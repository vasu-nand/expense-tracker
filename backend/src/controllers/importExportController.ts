import { Request, Response } from 'express';
import { ExpenseService } from '../services/expenseService';
import { parseExcelFile, parseCSVFile, parseJSONFile } from '../utils/fileParser';
import { getActiveBankAccountId } from '../utils/bankAccountHelper';
import Expense from '../models/Expense';
import BankAccount from '../models/BankAccount';
import InvestmentAsset from '../models/InvestmentAsset';
import InvestmentTransaction from '../models/InvestmentTransaction';
import Dividend from '../models/Dividend';
import MonthlySummary from '../models/MonthlySummary';
import Category from '../models/Category';
import Settings from '../models/Settings';
import Watchlist from '../models/Watchlist';
import WealthGoal from '../models/WealthGoal';
import PriceAlert from '../models/PriceAlert';
import { syncTransactionToExpense, syncDividendToExpense } from '../services/portfolioSyncService';

const expenseService = new ExpenseService();

/**
 * Import Expenses & Income
 */
export const importExpenses = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No statement file uploaded' });
            return;
        }

        const month = req.body.month || new Date().toISOString().slice(0, 7);
        const bankAccountId = await getActiveBankAccountId(req);

        const isJson = req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json');
        const isCsv = req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv');

        let expenses: any[];
        if (isJson) {
            expenses = await parseJSONFile(req.file.buffer, month, bankAccountId);
        } else if (isCsv) {
            expenses = await parseCSVFile(req.file.buffer, month, bankAccountId);
        } else {
            expenses = await parseExcelFile(req.file.buffer, month, bankAccountId);
        }

        if (expenses.length === 0) {
            res.status(400).json({ error: 'No valid expense entries found in uploaded file' });
            return;
        }

        const bankAccounts = await BankAccount.find({}, '_id').lean();
        const existingAccountIds = new Set(bankAccounts.map(acc => acc._id.toString()));

        const expensesWithAccount = expenses.map(exp => ({
            ...exp,
            bankAccountId: (exp.bankAccountId && existingAccountIds.has(exp.bankAccountId.toString()))
                ? exp.bankAccountId
                : bankAccountId
        }));

        await expenseService.bulkCreateExpenses(expensesWithAccount);

        const uniqueCombinations = new Set<string>();
        for (const exp of expensesWithAccount) {
            if (exp.month && exp.bankAccountId) {
                uniqueCombinations.add(`${exp.month}_${exp.bankAccountId.toString()}`);
            }
        }

        await Promise.all(
            Array.from(uniqueCombinations).map(comb => {
                const [m, accId] = comb.split('_');
                return expenseService.generateMonthlySummary(m, accId);
            })
        );

        res.status(201).json({
            message: `${expenses.length} expenses imported successfully`,
            count: expenses.length
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Import Investment Transactions (Trades)
 */
export const importTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No transaction file uploaded' });
            return;
        }

        const bankAccountId = await getActiveBankAccountId(req);
        const rawContent = req.file.buffer.toString('utf-8');
        let records: any[] = [];

        if (req.file.originalname.endsWith('.json')) {
            records = JSON.parse(rawContent);
        } else {
            // Parse CSV / TSV lines
            const lines = rawContent.split(/\r?\n/).filter(line => line.trim().length > 0);
            if (lines.length > 1) {
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    const obj: any = {};
                    headers.forEach((h, idx) => {
                        obj[h] = values[idx];
                    });
                    records.push(obj);
                }
            }
        }

        let importedCount = 0;
        for (const rec of records) {
            const symbol = (rec.symbol || rec.asset || '').toUpperCase().trim();
            if (!symbol) continue;

            let asset = await InvestmentAsset.findOne({ symbol });
            if (!asset) {
                asset = new InvestmentAsset({
                    symbol,
                    name: rec.name || symbol,
                    assetType: rec.assettype || rec.type || 'stock',
                    exchange: rec.exchange || 'NSE',
                    currency: rec.currency || 'INR'
                });
                await asset.save();
            }

            const transaction = new InvestmentTransaction({
                assetId: asset._id,
                bankAccountId: rec.bankaccountid || bankAccountId,
                type: (rec.type || 'buy').toLowerCase() === 'sell' ? 'sell' : 'buy',
                quantity: parseFloat(rec.quantity || rec.qty || 1),
                price: parseFloat(rec.price || rec.unitprice || 0),
                fees: parseFloat(rec.fees || 0),
                tax: parseFloat(rec.tax || 0),
                dateTime: rec.datetime || rec.date ? new Date(rec.datetime || rec.date) : new Date(),
                notes: rec.notes || rec.description
            });

            await transaction.save();
            await syncTransactionToExpense(transaction, asset);
            importedCount++;
        }

        res.status(201).json({
            message: `${importedCount} investment transactions imported successfully`,
            count: importedCount
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Import Dividends History
 */
export const importDividends = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No dividend file uploaded' });
            return;
        }

        const bankAccountId = await getActiveBankAccountId(req);
        const rawContent = req.file.buffer.toString('utf-8');
        let records: any[] = [];

        if (req.file.originalname.endsWith('.json')) {
            records = JSON.parse(rawContent);
        } else {
            const lines = rawContent.split(/\r?\n/).filter(line => line.trim().length > 0);
            if (lines.length > 1) {
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    const obj: any = {};
                    headers.forEach((h, idx) => {
                        obj[h] = values[idx];
                    });
                    records.push(obj);
                }
            }
        }

        let importedCount = 0;
        for (const rec of records) {
            const symbol = (rec.symbol || rec.asset || '').toUpperCase().trim();
            if (!symbol) continue;

            let asset = await InvestmentAsset.findOne({ symbol });
            if (!asset) {
                asset = new InvestmentAsset({
                    symbol,
                    name: rec.name || symbol,
                    assetType: 'stock',
                    exchange: 'NSE',
                    currency: 'INR'
                });
                await asset.save();
            }

            const dividend = new Dividend({
                assetId: asset._id,
                bankAccountId: rec.bankaccountid || bankAccountId,
                amount: parseFloat(rec.amount || rec.dividend || 0),
                date: rec.date ? new Date(rec.date) : new Date(),
                tax: parseFloat(rec.tax || 0)
            });

            await dividend.save();
            await syncDividendToExpense(dividend, asset);
            importedCount++;
        }

        res.status(201).json({
            message: `${importedCount} dividend entries imported successfully`,
            count: importedCount
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Import Master Assets
 */
export const importAssets = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No asset file uploaded' });
            return;
        }

        const rawContent = req.file.buffer.toString('utf-8');
        let records: any[] = [];

        if (req.file.originalname.endsWith('.json')) {
            records = JSON.parse(rawContent);
        } else {
            const lines = rawContent.split(/\r?\n/).filter(line => line.trim().length > 0);
            if (lines.length > 1) {
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    const obj: any = {};
                    headers.forEach((h, idx) => {
                        obj[h] = values[idx];
                    });
                    records.push(obj);
                }
            }
        }

        let importedCount = 0;
        for (const rec of records) {
            const symbol = (rec.symbol || '').toUpperCase().trim();
            if (!symbol) continue;

            let asset = await InvestmentAsset.findOne({ symbol });
            if (!asset) {
                asset = new InvestmentAsset({
                    symbol,
                    name: rec.name || symbol,
                    assetType: rec.assettype || 'stock',
                    exchange: rec.exchange || 'NSE',
                    currency: rec.currency || 'INR'
                });
                await asset.save();
                importedCount++;
            }
        }

        res.status(201).json({
            message: `${importedCount} master assets imported successfully`,
            count: importedCount
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Import Bank Accounts
 */
export const importBankAccounts = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No bank account file uploaded' });
            return;
        }

        const rawContent = req.file.buffer.toString('utf-8');
        let records: any[] = [];

        if (req.file.originalname.endsWith('.json')) {
            records = JSON.parse(rawContent);
        } else {
            const lines = rawContent.split(/\r?\n/).filter(line => line.trim().length > 0);
            if (lines.length > 1) {
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    const obj: any = {};
                    headers.forEach((h, idx) => {
                        obj[h] = values[idx];
                    });
                    records.push(obj);
                }
            }
        }

        let importedCount = 0;
        for (const rec of records) {
            const name = (rec.name || rec.accountname || '').trim();
            if (!name) continue;

            const existing = await BankAccount.findOne({ name });
            if (!existing) {
                await BankAccount.create({
                    name,
                    bankName: rec.bankname || 'General Bank',
                    accountNumber: rec.accountnumber || 'xxxx',
                    accountType: rec.accounttype || 'savings',
                    initialBalance: parseFloat(rec.initialbalance || 0),
                    currency: rec.currency || 'INR',
                    color: rec.color || '#6366f1',
                    icon: rec.icon || 'Landmark'
                });
                importedCount++;
            }
        }

        res.status(201).json({
            message: `${importedCount} bank accounts imported successfully`,
            count: importedCount
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Restore Full Database JSON Backup
 */
export const importFullBackup = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No backup file uploaded' });
            return;
        }

        const backupData = JSON.parse(req.file.buffer.toString('utf-8'));

        if (backupData.expenses && Array.isArray(backupData.expenses)) {
            await Expense.deleteMany({});
            if (backupData.expenses.length > 0) await Expense.insertMany(backupData.expenses);
        }

        if (backupData.bankAccounts && Array.isArray(backupData.bankAccounts)) {
            await BankAccount.deleteMany({});
            if (backupData.bankAccounts.length > 0) await BankAccount.insertMany(backupData.bankAccounts);
        }

        if (backupData.assets && Array.isArray(backupData.assets)) {
            await InvestmentAsset.deleteMany({});
            if (backupData.assets.length > 0) await InvestmentAsset.insertMany(backupData.assets);
        }

        if (backupData.transactions && Array.isArray(backupData.transactions)) {
            await InvestmentTransaction.deleteMany({});
            if (backupData.transactions.length > 0) await InvestmentTransaction.insertMany(backupData.transactions);
        }

        if (backupData.dividends && Array.isArray(backupData.dividends)) {
            await Dividend.deleteMany({});
            if (backupData.dividends.length > 0) await Dividend.insertMany(backupData.dividends);
        }

        if (backupData.categories && Array.isArray(backupData.categories)) {
            await Category.deleteMany({});
            if (backupData.categories.length > 0) await Category.insertMany(backupData.categories);
        }

        res.json({ message: 'Full database backup restored successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Export Specific Table as Downloadable CSV
 */
export const exportCSV = async (req: Request, res: Response): Promise<void> => {
    try {
        const type = (req.query.type as string || 'expenses').toLowerCase();
        let csvContent = '';
        let filename = `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`;

        if (type === 'expenses') {
            const items = await Expense.find().sort({ month: -1, day: -1 }).lean();
            csvContent = 'date,month,day,amount,reason,category,type,bankAccountId\n' +
                items.map(i => {
                    const fullDate = i.month && i.day ? `${i.month}-${String(i.day).padStart(2, '0')}` : '';
                    return `${fullDate},${i.month || ''},${i.day || ''},${i.amount || 0},"${(i.reason || '').replace(/"/g, '""')}",${i.category || ''},${i.type || 'expense'},${i.bankAccountId || ''}`;
                }).join('\n');
        } else if (type === 'transactions') {
            const items = await InvestmentTransaction.find().populate('assetId').sort({ dateTime: -1 }).lean();
            csvContent = 'date,month,dateTime,symbol,assetName,type,quantity,price,fees,tax,totalAmount,notes,bankAccountId\n' +
                items.map(i => {
                    const dt = i.dateTime ? new Date(i.dateTime) : new Date();
                    const dateStr = dt.toISOString().slice(0, 10);
                    const monthStr = dt.toISOString().slice(0, 7);
                    const assetSymbol = (i.assetId as any)?.symbol || '';
                    const assetName = (i.assetId as any)?.name || '';
                    const totalAmt = (i.price * i.quantity) + (i.type === 'buy' ? (i.fees + i.tax) : -(i.fees + i.tax));
                    return `${dateStr},${monthStr},${dt.toISOString()},${assetSymbol},"${assetName.replace(/"/g, '""')}",${i.type},${i.quantity},${i.price},${i.fees},${i.tax},${totalAmt},"${(i.notes || '').replace(/"/g, '""')}",${i.bankAccountId || ''}`;
                }).join('\n');
        } else if (type === 'dividends') {
            const items = await Dividend.find().populate('assetId').sort({ date: -1 }).lean();
            csvContent = 'date,month,symbol,assetName,grossAmount,tax,netAmount,bankAccountId\n' +
                items.map(i => {
                    const dt = i.date ? new Date(i.date) : new Date();
                    const dateStr = dt.toISOString().slice(0, 10);
                    const monthStr = dt.toISOString().slice(0, 7);
                    const assetSymbol = (i.assetId as any)?.symbol || '';
                    const assetName = (i.assetId as any)?.name || '';
                    const netAmt = (i.amount || 0) - (i.tax || 0);
                    return `${dateStr},${monthStr},${assetSymbol},"${assetName.replace(/"/g, '""')}",${i.amount || 0},${i.tax || 0},${netAmt},${i.bankAccountId || ''}`;
                }).join('\n');
        } else if (type === 'assets') {
            const items = await InvestmentAsset.find().sort({ symbol: 1 }).lean();
            csvContent = 'symbol,name,assetType,exchange,currency,lastPrice\n' +
                items.map(i => `${i.symbol},"${(i.name || '').replace(/"/g, '""')}",${i.assetType || ''},${i.exchange || ''},${i.currency || 'INR'},${i.lastPrice || 0}`).join('\n');
        } else if (type === 'bank_accounts') {
            const items = await BankAccount.find().lean();
            csvContent = 'name,bankName,accountNumber,color,icon,isPrimary\n' +
                items.map(i => `"${(i.name || '').replace(/"/g, '""')}","${(i.bankName || '').replace(/"/g, '""')}",${i.accountNumber || ''},${i.color || ''},${i.icon || ''},${i.isPrimary || false}`).join('\n');
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(csvContent);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Export Full Database JSON Backup
 */
export const exportBackup = async (req: Request, res: Response): Promise<void> => {
    try {
        const [expenses, summaries, bankAccounts, categories, settings, assets, transactions, dividends, watchlists, goals, alerts] = await Promise.all([
            Expense.find().lean(),
            MonthlySummary.find().lean(),
            BankAccount.find().lean(),
            Category.find().lean(),
            Settings.find().lean(),
            InvestmentAsset.find().lean(),
            InvestmentTransaction.find().lean(),
            Dividend.find().lean(),
            Watchlist.find().lean(),
            WealthGoal.find().lean(),
            PriceAlert.find().lean()
        ]);

        const backupData = {
            exportDate: new Date().toISOString(),
            expenses,
            summaries,
            bankAccounts,
            categories,
            settings,
            assets,
            transactions,
            dividends,
            watchlists,
            goals,
            alerts
        };

        const filename = `db_backup_${new Date().toISOString().slice(0, 10)}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(JSON.stringify(backupData, null, 2));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
