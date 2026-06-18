'use client'

interface ExpenseFiltersProps {
    categories: string[];
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    month: string;
    onMonthChange: (month: string) => void;
}

export function ExpenseFilters({
    categories,
    selectedCategory,
    onCategoryChange,
    month,
    onMonthChange
}: ExpenseFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 p-4 border border-border rounded-lg bg-card shadow-sm">
            {/* Category Filter */}
            <div className="flex-1 flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Filter by Category
                </label>
                <select
                    value={selectedCategory}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className="border border-border rounded-md px-3.5 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 capitalize transition-all"
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </div>

            {/* Month Filter */}
            <div className="w-full sm:w-64 flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Month
                </label>
                <input
                    type="month"
                    value={month}
                    onChange={(e) => onMonthChange(e.target.value)}
                    className="border border-border rounded-md px-3.5 py-1.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
            </div>
        </div>
    )
}
