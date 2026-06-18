import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
    day: number;
    amount: number;
    reason: string;
    category: string;
    uploadedAt: Date;
    month: string;
}

const ExpenseSchema: Schema = new Schema({
    day: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        default: 'Others'
    },
    month: {
        type: String,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

// Create indexes for better query performance
ExpenseSchema.index({ month: 1, day: 1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ amount: 1 });

export default mongoose.model<IExpense>('Expense', ExpenseSchema);