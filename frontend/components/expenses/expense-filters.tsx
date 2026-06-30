'use client'

import { useState } from 'react'
import { SlidersHorizontal, Search, Calendar, Tag, ChevronDown, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    type: string;
    onTypeChange: (type: string) => void;
    
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
    type,
    onTypeChange,
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
        <div className="space-y-3 p-4 md:p-5 border border-border/80 rounded-2xl bg-card/65 backdrop-blur-md shadow-lg transition-all duration-300 hover:border-border">
            {/* Row 1: Core Search & Selects */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Search Input */}
                <div className="md:col-span-4 flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Search Description
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search descriptions or categories..."
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full border border-border/70 pl-10 pr-4 py-2 bg-background/50 hover:bg-background/85 focus:bg-background/90 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all text-xs rounded-xl"
                        />
                    </div>
                </div>

                {/* Category Filter */}
                <div className="md:col-span-3 flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Category Filter
                    </label>
                    <div className="relative">
                        <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => onCategoryChange(e.target.value)}
                            className="w-full border border-border/70 pl-10 pr-8 py-2 bg-background/50 hover:bg-background/85 focus:bg-background/90 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 capitalize transition-all text-xs rounded-xl appearance-none cursor-pointer"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground/60">
                            <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                    </div>
                </div>

                {/* Month Filter */}
                <div className="md:col-span-3 flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Select Month
                    </label>
                    <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => onMonthChange(e.target.value)}
                            className="w-full border border-border/70 pl-10 pr-4 py-2 bg-background/50 hover:bg-background/85 focus:bg-background/90 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all text-xs rounded-xl"
                        />
                    </div>
                </div>

                {/* Transaction Type Filter */}
                <div className="md:col-span-2 flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Type Filter
                    </label>
                    <div className="relative">
                        <select
                            value={type}
                            onChange={(e) => onTypeChange(e.target.value)}
                            className="w-full border border-border/70 px-3 py-2 bg-background/50 hover:bg-background/85 focus:bg-background/90 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all text-xs rounded-xl appearance-none cursor-pointer"
                        >
                            <option value="">All Types</option>
                            <option value="expense">Expenses Only</option>
                            <option value="income">Income Only</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground/60">
                            <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Sorts & Advanced Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-t border-border/30 pt-3.5 gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Sort By */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                            <ArrowUpDown className="h-3.5 w-3.5" /> Sort:
                        </span>
                        <div className="flex items-center space-x-1.5">
                            <select
                                value={sortBy}
                                onChange={(e) => onSortByChange(e.target.value)}
                                className="border border-border/70 rounded-xl px-3 py-1.5 bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 text-xs cursor-pointer hover:bg-background/80"
                            >
                                <option value="day">Date / Day</option>
                                <option value="amount">Amount</option>
                                <option value="reason">Description</option>
                            </select>

                            <select
                                value={sortOrder}
                                onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
                                className="border border-border/70 rounded-xl px-3 py-1.5 bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 text-xs cursor-pointer hover:bg-background/80"
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
                </div>

                {/* Advanced Filters Button */}
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={cn(
                        "flex items-center justify-center gap-1.5 px-4.5 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 shadow-sm",
                        showAdvanced || isRangeActive
                            ? 'bg-primary/10 text-primary border-primary/45 ring-2 ring-primary/10'
                            : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border/70'
                    )}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Advanced Filters</span>
                    {isRangeActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                    )}
                </button>
            </div>

            {/* Collapsible Advanced Section */}
            {showAdvanced && (
                <div className="border-t border-border/30 pt-3.5 mt-2 animate-in slide-in-from-top duration-300">
                    <div className="bg-muted/30 border border-border/40 p-4 rounded-xl">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Range-Based Search</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {/* Amount Range */}
                            <div className="flex flex-col space-y-1">
                                <label className="text-[9px] font-bold text-muted-foreground/80 uppercase">Min Amount</label>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minAmount}
                                    onChange={(e) => onMinAmountChange(e.target.value)}
                                    className="border border-border rounded-lg px-2.5 py-1.5 bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/25 outline-none"
                                />
                            </div>

                            <div className="flex flex-col space-y-1">
                                <label className="text-[9px] font-bold text-muted-foreground/80 uppercase">Max Amount</label>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxAmount}
                                    onChange={(e) => onMaxAmountChange(e.target.value)}
                                    className="border border-border rounded-lg px-2.5 py-1.5 bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/25 outline-none"
                                />
                            </div>

                            {/* Day Range */}
                            <div className="flex flex-col space-y-1">
                                <label className="text-[9px] font-bold text-muted-foreground/80 uppercase">Start Day (1-31)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    placeholder="e.g. 1"
                                    value={minDay}
                                    onChange={(e) => onMinDayChange(e.target.value)}
                                    className="border border-border rounded-lg px-2.5 py-1.5 bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/25 outline-none"
                                />
                            </div>

                            <div className="flex flex-col space-y-1">
                                <label className="text-[9px] font-bold text-muted-foreground/80 uppercase">End Day (1-31)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    placeholder="e.g. 31"
                                    value={maxDay}
                                    onChange={(e) => onMaxDayChange(e.target.value)}
                                    className="border border-border rounded-lg px-2.5 py-1.5 bg-background text-foreground text-xs focus:ring-2 focus:ring-primary/25 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
