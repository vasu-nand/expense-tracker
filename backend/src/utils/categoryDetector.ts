import Category from '../models/Category';

// In-memory cache for fast transaction classification checks
let categoryKeywordsCache: Record<string, string[]> = {
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
    Gifts: ['gift', 'cashback', 'reward', 'refund', 'birthday'],
    Others: []
};

export const reloadCategoryKeywordsCache = async () => {
    try {
        const categories = await Category.find({});
        const cache: Record<string, string[]> = {};
        for (const cat of categories) {
            cache[cat.name] = cat.keywords || [];
        }
        categoryKeywordsCache = cache;
        console.log('Category keywords detector cache reloaded successfully.');
    } catch (e) {
        console.error('Failed to reload category keywords cache:', e);
    }
};

export const detectCategory = (reason: string): string => {
    const lowerReason = reason.toLowerCase();

    for (const [category, keywords] of Object.entries(categoryKeywordsCache)) {
        if (keywords && keywords.some(keyword => lowerReason.includes(keyword.toLowerCase()))) {
            return category;
        }
    }

    return 'Others';
};