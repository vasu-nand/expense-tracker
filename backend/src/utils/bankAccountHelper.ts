import { Request } from 'express';
import mongoose from 'mongoose';
import BankAccount from '../models/BankAccount';

// In-memory cache for bank account validation
let activeBankAccountsCache: Set<string> = new Set();
let primaryBankAccountIdCache: string | null = null;
let cacheInitialized = false;

export const reloadBankAccountCache = async (): Promise<void> => {
    try {
        const accounts = await BankAccount.find({}, '_id isPrimary').lean();
        const newCache = new Set<string>();
        let primaryId: string | null = null;
        
        for (const acc of accounts) {
            const idStr = acc._id.toString();
            newCache.add(idStr);
            if (acc.isPrimary) {
                primaryId = idStr;
            }
        }
        
        activeBankAccountsCache = newCache;
        primaryBankAccountIdCache = primaryId || (accounts[0]?._id.toString() || null);
        cacheInitialized = true;
        console.log(`Bank account validation cache reloaded. Active accounts count: ${newCache.size}`);
    } catch (err) {
        console.error('Failed to reload bank account cache:', err);
    }
};

export const getActiveBankAccountId = async (req: Request): Promise<string> => {
    const headerId = req.headers['x-bank-account-id'] as string;
    
    if (headerId && mongoose.Types.ObjectId.isValid(headerId)) {
        // Check cache first
        if (cacheInitialized && activeBankAccountsCache.has(headerId)) {
            return headerId;
        }
        
        // Fallback to DB check if cache is not initialized or missed
        const exists = await BankAccount.exists({ _id: headerId });
        if (exists) {
            if (cacheInitialized) {
                activeBankAccountsCache.add(headerId);
            }
            return headerId;
        }
    }
    
    // Fallback: Check primary account cache
    if (cacheInitialized && primaryBankAccountIdCache) {
        return primaryBankAccountIdCache;
    }
    
    // If cache not initialized/missed, query database
    const primaryAccount = await BankAccount.findOne({ isPrimary: true }).lean();
    if (primaryAccount) {
        const primaryIdStr = primaryAccount._id.toString();
        if (cacheInitialized) {
            primaryBankAccountIdCache = primaryIdStr;
            activeBankAccountsCache.add(primaryIdStr);
        }
        return primaryIdStr;
    }
    
    const anyAccount = await BankAccount.findOne().lean();
    if (anyAccount) {
        const anyIdStr = anyAccount._id.toString();
        if (cacheInitialized) {
            activeBankAccountsCache.add(anyIdStr);
        }
        return anyIdStr;
    }
    
    throw new Error('No bank accounts exist in the system.');
};
