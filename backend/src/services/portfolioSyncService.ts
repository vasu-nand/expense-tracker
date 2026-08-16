import Types from 'mongoose';
import Expense from '../models/Expense';
import BankAccount from '../models/BankAccount';
import InvestmentAsset, { IInvestmentAsset } from '../models/InvestmentAsset';
import { IInvestmentTransaction } from '../models/InvestmentTransaction';
import { IDividend } from '../models/Dividend';

/**
 * Get a valid fallback bank account ID if none is explicitly provided.
 */
export async function getDefaultBankAccountId(): Promise<Types.Types.ObjectId | null> {
    const account = await BankAccount.findOne().sort({ createdAt: 1 });
    return account ? (account._id as Types.Types.ObjectId) : null;
}

/**
 * Synchronize an InvestmentTransaction (Buy/Sell) into an Expense/Income entry.
 */
export async function syncTransactionToExpense(
    tx: IInvestmentTransaction,
    asset: IInvestmentAsset
): Promise<Types.Types.ObjectId | null> {
    try {
        const bankAccountId = tx.bankAccountId || (await getDefaultBankAccountId());
        if (!bankAccountId) {
            console.warn('[PortfolioSync] No bank account available to sync transaction:', tx._id);
            return null;
        }

        const date = tx.dateTime ? new Date(tx.dateTime) : new Date();
        const year = date.getFullYear();
        const monthNum = String(date.getMonth() + 1).padStart(2, '0');
        const month = `${year}-${monthNum}`;
        const day = date.getDate();

        const isBuy = tx.type === 'buy';
        const rawAmount = isBuy
            ? (tx.quantity * tx.price) + (tx.fees || 0) + (tx.tax || 0)
            : (tx.quantity * tx.price) - (tx.fees || 0) - (tx.tax || 0);

        const amount = Math.max(0, Math.round(rawAmount * 100) / 100);
        const type = isBuy ? 'expense' : 'income';
        const category = 'Investments';
        const reason = isBuy
            ? `Investment Buy: ${tx.quantity} ${asset.symbol}`
            : `Investment Sell: ${tx.quantity} ${asset.symbol}`;
        const sourceType = isBuy ? 'investment_buy' : 'investment_sell';

        let expenseDoc = null;
        if (tx.expenseId) {
            expenseDoc = await Expense.findById(tx.expenseId);
        }

        if (expenseDoc) {
            expenseDoc.bankAccountId = bankAccountId;
            expenseDoc.day = day;
            expenseDoc.month = month;
            expenseDoc.amount = amount;
            expenseDoc.reason = reason;
            expenseDoc.category = category;
            expenseDoc.type = type;
            expenseDoc.sourceType = sourceType;
            expenseDoc.sourceId = tx._id as any;
            await expenseDoc.save();
        } else {
            expenseDoc = new Expense({
                bankAccountId,
                day,
                month,
                amount,
                reason,
                category,
                type,
                sourceType,
                sourceId: tx._id,
                uploadedAt: date
            });
            await expenseDoc.save();
        }

        tx.expenseId = expenseDoc._id as any;
        tx.bankAccountId = bankAccountId;
        await tx.save();

        return expenseDoc._id as any;
    } catch (err) {
        console.error('[PortfolioSync] Error syncing transaction to expense:', err);
        return null;
    }
}

/**
 * Synchronize a Dividend payout into an Income entry.
 */
export async function syncDividendToExpense(
    div: IDividend,
    asset: IInvestmentAsset
): Promise<Types.Types.ObjectId | null> {
    try {
        const bankAccountId = div.bankAccountId || (await getDefaultBankAccountId());
        if (!bankAccountId) {
            console.warn('[PortfolioSync] No bank account available to sync dividend:', div._id);
            return null;
        }

        const date = div.date ? new Date(div.date) : new Date();
        const year = date.getFullYear();
        const monthNum = String(date.getMonth() + 1).padStart(2, '0');
        const month = `${year}-${monthNum}`;
        const day = date.getDate();

        const netAmount = Math.max(0, Math.round((div.amount - (div.tax || 0)) * 100) / 100);
        const type = 'income';
        const category = 'Dividends';
        const reason = `Dividend Payment: ${asset.symbol}`;
        const sourceType = 'dividend';

        let expenseDoc = null;
        if (div.expenseId) {
            expenseDoc = await Expense.findById(div.expenseId);
        }

        if (expenseDoc) {
            expenseDoc.bankAccountId = bankAccountId;
            expenseDoc.day = day;
            expenseDoc.month = month;
            expenseDoc.amount = netAmount;
            expenseDoc.reason = reason;
            expenseDoc.category = category;
            expenseDoc.type = type;
            expenseDoc.sourceType = sourceType;
            expenseDoc.sourceId = div._id as any;
            await expenseDoc.save();
        } else {
            expenseDoc = new Expense({
                bankAccountId,
                day,
                month,
                amount: netAmount,
                reason,
                category,
                type,
                sourceType,
                sourceId: div._id,
                uploadedAt: date
            });
            await expenseDoc.save();
        }

        div.expenseId = expenseDoc._id as any;
        div.bankAccountId = bankAccountId;
        await div.save();

        return expenseDoc._id as any;
    } catch (err) {
        console.error('[PortfolioSync] Error syncing dividend to expense:', err);
        return null;
    }
}

/**
 * Remove a synced expense document when its associated portfolio item is deleted.
 */
export async function removeSyncedExpense(expenseId?: any): Promise<void> {
    if (!expenseId) return;
    try {
        await Expense.findByIdAndDelete(expenseId);
    } catch (err) {
        console.error('[PortfolioSync] Error removing synced expense:', err);
    }
}
