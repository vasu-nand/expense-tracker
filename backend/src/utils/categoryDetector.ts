import Category from '../models/Category';

// In-memory cache mapping bankAccountId -> { categoryName -> keywords[] }
let categoryKeywordsCache: Record<string, Record<string, string[]>> = {};

export const reloadCategoryKeywordsCache = async (bankAccountId?: string) => {
    try {
        const query = bankAccountId ? { bankAccountId } : {};
        const categories = await Category.find(query).lean();
        
        if (bankAccountId) {
            const cache: Record<string, string[]> = {};
            for (const cat of categories) {
                cache[cat.name] = cat.keywords || [];
            }
            categoryKeywordsCache[bankAccountId] = cache;
        } else {
            const newCache: Record<string, Record<string, string[]>> = {};
            for (const cat of categories) {
                if (!cat.bankAccountId) continue;
                const bId = cat.bankAccountId.toString();
                if (!newCache[bId]) {
                    newCache[bId] = {};
                }
                newCache[bId][cat.name] = cat.keywords || [];
            }
            categoryKeywordsCache = newCache;
        }
        console.log(`Category keywords detector cache reloaded successfully.`);
    } catch (e) {
        console.error('Failed to reload category keywords cache:', e);
    }
};

export const detectCategory = (reason: string, bankAccountId: string): string => {
    if (!bankAccountId) return 'Others';
    
    const lowerReason = reason.toLowerCase();
    const cache = categoryKeywordsCache[bankAccountId.toString()] || {};

    // Match against account-specific category keywords cache first
    for (const [category, keywords] of Object.entries(cache)) {
        if (keywords && keywords.some(keyword => lowerReason.includes(keyword.toLowerCase()))) {
            return category;
        }
    }

    // Default system categories & keywords fallback to ensure zero data gaps
    const defaultFallback: Record<string, string[]> = {
        Breakfast: ['breakfast', 'doodh', 'milk', 'coffee', 'eggs', 'omlet', 'bread', 'butter', 'jam'],
        Lunch: ['lunch', 'thali', 'meal', 'curry', 'roti', 'rice'],
        Dinner: ['dinner', 'night', 'supper'],
        Groceries: ['blinkit', 'grocery', 'vegetable', 'fruits', 'groceries', 'provision', 'milk delivery', 'tiffin'],
        Food: ['paratha', 'sweet', 'chutney', 'snack', 'samosa', 'pizza', 'burger', 'sandwich', 'cake', 'biscuit'],
        Drinks: ['juice', 'frooti', 'nimbu pani', 'lemon', 'soda', 'water', 'cold drink', 'milkshake', 'smoothie'],
        Transport: ['auto', 'taxi', 'bus', 'train', 'petrol', 'diesel', 'uber', 'ola', 'rickshaw', 'rapido'],
        Shopping: ['shopping', 'clothes', 'shoes', 'electronics', 'amazon', 'flipkart'],
        Rent: ['rent', 'room rent', 'house rent', 'flat rent', 'hostel rent', 'hostel fee', 'pg rent'],
        Bills: ['electricity', 'power bill', 'light bill', 'bill', 'recharge', 'wifi', 'internet', 'broadband', 'water bill', 'maintenance'],
        Salary: ['salary', 'paycheck', 'payout', 'wage', 'stipend', 'income'],
        Freelance: ['freelance', 'client', 'gig', 'consulting', 'upwork', 'fiverr'],
        Investments: ['investment', 'dividend', 'interest', 'stock', 'mutual fund', 'crypto'],
        Gifts: ['gift', 'cashback', 'reward', 'refund', 'birthday']
    };

    for (const [category, keywords] of Object.entries(defaultFallback)) {
        if (keywords.some(keyword => lowerReason.includes(keyword.toLowerCase()))) {
            return category;
        }
    }

    return 'Others';
};