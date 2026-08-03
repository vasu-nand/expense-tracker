import { Schema, model, Document } from 'mongoose';

export interface IPriceAlert extends Document {
    symbol: string;
    condition: 'above' | 'below';
    targetPrice: number;
    triggered: boolean;
    createdAt: Date;
    triggeredAt?: Date;
}

const PriceAlertSchema = new Schema<IPriceAlert>({
    symbol: { type: String, required: true, uppercase: true, trim: true },
    condition: { type: String, required: true, enum: ['above', 'below'] },
    targetPrice: { type: Number, required: true, min: 0 },
    triggered: { type: Boolean, required: true, default: false },
    createdAt: { type: Date, default: Date.now },
    triggeredAt: { type: Date }
});

export default model<IPriceAlert>('PriceAlert', PriceAlertSchema);
