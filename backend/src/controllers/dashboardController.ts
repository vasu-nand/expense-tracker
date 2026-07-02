import { Request, Response } from 'express';
import { ExpenseService } from '../services/expenseService';
import { getLocalMonthString } from '../utils/dateUtils';
import { getActiveBankAccountId } from '../utils/bankAccountHelper';

const expenseService = new ExpenseService();

export const getDashboard = async (req: Request, res: Response) => {
    try {
        const month = req.query.month as string || getLocalMonthString();
        const bankAccountId = await getActiveBankAccountId(req);
        const data = await expenseService.getDashboardData(month, bankAccountId);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};