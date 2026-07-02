import { IExpense } from '../models/Expense';

export class AnalyticsService {
    generateInsights(transactions: IExpense[]): string[] {
        if (transactions.length === 0) {
            return ['No transactions recorded for this month. Upload a file or add a transaction to see insights.'];
        }

        const insights: string[] = [];
        const expenses = transactions.filter(t => t.type !== 'income');
        const incomes = transactions.filter(t => t.type === 'income');

        const activeDays = new Set(transactions.map(e => e.day)).size;
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalIncome = incomes.reduce((sum, e) => sum + e.amount, 0);
        const netSavings = totalIncome - totalExpenses;

        // Daily averages
        const avgExpense = activeDays > 0 ? totalExpenses / activeDays : 0;
        const avgIncome = activeDays > 0 ? totalIncome / activeDays : 0;

        // Expenses categories metrics
        const categoryCount = new Map<string, number>();
        const categorySpend = new Map<string, number>();
        for (const expense of expenses) {
            categoryCount.set(expense.category, (categoryCount.get(expense.category) || 0) + 1);
            categorySpend.set(expense.category, (categorySpend.get(expense.category) || 0) + expense.amount);
        }

        let mostFrequentExpenseCategory = 'None';
        let maxExpenseCount = 0;
        for (const [category, count] of categoryCount) {
            if (count > maxExpenseCount) {
                maxExpenseCount = count;
                mostFrequentExpenseCategory = category;
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

        // Income categories metrics
        const incomeCategoryCount = new Map<string, number>();
        const incomeCategoryTotal = new Map<string, number>();
        for (const income of incomes) {
            incomeCategoryCount.set(income.category, (incomeCategoryCount.get(income.category) || 0) + 1);
            incomeCategoryTotal.set(income.category, (incomeCategoryTotal.get(income.category) || 0) + income.amount);
        }

        let mostFrequentIncomeCategory = 'None';
        let maxIncomeCount = 0;
        for (const [category, count] of incomeCategoryCount) {
            if (count > maxIncomeCount) {
                maxIncomeCount = count;
                mostFrequentIncomeCategory = category;
            }
        }

        let highestIncomeCategory = 'None';
        let maxIncomeSpend = 0;
        for (const [category, val] of incomeCategoryTotal) {
            if (val > maxIncomeSpend) {
                maxIncomeSpend = val;
                highestIncomeCategory = category;
            }
        }

        // Find highest spending day
        const dailyExpenseTotals = new Map<number, number>();
        for (const expense of expenses) {
            dailyExpenseTotals.set(expense.day, (dailyExpenseTotals.get(expense.day) || 0) + expense.amount);
        }

        let highestSpendingDay = 0;
        let highestExpenseAmount = 0;
        for (const [day, amount] of dailyExpenseTotals) {
            if (amount > highestExpenseAmount) {
                highestExpenseAmount = amount;
                highestSpendingDay = day;
            }
        }

        // Find highest income day
        const dailyIncomeTotals = new Map<number, number>();
        for (const income of incomes) {
            dailyIncomeTotals.set(income.day, (dailyIncomeTotals.get(income.day) || 0) + income.amount);
        }

        let highestIncomeDay = 0;
        let highestIncomeAmount = 0;
        for (const [day, amount] of dailyIncomeTotals) {
            if (amount > highestIncomeAmount) {
                highestIncomeAmount = amount;
                highestIncomeDay = day;
            }
        }

        // Trend analysis (expenses)
        const sortedDays = Array.from(dailyExpenseTotals.keys()).sort((a, b) => a - b);
        const trendData = sortedDays.map(day => ({
            day,
            amount: dailyExpenseTotals.get(day) || 0
        }));

        let trend = 'stable';
        if (trendData.length >= 3) {
            const mid = Math.floor(trendData.length / 2);
            const firstHalf = trendData.slice(0, mid).reduce((sum, d) => sum + d.amount, 0);
            const secondHalf = trendData.slice(mid).reduce((sum, d) => sum + d.amount, 0);

            if (secondHalf > firstHalf * 1.1) trend = 'increasing';
            else if (secondHalf < firstHalf * 0.9) trend = 'decreasing';
        }

        // Generate dynamic visual insights list
        insights.push(`Daily Average Rate: ₹${avgExpense.toFixed(2)} spending vs ₹${avgIncome.toFixed(2)} income.`);
        
        if (totalIncome > 0) {
            insights.push(`Income stats: Top source is "${highestIncomeCategory}" (₹${maxIncomeSpend.toFixed(2)} total).`);
            if (highestIncomeDay > 0) {
                insights.push(`Highest single-day income: Day ${highestIncomeDay} (₹${highestIncomeAmount.toFixed(2)}).`);
            }
        }

        if (totalExpenses > 0) {
            insights.push(`Spending stats: Highest total category is "${highestSpendCategory}" (₹${maxSpend.toFixed(2)}).`);
            if (highestSpendingDay > 0) {
                insights.push(`Highest single-day spend: Day ${highestSpendingDay} (₹${highestExpenseAmount.toFixed(2)}).`);
            }
        }

        // Savings insight
        if (totalIncome > 0) {
            if (netSavings >= 0) {
                const savingsRate = (netSavings / totalIncome) * 100;
                insights.push(`Savings Rate: You saved ₹${netSavings.toFixed(2)} this month (${savingsRate.toFixed(0)}% of your income).`);
            } else {
                insights.push(`Alert: Your net balance is negative by -₹${Math.abs(netSavings).toFixed(2)} (spent more than earned).`);
            }
        }

        if (totalExpenses > 0) {
            if (trend === 'increasing') {
                insights.push(`Caution: Spending trend is increasing in the second half of the month.`);
            } else if (trend === 'decreasing') {
                insights.push(`Success: Spending trend is decreasing in the second half of the month. Keep it up!`);
            }
        }

        return insights;
    }

    getWeekdayWeekendBreakdown(transactions: IExpense[], month: string) {
        let weekdayTotal = 0;
        let weekendTotal = 0;
        let weekdayCount = 0;
        let weekendCount = 0;

        let weekdayIncomeTotal = 0;
        let weekendIncomeTotal = 0;
        let weekdayIncomeCount = 0;
        let weekendIncomeCount = 0;

        const targetMonth = month.includes(':') ? month.split(':')[0] : (month.includes(',') ? month.split(',')[0] : month);
        const [year, monthNum] = targetMonth.split('-').map(Number);

        for (const transaction of transactions) {
            const date = new Date(year, monthNum - 1, transaction.day);
            const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isIncome = transaction.type === 'income';

            if (isIncome) {
                if (isWeekend) {
                    weekendIncomeTotal += transaction.amount;
                    weekendIncomeCount++;
                } else {
                    weekdayIncomeTotal += transaction.amount;
                    weekdayIncomeCount++;
                }
            } else {
                if (isWeekend) {
                    weekendTotal += transaction.amount;
                    weekendCount++;
                } else {
                    weekdayTotal += transaction.amount;
                    weekdayCount++;
                }
            }
        }

        return {
            weekdayTotal,
            weekendTotal,
            weekdayCount,
            weekendCount,
            weekdayAverage: weekdayCount > 0 ? weekdayTotal / weekdayCount : 0,
            weekendAverage: weekendCount > 0 ? weekendTotal / weekendCount : 0,
            weekdayIncomeTotal,
            weekendIncomeTotal,
            weekdayIncomeCount,
            weekendIncomeCount,
            weekdayIncomeAverage: weekdayIncomeCount > 0 ? weekdayIncomeTotal / weekdayIncomeCount : 0,
            weekendIncomeAverage: weekendIncomeCount > 0 ? weekendIncomeTotal / weekendIncomeCount : 0
        };
    }

    getWeeklySpend(transactions: IExpense[]) {
        let week1Exp = 0, week1Inc = 0;
        let week2Exp = 0, week2Inc = 0;
        let week3Exp = 0, week3Inc = 0;
        let week4Exp = 0, week4Inc = 0;

        for (const transaction of transactions) {
            const isIncome = transaction.type === 'income';
            if (transaction.day <= 7) {
                if (isIncome) week1Inc += transaction.amount; else week1Exp += transaction.amount;
            } else if (transaction.day <= 14) {
                if (isIncome) week2Inc += transaction.amount; else week2Exp += transaction.amount;
            } else if (transaction.day <= 21) {
                if (isIncome) week3Inc += transaction.amount; else week3Exp += transaction.amount;
            } else {
                if (isIncome) week4Inc += transaction.amount; else week4Exp += transaction.amount;
            }
        }

        return [
            { name: 'Week 1', amount: week1Exp, income: week1Inc },
            { name: 'Week 2', amount: week2Exp, income: week2Inc },
            { name: 'Week 3', amount: week3Exp, income: week3Inc },
            { name: 'Week 4+', amount: week4Exp, income: week4Inc }
        ];
    }

    getTransactionSizeBreakdown(transactions: IExpense[]) {
        let lowExpense = 0, mediumExpense = 0, highExpense = 0;
        let lowIncome = 0, mediumIncome = 0, highIncome = 0;

        for (const transaction of transactions) {
            const isIncome = transaction.type === 'income';
            if (isIncome) {
                if (transaction.amount < 250) lowIncome++;
                else if (transaction.amount <= 1000) mediumIncome++;
                else highIncome++;
            } else {
                if (transaction.amount < 250) lowExpense++;
                else if (transaction.amount <= 1000) mediumExpense++;
                else highExpense++;
            }
        }

        return {
            low: lowExpense,
            medium: mediumExpense,
            high: highExpense,
            expense: { low: lowExpense, medium: mediumExpense, high: highExpense },
            income: { low: lowIncome, medium: mediumIncome, high: highIncome }
        };
    }
}