export const getLocalMonthString = (date: Date = new Date()): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
};

export const getDaysInMonth = (monthStr: string): number => {
    if (!monthStr) return 31;
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month, 0).getDate();
};
