import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
    bankAccountId: mongoose.Types.ObjectId;
    name: string;
    color: string;
    keywords: string[];
    isPredefined: boolean;
}

const CategorySchema: Schema = new Schema({
    bankAccountId: {
        type: Schema.Types.ObjectId,
        ref: 'BankAccount',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    color: {
        type: String,
        required: true
    },
    keywords: {
        type: [String],
        default: []
    },
    isPredefined: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Ensure a category name is unique *per bank account*
CategorySchema.index({ name: 1, bankAccountId: 1 }, { unique: true });

export default mongoose.model<ICategory>('Category', CategorySchema);
