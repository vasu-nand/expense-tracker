import { Request, Response } from 'express';
import crypto from 'crypto';
import { ExpenseService } from '../services/expenseService';
import { parseExcelFile, parseCSVFile } from '../utils/fileParser';
import { detectCategory } from '../utils/categoryDetector';
import 'multer';

const expenseService = new ExpenseService();

export const uploadExpenses = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const month = req.body.month || new Date().toISOString().slice(0, 7); // YYYY-MM format
        let expenses;

        if (req.file.mimetype === 'text/csv') {
            expenses = await parseCSVFile(req.file.buffer, month);
        } else {
            expenses = await parseExcelFile(req.file.buffer, month);
        }

        if (expenses.length === 0) {
            return res.status(400).json({ error: 'No valid expense data found' });
        }

        await expenseService.bulkCreateExpenses(expenses);
        await expenseService.generateMonthlySummary(month);

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

        const result = await expenseService.getAllExpenses(
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
            isNaN(maxDay as number) ? undefined : maxDay
        );
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getExpenseById = async (req: Request, res: Response) => {
    try {
        const expense = await expenseService.getExpenseById(req.params.id);
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }
        res.json(expense);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteExpense = async (req: Request, res: Response) => {
    try {
        const password = req.headers['x-delete-password'] || req.query.password;
        
        if (!password) {
            return res.status(401).json({ error: 'Unauthorized: Password required' });
        }

        const hash = crypto.createHash('sha256').update(String(password)).digest('hex');
        const requiredHash = process.env.DELETE_PASSWORD_HASH || 'af0dce62e992efc95dc1e0985253fd368e54a32c60852cf77cf2c90bc839ecad';

        if (hash !== requiredHash) {
            return res.status(401).json({ error: 'Unauthorized: Invalid password' });
        }

        const existing = await expenseService.getExpenseById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        await expenseService.deleteExpense(req.params.id);
        await expenseService.generateMonthlySummary(existing.month);

        res.json({ message: 'Expense deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createExpense = async (req: Request, res: Response) => {
    try {
        const { day, amount, reason, month } = req.body;
        let { category } = req.body;

        if (!day || !amount || !reason || !month) {
            return res.status(400).json({ error: 'Missing required fields: day, amount, reason, month' });
        }

        if (!category || category === 'auto') {
            category = detectCategory(reason);
        }

        const expense = await expenseService.createExpense({
            day,
            amount,
            reason,
            category,
            month
        });

        await expenseService.generateMonthlySummary(month);

        res.status(201).json(expense);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateExpense = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { day, amount, reason, month } = req.body;
        let { category } = req.body;

        const existing = await expenseService.getExpenseById(id);
        if (!existing) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        if (category === 'auto') {
            category = detectCategory(reason || existing.reason);
        }

        const updates: any = {};
        if (day !== undefined) updates.day = day;
        if (amount !== undefined) updates.amount = amount;
        if (reason !== undefined) updates.reason = reason;
        if (category !== undefined) updates.category = category;
        if (month !== undefined) updates.month = month;

        const expense = await expenseService.updateExpense(id, updates);

        if (existing.month) {
            await expenseService.generateMonthlySummary(existing.month);
        }
        if (month && month !== existing.month) {
            await expenseService.generateMonthlySummary(month);
        }

        res.json(expense);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getDailySummary = async (req: Request, res: Response) => {
    try {
        const month = req.query.month as string || new Date().toISOString().slice(0, 7);
        const summary = await expenseService.getDailySummary(month);
        res.json(summary);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const clearAllExpenses = async (req: Request, res: Response) => {
    try {
        const password = req.headers['x-delete-password'] || req.query.password;
        
        if (!password) {
            return res.status(401).json({ error: 'Unauthorized: Password required' });
        }

        const hash = crypto.createHash('sha256').update(String(password)).digest('hex');
        const requiredHash = process.env.DELETE_PASSWORD_HASH || 'af0dce62e992efc95dc1e0985253fd368e54a32c60852cf77cf2c90bc839ecad';

        if (hash !== requiredHash) {
            return res.status(401).json({ error: 'Unauthorized: Invalid password' });
        }

        await expenseService.clearAllExpenses();
        res.json({ message: 'All expenses and summaries deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};