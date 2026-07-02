import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
    bankAccountId: mongoose.Types.ObjectId;
    day: number;
    amount: number;
    reason: string;
    category: string;
    uploadedAt: Date;
    month: string;
    type: 'expense' | 'income';
}

const ExpenseSchema: Schema = new Schema({
    bankAccountId: {
        type: Schema.Types.ObjectId,
        ref: 'BankAccount',
        required: true,
        index: true
    },
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
    type: {
        type: String,
        enum: ['expense', 'income'],
        required: true,
        default: 'expense'
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

// Create indexes for better query performance under isolated bank account view
ExpenseSchema.index({ bankAccountId: 1 });
ExpenseSchema.index({ bankAccountId: 1, month: 1, day: 1 });
ExpenseSchema.index({ bankAccountId: 1, category: 1 });
ExpenseSchema.index({ bankAccountId: 1, amount: 1 });
ExpenseSchema.index({ bankAccountId: 1, type: 1 });

export default mongoose.model<IExpense>('Expense', ExpenseSchema);