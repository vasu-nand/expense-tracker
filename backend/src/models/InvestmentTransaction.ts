import { Schema, model, Document, Types } from 'mongoose';

export interface IInvestmentTransaction extends Document {
    assetId: Types.ObjectId;
    type: 'buy' | 'sell';
    quantity: number;
    price: number;
    fees: number;
    tax: number;
    dateTime: Date;
    notes?: string;
    createdAt: Date;
}

const InvestmentTransactionSchema = new Schema<IInvestmentTransaction>({
    assetId: { type: Schema.Types.ObjectId, ref: 'InvestmentAsset', required: true },
    type: { type: String, required: true, enum: ['buy', 'sell'] },
    quantity: { type: Number, required: true, min: 0.00000001 },
    price: { type: Number, required: true, min: 0 },
    fees: { type: Number, required: true, default: 0, min: 0 },
    tax: { type: Number, required: true, default: 0, min: 0 },
    dateTime: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now }
});

export default model<IInvestmentTransaction>('InvestmentTransaction', InvestmentTransactionSchema);
