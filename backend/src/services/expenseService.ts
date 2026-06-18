import Expense, { IExpense } from '../models/Expense';
import MonthlySummary from '../models/MonthlySummary';

export class ExpenseService {
    async createExpense(expense: Partial<IExpense>) {
        const newExpense = new Expense(expense);
        return newExpense.save();
    }

    async updateExpense(id: string, updates: Partial<IExpense>) {
        return Expense.findByIdAndUpdate(id, updates, { new: true });
    }

    async bulkCreateExpenses(expenses: Partial<IExpense>[]) {
        return Expense.insertMany(expenses);
    }

    async getAllExpenses(
        page: number = 1,
        limit: number = 50,
        category?: string,
        month?: string,
        day?: number
    ) {
        const query: any = {};
        if (category) query.category = category;
        if (month) query.month = month;
        if (day !== undefined) query.day = day;

        const skip = (page - 1) * limit;
        const [expenses, total] = await Promise.all([
            Expense.find(query)
                .sort({ day: 1 })
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

    async getExpenseById(id: string) {
        return Expense.findById(id);
    }

    async deleteExpense(id: string) {
        return Expense.findByIdAndDelete(id);
    }

    async getDailySummary(month: string) {
        const expenses = await Expense.find({ month });

        const dailyMap = new Map<number, { day: number; totalExpense: number; entries: any[] }>();

        for (const expense of expenses) {
            if (!dailyMap.has(expense.day)) {
                dailyMap.set(expense.day, {
                    day: expense.day,
                    totalExpense: 0,
                    entries: []
                });
            }

            const daily = dailyMap.get(expense.day)!;
            daily.totalExpense += expense.amount;
            daily.entries.push({
                amount: expense.amount,
                reason: expense.reason,
                category: expense.category
            });
        }

        return Array.from(dailyMap.values()).sort((a, b) => a.day - b.day);
    }

    async generateMonthlySummary(month: string) {
        const expenses = await Expense.find({ month });

        if (expenses.length === 0) {
            await MonthlySummary.deleteOne({ month });
            return null;
        }

        const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
        const uniqueDays = new Set(expenses.map(e => e.day));
        const totalDays = uniqueDays.size;
        const averageDailyExpense = totalExpense / totalDays;

        // Category breakdown
        const categoryBreakdown = new Map<string, number>();
        for (const expense of expenses) {
            const current = categoryBreakdown.get(expense.category) || 0;
            categoryBreakdown.set(expense.category, current + expense.amount);
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

        const summary = new MonthlySummary({
            month,
            totalExpense,
            totalDays,
            categoryBreakdown,
            averageDailyExpense,
            highestExpenseDay
        });

        await summary.save();
        return summary;
    }

    async getDashboardData(month: string) {
        const expenses = await Expense.find({ month });

        if (expenses.length === 0) {
            return {
                totalExpense: 0,
                averageDailyExpense: 0,
                highestExpenseDay: 0,
                totalEntries: 0
            };
        }

        const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
        const uniqueDays = new Set(expenses.map(e => e.day));
        const averageDailyExpense = totalExpense / uniqueDays.size;

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

        // Daily trend data
        const dailyTrend = Array.from(dailyTotals.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([day, total]) => ({ day, total }));

        // Top spending days
        const topSpendingDays = [...dailyTrend]
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        return {
            totalExpense,
            averageDailyExpense,
            highestExpenseDay,
            totalEntries: expenses.length,
            categoryBreakdown,
            dailyTrend,
            topSpendingDays
        };
    }
}