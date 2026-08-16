import { Schema, model, Document, Types } from 'mongoose';

export interface IDividend extends Document {
    assetId: Types.ObjectId;
    bankAccountId?: Types.ObjectId;
    expenseId?: Types.ObjectId;
    amount: number;
    date: Date;
    tax: number;
    createdAt: Date;
}

const DividendSchema = new Schema<IDividend>({
    assetId: { type: Schema.Types.ObjectId, ref: 'InvestmentAsset', required: true },
    bankAccountId: { type: Schema.Types.ObjectId, ref: 'BankAccount' },
    expenseId: { type: Schema.Types.ObjectId, ref: 'Expense' },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    tax: { type: Number, required: true, default: 0, min: 0 },
    createdAt: { type: Date, default: Date.now }
});

export default model<IDividend>('Dividend', DividendSchema);
