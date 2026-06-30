import Category, { ICategory } from '../models/Category';
import { reloadCategoryKeywordsCache } from '../utils/categoryDetector';

const defaultCategories = [
    {
        name: 'Breakfast',
        color: '#fbbf24', // Amber
        keywords: ['breakfast', 'doodh', 'milk', 'coffee', 'eggs', 'omlet', 'bread', 'butter', 'jam'],
        isPredefined: true
    },
    {
        name: 'Lunch',
        color: '#f97316', // Orange
        keywords: ['lunch', 'thali', 'meal', 'curry', 'roti', 'rice'],
        isPredefined: true
    },
    {
        name: 'Dinner',
        color: '#6366f1', // Indigo
        keywords: ['dinner', 'night', 'supper'],
        isPredefined: true
    },
    {
        name: 'Groceries',
        color: '#14b8a6', // Teal
        keywords: ['blinkit', 'grocery', 'vegetable', 'fruits', 'groceries', 'provision', 'milk delivery', 'tiffin'],
        isPredefined: true
    },
    {
        name: 'Food',
        color: '#f43f5e', // Rose
        keywords: ['paratha', 'sweet', 'chutney', 'snack', 'samosa', 'pizza', 'burger', 'sandwich', 'cake', 'biscuit'],
        isPredefined: true
    },
    {
        name: 'Drinks',
        color: '#0ea5e9', // Sky
        keywords: ['juice', 'frooti', 'nimbu pani', 'lemon', 'soda', 'water', 'cold drink', 'milkshake', 'smoothie'],
        isPredefined: true
    },
    {
        name: 'Transport',
        color: '#10b981', // Emerald
        keywords: ['auto', 'taxi', 'bus', 'train', 'petrol', 'diesel', 'uber', 'ola', 'rickshaw', 'rapido'],
        isPredefined: true
    },
    {
        name: 'Shopping',
        color: '#a855f7', // Purple
        keywords: ['shopping', 'clothes', 'shoes', 'electronics', 'amazon', 'flipkart'],
        isPredefined: true
    },
    {
        name: 'Rent',
        color: '#ec4899', // Pink
        keywords: ['rent', 'room rent', 'house rent', 'flat rent', 'hostel rent', 'hostel fee', 'pg rent'],
        isPredefined: true
    },
    {
        name: 'Bills',
        color: '#ef4444', // Red
        keywords: ['electricity', 'power bill', 'light bill', 'bill', 'recharge', 'wifi', 'internet', 'broadband', 'water bill', 'maintenance'],
        isPredefined: true
    },
    {
        name: 'Salary',
        color: '#10b981', // Emerald
        keywords: ['salary', 'paycheck', 'payout', 'wage', 'stipend', 'income'],
        isPredefined: true
    },
    {
        name: 'Freelance',
        color: '#06b6d4', // Cyan
        keywords: ['freelance', 'client', 'gig', 'consulting', 'upwork', 'fiverr'],
        isPredefined: true
    },
    {
        name: 'Investments',
        color: '#3b82f6', // Blue
        keywords: ['investment', 'dividend', 'interest', 'stock', 'mutual fund', 'crypto'],
        isPredefined: true
    },
    {
        name: 'Gifts',
        color: '#ec4899', // Pink
        keywords: ['gift', 'cashback', 'reward', 'refund', 'birthday'],
        isPredefined: true
    },
    {
        name: 'Others',
        color: '#71717a', // Zinc
        keywords: [],
        isPredefined: true
    }
];

export const seedDefaultCategories = async () => {
    try {
        const count = await Category.countDocuments();
        if (count === 0) {
            await Category.insertMany(defaultCategories);
            console.log('Seeded predefined category configuration successfully');
            await reloadCategoryKeywordsCache();
        }
    } catch (error) {
        console.error('Error seeding categories:', error);
    }
};

export const getAllCategories = async (): Promise<ICategory[]> => {
    return Category.find().sort({ name: 1 });
};

export const createCategory = async (data: { name: string; color: string; keywords?: string[] }): Promise<ICategory> => {
    const formattedName = data.name.trim().charAt(0).toUpperCase() + data.name.trim().slice(1);
    
    // Check if category already exists
    const existing = await Category.findOne({ name: formattedName });
    if (existing) {
        throw new Error(`Category "${formattedName}" already exists`);
    }

    const category = new Category({
        name: formattedName,
        color: data.color || '#6366f1',
        keywords: data.keywords || [formattedName.toLowerCase()],
        isPredefined: false
    });

    const saved = await category.save();
    await reloadCategoryKeywordsCache();
    return saved;
};

export const updateCategory = async (name: string, updates: { color?: string; keywords?: string[] }): Promise<ICategory | null> => {
    const category = await Category.findOne({ name });
    if (!category) {
        throw new Error(`Category "${name}" not found`);
    }

    if (updates.color !== undefined) category.color = updates.color;
    if (updates.keywords !== undefined) category.keywords = updates.keywords;

    const saved = await category.save();
    await reloadCategoryKeywordsCache();
    return saved;
};

export const deleteCategory = async (name: string): Promise<boolean> => {
    const category = await Category.findOne({ name });
    if (!category) {
        throw new Error(`Category "${name}" not found`);
    }

    if (category.isPredefined) {
        throw new Error('Cannot delete predefined system categories');
    }

    await Category.deleteOne({ _id: category._id });
    await reloadCategoryKeywordsCache();
    return true;
};

export const resetToDefaultCategories = async () => {
    await Category.deleteMany({});
    await Category.insertMany(defaultCategories);
    await reloadCategoryKeywordsCache();
    return defaultCategories;
};
