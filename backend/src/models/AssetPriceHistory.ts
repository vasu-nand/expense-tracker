import { Schema, model, Document } from 'mongoose';

export interface IAssetPriceHistory extends Document {
    assetId?: Schema.Types.ObjectId;
    symbol: string;
    price: number;
    dayChange: number;
    currency: string;
    timestamp: Date;
}

const AssetPriceHistorySchema = new Schema<IAssetPriceHistory>({
    assetId: { type: Schema.Types.ObjectId, ref: 'InvestmentAsset' },
    symbol: { type: String, required: true, uppercase: true, trim: true, index: true },
    price: { type: Number, required: true },
    dayChange: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    timestamp: { type: Date, default: Date.now, index: true }
});

AssetPriceHistorySchema.index({ symbol: 1, timestamp: -1 });
AssetPriceHistorySchema.index({ assetId: 1, timestamp: -1 });

export default model<IAssetPriceHistory>('AssetPriceHistory', AssetPriceHistorySchema);
