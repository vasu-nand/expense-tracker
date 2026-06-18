import { Request, Response } from 'express';
import { ExpenseService } from '../services/expenseService';

const expenseService = new ExpenseService();

export const getDashboard = async (req: Request, res: Response) => {
    try {
        const month = req.query.month as string || new Date().toISOString().slice(0, 7);
        const data = await expenseService.getDashboardData(month);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};