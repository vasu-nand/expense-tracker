'use client'

import { useState, useEffect, useRef } from 'react'
import { SlidersHorizontal, Search, Calendar, Tag, ChevronDown, ArrowUpDown, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MonthPicker } from '@/components/ui/month-picker'

// Category Multi Select Dropdown, matching Export screen
function CategoryMultiSelect({
    categories,
    selected,
    onChange,
}: {
    categories: string[]
    selected: string[]
    onChange: (v: string[]) => void
}) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const toggle = (cat: string) => {
        onChange(selected.includes(cat) ? selected.filter(c => c !== cat) : [...selected, cat])
    }

    const allSelected = selected.length === 0
    const label = allSelected
        ? 'All Categories'
        : selected.length === 1
            ? selected[0]
            : `${selected.length} categories`

    return (
        <div className="relative w-full" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between border border-border/70 pl-10 pr-4 py-2 bg-background/50 hover:bg-background/85 focus:bg-background/90 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/25 rounded-xl capitalize text-left shadow-sm select-none"
            >
                <span className="truncate">{label}</span>
                <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground ml-2 flex-shrink-0 transition-transform", open && "rotate-180")} />
            </button>

            {open && (
                <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-white dark:bg-zinc-900 border border-border/95 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.5)] overflow-hidden text-xs">
                    <button
                        type="button"
                        onClick={() => { onChange([]); setOpen(false) }}
                        className={cn(
                            "w-full flex items-center justify-between px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-left font-medium",
                            allSelected && "text-primary font-bold"
                        )}
                    >
                        <span>All Categories</span>
                        {allSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </button>
                    <div className="max-h-48 overflow-y-auto divide-y divide-border/20 border-t border-border/20">
                        {categories.map(cat => {
                            const isSel = selected.includes(cat)
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => toggle(cat)}
                                    className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors capitalize text-left"
                                >
                                    <span className={cn(isSel && "text-primary font-bold")}>{cat}</span>
                                    {isSel && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

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

    // Parse comma-separated string back to selectedCategories array
    const selectedCategories = selectedCategory ? selectedCategory.split(',').filter(Boolean) : []

    // Checks if any range filter is active to show indicator dot
    const isRangeActive = minAmount || maxAmount || minDay || maxDay

    return (
        <div className="relative z-30 space-y-3 p-4 md:p-5 border border-border/80 rounded-2xl bg-card/65 backdrop-blur-md shadow-lg transition-all duration-300 hover:border-border">
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

                {/* Category Filter - Upgraded to Multi Select */}
                <div className="md:col-span-4 flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Category Filter
                    </label>
                    <div className="relative w-full">
                        <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none z-10" />
                        <CategoryMultiSelect
                            categories={categories}
                            selected={selectedCategories}
                            onChange={(cats) => onCategoryChange(cats.join(','))}
                        />
                    </div>
                </div>

                {/* Month/Range Filter */}
                <div className="md:col-span-4 flex flex-col space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Time Period
                        </label>
                        <div className="flex rounded-md bg-muted p-0.5 text-[9px] font-extrabold border border-border/40 select-none">
                            <button
                                type="button"
                                onClick={() => {
                                    onMonthChange(month.includes(':') ? month.split(':')[0] : month)
                                }}
                                className={cn("px-1.5 py-0.5 rounded", !month.includes(':') ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
                            >
                                Month
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const mVal = month.includes(':') ? month : `${month}:${month}`
                                    onMonthChange(mVal)
                                }}
                                className={cn("px-1.5 py-0.5 rounded", month.includes(':') ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
                            >
                                Range
                            </button>
                        </div>
                    </div>
                    
                    {!month.includes(':') ? (
                        <MonthPicker
                            value={month}
                            onChange={onMonthChange}
                            placeholder="Select Month"
                        />
                    ) : (
                        <div className="flex items-center space-x-1.5">
                            <MonthPicker
                                value={month.split(':')[0]}
                                onChange={(val) => onMonthChange(`${val}:${month.split(':')[1] || val}`)}
                                placeholder="Start Month"
                            />
                            <span className="text-[10px] text-muted-foreground font-black uppercase shrink-0">to</span>
                            <MonthPicker
                                value={month.split(':')[1] || month.split(':')[0]}
                                onChange={(val) => onMonthChange(`${month.split(':')[0]}:${val}`)}
                                placeholder="End Month"
                            />
                        </div>
                    )}
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

                    {/* Transaction Type Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Type:</span>
                        <select
                            value={type}
                            onChange={(e) => onTypeChange(e.target.value)}
                            className="border border-border/70 rounded-xl px-3 py-1.5 bg-background/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 text-xs cursor-pointer hover:bg-background/80"
                        >
                            <option value="">All Types</option>
                            <option value="expense">Expenses Only</option>
                            <option value="income">Income Only</option>
                        </select>
                    </div>
                </div>

                {/* Advanced Filters Button */}
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={cn(
                        "flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 shadow-sm",
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
