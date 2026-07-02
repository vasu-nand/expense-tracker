import { Request, Response } from 'express';
import crypto from 'crypto';
import { ExpenseService } from '../services/expenseService';
import { parseExcelFile, parseCSVFile } from '../utils/fileParser';
import { detectCategory } from '../utils/categoryDetector';
import { getLocalMonthString, getDaysInMonth } from '../utils/dateUtils';
import { getActiveBankAccountId } from '../utils/bankAccountHelper';
import 'multer';

const expenseService = new ExpenseService();

export const uploadExpenses = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const month = req.body.month || getLocalMonthString(); // YYYY-MM format
        const bankAccountId = await getActiveBankAccountId(req);
        let expenses;

        if (req.file.mimetype === 'text/csv') {
            expenses = await parseCSVFile(req.file.buffer, month, bankAccountId);
        } else {
            expenses = await parseExcelFile(req.file.buffer, month, bankAccountId);
        }

        if (expenses.length === 0) {
            return res.status(400).json({ error: 'No valid expense data found' });
        }

        // Attach bankAccountId to every expense
        const expensesWithAccount = expenses.map(exp => ({
            ...exp,
            bankAccountId: bankAccountId as any
        }));

        await expenseService.bulkCreateExpenses(expensesWithAccount);
        await expenseService.generateMonthlySummary(month, bankAccountId);

        res.status(201).json({
            message: `${expenses.length} expenses uploaded successfully`,
            count: expenses.length,
            month
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getExpenses = async (req: Request, res: Response) => {
    try {
        const bankAccountId = await getActiveBankAccountId(req);
        
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const category = req.query.category as string;
        const month = req.query.month as string;
        const day = req.query.day ? parseInt(req.query.day as string) : undefined;
        const search = req.query.search as string;
        const sortBy = req.query.sortBy as string || 'day';
        const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
        
        const minAmount = req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined;
        const maxAmount = req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined;
        const minDay = req.query.minDay ? parseInt(req.query.minDay as string) : undefined;
        const maxDay = req.query.maxDay ? parseInt(req.query.maxDay as string) : undefined;
        const type = req.query.type as string;
        const startMonth = req.query.startMonth as string | undefined;
        const endMonth = req.query.endMonth as string | undefined;

        const result = await expenseService.getAllExpenses(
            bankAccountId,
            page, 
            limit, 
            category, 
            month, 
            isNaN(day as number) ? undefined : day,
            search,
            sortBy,
            sortOrder,
            isNaN(minAmount as number) ? undefined : minAmount,
            isNaN(maxAmount as number) ? undefined : maxAmount,
            isNaN(minDay as number) ? undefined : minDay,
            isNaN(maxDay as number) ? undefined : maxDay,
            type,
            startMonth,
            endMonth
        );
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getExpenseById = async (req: Request, res: Response) => {
    try {
        const bankAccountId = await getActiveBankAccountId(req);
        const expense = await expenseService.getExpenseById(req.params.id, bankAccountId);
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found or does not belong to this account' });
        }
        res.json(expense);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteExpense = async (req: Request, res: Response) => {
    try {
        const bankAccountId = await getActiveBankAccountId(req);
        const password = req.headers['x-delete-password'] || req.query.password;
        
        if (!password) {
            return res.status(401).json({ error: 'Unauthorized: Password required' });
        }

        const hash = crypto.createHash('sha256').update(String(password)).digest('hex');
        const requiredHash = process.env.DELETE_PASSWORD_HASH || 'af0dce62e992efc95dc1e0985253fd368e54a32c60852cf77cf2c90bc839ecad';

        if (hash !== requiredHash) {
            return res.status(401).json({ error: 'Unauthorized: Invalid password' });
        }

        const existing = await expenseService.getExpenseById(req.params.id, bankAccountId);
        if (!existing) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        await expenseService.deleteExpense(req.params.id, bankAccountId);
        await expenseService.generateMonthlySummary(existing.month, bankAccountId);

        res.json({ message: 'Expense deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createExpense = async (req: Request, res: Response) => {
    try {
        const bankAccountId = await getActiveBankAccountId(req);
        const { day, amount, reason, month, type } = req.body;
        let { category } = req.body;

        if (!day || !amount || !reason || !month) {
            return res.status(400).json({ error: 'Missing required fields: day, amount, reason, month' });
        }

        if (!category || category === 'auto') {
            category = detectCategory(reason, bankAccountId);
        }

        const parsedDay = parseInt(day);
        const maxDays = getDaysInMonth(month);
        if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > maxDays) {
            return res.status(400).json({ error: `Invalid day: Must be between 1 and ${maxDays} for ${month}` });
        }

        const expense = await expenseService.createExpense({
            bankAccountId: bankAccountId as any,
            day,
            amount,
            reason,
            category,
            month,
            type: type || 'expense'
        });

        await expenseService.generateMonthlySummary(month, bankAccountId);

        res.status(201).json(expense);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateExpense = async (req: Request, res: Response) => {
    try {
        const bankAccountId = await getActiveBankAccountId(req);
        const { id } = req.params;
        const { day, amount, reason, month, type } = req.body;
        let { category } = req.body;

        const existing = await expenseService.getExpenseById(id, bankAccountId);
        if (!existing) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        if (category === 'auto') {
            category = detectCategory(reason || existing.reason, bankAccountId);
        }

        const checkDay = day !== undefined ? parseInt(day) : existing.day;
        const checkMonth = month !== undefined ? month : existing.month;
        const maxDays = getDaysInMonth(checkMonth);
        if (isNaN(checkDay) || checkDay < 1 || checkDay > maxDays) {
            return res.status(400).json({ error: `Invalid day: Must be between 1 and ${maxDays} for ${checkMonth}` });
        }

        const updates: any = {};
        if (day !== undefined) updates.day = day;
        if (amount !== undefined) updates.amount = amount;
        if (reason !== undefined) updates.reason = reason;
        if (category !== undefined) updates.category = category;
        if (month !== undefined) updates.month = month;
        if (type !== undefined) updates.type = type;

        const expense = await expenseService.updateExpense(id, updates, bankAccountId);

        if (existing.month) {
            await expenseService.generateMonthlySummary(existing.month, bankAccountId);
        }
        if (month && month !== existing.month) {
            await expenseService.generateMonthlySummary(month, bankAccountId);
        }

        res.json(expense);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getDailySummary = async (req: Request, res: Response) => {
    try {
        const month = req.query.month as string || getLocalMonthString();
        const bankAccountId = await getActiveBankAccountId(req);
        const summary = await expenseService.getDailySummary(month, bankAccountId);
        res.json(summary);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const clearAllExpenses = async (req: Request, res: Response) => {
    try {
        const bankAccountId = await getActiveBankAccountId(req);
        const password = req.headers['x-delete-password'] || req.query.password;
        
        if (!password) {
            return res.status(401).json({ error: 'Unauthorized: Password required' });
        }

        const hash = crypto.createHash('sha256').update(String(password)).digest('hex');
        const requiredHash = process.env.DELETE_PASSWORD_HASH || 'af0dce62e992efc95dc1e0985253fd368e54a32c60852cf77cf2c90bc839ecad';

        if (hash !== requiredHash) {
            return res.status(401).json({ error: 'Unauthorized: Invalid password' });
        }

        await expenseService.clearAllExpenses(bankAccountId);
        res.json({ message: 'All expenses and summaries deleted successfully for this account' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};