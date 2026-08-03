import { Schema, model, Document } from 'mongoose';

export interface IInvestmentAsset extends Document {
    symbol: string;
    name: string;
    assetType: 'stocks' | 'etfs' | 'mutual_funds' | 'bonds' | 'crypto' | 'gold_silver' | 'real_estate' | 'fixed_deposits' | 'retirement_plans' | 'savings_accounts';
    exchange?: string;
    currency: string;
    createdAt: Date;
}

const InvestmentAssetSchema = new Schema<IInvestmentAsset>({
    symbol: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    assetType: {
        type: String,
        required: true,
        enum: ['stocks', 'etfs', 'mutual_funds', 'bonds', 'crypto', 'gold_silver', 'real_estate', 'fixed_deposits', 'retirement_plans', 'savings_accounts']
    },
    exchange: { type: String, trim: true },
    currency: { type: String, required: true, default: 'USD', uppercase: true, trim: true },
    createdAt: { type: Date, default: Date.now }
});

export default model<IInvestmentAsset>('InvestmentAsset', InvestmentAssetSchema);
