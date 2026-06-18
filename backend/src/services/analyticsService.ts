import { IExpense } from '../models/Expense';

export class AnalyticsService {
    generateInsights(expenses: IExpense[]): string[] {
        if (expenses.length === 0) {
            return ['No expenses recorded for this month. Upload a file to see insights.'];
        }

        const insights: string[] = [];
        const days = new Set(expenses.map(e => e.day)).size;
        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
        const average = total / days;

        // Most frequent category
        const categoryCount = new Map<string, number>();
        const categorySpend = new Map<string, number>();
        for (const expense of expenses) {
            const currentCount = categoryCount.get(expense.category) || 0;
            categoryCount.set(expense.category, currentCount + 1);

            const currentSpend = categorySpend.get(expense.category) || 0;
            categorySpend.set(expense.category, currentSpend + expense.amount);
        }

        let mostFrequentCategory = 'None';
        let maxCount = 0;
        for (const [category, count] of categoryCount) {
            if (count > maxCount) {
                maxCount = count;
                mostFrequentCategory = category;
            }
        }

        let highestSpendCategory = 'None';
        let maxSpend = 0;
        for (const [category, spend] of categorySpend) {
            if (spend > maxSpend) {
                maxSpend = spend;
                highestSpendCategory = category;
            }
        }

        // Find highest spending day
        const dailyTotals = new Map<number, number>();
        for (const expense of expenses) {
            const current = dailyTotals.get(expense.day) || 0;
            dailyTotals.set(expense.day, current + expense.amount);
        }

        let highestSpendingDay = 0;
        let highestAmount = 0;
        for (const [day, amount] of dailyTotals) {
            if (amount > highestAmount) {
                highestAmount = amount;
                highestSpendingDay = day;
            }
        }

        // Trend analysis
        const sortedDays = Array.from(dailyTotals.keys()).sort((a, b) => a - b);
        const trendData = sortedDays.map(day => ({
            day,
            amount: dailyTotals.get(day) || 0
        }));

        let trend = 'stable';
        if (trendData.length >= 3) {
            const mid = Math.floor(trendData.length / 2);
            const firstHalf = trendData.slice(0, mid).reduce((sum, d) => sum + d.amount, 0);
            const secondHalf = trendData.slice(mid).reduce((sum, d) => sum + d.amount, 0);

            if (secondHalf > firstHalf * 1.1) trend = 'increasing';
            else if (secondHalf < firstHalf * 0.9) trend = 'decreasing';
        }

        insights.push(`Your average daily expense is ₹${average.toFixed(2)} across ${days} active days.`);
        insights.push(`The category with the most transactions is "${mostFrequentCategory}" (${maxCount} times).`);
        insights.push(`The category with the highest total spend is "${highestSpendCategory}" (₹${maxSpend.toFixed(2)}).`);
        insights.push(`Your highest single-day spend was on Day ${highestSpendingDay}, totaling ₹${highestAmount.toFixed(2)}.`);
        
        if (trend === 'increasing') {
            insights.push(`Caution: Your spending trend is increasing in the second half of the month compared to the first.`);
        } else if (trend === 'decreasing') {
            insights.push(`Suggest: Your spending trend is decreasing in the second half of the month. Keep up the good work!`);
        } else {
            insights.push(`Your spending pattern has been relatively stable throughout the month.`);
        }

        return insights;
    }

    getWeekdayWeekendBreakdown(expenses: IExpense[], month: string) {
        let weekdayTotal = 0;
        let weekendTotal = 0;
        let weekdayCount = 0;
        let weekendCount = 0;

        const [year, monthNum] = month.split('-').map(Number);

        for (const expense of expenses) {
            const date = new Date(year, monthNum - 1, expense.day);
            const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            if (isWeekend) {
                weekendTotal += expense.amount;
                weekendCount++;
            } else {
                weekdayTotal += expense.amount;
                weekdayCount++;
            }
        }

        return {
            weekdayTotal,
            weekendTotal,
            weekdayCount,
            weekendCount,
            weekdayAverage: weekdayCount > 0 ? weekdayTotal / weekdayCount : 0,
            weekendAverage: weekendCount > 0 ? weekendTotal / weekendCount : 0
        };
    }

    getWeeklySpend(expenses: IExpense[]) {
        let week1 = 0;
        let week2 = 0;
        let week3 = 0;
        let week4 = 0;

        for (const expense of expenses) {
            if (expense.day <= 7) week1 += expense.amount;
            else if (expense.day <= 14) week2 += expense.amount;
            else if (expense.day <= 21) week3 += expense.amount;
            else week4 += expense.amount;
        }

        return [
            { name: 'Week 1', amount: week1 },
            { name: 'Week 2', amount: week2 },
            { name: 'Week 3', amount: week3 },
            { name: 'Week 4+', amount: week4 }
        ];
    }

    getTransactionSizeBreakdown(expenses: IExpense[]) {
        let low = 0;
        let medium = 0;
        let high = 0;

        for (const expense of expenses) {
            if (expense.amount < 250) low++;
            else if (expense.amount <= 1000) medium++;
            else high++;
        }

        return { low, medium, high };
    }
}