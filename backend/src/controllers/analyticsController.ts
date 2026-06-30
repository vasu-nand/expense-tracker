import { Request, Response } from 'express';
import Expense from '../models/Expense';
import MonthlySummary from '../models/MonthlySummary';
import { AnalyticsService } from '../services/analyticsService';

const analyticsService = new AnalyticsService();

export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const month = req.query.month as string || new Date().toISOString().slice(0, 7);
        const summary = await MonthlySummary.findOne({ month });

        if (!summary) {
            return res.status(404).json({ error: 'No data found for this month' });
        }

        // Get insights & extra metrics
        const expenses = await Expense.find({ month });
        const insights = analyticsService.generateInsights(expenses);
        const weekdayWeekend = analyticsService.getWeekdayWeekendBreakdown(expenses, month);
        const weeklySpend = analyticsService.getWeeklySpend(expenses);
        const transactionSizes = analyticsService.getTransactionSizeBreakdown(expenses);

        // Get category breakdown
        const categoryBreakdown = Object.fromEntries(summary.categoryBreakdown);
        const incomeCategoryBreakdown = summary.incomeCategoryBreakdown ? Object.fromEntries(summary.incomeCategoryBreakdown) : {};

        const result = {
            ...summary.toObject(),
            categoryBreakdown,
            incomeCategoryBreakdown,
            insights,
            weekdayWeekend,
            weeklySpend,
            transactionSizes
        };

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCategories = async (req: Request, res: Response) => {
    try {
        const month = req.query.month as string || new Date().toISOString().slice(0, 7);
        const categories = await Expense.distinct('category', { month });
        res.json(categories.sort());
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};