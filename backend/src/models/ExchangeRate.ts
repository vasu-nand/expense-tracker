import mongoose, { Schema, Document } from 'mongoose';

export interface IExchangeRate extends Document {
    baseCurrency: string;
    rates: Record<string, number>;
    lastUpdated: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const ExchangeRateSchema: Schema = new Schema(
    {
        baseCurrency: { type: String, required: true, default: 'USD', unique: true },
        rates: { type: Schema.Types.Mixed, required: true },
        lastUpdated: { type: Date, required: true, default: Date.now }
    },
    { timestamps: true }
);

export default mongoose.model<IExchangeRate>('ExchangeRate', ExchangeRateSchema);
