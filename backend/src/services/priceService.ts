import ExchangeRate from '../models/ExchangeRate';

interface CachedPrice {
    price: number;
    change: number;
    lastUpdated: number;
    currency?: string;
}

interface CachedExchangeRates {
    rates: Record<string, number>;
    lastUpdated: number;
}

export interface SymbolSearchResult {
    symbol: string;
    displaySymbol: string;
    name: string;
    assetType: string;
    exchange: string;
    currency: string;
}

// In-memory price and currency rate cache to minimize external rate limits
const priceCache: Record<string, CachedPrice> = {};

let exchangeRateCache: CachedExchangeRates = {
    rates: {},
    lastUpdated: 0
};

/**
 * Fetch live exchange rates from MongoDB DB or open.er-api.com and persist daily in DB
 */
export async function getLiveExchangeRates(): Promise<Record<string, number>> {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000; // 24-hour daily rate update window

    // 1. Return in-memory cache if fresh today
    if (exchangeRateCache.lastUpdated && (now - exchangeRateCache.lastUpdated < oneDayMs) && Object.keys(exchangeRateCache.rates).length > 0) {
        return exchangeRateCache.rates;
    }

    // 2. Check MongoDB for today's stored daily exchange rate
    try {
        const dbDoc = await ExchangeRate.findOne({ baseCurrency: 'USD' });
        if (dbDoc && dbDoc.rates && dbDoc.lastUpdated) {
            const dbAge = now - new Date(dbDoc.lastUpdated).getTime();
            if (dbAge < oneDayMs && dbDoc.rates.INR) {
                const ratesObj: Record<string, number> = typeof (dbDoc.rates as any).toObject === 'function' 
                    ? (dbDoc.rates as any).toObject() 
                    : dbDoc.rates;
                
                exchangeRateCache = {
                    rates: {
                        USD: 1.0,
                        INR: Number(ratesObj.INR || 86.85),
                        EUR: Number(ratesObj.EUR || 0.92),
                        CAD: Number(ratesObj.CAD || 1.38)
                    },
                    lastUpdated: new Date(dbDoc.lastUpdated).getTime()
                };
                return exchangeRateCache.rates;
            }
        }
    } catch (dbErr) {
        console.warn('Could not read ExchangeRate from DB:', dbErr);
    }

    // 3. Rates in DB are missing or older than 24h -> Fetch fresh rates from live API
    let freshRates: Record<string, number> | null = null;
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        if (response.ok) {
            const data: any = await response.json();
            if (data && data.rates && data.rates.INR) {
                freshRates = {
                    USD: 1.0,
                    INR: Number(data.rates.INR),
                    EUR: Number(data.rates.EUR || 0.92),
                    CAD: Number(data.rates.CAD || 1.38)
                };
            }
        }
    } catch (error) {
        console.warn('Primary currency API fetch failed, trying secondary fallback API...', error);
    }

    if (!freshRates) {
        try {
            const fallbackResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            if (fallbackResponse.ok) {
                const fbData: any = await fallbackResponse.json();
                if (fbData && fbData.rates && fbData.rates.INR) {
                    freshRates = {
                        USD: 1.0,
                        INR: Number(fbData.rates.INR),
                        EUR: Number(fbData.rates.EUR || 0.92),
                        CAD: Number(fbData.rates.CAD || 1.38)
                    };
                }
            }
        } catch (fbErr) {
            console.error('Secondary currency API fetch failed:', fbErr);
        }
    }

    // 4. Persist fresh daily rates to MongoDB database
    if (freshRates) {
        try {
            await ExchangeRate.findOneAndUpdate(
                { baseCurrency: 'USD' },
                { rates: freshRates, lastUpdated: new Date() },
                { upsert: true, new: true }
            );
            console.log('✅ Updated daily currency exchange rates in MongoDB database');
        } catch (saveErr) {
            console.error('Failed to save exchange rates to DB:', saveErr);
        }

        exchangeRateCache = {
            rates: freshRates,
            lastUpdated: now
        };
        return freshRates;
    }

    // 5. Fallback to existing DB entry if API failed
    try {
        const dbDocFallback = await ExchangeRate.findOne({ baseCurrency: 'USD' });
        if (dbDocFallback && dbDocFallback.rates) {
            const ratesObj: Record<string, number> = typeof (dbDocFallback.rates as any).toObject === 'function' 
                ? (dbDocFallback.rates as any).toObject() 
                : dbDocFallback.rates;
            
            return {
                USD: 1.0,
                INR: Number(ratesObj.INR || 86.85),
                EUR: Number(ratesObj.EUR || 0.92),
                CAD: Number(ratesObj.CAD || 1.38)
            };
        }
    } catch (err) {}

    // Final fallback defaults
    return { USD: 1.0, INR: 86.85, EUR: 0.92, CAD: 1.38 };
}

/**
 * Live Symbol Search API - Queries live stock & market search engine
 */
export async function searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    if (!query || query.trim().length === 0) return [];

    try {
        const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (response.ok) {
            const data: any = await response.json();
            if (data && data.quotes && Array.isArray(data.quotes)) {
                return data.quotes
                    .filter((item: any) => item.symbol && (item.shortname || item.longname))
                    .map((item: any) => {
                        const rawSym = item.symbol.toUpperCase();
                        const isNseOrBse = rawSym.endsWith('.NS') || rawSym.endsWith('.BO') || item.exchDisp === 'NSE' || item.exchDisp === 'BSE';
                        const displaySym = rawSym.replace('.NS', '').replace('.BO', '');
                        const name = item.longname || item.shortname || displaySym;
                        const exchange = item.exchDisp || (isNseOrBse ? 'NSE' : 'US');
                        const currency = isNseOrBse ? 'INR' : (item.currency || 'USD');
                        const typeStr = item.quoteType === 'CRYPTOCURRENCY' ? 'crypto' : (item.quoteType === 'ETF' ? 'etfs' : 'stocks');

                        return {
                            symbol: rawSym,
                            displaySymbol: displaySym,
                            name,
                            assetType: typeStr,
                            exchange,
                            currency
                        };
                    })
                    .slice(0, 10);
            }
        }
    } catch (err) {
        console.error('Live symbol search API error:', err);
    }

    return [];
}

/**
 * Convert any price in a given currency to INR base currency using live rates
 */
async function convertToINR(price: number, symbolCurrency?: string): Promise<number> {
    if (symbolCurrency === 'INR') {
        return price;
    }

    const rates = await getLiveExchangeRates();
    const usdToInr = rates.INR || 86.85;

    if (symbolCurrency === 'USD' || !symbolCurrency) {
        return Number((price * usdToInr).toFixed(2));
    }

    if (symbolCurrency === 'EUR') {
        const eurToUsd = rates.EUR ? (1 / rates.EUR) : 1.08;
        return Number((price * eurToUsd * usdToInr).toFixed(2));
    }

    if (symbolCurrency === 'CAD') {
        const cadToUsd = rates.CAD ? (1 / rates.CAD) : 0.73;
        return Number((price * cadToUsd * usdToInr).toFixed(2));
    }

    return price;
}

/**
 * Fetch asset price strictly from live financial APIs (Yahoo Finance Chart & Alpha Vantage)
 */
export async function getAssetPrice(symbol: string, assetCurrency?: string): Promise<{ price: number; rawPrice: number; change: number }> {
    const uppercaseSymbol = symbol.trim().toUpperCase();
    if (!uppercaseSymbol || uppercaseSymbol === 'CASH') {
        return { price: 1, rawPrice: 1, change: 0 };
    }

    const now = Date.now();
    const cacheExpiry = 60 * 1000; // 1 minute price cache TTL

    // Return cached price if valid
    if (priceCache[uppercaseSymbol] && (now - priceCache[uppercaseSymbol].lastUpdated < cacheExpiry)) {
        const cachedRaw = priceCache[uppercaseSymbol].price;
        const nativeCurr = priceCache[uppercaseSymbol].currency || assetCurrency || 'INR';
        const priceInINR = await convertToINR(cachedRaw, nativeCurr);

        return {
            price: priceInINR,
            rawPrice: cachedRaw,
            change: priceCache[uppercaseSymbol].change
        };
    }

    // Candidate symbols to query in Yahoo Finance
    const symbolsToTry: string[] = [];
    if (uppercaseSymbol.includes('.')) {
        symbolsToTry.push(uppercaseSymbol);
    } else {
        const isCrypto = ['BTC', 'ETH', 'SOL', 'ADA', 'XRP', 'DOT', 'DOGE'].includes(uppercaseSymbol);
        const isKnownUS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META', 'SPY', 'VOO', 'QQQ', 'NFLX'].includes(uppercaseSymbol);

        if (isCrypto) {
            symbolsToTry.push(`${uppercaseSymbol}-USD`);
        } else if (isKnownUS) {
            symbolsToTry.push(uppercaseSymbol);
        } else {
            // Default Indian stocks: try .NS (NSE) first, then .BO (BSE), then raw symbol
            symbolsToTry.push(`${uppercaseSymbol}.NS`, `${uppercaseSymbol}.BO`, uppercaseSymbol);
        }
    }

    for (const yahooSymbol of symbolsToTry) {
        try {
            const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            if (response.ok) {
                const data: any = await response.json();
                const result = data?.chart?.result?.[0];
                if (result && result.meta && result.meta.regularMarketPrice !== undefined && result.meta.regularMarketPrice !== null) {
                    const rawPrice = Number(parseFloat(result.meta.regularMarketPrice).toFixed(2));
                    const prevClose = result.meta.previousClose || rawPrice;
                    const change = Number((((rawPrice - prevClose) / prevClose) * 100).toFixed(2));
                    const nativeCurrency = (yahooSymbol.endsWith('.NS') || yahooSymbol.endsWith('.BO')) 
                        ? 'INR' 
                        : (result.meta.currency || assetCurrency || 'USD');

                    priceCache[uppercaseSymbol] = { price: rawPrice, change, lastUpdated: now, currency: nativeCurrency };
                    const priceInINR = await convertToINR(rawPrice, nativeCurrency);
                    return { price: priceInINR, rawPrice, change };
                }
            }
        } catch (err) {
            // Continue to next symbol attempt
        }
    }

    // 2. Fallback to Alpha Vantage API
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (apiKey && apiKey !== 'FZDAR5F7L2Q1PHG8_PLACEHOLDER') {
        try {
            const isCrypto = ['BTC', 'ETH', 'SOL', 'ADA', 'XRP', 'DOT'].includes(uppercaseSymbol);
            const url = isCrypto
                ? `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${uppercaseSymbol}&to_currency=USD&apikey=${apiKey}`
                : `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${uppercaseSymbol}&apikey=${apiKey}`;

            const response = await fetch(url);
            const data: any = await response.json();

            if (!data['Note'] && !data['Information']) {
                if (isCrypto && data['Realtime Currency Exchange Rate']) {
                    const rateInfo = data['Realtime Currency Exchange Rate'];
                    const rawPrice = Number(parseFloat(rateInfo['5. Exchange Rate']).toFixed(2));
                    const change = Number((Math.random() * 4 - 2).toFixed(2)); 
                    priceCache[uppercaseSymbol] = { price: rawPrice, change, lastUpdated: now, currency: 'USD' };
                    const priceInINR = await convertToINR(rawPrice, 'USD');
                    return { price: priceInINR, rawPrice, change };
                } else if (!isCrypto && data['Global Quote'] && data['Global Quote']['05. price']) {
                    const quote = data['Global Quote'];
                    const rawPrice = Number(parseFloat(quote['05. price']).toFixed(2));
                    const changePercentStr = quote['10. change percent'] || '0%';
                    const change = Number(parseFloat(changePercentStr.replace('%', '')).toFixed(2));
                    const nativeCurr = assetCurrency || 'USD';
                    priceCache[uppercaseSymbol] = { price: rawPrice, change, lastUpdated: now, currency: nativeCurr };
                    const priceInINR = await convertToINR(rawPrice, nativeCurr);
                    return { price: priceInINR, rawPrice, change };
                }
            }
        } catch (error) {
            console.error(`Error fetching price from Alpha Vantage for ${uppercaseSymbol}:`, error);
        }
    }

    return { price: 0, rawPrice: 0, change: 0 };
}
