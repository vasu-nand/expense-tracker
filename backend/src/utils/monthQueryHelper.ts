export function buildMonthQuery(monthStr: string) {
    if (!monthStr) return monthStr;
    
    if (monthStr.includes(',')) {
        const months = monthStr.split(',').map(m => m.trim()).filter(Boolean);
        return { $in: months };
    }
    
    if (monthStr.includes(':')) {
        const [start, end] = monthStr.split(':');
        const query: any = {};
        if (start) query.$gte = start;
        if (end) query.$lte = end;
        return query;
    }
    
    return monthStr;
}
