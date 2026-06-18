const categoryKeywords: Record<string, string[]> = {
    Breakfast: ['breakfast', 'doodh', 'milk', 'coffee', 'eggs', 'omlet', 'bread', 'butter', 'jam'],
    Lunch: ['lunch', 'thali', 'meal', 'curry', 'roti', 'rice'],
    Dinner: ['dinner', 'night', 'supper'],
    Groceries: ['blinkit', 'grocery', 'vegetable', 'fruits', 'groceries', 'provision', 'milk delivery', 'tiffin'],
    Food: ['paratha', 'sweet', 'chutney', 'snack', 'samosa', 'pizza', 'burger', 'sandwich', 'cake', 'biscuit'],
    Drinks: ['juice', 'frooti', 'nimbu pani', 'lemon', 'soda', 'water', 'cold drink', 'milkshake', 'smoothie'],
    Transport: ['auto', 'taxi', 'bus', 'train', 'petrol', 'diesel', 'uber', 'ola', 'rickshaw'],
    Shopping: ['shopping', 'clothes', 'shoes', 'electronics', 'amazon', 'flipkart']
};

export const detectCategory = (reason: string): string => {
    const lowerReason = reason.toLowerCase();

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => lowerReason.includes(keyword))) {
            return category;
        }
    }

    return 'Others';
};