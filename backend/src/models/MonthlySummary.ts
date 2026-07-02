import mongoose, { Schema, Document } from 'mongoose';

export interface IMonthlySummary extends Document {
    bankAccountId: mongoose.Types.ObjectId;
    month: string;
    totalExpense: number;
    totalIncome: number;
    totalDays: number;
    categoryBreakdown: Map<string, number>;
    incomeCategoryBreakdown: Map<string, number>;
    averageDailyExpense: number;
    highestExpenseDay: number;
    createdAt: Date;
}

const MonthlySummarySchema: Schema = new Schema({
    bankAccountId: {
        type: Schema.Types.ObjectId,
        ref: 'BankAccount',
        required: true,
        index: true
    },
    month: {
        type: String,
        required: true
    },
    totalExpense: {
        type: Number,
        required: true
    },
    totalIncome: {
        type: Number,
        required: true,
        default: 0
    },
    totalDays: {
        type: Number,
        required: true
    },
    categoryBreakdown: {
        type: Map,
        of: Number,
        default: {}
    },
    incomeCategoryBreakdown: {
        type: Map,
        of: Number,
        default: {}
    },
    averageDailyExpense: {
        type: Number,
        required: true
    },
    highestExpenseDay: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure a month's summary is unique *per bank account*
MonthlySummarySchema.index({ month: 1, bankAccountId: 1 }, { unique: true });

export default mongoose.model<IMonthlySummary>('MonthlySummary', MonthlySummarySchema);