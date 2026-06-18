import mongoose, { Schema, Document } from 'mongoose';

export interface IMonthlySummary extends Document {
    month: string;
    totalExpense: number;
    totalDays: number;
    categoryBreakdown: Map<string, number>;
    averageDailyExpense: number;
    highestExpenseDay: number;
    createdAt: Date;
}

const MonthlySummarySchema: Schema = new Schema({
    month: {
        type: String,
        required: true,
        unique: true
    },
    totalExpense: {
        type: Number,
        required: true
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

export default mongoose.model<IMonthlySummary>('MonthlySummary', MonthlySummarySchema);