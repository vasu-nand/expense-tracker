import { Request, Response } from 'express';
import Expense from '../models/Expense';
import MonthlySummary from '../models/MonthlySummary';
import { AnalyticsService } from '../services/analyticsService';
import { getLocalMonthString } from '../utils/dateUtils';
import { getActiveBankAccountId } from '../utils/bankAccountHelper';
import { buildMonthQuery } from '../utils/monthQueryHelper';

const analyticsService = new AnalyticsService();

export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const month = req.query.month as string || getLocalMonthString();
        const bankAccountId = await getActiveBankAccountId(req);
        
        const monthQuery = buildMonthQuery(month);
        const summaries = await MonthlySummary.find({ month: monthQuery, bankAccountId });

        if (summaries.length === 0) {
            // Return empty analytics structures instead of 404, preventing frontend crashes
            return res.json({
                month,
                bankAccountId,
                totalExpense: 0,
                totalIncome: 0,
                totalDays: 0,
                categoryBreakdown: {},
                incomeCategoryBreakdown: {},
                averageDailyExpense: 0,
                highestExpenseDay: 0,
                insights: [],
                weekdayWeekend: {
                    weekdayTotal: 0,
                    weekendTotal: 0,
                    weekdayCount: 0,
                    weekendCount: 0,
                    weekdayAverage: 0,
                    weekendAverage: 0
                },
                weeklySpend: [],
                transactionSizes: { low: 0, medium: 0, high: 0 },
                totalEntries: 0
            });
        }

        let totalExpense = 0;
        let totalIncome = 0;
        let totalDays = 0;
        const categoryBreakdown: Record<string, number> = {};
        const incomeCategoryBreakdown: Record<string, number> = {};

        for (const summary of summaries) {
            totalExpense += summary.totalExpense || 0;
            totalIncome += summary.totalIncome || 0;
            totalDays += summary.totalDays || 0;

            if (summary.categoryBreakdown) {
                for (const [cat, val] of summary.categoryBreakdown.entries()) {
                    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + val;
                }
            }
            if (summary.incomeCategoryBreakdown) {
                for (const [cat, val] of summary.incomeCategoryBreakdown.entries()) {
                    incomeCategoryBreakdown[cat] = (incomeCategoryBreakdown[cat] || 0) + val;
                }
            }
        }

        const averageDailyExpense = totalDays > 0 ? totalExpense / totalDays : 0;

        // Get insights & extra metrics (filtered by bankAccountId & month range)
        const expenses = await Expense.find({ month: monthQuery, bankAccountId });
        
        // Find highest expense day across all queried months
        const dailyTotals = new Map<number, number>();
        for (const expense of expenses.filter(e => e.type !== 'income')) {
            const current = dailyTotals.get(expense.day) || 0;
            dailyTotals.set(expense.day, current + expense.amount);
        }
        let highestExpenseDay = 0;
        let highestAmount = 0;
        for (const [day, total] of dailyTotals) {
            if (total > highestAmount) {
                highestAmount = total;
                highestExpenseDay = day;
            }
        }

        const insights = analyticsService.generateInsights(expenses);
        const weekdayWeekend = analyticsService.getWeekdayWeekendBreakdown(expenses, month);
        const weeklySpend = analyticsService.getWeeklySpend(expenses);
        const transactionSizes = analyticsService.getTransactionSizeBreakdown(expenses);

        const result = {
            month,
            bankAccountId,
            totalExpense,
            totalIncome,
            totalDays,
            categoryBreakdown,
            incomeCategoryBreakdown,
            averageDailyExpense,
            highestExpenseDay,
            insights,
            weekdayWeekend,
            weeklySpend,
            transactionSizes,
            totalEntries: expenses.length
        };

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCategories = async (req: Request, res: Response) => {
    try {
        const month = req.query.month as string || getLocalMonthString();
        const bankAccountId = await getActiveBankAccountId(req);
        const categories = await Expense.distinct('category', { month: buildMonthQuery(month), bankAccountId });
        res.json(categories.sort());
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};