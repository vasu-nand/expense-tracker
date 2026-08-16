import { Schema, model, Document, Types } from 'mongoose';

export interface IInvestmentTransaction extends Document {
    assetId: Types.ObjectId;
    bankAccountId?: Types.ObjectId;
    expenseId?: Types.ObjectId;
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
    bankAccountId: { type: Schema.Types.ObjectId, ref: 'BankAccount' },
    expenseId: { type: Schema.Types.ObjectId, ref: 'Expense' },
    type: { type: String, required: true, enum: ['buy', 'sell'] },
    quantity: { type: Number, required: true, min: 0.00000001 },
    price: { type: Number, required: true, min: 0 },
    fees: { type: Number, required: true, default: 0, min: 0 },
    tax: { type: Number, required: true, default: 0, min: 0 },
    dateTime: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now }
});

InvestmentTransactionSchema.index({ assetId: 1, dateTime: 1 });
InvestmentTransactionSchema.index({ dateTime: 1 });
InvestmentTransactionSchema.index({ bankAccountId: 1 });

export default model<IInvestmentTransaction>('InvestmentTransaction', InvestmentTransactionSchema);
