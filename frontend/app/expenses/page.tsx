'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ExpenseTable } from '@/components/expenses/expense-table'
import { ExpenseFilters } from '@/components/expenses/expense-filters'
import { useExpenses } from '@/hooks/useExpenses'
import { AddExpenseDialog } from '@/components/expenses/add-expense-dialog'
import { Plus, DollarSign, TrendingUp, Sparkles, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ExpensesPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const urlSearch = searchParams.get('search') || ''
    const urlCategory = searchParams.get('category') || ''
    const urlMonth = searchParams.get('month') || new Date().toISOString().slice(0, 7)
    const urlSortBy = searchParams.get('sortBy') || 'day'
    const urlSortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'

    const [page, setPage] = useState(1)
    const [category, setCategory] = useState(urlCategory)
    const [month, setMonth] = useState(urlMonth)
    const [search, setSearch] = useState(urlSearch)
    const [debouncedSearch, setDebouncedSearch] = useState(urlSearch)
    const [sortBy, setSortBy] = useState(urlSortBy)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(urlSortOrder) // Default to reverse order (desc)
    const [isAddOpen, setIsAddOpen] = useState(false)

    // Sync search and filters from URL when URL parameters change (e.g. navigation)
    useEffect(() => {
        setSearch(urlSearch)
        setDebouncedSearch(urlSearch)
        setCategory(urlCategory)
        setMonth(urlMonth)
        setSortBy(urlSortBy)
        setSortOrder(urlSortOrder)
        setPage(1)
    }, [urlSearch, urlCategory, urlMonth, urlSortBy, urlSortOrder])

    // Debounce search input changes
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
            setPage(1)
        }, 300)
        return () => clearTimeout(timer)
    }, [search])

    // Sync state changes back to URL query parameters
    useEffect(() => {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('search', debouncedSearch)
        if (category) params.set('category', category)
        if (month) params.set('month', month)
        if (sortBy) params.set('sortBy', sortBy)
        if (sortOrder) params.set('sortOrder', sortOrder)
        
        router.replace(`${pathname}?${params.toString()}`)
    }, [debouncedSearch, category, month, sortBy, sortOrder, pathname, router])

    const { expenses, total, loading, error, categories, refetch } = useExpenses({
        page,
        limit: 20,
        category: category || undefined,
        month,
        search: debouncedSearch || undefined,
        sortBy,
        sortOrder
    })

    // Reset to page 1 when filter parameters change
    useEffect(() => {
        setPage(1)
    }, [category, month, sortBy, sortOrder])

    // Calculate view insights
    const pageTotal = expenses.reduce((sum, e) => sum + e.amount, 0)
    const pageAvg = expenses.length > 0 ? pageTotal / expenses.length : 0
    const pageMax = expenses.length > 0 
        ? [...expenses].sort((a, b) => b.amount - a.amount)[0] 
        : null

    const categoryTotals: Record<string, number> = {}
    expenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
    })
    let topCategory = 'None'
    let topCategoryTotal = 0
    Object.entries(categoryTotals).forEach(([cat, total]) => {
        if (total > topCategoryTotal) {
            topCategoryTotal = total
            topCategory = cat
        }
    })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Expenses</h1>
                <div className="flex space-x-2">
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        className="flex items-center space-x-1.5"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Expense</span>
                    </Button>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors text-sm font-medium"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Quick View Insights */}
            {!loading && expenses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
                    <div className="p-4 rounded-xl border border-teal-500/10 bg-teal-500/5 dark:bg-teal-950/10 flex items-center justify-between hover:scale-[1.01] transition-transform shadow-sm">
                        <div>
                            <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Visible Spend Total</p>
                            <h3 className="text-xl font-extrabold text-teal-700 dark:text-teal-300 font-mono mt-0.5">₹{pageTotal.toFixed(2)}</h3>
                        </div>
                        <div className="p-2 bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-lg">
                            <DollarSign className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/5 dark:bg-indigo-950/10 flex items-center justify-between hover:scale-[1.01] transition-transform shadow-sm">
                        <div>
                            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Visible Average</p>
                            <h3 className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300 font-mono mt-0.5">₹{pageAvg.toFixed(2)}</h3>
                        </div>
                        <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="p-4 rounded-xl border border-purple-500/10 bg-purple-500/5 dark:bg-purple-950/10 flex items-center justify-between hover:scale-[1.01] transition-transform shadow-sm">
                        <div className="truncate pr-2">
                            <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Top Spend Category</p>
                            <h3 className="text-sm font-bold text-purple-800 dark:text-purple-300 mt-1 truncate capitalize" title={topCategory}>
                                {topCategory}
                            </h3>
                            <p className="text-xs font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-0.5">₹{topCategoryTotal.toFixed(2)}</p>
                        </div>
                        <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg shrink-0">
                            <Receipt className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/5 dark:bg-amber-950/10 flex items-center justify-between hover:scale-[1.01] transition-transform shadow-sm">
                        <div className="truncate pr-2">
                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Top Single Expense</p>
                            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 mt-1 truncate" title={pageMax?.reason}>
                                {pageMax?.reason}
                            </h3>
                            <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-0.5">₹{pageMax?.amount.toFixed(2)}</p>
                        </div>
                        <div className="p-2 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
                            <Sparkles className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            )}

            <ExpenseFilters
                categories={categories}
                selectedCategory={category}
                onCategoryChange={setCategory}
                month={month}
                onMonthChange={setMonth}
                search={search}
                onSearchChange={setSearch}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
            />

            <ExpenseTable
                expenses={expenses}
                loading={loading}
                error={error}
                page={page}
                total={total}
                onPageChange={setPage}
                onDelete={refetch}
            />

            <AddExpenseDialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={() => {
                    refetch()
                    window.dispatchEvent(new CustomEvent('expense-added'))
                }}
                defaultMonth={month}
            />
        </div>
    )
}