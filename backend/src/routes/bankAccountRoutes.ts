import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import BankAccount from '../models/BankAccount';
import Expense from '../models/Expense';
import MonthlySummary from '../models/MonthlySummary';
import Category from '../models/Category';
import Settings from '../models/Settings';
import { seedDefaultCategories } from '../services/categoryService';
import { reloadBankAccountCache } from '../utils/bankAccountHelper';

const router = Router();

// GET /api/accounts - List all bank accounts with count/totals stats
router.get('/accounts', async (req: Request, res: Response) => {
    try {
        const accounts = await BankAccount.find().sort({ createdAt: 1 });
        
        // Fetch stats for all accounts using aggregation to prevent N+1 query overhead
        const expenseStats = await Expense.aggregate([
            { $match: { type: { $ne: 'income' } } },
            { $group: { 
                _id: '$bankAccountId', 
                total: { $sum: '$amount' }, 
                count: { $sum: 1 } 
            }}
        ]);

        const lastUploadStats = await Expense.aggregate([
            { $sort: { bankAccountId: 1, uploadedAt: -1 } },
            { $group: {
                _id: '$bankAccountId',
                lastUpload: { $first: '$uploadedAt' }
            }}
        ]);

        const statsMap = new Map(expenseStats.map(s => [s._id.toString(), s]));
        const uploadMap = new Map(lastUploadStats.map(u => [u._id.toString(), u.lastUpload]));

        const accountStats = accounts.map((acc) => {
            const accIdStr = acc._id.toString();
            const stats = statsMap.get(accIdStr);
            const lastUpload = uploadMap.get(accIdStr);

            return {
                ...acc.toObject(),
                expenseCount: stats?.count || 0,
                totalExpenses: stats?.total || 0,
                lastUpload: lastUpload || acc.createdAt
            };
        });

        res.json({ accounts: accountStats });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/accounts - Create a new bank account
router.post('/accounts', async (req: Request, res: Response) => {
    try {
        const { name, bankName, accountNumber, color, icon, deletePassword, confirmPassword } = req.body;

        // Basic validation
        if (!name || !bankName || !accountNumber) {
            return res.status(400).json({ error: 'Missing required fields: name, bankName, accountNumber' });
        }

        if (!deletePassword) {
            return res.status(400).json({ error: 'Deletion password is required' });
        }

        if (deletePassword.length < 6) {
            return res.status(400).json({ error: 'Deletion password must be at least 6 characters long' });
        }

        if (deletePassword !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        // Check if there are any existing accounts
        const count = await BankAccount.countDocuments();
        const isPrimary = count === 0;

        // Hash the deletion password
        const deletePasswordHash = crypto.createHash('sha256').update(String(deletePassword)).digest('hex');

        const newAccount = new BankAccount({
            name,
            bankName,
            accountNumber,
            color: color || '#0d9488',
            icon: icon || 'Wallet',
            isPrimary,
            deletePasswordHash
        });

        const savedAccount = await newAccount.save();

        // Seed default categories for this account workspace
        await seedDefaultCategories(savedAccount._id);

        // Update in-memory bank account validation cache
        await reloadBankAccountCache();

        res.status(201).json({ account: savedAccount });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/accounts/:id - Update bank account metadata
router.patch('/accounts/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, color, icon } = req.body;

        const account = await BankAccount.findById(id);
        if (!account) {
            return res.status(404).json({ error: 'Bank account not found' });
        }

        if (name !== undefined) account.name = name;
        if (color !== undefined) account.color = color;
        if (icon !== undefined) account.icon = icon;

        const updated = await account.save();
        res.json({ account: updated });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/accounts/:id - Secure password-protected delete account
router.delete('/accounts/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const password = req.headers['x-delete-password'] as string;

        if (!password) {
            return res.status(401).json({ error: 'Unauthorized: Deletion password is required' });
        }

        const account = await BankAccount.findById(id);
        if (!account) {
            return res.status(404).json({ error: 'Bank account not found' });
        }

        if (account.isPrimary) {
            return res.status(400).json({ error: 'Primary bank account cannot be deleted' });
        }

        const submittedHash = crypto.createHash('sha256').update(String(password)).digest('hex');
        if (submittedHash !== account.deletePasswordHash) {
            return res.status(401).json({ error: 'Unauthorized: Invalid deletion password' });
        }

        // Delete all associated workspace data
        await Promise.all([
            Expense.deleteMany({ bankAccountId: account._id }),
            MonthlySummary.deleteMany({ bankAccountId: account._id }),
            Category.deleteMany({ bankAccountId: account._id }),
            Settings.deleteMany({ bankAccountId: account._id }),
            BankAccount.deleteOne({ _id: account._id })
        ]);

        // Invalidate deleted account from cache
        await reloadBankAccountCache();

        res.json({ message: `Bank account "${account.name}" and all associated data deleted successfully.` });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/accounts/:id/switch - Switch account context log
router.post('/accounts/:id/switch', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const exists = await BankAccount.exists({ _id: id });
        if (!exists) {
            return res.status(404).json({ error: 'Bank account not found' });
        }
        res.json({ success: true, accountId: id });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
