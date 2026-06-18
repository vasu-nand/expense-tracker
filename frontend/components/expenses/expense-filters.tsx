'use client'

interface ExpenseFiltersProps {
    categories: string[];
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    month: string;
    onMonthChange: (month: string) => void;
    search: string;
    onSearchChange: (search: string) => void;
    sortBy: string;
    onSortByChange: (sortBy: string) => void;
    sortOrder: 'asc' | 'desc';
    onSortOrderChange: (sortOrder: 'asc' | 'desc') => void;
}

export function ExpenseFilters({
    categories,
    selectedCategory,
    onCategoryChange,
    month,
    onMonthChange,
    search,
    onSearchChange,
    sortBy,
    onSortByChange,
    sortOrder,
    onSortOrderChange
}: ExpenseFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 p-4 border border-border rounded-lg bg-card shadow-sm">
            {/* Search Input */}
            <div className="flex-1 flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Search Expenses
                </label>
                <input
                    type="text"
                    placeholder="Search by description or category..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="border border-border rounded-md px-3.5 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm"
                />
            </div>

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
            <div className="w-full sm:w-44 flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Month
                </label>
                <input
                    type="month"
                    value={month}
                    onChange={(e) => onMonthChange(e.target.value)}
                    className="border border-border rounded-md px-3.5 py-1.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm"
                />
            </div>

            {/* Sort By */}
            <div className="w-full sm:w-44 flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Sort By
                </label>
                <select
                    value={sortBy}
                    onChange={(e) => onSortByChange(e.target.value)}
                    className="border border-border rounded-md px-3.5 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm"
                >
                    <option value="day">Date / Day</option>
                    <option value="amount">Amount</option>
                    <option value="reason">Description</option>
                </select>
            </div>

            {/* Sort Order */}
            <div className="w-full sm:w-44 flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Order
                </label>
                <select
                    value={sortOrder}
                    onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
                    className="border border-border rounded-md px-3.5 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm"
                >
                    {sortBy === 'amount' ? (
                        <>
                            <option value="desc">Highest First</option>
                            <option value="asc">Lowest First</option>
                        </>
                    ) : sortBy === 'reason' ? (
                        <>
                            <option value="desc">Z - A</option>
                            <option value="asc">A - Z</option>
                        </>
                    ) : (
                        <>
                            <option value="desc">Newest First</option>
                            <option value="asc">Oldest First</option>
                        </>
                    )}
                </select>
            </div>
        </div>
    )
}
