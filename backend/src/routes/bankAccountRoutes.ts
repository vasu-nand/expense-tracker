import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import BankAccount from '../models/BankAccount';
import Expense from '../models/Expense';
import MonthlySummary from '../models/MonthlySummary';
import Category from '../models/Category';
import Settings from '../models/Settings';
import { seedDefaultCategories } from '../services/categoryService';

const router = Router();

// GET /api/accounts - List all bank accounts with count/totals stats
router.get('/accounts', async (req: Request, res: Response) => {
    try {
        const accounts = await BankAccount.find().sort({ createdAt: 1 });
        
        // Fetch stats for each account
        const accountStats = await Promise.all(accounts.map(async (acc) => {
            const expenseStats = await Expense.aggregate([
                { $match: { bankAccountId: acc._id, type: { $ne: 'income' } } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]);

            const lastExpense = await Expense.findOne({ bankAccountId: acc._id }).sort({ uploadedAt: -1 }).select('uploadedAt');

            return {
                ...acc.toObject(),
                expenseCount: expenseStats[0]?.count || 0,
                totalExpenses: expenseStats[0]?.total || 0,
                lastUpload: lastExpense?.uploadedAt || acc.createdAt
            };
        }));

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
