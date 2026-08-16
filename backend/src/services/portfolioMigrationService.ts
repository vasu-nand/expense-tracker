import InvestmentTransaction from '../models/InvestmentTransaction';
import Dividend from '../models/Dividend';
import InvestmentAsset from '../models/InvestmentAsset';
import { syncTransactionToExpense, syncDividendToExpense } from './portfolioSyncService';

/**
 * Migration Service: Scans all existing portfolio transactions & dividends lacking a synced expense record
 * and automatically backfills corresponding Expense/Income entries.
 */
export async function migrateExistingPortfolioTransactions(): Promise<{
    transactionsMigrated: number;
    dividendsMigrated: number;
    totalMigrated: number;
}> {
    let transactionsMigrated = 0;
    let dividendsMigrated = 0;

    try {
        // 1. Backfill Investment Transactions
        const unlinkedTransactions = await InvestmentTransaction.find({
            $or: [{ expenseId: { $exists: false } }, { expenseId: null }]
        }).populate('assetId');

        for (const tx of unlinkedTransactions) {
            const asset = tx.assetId as any;
            if (asset && asset.symbol) {
                const expenseId = await syncTransactionToExpense(tx, asset);
                if (expenseId) {
                    transactionsMigrated++;
                }
            }
        }

        // 2. Backfill Dividends
        const unlinkedDividends = await Dividend.find({
            $or: [{ expenseId: { $exists: false } }, { expenseId: null }]
        }).populate('assetId');

        for (const div of unlinkedDividends) {
            const asset = div.assetId as any;
            if (asset && asset.symbol) {
                const expenseId = await syncDividendToExpense(div, asset);
                if (expenseId) {
                    dividendsMigrated++;
                }
            }
        }

        if (transactionsMigrated > 0 || dividendsMigrated > 0) {
            console.log(`✅ [PortfolioMigration] Backfilled ${transactionsMigrated} transactions and ${dividendsMigrated} dividends into Expense entries.`);
        } else {
            console.log('[PortfolioMigration] All portfolio transactions and dividends are up-to-date with Expense entries.');
        }

        return {
            transactionsMigrated,
            dividendsMigrated,
            totalMigrated: transactionsMigrated + dividendsMigrated
        };
    } catch (err) {
        console.error('[PortfolioMigration] Error during migration:', err);
        return {
            transactionsMigrated,
            dividendsMigrated,
            totalMigrated: transactionsMigrated + dividendsMigrated
        };
    }
}
