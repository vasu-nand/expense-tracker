'use client'

import { useState } from 'react'
import { SlidersHorizontal, Sparkles } from 'lucide-react'

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
    
    // Range Filters
    minAmount: string;
    onMinAmountChange: (val: string) => void;
    maxAmount: string;
    onMaxAmountChange: (val: string) => void;
    minDay: string;
    onMinDayChange: (val: string) => void;
    maxDay: string;
    onMaxDayChange: (val: string) => void;
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
    onSortOrderChange,
    minAmount,
    onMinAmountChange,
    maxAmount,
    onMaxAmountChange,
    minDay,
    onMinDayChange,
    maxDay,
    onMaxDayChange
}: ExpenseFiltersProps) {
    const [showAdvanced, setShowAdvanced] = useState(false)

    // Checks if any range filter is active to show indicator dot
    const isRangeActive = minAmount || maxAmount || minDay || maxDay

    return (
        <div className="space-y-3 p-4 border border-border rounded-xl bg-card/60 backdrop-blur-sm shadow-sm transition-all duration-300">
            {/* Row 1: Core Search & Selects */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Search Input */}
                <div className="md:col-span-5 flex flex-col space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Search Expenses
                    </label>
                    <input
                        type="text"
                        placeholder="Search by description or category..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-xs"
                    />
                </div>

                {/* Category Filter */}
                <div className="md:col-span-4 flex flex-col space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Category
                    </label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => onCategoryChange(e.target.value)}
                        className="border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 capitalize transition-all text-xs"
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
                <div className="md:col-span-3 flex flex-col space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Month
                    </label>
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => onMonthChange(e.target.value)}
                        className="border border-border rounded-md px-3 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all text-xs"
                    />
                </div>
            </div>

            {/* Row 2: Sorts & Advanced Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-t border-border/30 pt-3 gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Sort By */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Sort:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => onSortByChange(e.target.value)}
                            className="border border-border rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 text-xs"
                        >
                            <option value="day">Date / Day</option>
                            <option value="amount">Amount</option>
                            <option value="reason">Description</option>
                        </select>
                    </div>

                    {/* Sort Order */}
                    <div className="flex items-center gap-2">
                        <select
                            value={sortOrder}
                            onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
                            className="border border-border rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/45 text-xs"
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

                {/* Advanced Filters Button */}
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-200 ${
                        showAdvanced || isRangeActive
                            ? 'bg-accent/40 text-primary border-primary/50'
                            : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Advanced Filters</span>
                    {isRangeActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                </button>
            </div>

            {/* Collapsible Advanced Section */}
            {showAdvanced && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border-t border-border/30 pt-3 animate-in slide-in-from-top duration-300">
                    {/* Amount Range */}
                    <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Min Amount</label>
                        <input
                            type="number"
                            placeholder="Min"
                            value={minAmount}
                            onChange={(e) => onMinAmountChange(e.target.value)}
                            className="border border-border rounded-md px-2 py-1 bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/45"
                        />
                    </div>

                    <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Max Amount</label>
                        <input
                            type="number"
                            placeholder="Max"
                            value={maxAmount}
                            onChange={(e) => onMaxAmountChange(e.target.value)}
                            className="border border-border rounded-md px-2 py-1 bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/45"
                        />
                    </div>

                    {/* Day Range */}
                    <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Start Day (1-31)</label>
                        <input
                            type="number"
                            min="1"
                            max="31"
                            placeholder="e.g. 1"
                            value={minDay}
                            onChange={(e) => onMinDayChange(e.target.value)}
                            className="border border-border rounded-md px-2 py-1 bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/45"
                        />
                    </div>

                    <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">End Day (1-31)</label>
                        <input
                            type="number"
                            min="1"
                            max="31"
                            placeholder="e.g. 31"
                            value={maxDay}
                            onChange={(e) => onMaxDayChange(e.target.value)}
                            className="border border-border rounded-md px-2 py-1 bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/45"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
