import { Request, Response } from 'express';
import InvestmentAsset from '../models/InvestmentAsset';
import InvestmentTransaction from '../models/InvestmentTransaction';
import Dividend from '../models/Dividend';
import Watchlist from '../models/Watchlist';
import WealthGoal from '../models/WealthGoal';
import PriceAlert from '../models/PriceAlert';
import BankAccount from '../models/BankAccount';
import Expense from '../models/Expense';
import { getAssetPrice } from '../services/priceService';
import { calculateXIRR } from '../utils/wealthEngine';

// Get comprehensive wealth & portfolio summary
export const getPortfolioSummary = async (req: Request, res: Response): Promise<void> => {
    try {
        const assets = await InvestmentAsset.find();
        const transactions = await InvestmentTransaction.find().sort({ dateTime: 1 });
        const dividends = await Dividend.find();
        const bankAccounts = await BankAccount.find();

        // 1. Calculate positions/holdings dynamically
        const holdingsMap: Record<string, {
            assetId: string;
            symbol: string;
            name: string;
            assetType: string;
            currency: string;
            quantity: number;
            totalCost: number;
            averageBuyPrice: number;
            realizedPL: number;
        }> = {};

        // Initialize positions
        assets.forEach(asset => {
            holdingsMap[asset._id.toString()] = {
                assetId: asset._id.toString(),
                symbol: asset.symbol,
                name: asset.name,
                assetType: asset.assetType,
                currency: asset.currency,
                quantity: 0,
                totalCost: 0,
                averageBuyPrice: 0,
                realizedPL: 0
            };
        });

        // Process transactions chronologically
        transactions.forEach(tx => {
            const assetKey = tx.assetId.toString();
            if (!holdingsMap[assetKey]) return;

            const pos = holdingsMap[assetKey];
            if (tx.type === 'buy') {
                const txCost = (tx.price * tx.quantity) + tx.fees + tx.tax;
                pos.totalCost += txCost;
                pos.quantity += tx.quantity;
                pos.averageBuyPrice = pos.quantity > 0 ? (pos.totalCost / pos.quantity) : 0;
            } else if (tx.type === 'sell') {
                if (pos.quantity <= 0) return;
                const sellRevenue = (tx.price * tx.quantity) - tx.fees - tx.tax;
                const costOfSoldQuantity = pos.averageBuyPrice * tx.quantity;
                
                pos.realizedPL += (sellRevenue - costOfSoldQuantity);
                pos.quantity = Math.max(0, pos.quantity - tx.quantity);
                
                // Reduce cost proportional to remaining quantity
                pos.totalCost = pos.quantity * pos.averageBuyPrice;
            }
        });

        // 2. Fetch live prices and compute market values
        const activeHoldings: any[] = [];
        let totalCurrentValue = 0;
        let totalInvestment = 0;
        let totalRealizedPL = 0;
        let totalUnrealizedPL = 0;
        const assetAllocation: Record<string, number> = {};

        // Cash flow history for XIRR
        const cashFlows: Array<{ amount: number; date: Date }> = [];

        // Build cash flow for XIRR from transactions
        transactions.forEach(tx => {
            const cost = (tx.price * tx.quantity);
            if (tx.type === 'buy') {
                // Outflow (money invested)
                cashFlows.push({
                    amount: -(cost + tx.fees + tx.tax),
                    date: tx.dateTime
                });
            } else {
                // Inflow (money returned)
                cashFlows.push({
                    amount: +(cost - tx.fees - tx.tax),
                    date: tx.dateTime
                });
            }
        });

        // Process dividends as positive inflows
        dividends.forEach(div => {
            cashFlows.push({
                amount: +(div.amount - div.tax),
                date: div.date
            });
        });

        // Loop holdings to query current market values
        for (const key of Object.keys(holdingsMap)) {
            const pos = holdingsMap[key];
            totalRealizedPL += pos.realizedPL;

            if (pos.quantity > 0) {
                const priceData = await getAssetPrice(pos.symbol);
                const currentValue = pos.quantity * priceData.price;
                const unrealizedPL = currentValue - pos.totalCost;
                
                totalCurrentValue += currentValue;
                totalInvestment += pos.totalCost;
                totalUnrealizedPL += unrealizedPL;

                // Group allocation
                const category = pos.assetType;
                assetAllocation[category] = (assetAllocation[category] || 0) + currentValue;

                activeHoldings.push({
                    ...pos,
                    currentPrice: priceData.price,
                    dayChange: priceData.change,
                    currentValue,
                    unrealizedPL,
                    unrealizedPLPercentage: pos.totalCost > 0 ? (unrealizedPL / pos.totalCost) * 100 : 0
                });
            }
        }

        // Add current portfolio market value as a positive final cash flow today to finalize XIRR
        if (totalCurrentValue > 0) {
            cashFlows.push({
                amount: totalCurrentValue,
                date: new Date()
            });
        }

        // Calculate metrics
        const totalDividends = dividends.reduce((sum, d) => sum + (d.amount - d.tax), 0);
        const xirr = calculateXIRR(cashFlows);

        // Aggregate bank balances from Expense transactions
        const balanceStats = await Expense.aggregate([
            {
                $group: {
                    _id: '$bankAccountId',
                    totalIncome: {
                        $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
                    },
                    totalExpenses: {
                        $sum: { $cond: [{ $ne: ['$type', 'income'] }, '$amount', 0] }
                    }
                }
            }
        ]);

        const balanceMap = new Map(balanceStats.map(s => [s._id.toString(), s.totalIncome - s.totalExpenses]));
        let bankBalances = 0;
        bankAccounts.forEach(acc => {
            bankBalances += balanceMap.get(acc._id.toString()) || 0;
        });

        const netWorth = totalCurrentValue + bankBalances;

        res.json({
            summary: {
                totalInvestment,
                currentValue: totalCurrentValue,
                unrealizedPL: totalUnrealizedPL,
                realizedPL: totalRealizedPL,
                totalProfitLoss: totalUnrealizedPL + totalRealizedPL,
                totalProfitLossPercentage: totalInvestment > 0 ? ((totalUnrealizedPL + totalRealizedPL) / totalInvestment) * 100 : 0,
                totalDividends,
                xirr,
                bankBalances,
                netWorth,
                assetAllocation
            },
            holdings: activeHoldings
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Asset CRUD
export const getAssets = async (req: Request, res: Response): Promise<void> => {
    try {
        const assets = await InvestmentAsset.find().sort({ symbol: 1 });
        res.json(assets);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createAsset = async (req: Request, res: Response): Promise<void> => {
    try {
        const { symbol, name, assetType, exchange, currency } = req.body;
        let asset = await InvestmentAsset.findOne({ symbol: symbol.toUpperCase() });
        
        if (!asset) {
            asset = new InvestmentAsset({
                symbol: symbol.toUpperCase(),
                name,
                assetType,
                exchange,
                currency: currency || 'USD'
            });
            await asset.save();
        }
        res.status(201).json(asset);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Transaction CRUD
export const getTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
        const transactions = await InvestmentTransaction.find()
            .populate('assetId')
            .sort({ dateTime: -1 });
        res.json(transactions);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const addTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
        const { assetId, type, quantity, price, fees, tax, dateTime, notes } = req.body;
        const transaction = new InvestmentTransaction({
            assetId,
            type,
            quantity,
            price,
            fees: fees || 0,
            tax: tax || 0,
            dateTime: dateTime || new Date(),
            notes
        });
        await transaction.save();
        res.status(201).json(transaction);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await InvestmentTransaction.findByIdAndDelete(id);
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Dividend CRUD
export const getDividends = async (req: Request, res: Response): Promise<void> => {
    try {
        const dividends = await Dividend.find().populate('assetId').sort({ date: -1 });
        res.json(dividends);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const addDividend = async (req: Request, res: Response): Promise<void> => {
    try {
        const { assetId, amount, date, tax } = req.body;
        const dividend = new Dividend({
            assetId,
            amount,
            date: date || new Date(),
            tax: tax || 0
        });
        await dividend.save();
        res.status(201).json(dividend);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteDividend = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await Dividend.findByIdAndDelete(id);
        res.json({ message: 'Dividend deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Watchlist CRUD
export const getWatchlist = async (req: Request, res: Response): Promise<void> => {
    try {
        const watchlist = await Watchlist.find().sort({ symbol: 1 });
        const listWithPrices = [];

        for (const item of watchlist) {
            const priceData = await getAssetPrice(item.symbol);
            listWithPrices.push({
                _id: item._id,
                symbol: item.symbol,
                name: item.name,
                assetType: item.assetType,
                currentPrice: priceData.price,
                dayChange: priceData.change
            });
        }
        res.json(listWithPrices);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const addToWatchlist = async (req: Request, res: Response): Promise<void> => {
    try {
        const { symbol, name, assetType } = req.body;
        const item = new Watchlist({
            symbol: symbol.toUpperCase(),
            name,
            assetType: assetType || 'stocks'
        });
        await item.save();
        res.status(201).json(item);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const removeFromWatchlist = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await Watchlist.findByIdAndDelete(id);
        res.json({ message: 'Removed from watchlist successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Goals CRUD
export const getGoals = async (req: Request, res: Response): Promise<void> => {
    try {
        const goals = await WealthGoal.find().sort({ deadline: 1 });
        res.json(goals);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const addGoal = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, targetAmount, currentProgress, deadline } = req.body;
        const goal = new WealthGoal({
            name,
            targetAmount,
            currentProgress: currentProgress || 0,
            deadline
        });
        await goal.save();
        res.status(201).json(goal);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateGoal = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, targetAmount, currentProgress, deadline } = req.body;
        const goal = await WealthGoal.findByIdAndUpdate(id, {
            name,
            targetAmount,
            currentProgress,
            deadline
        }, { new: true });
        res.json(goal);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteGoal = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await WealthGoal.findByIdAndDelete(id);
        res.json({ message: 'Goal deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Price Alerts CRUD
export const getAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
        const alerts = await PriceAlert.find().sort({ symbol: 1 });
        
        // Scan and trigger alerts in real-time
        for (const alert of alerts) {
            if (!alert.triggered) {
                const priceData = await getAssetPrice(alert.symbol);
                let isTriggered = false;
                
                if (alert.condition === 'above' && priceData.price > alert.targetPrice) {
                    isTriggered = true;
                } else if (alert.condition === 'below' && priceData.price < alert.targetPrice) {
                    isTriggered = true;
                }
                
                if (isTriggered) {
                    alert.triggered = true;
                    alert.triggeredAt = new Date();
                    await alert.save();
                }
            }
        }

        res.json(alerts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const addAlert = async (req: Request, res: Response): Promise<void> => {
    try {
        const { symbol, condition, targetPrice } = req.body;
        const alert = new PriceAlert({
            symbol: symbol.toUpperCase(),
            condition,
            targetPrice
        });
        await alert.save();
        res.status(201).json(alert);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteAlert = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await PriceAlert.findByIdAndDelete(id);
        res.json({ message: 'Alert deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
