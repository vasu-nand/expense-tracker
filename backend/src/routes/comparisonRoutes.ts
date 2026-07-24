import { Router, Request, Response } from 'express';
import BankAccount from '../models/BankAccount';
import Expense from '../models/Expense';

const router = Router();

// Helper to construct query filters based on comparison request parameters
const buildMonthFilter = (filterType: string, startMonth?: string, endMonth?: string) => {
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = String(today.getMonth() + 1).padStart(2, '0');
    
    switch (filterType) {
        case 'current-month':
            return { month: `${curYear}-${curMonth}` };
        case 'last-month': {
            const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lmY = lm.getFullYear();
            const lmM = String(lm.getMonth() + 1).padStart(2, '0');
            return { month: `${lmY}-${lmM}` };
        }
        case 'current-year':
            return { month: { $regex: `^${curYear}-` } };
        case 'custom': {
            const query: any = {};
            if (startMonth) query.$gte = startMonth;
            if (endMonth) query.$lte = endMonth;
            return { month: query };
        }
        case 'all-time':
        default:
            return {};
    }
};

// GET /api/comparison - Retrieve general summary overview metrics for all accounts side-by-side
router.get('/comparison', async (req: Request, res: Response) => {
    try {
        const filterType = (req.query.filterType as string) || 'all-time';
        const startMonth = req.query.startMonth as string;
        const endMonth = req.query.endMonth as string;
        
        const today = new Date();
        const curYear = today.getFullYear();
        const curMonth = String(today.getMonth() + 1).padStart(2, '0');
        const heatmapMonth = (req.query.heatmapMonth as string) || `${curYear}-${curMonth}`;

        const accounts = await BankAccount.find().sort({ createdAt: 1 });
        const monthFilter = buildMonthFilter(filterType, startMonth, endMonth);
        const expenseFilter = { type: { $ne: 'income' }, ...monthFilter };

        const comparisonStats = await Promise.all(accounts.map(async (acc) => {
            const expenses = await Expense.find({ bankAccountId: acc._id, ...expenseFilter })
                .select('amount category month day reason')
                .lean();

            const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
            const transactionCount = expenses.length;
            const averageTransaction = transactionCount > 0 ? totalExpenses / transactionCount : 0;

            // Find largest expense
            let largestExpense = null;
            if (expenses.length > 0) {
                const largest = expenses.reduce((max, e) => e.amount > max.amount ? e : max, expenses[0]);
                largestExpense = {
                    amount: largest.amount,
                    reason: largest.reason,
                    category: largest.category
                };
            }

            // Categories count
            const categories = new Set(expenses.map(e => e.category));
            const categoriesUsed = categories.size;

            // Monthly breakdown for averages and highest month
            const monthlyTotals: Record<string, number> = {};
            for (const exp of expenses) {
                monthlyTotals[exp.month] = (monthlyTotals[exp.month] || 0) + exp.amount;
            }

            let highestMonthName = 'None';
            let highestMonthAmount = 0;
            for (const [m, amt] of Object.entries(monthlyTotals)) {
                if (amt > highestMonthAmount) {
                    highestMonthAmount = amt;
                    highestMonthName = m;
                }
            }

            const uniqueMonths = Object.keys(monthlyTotals);
            const averageMonthlySpend = uniqueMonths.length > 0 ? totalExpenses / uniqueMonths.length : totalExpenses;

            // Mini heatmap data: group by day, filtered specifically for heatmapMonth
            const heatmapExpenses = await Expense.find({
                bankAccountId: acc._id,
                type: { $ne: 'income' },
                month: heatmapMonth
            }).select('amount day').lean();

            const dailyTotals: Record<number, number> = {};
            for (const exp of heatmapExpenses) {
                dailyTotals[exp.day] = (dailyTotals[exp.day] || 0) + exp.amount;
            }

            // Growth indicator (compare this month to last month)
            // Note: only makes sense if current month or specific single month is viewed
            let growthPercentage = 0;
            if (filterType === 'current-month') {
                const curM = monthFilter.month;
                const [y, m] = curM.split('-').map(Number);
                const prevMStr = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, '0')}`;
                
                const prevMonthAgg = await Expense.aggregate([
                    { $match: {
                        bankAccountId: acc._id,
                        type: { $ne: 'income' },
                        month: prevMStr
                    }},
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]);
                
                const prevTotal = prevMonthAgg[0]?.total || 0;
                if (prevTotal > 0) {
                    growthPercentage = ((totalExpenses - prevTotal) / prevTotal) * 100;
                }
            }

            const latestExpense = await Expense.findOne({ bankAccountId: acc._id }).sort({ uploadedAt: -1 }).select('uploadedAt');

            return {
                accountId: acc._id,
                name: acc.name,
                bankName: acc.bankName,
                color: acc.color,
                icon: acc.icon,
                isPrimary: acc.isPrimary,
                createdAt: acc.createdAt,
                totalExpenses,
                transactionCount,
                averageTransaction,
                largestExpense,
                categoriesUsed,
                averageMonthlySpend,
                highestMonth: highestMonthName !== 'None' ? { month: highestMonthName, amount: highestMonthAmount } : null,
                dailyTotals,
                growthPercentage,
                lastUpload: latestExpense?.uploadedAt || acc.createdAt
            };
        }));

        // Sort leaderboard: highest spend to lowest
        const leaderboard = [...comparisonStats].sort((a, b) => b.totalExpenses - a.totalExpenses);

        // Fetch top biggest transactions across all accounts
        const allTransactions = await Expense.find({ ...expenseFilter })
            .populate('bankAccountId', 'name bankName color')
            .sort({ amount: -1 })
            .limit(10)
            .lean();

        res.json({
            accounts: comparisonStats,
            leaderboard,
            biggestTransactions: allTransactions.map(tx => ({
                id: tx._id,
                amount: tx.amount,
                reason: tx.reason,
                category: tx.category,
                month: tx.month,
                day: tx.day,
                accountName: (tx.bankAccountId as any)?.name || 'Unknown',
                bankName: (tx.bankAccountId as any)?.bankName || 'Unknown',
                accountColor: (tx.bankAccountId as any)?.color || '#0d9488'
            }))
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/comparison/monthly - Multi-line monthly trend chart totals grouped per account
router.get('/comparison/monthly', async (req: Request, res: Response) => {
    try {
        const filterType = (req.query.filterType as string) || 'all-time';
        const startMonth = req.query.startMonth as string;
        const endMonth = req.query.endMonth as string;

        const accounts = await BankAccount.find().sort({ createdAt: 1 });
        const monthFilter = buildMonthFilter(filterType, startMonth, endMonth);
        const expenseFilter = { type: { $ne: 'income' }, ...monthFilter };

        // Query database grouping by month and account ID
        const aggregates = await Expense.aggregate([
            { $match: expenseFilter },
            { $group: {
                _id: { bankAccountId: '$bankAccountId', month: '$month' },
                total: { $sum: '$amount' }
            }}
        ]);

        // List of all unique months matched
        const uniqueMonthsSet = new Set<string>();
        aggregates.forEach(agg => uniqueMonthsSet.add(agg._id.month));
        const uniqueMonths = Array.from(uniqueMonthsSet).sort();

        // If 'current-year' or other filters returned empty list, populate at least the last few months for graph consistency
        if (uniqueMonths.length === 0) {
            const today = new Date();
            const curYear = today.getFullYear();
            for (let i = 1; i <= 12; i++) {
                uniqueMonths.push(`${curYear}-${String(i).padStart(2, '0')}`);
            }
        }

        // Build side-by-side monthly totals array
        const chartData = uniqueMonths.map(month => {
            const row: any = { name: month };
            accounts.forEach(acc => {
                const match = aggregates.find(
                    agg => agg._id.month === month && agg._id.bankAccountId.toString() === acc._id.toString()
                );
                row[acc.name] = match ? match.total : 0;
            });
            return row;
        });

        res.json(chartData);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/comparison/categories - Category stacked bar data & top categories details
router.get('/comparison/categories', async (req: Request, res: Response) => {
    try {
        const filterType = (req.query.filterType as string) || 'all-time';
        const startMonth = req.query.startMonth as string;
        const endMonth = req.query.endMonth as string;

        const accounts = await BankAccount.find().sort({ createdAt: 1 });
        const monthFilter = buildMonthFilter(filterType, startMonth, endMonth);
        const expenseFilter = { type: { $ne: 'income' }, ...monthFilter };

        // Aggregate spend by category and account
        const aggregates = await Expense.aggregate([
            { $match: expenseFilter },
            { $group: {
                _id: { bankAccountId: '$bankAccountId', category: '$category' },
                total: { $sum: '$amount' }
            }}
        ]);

        // Get unique categories list
        const categoriesSet = new Set<string>();
        aggregates.forEach(agg => categoriesSet.add(agg._id.category));
        
        // Add predefined ones as fallback if empty
        if (categoriesSet.size === 0) {
            ['Food', 'Shopping', 'Bills', 'Rent', 'Others'].forEach(c => categoriesSet.add(c));
        }
        const uniqueCategories = Array.from(categoriesSet).sort();

        // Build stacked category chart data
        const chartData = uniqueCategories.map(cat => {
            const row: any = { category: cat };
            accounts.forEach(acc => {
                const match = aggregates.find(
                    agg => agg._id.category === cat && agg._id.bankAccountId.toString() === acc._id.toString()
                );
                row[acc.name] = match ? match.total : 0;
            });
            return row;
        });

        // Compute top category info table for every account
        const topCategoriesInfo = await Promise.all(accounts.map(async (acc) => {
            const accountAggs = aggregates.filter(agg => agg._id.bankAccountId.toString() === acc._id.toString());
            const totalSpend = accountAggs.reduce((sum, agg) => sum + agg.total, 0);

            let topCategory = 'None';
            let topAmount = 0;
            
            for (const agg of accountAggs) {
                if (agg.total > topAmount) {
                    topAmount = agg.total;
                    topCategory = agg._id.category;
                }
            }

            const percentage = totalSpend > 0 ? (topAmount / totalSpend) * 100 : 0;

            return {
                accountId: acc._id,
                accountName: acc.name,
                bankName: acc.bankName,
                color: acc.color,
                topCategory,
                amount: topAmount,
                percentage
            };
        }));

        res.json({
            chartData,
            topCategories: topCategoriesInfo
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
