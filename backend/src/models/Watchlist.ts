import { Schema, model, Document } from 'mongoose';

export interface IWatchlist extends Document {
    symbol: string;
    name: string;
    assetType: string;
    createdAt: Date;
}

const WatchlistSchema = new Schema<IWatchlist>({
    symbol: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    assetType: { type: String, required: true, default: 'stocks' },
    createdAt: { type: Date, default: Date.now }
});

export default model<IWatchlist>('Watchlist', WatchlistSchema);
