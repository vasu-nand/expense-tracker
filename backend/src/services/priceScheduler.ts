import InvestmentAsset from '../models/InvestmentAsset';
import AssetPriceHistory from '../models/AssetPriceHistory';
import { getAssetPrice } from './priceService';

let lastSyncTimestamp: Date | null = null;
let syncTimer: NodeJS.Timeout | null = null;

/**
 * Record live prices for all master investment assets and store in database
 */
export async function recordAndSyncAllPrices(): Promise<{ updatedCount: number; timestamp: Date; offlineFallbackCount: number }> {
    let updatedCount = 0;
    let offlineFallbackCount = 0;
    const now = new Date();

    try {
        const assets = await InvestmentAsset.find();
        for (const asset of assets) {
            const sym = asset.symbol.toUpperCase();
            try {
                const priceData = await getAssetPrice(sym, asset.currency);

                if (priceData && priceData.price > 0) {
                    // Update latest price in asset document
                    asset.lastPrice = priceData.price;
                    asset.dayChange = priceData.change;
                    asset.lastPriceUpdatedAt = now;
                    await asset.save();

                    // Record snapshot in price history
                    await AssetPriceHistory.create({
                        assetId: asset._id,
                        symbol: sym,
                        price: priceData.price,
                        dayChange: priceData.change,
                        currency: asset.currency,
                        timestamp: now
                    });

                    updatedCount++;
                } else if (asset.lastPrice && asset.lastPrice > 0) {
                    // Internet connection down or API error: Fallback to last stored DB price
                    offlineFallbackCount++;
                }
            } catch (err) {
                console.warn(`[PriceScheduler] Error fetching price for ${sym}:`, err);
                if (asset.lastPrice && asset.lastPrice > 0) {
                    offlineFallbackCount++;
                }
            }
        }

        lastSyncTimestamp = now;
        console.log(`[PriceScheduler] 15-min Price Sync completed at ${now.toLocaleTimeString()}. Updated: ${updatedCount}, Offline Fallbacks: ${offlineFallbackCount}`);
    } catch (error) {
        console.error('[PriceScheduler] Global price recording error:', error);
    }

    return { updatedCount, timestamp: now, offlineFallbackCount };
}

/**
 * Start 15-minute background interval scheduler
 */
export function startPriceScheduler(): void {
    if (syncTimer) {
        clearInterval(syncTimer);
    }

    // Run initial sync after 5 seconds of server startup
    setTimeout(() => {
        recordAndSyncAllPrices().catch(err => console.error('[PriceScheduler] Initial sync failed:', err));
    }, 5000);

    // Schedule 15-minute interval (15 * 60 * 1000 = 900,000 ms)
    const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
    syncTimer = setInterval(() => {
        console.log('[PriceScheduler] Running 15-minute scheduled price recording...');
        recordAndSyncAllPrices().catch(err => console.error('[PriceScheduler] Interval sync failed:', err));
    }, FIFTEEN_MINUTES_MS);

    console.log('[PriceScheduler] 15-minute automated price recording service initialized.');
}

/**
 * Get timestamp of last completed price recording sync
 */
export function getLastSyncTimestamp(): Date | null {
    return lastSyncTimestamp;
}
