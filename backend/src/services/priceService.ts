interface CachedPrice {
    price: number;
    change: number;
    lastUpdated: number;
}

// Global in-memory price cache to avoid hitting API rate limits repeatedly
const priceCache: Record<string, CachedPrice> = {};

// Hardcoded seed prices for mock fallback
const BASE_PRICES: Record<string, number> = {
    'AAPL': 225.50,
    'MSFT': 420.20,
    'NVDA': 127.80,
    'TSLA': 208.40,
    'GOOGL': 175.60,
    'BTC': 94250.00,
    'ETH': 3120.00,
    'SOL': 185.00,
    'GOLD': 2445.00,
    'SILVER': 28.50,
    'SPY': 545.00,
    'VOO': 502.00,
    'INDF': 100.00, // PPF/EPF/NPS representation
    'CASH': 1.00
};

/**
 * Helper to generate a mock fluctuating price
 */
function getMockPrice(symbol: string): { price: number; change: number } {
    const uppercaseSymbol = symbol.toUpperCase();
    const base = BASE_PRICES[uppercaseSymbol] || 150.00;
    
    // Existing cached mock price
    const cached = priceCache[uppercaseSymbol];
    let currentBase = base;
    if (cached) {
        currentBase = cached.price;
    }

    // Fluctuate by -1.5% to +1.5%
    const changePct = (Math.random() * 3 - 1.5) / 100;
    const price = Number((currentBase * (1 + changePct)).toFixed(2));
    const change = Number((changePct * 100).toFixed(2));

    return { price, change };
}

/**
 * Fetch asset price from Alpha Vantage or mock fallback
 */
export async function getAssetPrice(symbol: string): Promise<{ price: number; change: number }> {
    const uppercaseSymbol = symbol.toUpperCase();
    const now = Date.now();
    const cacheExpiry = 60 * 1000; // 1 minute price cache TTL

    // Return cached price if valid
    if (priceCache[uppercaseSymbol] && (now - priceCache[uppercaseSymbol].lastUpdated < cacheExpiry)) {
        return {
            price: priceCache[uppercaseSymbol].price,
            change: priceCache[uppercaseSymbol].change
        };
    }

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    if (apiKey && apiKey !== 'FZDAR5F7L2Q1PHG8_PLACEHOLDER' && uppercaseSymbol !== 'CASH') {
        try {
            // Check if crypto
            const isCrypto = ['BTC', 'ETH', 'SOL', 'ADA', 'XRP', 'DOT'].includes(uppercaseSymbol);
            let url = '';
            
            if (isCrypto) {
                url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${uppercaseSymbol}&to_currency=USD&apikey=${apiKey}`;
            } else {
                url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${uppercaseSymbol}&apikey=${apiKey}`;
            }

            const response = await fetch(url);
            const data: any = await response.json();

            // Handle API limit warning
            if (data['Note'] || data['Information']) {
                console.warn(`Alpha Vantage API rate limit or warning hit. Falling back to mock pricing for: ${uppercaseSymbol}`);
                const mock = getMockPrice(uppercaseSymbol);
                priceCache[uppercaseSymbol] = { price: mock.price, change: mock.change, lastUpdated: now };
                return mock;
            }

            if (isCrypto && data['Realtime Currency Exchange Rate']) {
                const rateInfo = data['Realtime Currency Exchange Rate'];
                const price = Number(parseFloat(rateInfo['5. Exchange Rate']).toFixed(2));
                // Mock change for crypto daily fluctuations
                const change = Number((Math.random() * 4 - 2).toFixed(2)); 
                priceCache[uppercaseSymbol] = { price, change, lastUpdated: now };
                return { price, change };
            } else if (!isCrypto && data['Global Quote'] && data['Global Quote']['05. price']) {
                const quote = data['Global Quote'];
                const price = Number(parseFloat(quote['05. price']).toFixed(2));
                const changePercentStr = quote['10. change percent'] || '0%';
                const change = Number(parseFloat(changePercentStr.replace('%', '')).toFixed(2));
                priceCache[uppercaseSymbol] = { price, change, lastUpdated: now };
                return { price, change };
            }
        } catch (error) {
            console.error(`Error fetching price from Alpha Vantage for ${uppercaseSymbol}:`, error);
        }
    }

    // Fallback to mock pricing
    const mock = getMockPrice(uppercaseSymbol);
    priceCache[uppercaseSymbol] = { price: mock.price, change: mock.change, lastUpdated: now };
    return mock;
}
