import mongoose from 'mongoose';
import Expense, { IExpense } from '../models/Expense';
import MonthlySummary from '../models/MonthlySummary';
import { buildMonthQuery } from '../utils/monthQueryHelper';
import { getDaysInMonth } from '../utils/dateUtils';

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class ExpenseService {
    async createExpense(expense: Partial<IExpense>) {
        if (!expense.bankAccountId) {
            throw new Error('bankAccountId is required to create an expense');
        }
        const newExpense = new Expense(expense);
        return newExpense.save();
    }

    async updateExpense(id: string, updates: Partial<IExpense>, bankAccountId: string) {
        return Expense.findOneAndUpdate({ _id: id, bankAccountId }, updates, { new: true });
    }

    async bulkCreateExpenses(expenses: Partial<IExpense>[]) {
        return Expense.insertMany(expenses);
    }

    async getAllExpenses(
        bankAccountId: string,
        page: number = 1,
        limit: number = 50,
        category?: string,
        month?: string,
        day?: number,
        search?: string,
        sortBy: string = 'day',
        sortOrder: 'asc' | 'desc' = 'desc',
        minAmount?: number,
        maxAmount?: number,
        minDay?: number,
        maxDay?: number,
        type?: string,
        startMonth?: string,
        endMonth?: string
    ) {
        const query: any = { bankAccountId };
        
        if (category) {
            const cats = category.split(',').map(c => c.trim()).filter(Boolean);
            query.category = cats.length === 1 ? cats[0] : { $in: cats };
        }
        if (month) query.month = buildMonthQuery(month);
        else if (startMonth || endMonth) {
            query.month = {};
            if (startMonth) query.month.$gte = startMonth;
            if (endMonth) query.month.$lte = endMonth;
        }
        if (type) query.type = type;
        
        if (day !== undefined) {
            query.day = day;
        } else if (minDay !== undefined || maxDay !== undefined) {
            query.day = {};
            if (minDay !== undefined) query.day.$gte = minDay;
            if (maxDay !== undefined) query.day.$lte = maxDay;
        }

        if (minAmount !== undefined || maxAmount !== undefined) {
            query.amount = {};
            if (minAmount !== undefined) query.amount.$gte = minAmount;
            if (maxAmount !== undefined) query.amount.$lte = maxAmount;
        }

        if (search) {
            const escapedSearch = escapeRegExp(search);
            query.$or = [
                { reason: { $regex: escapedSearch, $options: 'i' } },
                { category: { $regex: escapedSearch, $options: 'i' } }
            ];
        }

        const sortQuery: any = {};
        if (sortBy === 'day' || sortBy === 'date') {
            sortQuery.month = sortOrder === 'desc' ? -1 : 1;
            sortQuery.day = sortOrder === 'desc' ? -1 : 1;
        } else {
            sortQuery[sortBy] = sortOrder === 'desc' ? -1 : 1;
        }

        const skip = (page - 1) * limit;
        const [expenses, total] = await Promise.all([
            Expense.find(query)
                .sort(sortQuery)
                .skip(skip)
                .limit(limit)
                .lean(),
            Expense.countDocuments(query)
        ]);

        return {
            expenses,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getExpenseById(id: string, bankAccountId: string) {
        return Expense.findOne({ _id: id, bankAccountId });
    }

    async deleteExpense(id: string, bankAccountId: string) {
        return Expense.findOneAndDelete({ _id: id, bankAccountId });
    }

    async clearAllExpenses(bankAccountId: string) {
        return Promise.all([
            Expense.deleteMany({ bankAccountId }),
            MonthlySummary.deleteMany({ bankAccountId })
        ]);
    }

    async getDailySummary(month: string, bankAccountId: string) {
        const expenses = await Expense.find({ month, bankAccountId })
            .select('day type amount reason category')
            .lean();

        const dailyMap = new Map<number, { day: number; totalExpense: number; totalIncome: number; entries: any[] }>();

        for (const expense of expenses) {
            if (!dailyMap.has(expense.day)) {
                dailyMap.set(expense.day, {
                    day: expense.day,
                    totalExpense: 0,
                    totalIncome: 0,
                    entries: []
                });
            }

            const daily = dailyMap.get(expense.day)!;
            const expType = expense.type || 'expense';
            if (expType === 'income') {
                daily.totalIncome += expense.amount;
            } else {
                daily.totalExpense += expense.amount;
            }
            daily.entries.push({
                amount: expense.amount,
                reason: expense.reason,
                category: expense.category,
                type: expType
            });
        }

        return Array.from(dailyMap.values()).sort((a, b) => a.day - b.day);
    }

    async generateMonthlySummary(month: string, bankAccountId: string) {
        const transactions = await Expense.find({ month, bankAccountId })
            .select('day type amount category')
            .lean();

        if (transactions.length === 0) {
            await MonthlySummary.deleteOne({ month, bankAccountId });
            return null;
        }

        const expenses = transactions.filter(t => t.type !== 'income');
        const incomes = transactions.filter(t => t.type === 'income');

        const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalIncome = incomes.reduce((sum, e) => sum + e.amount, 0);
        const uniqueDays = new Set(transactions.map(e => e.day));
        const totalDays = uniqueDays.size;
        const averageDailyExpense = totalDays > 0 ? totalExpense / totalDays : 0;

        // Category breakdown for expenses
        const categoryBreakdown = new Map<string, number>();
        for (const expense of expenses) {
            const current = categoryBreakdown.get(expense.category) || 0;
            categoryBreakdown.set(expense.category, current + expense.amount);
        }

        // Category breakdown for incomes
        const incomeCategoryBreakdown = new Map<string, number>();
        for (const income of incomes) {
            const current = incomeCategoryBreakdown.get(income.category) || 0;
            incomeCategoryBreakdown.set(income.category, current + income.amount);
        }

        // Find highest expense day
        const dailyTotals = new Map<number, number>();
        for (const expense of expenses) {
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

        const summary = await MonthlySummary.findOneAndUpdate(
            { month, bankAccountId },
            {
                totalExpense,
                totalIncome,
                totalDays,
                categoryBreakdown,
                incomeCategoryBreakdown,
                averageDailyExpense,
                highestExpenseDay
            },
            { upsert: true, new: true }
        );
        return summary;
    }

    async getDashboardData(month: string, bankAccountId: string) {
        const queryMonth = buildMonthQuery(month);
        const transactions = await Expense.find({ month: queryMonth, bankAccountId })
            .select('day amount category month type')
            .lean();

        if (transactions.length === 0) {
            return {
                totalExpense: 0,
                totalIncome: 0,
                netSavings: 0,
                averageDailyExpense: 0,
                highestExpenseDay: 0,
                totalEntries: 0,
                categoryBreakdown: {},
                incomeCategoryBreakdown: {},
                dailyTrend: [],
                topSpendingDays: []
            };
        }

        const expenses = transactions.filter(t => t.type !== 'income');
        const incomes = transactions.filter(t => t.type === 'income');

        const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalIncome = incomes.reduce((sum, e) => sum + e.amount, 0);
        const netSavings = totalIncome - totalExpense;

        const uniqueDays = new Set(expenses.map(e => e.day));
        const averageDailyExpense = uniqueDays.size > 0 ? totalExpense / uniqueDays.size : 0;

        // Highest expense day
        const dailyTotals = new Map<number, number>();
        for (const expense of expenses) {
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

        // Category breakdown for charts
        const categoryBreakdown: Record<string, number> = {};
        for (const expense of expenses) {
            categoryBreakdown[expense.category] = (categoryBreakdown[expense.category] || 0) + expense.amount;
        }

        // Income Category breakdown
        const incomeCategoryBreakdown: Record<string, number> = {};
        for (const income of incomes) {
            incomeCategoryBreakdown[income.category] = (incomeCategoryBreakdown[income.category] || 0) + income.amount;
        }

        // Daily trend data: combine both income and expense per day, grouped by month and day to support ranges
        const uniqueMonths = Array.from(new Set(transactions.map(t => t.month)));
        const dailyTrendMap = new Map<string, { day: number; month: string; date: string; expense: number; income: number }>();

        for (const m of uniqueMonths) {
            const daysInMonth = getDaysInMonth(m);
            for (let d = 1; d <= daysInMonth; d++) {
                const dateKey = `${m}-${String(d).padStart(2, '0')}`;
                dailyTrendMap.set(dateKey, {
                    day: d,
                    month: m,
                    date: dateKey,
                    expense: 0,
                    income: 0
                });
            }
        }

        for (const transaction of transactions) {
            const dateKey = `${transaction.month}-${String(transaction.day).padStart(2, '0')}`;
            const item = dailyTrendMap.get(dateKey);
            if (item) {
                if (transaction.type === 'income') {
                    item.income += transaction.amount;
                } else {
                    item.expense += transaction.amount;
                }
            }
        }

        const dailyTrend = Array.from(dailyTrendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

        // Top spending days
        const topSpendingDays = Array.from(dailyTotals.entries())
            .map(([day, total]) => ({ day, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        return {
            totalExpense,
            totalIncome,
            netSavings,
            averageDailyExpense,
            highestExpenseDay,
            totalEntries: transactions.length,
            categoryBreakdown,
            incomeCategoryBreakdown,
            dailyTrend,
            topSpendingDays
        };
    }
}