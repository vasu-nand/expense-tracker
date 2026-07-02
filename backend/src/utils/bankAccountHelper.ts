import { Request } from 'express';
import mongoose from 'mongoose';
import BankAccount from '../models/BankAccount';

export const getActiveBankAccountId = async (req: Request): Promise<string> => {
    const headerId = req.headers['x-bank-account-id'] as string;
    if (headerId && mongoose.Types.ObjectId.isValid(headerId)) {
        // Double check it exists
        const exists = await BankAccount.exists({ _id: headerId });
        if (exists) {
            return headerId;
        }
    }
    
    // Fallback: Find primary bank account
    const primaryAccount = await BankAccount.findOne({ isPrimary: true });
    if (primaryAccount) {
        return primaryAccount._id.toString();
    }
    
    // Ultimate fallback: Find any bank account
    const anyAccount = await BankAccount.findOne();
    if (anyAccount) {
        return anyAccount._id.toString();
    }
    
    throw new Error('No bank accounts exist in the system.');
};
