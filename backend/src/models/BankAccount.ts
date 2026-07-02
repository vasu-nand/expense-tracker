import mongoose, { Schema, Document } from 'mongoose';

export interface IBankAccount extends Document {
    name: string;
    bankName: string;
    accountNumber: string;
    color: string;
    icon: string;
    isPrimary: boolean;
    deletePasswordHash: string;
    createdAt: Date;
    updatedAt: Date;
}

const BankAccountSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    bankName: {
        type: String,
        required: true,
        trim: true
    },
    accountNumber: {
        type: String,
        required: true,
        trim: true
    },
    color: {
        type: String,
        default: '#0d9488' // Teal Harmoney primary color by default
    },
    icon: {
        type: String,
        default: 'Wallet'
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    deletePasswordHash: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model<IBankAccount>('BankAccount', BankAccountSchema);
