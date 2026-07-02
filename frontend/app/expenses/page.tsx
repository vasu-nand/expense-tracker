'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ExpenseTable } from '@/components/expenses/expense-table'
import { ExpenseFilters } from '@/components/expenses/expense-filters'
import { useExpenses } from '@/hooks/useExpenses'
import { AddExpenseDialog } from '@/components/expenses/add-expense-dialog'
import { EditExpenseDialog } from '@/components/expenses/edit-expense-dialog'
import { Plus, DollarSign, TrendingUp, Sparkles, Receipt, Lock, X, KeyRound, Loader2, RotateCw } from 'lucide-react'
import { useCurrency } from '@/hooks/use-currency'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'
import { getLocalMonth } from '@/lib/utils'

export default function ExpensesPage() {
    const { format } = useCurrency()
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const urlSearch = searchParams.get('search') || ''
    const urlCategory = searchParams.get('category') || ''
    const urlMonth = searchParams.get('month') || getLocalMonth()
    const urlSortBy = searchParams.get('sortBy') || 'day'
    const urlSortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    const urlLimit = Number(searchParams.get('limit')) || 20
    const urlMinAmount = searchParams.get('minAmount') || ''
    const urlMaxAmount = searchParams.get('maxAmount') || ''
    const urlMinDay = searchParams.get('minDay') || ''
    const urlMaxDay = searchParams.get('maxDay') || ''
    const urlType = searchParams.get('type') || ''

    const [page, setPage] = useState(1)
    const [category, setCategory] = useState(urlCategory)
    const [month, setMonth] = useState(urlMonth)
    const [type, setType] = useState(urlType)
    const [search, setSearch] = useState(urlSearch)
    const [debouncedSearch, setDebouncedSearch] = useState(urlSearch)
    const [sortBy, setSortBy] = useState(urlSortBy)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(urlSortOrder) // Default to reverse order (desc)
    const [limit, setLimit] = useState(urlLimit)
    const [minAmount, setMinAmount] = useState(urlMinAmount)
    const [maxAmount, setMaxAmount] = useState(urlMaxAmount)
    const [minDay, setMinDay] = useState(urlMinDay)
    const [maxDay, setMaxDay] = useState(urlMaxDay)
    const [isAddOpen, setIsAddOpen] = useState(false)

    // Dialog state lifted out of ExpenseTable to avoid containing-block issues
    const [editingExpense, setEditingExpense] = useState<any>(null)
    const [deletingExpense, setDeletingExpense] = useState<any>(null)
    const [deletePassword, setDeletePassword] = useState('')
    const [deleteError, setDeleteError] = useState('')
    const [deleting, setDeleting] = useState(false)

    // Sync search and filters from URL when URL parameters change (e.g. navigation)
    useEffect(() => {
        setSearch(urlSearch)
        setDebouncedSearch(urlSearch)
        setCategory(urlCategory)
        setMonth(urlMonth)
        setSortBy(urlSortBy)
        setSortOrder(urlSortOrder)
        setLimit(urlLimit)
        setMinAmount(urlMinAmount)
        setMaxAmount(urlMaxAmount)
        setMinDay(urlMinDay)
        setMaxDay(urlMaxDay)
        setType(urlType)
        setPage(1)
    }, [urlSearch, urlCategory, urlMonth, urlSortBy, urlSortOrder, urlLimit, urlMinAmount, urlMaxAmount, urlMinDay, urlMaxDay, urlType])

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
        if (limit !== 20) params.set('limit', String(limit))
        if (minAmount) params.set('minAmount', minAmount)
        if (maxAmount) params.set('maxAmount', maxAmount)
        if (minDay) params.set('minDay', minDay)
        if (maxDay) params.set('maxDay', maxDay)
        if (type) params.set('type', type)
        
        router.replace(`${pathname}?${params.toString()}`)
    }, [debouncedSearch, category, month, sortBy, sortOrder, limit, minAmount, maxAmount, minDay, maxDay, type, pathname, router])

    const { expenses, total, loading, error, categories, refetch } = useExpenses({
        page,
        limit,
        category: category || undefined,
        month,
        search: debouncedSearch || undefined,
        sortBy,
        sortOrder,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        minDay: minDay ? parseInt(minDay) : undefined,
        maxDay: maxDay ? parseInt(maxDay) : undefined,
        type: type || undefined
    })

    // Reset to page 1 when filter parameters change
    useEffect(() => {
        setPage(1)
    }, [category, month, sortBy, sortOrder, limit, minAmount, maxAmount, minDay, maxDay, type])

    // Calculate view insights
    const pageExpensesTotal = expenses.filter(e => e.type !== 'income').reduce((sum, e) => sum + e.amount, 0)
    const pageIncomesTotal = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0)
    const pageNet = pageIncomesTotal - pageExpensesTotal
    const pageTotal = pageExpensesTotal

    const expensesCount = expenses.filter(e => e.type !== 'income').length
    const pageAvg = expensesCount > 0 ? pageExpensesTotal / expensesCount : 0
    const pageMax = expenses.filter(e => e.type !== 'income').length > 0 
        ? [...expenses.filter(e => e.type !== 'income')].sort((a, b) => b.amount - a.amount)[0] 
        : null

    const pageIncomeMax = expenses.filter(e => e.type === 'income').length > 0 
        ? [...expenses.filter(e => e.type === 'income')].sort((a, b) => b.amount - a.amount)[0] 
        : null

    const categoryTotals: Record<string, number> = {}
    expenses.forEach(e => {
        const matchesType = !type || e.type === type || (type === 'expense' && (!e.type || e.type === 'expense'));
        if (matchesType) {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
        }
    })
    let topCategory = 'None'
    let topCategoryTotal = 0
    Object.entries(categoryTotals).forEach(([cat, total]) => {
        if (total > topCategoryTotal) {
            topCategoryTotal = total
            topCategory = cat
        }
    })

    const handleDeleteSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!deletingExpense) return

        if (!deletePassword.trim()) {
            setDeleteError('Password is required')
            return
        }

        try {
            setDeleting(true)
            setDeleteError('')
            await api.delete(`/expenses/${deletingExpense._id}`, {
                headers: { 'x-delete-password': deletePassword }
            })
            refetch()
            setDeletingExpense(null)
        } catch (err: any) {
            setDeleteError(err.response?.data?.error || 'Invalid password or failed deletion')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-custom-gradient">Expenses</h1>
                <div className="flex space-x-2">
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        className="flex items-center space-x-1.5"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Expense</span>
                    </Button>
                    {/* Desktop Refresh Button */}
                    <Button
                        variant="outline"
                        onClick={() => refetch()}
                        className="hidden sm:flex items-center space-x-1.5 border-border/80 text-muted-foreground hover:text-foreground"
                    >
                        <RotateCw className="h-4 w-4" />
                        <span>Refresh</span>
                    </Button>

                    {/* Mobile Refresh Icon Button */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => refetch()}
                        className="flex sm:hidden border-border/80 text-muted-foreground hover:text-foreground rounded-lg"
                        title="Refresh"
                    >
                        <RotateCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Quick View Insights */}
            {!loading && expenses.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-300">
                    <div className={`p-4 rounded-xl border flex items-center justify-between hover:scale-[1.01] transition-transform shadow-sm ${
                        type === 'income'
                            ? 'border-emerald-500/10 bg-emerald-500/5 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400'
                            : type === 'expense'
                            ? 'border-rose-500/10 bg-rose-500/5 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400'
                            : pageNet >= 0
                            ? 'border-emerald-500/10 bg-emerald-500/5 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400'
                            : 'border-rose-500/10 bg-rose-500/5 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400'
                    }`}>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                                {type === 'income' ? 'Visible Income Total' : type === 'expense' ? 'Visible Spend Total' : 'Net Flow Balance'}
                            </p>
                            <h3 className="text-xl font-extrabold font-mono mt-0.5">
                                {type === 'income' ? format(pageIncomesTotal) : type === 'expense' ? format(pageExpensesTotal) : `${pageNet >= 0 ? '+' : ''}${format(pageNet)}`}
                            </h3>
                        </div>
                        <div className="p-2 rounded-lg bg-current/10 text-current">
                            <DollarSign className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="p-4 rounded-xl border border-indigo-500/10 bg-indigo-500/5 dark:bg-indigo-950/10 flex items-center justify-between hover:scale-[1.01] transition-transform shadow-sm">
                        <div>
                            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                {type === 'income' ? 'Avg Income Entry' : 'Avg Spend Entry'}
                            </p>
                            <h3 className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300 font-mono mt-0.5">
                                {type === 'income' 
                                    ? format(expenses.filter(e => e.type === 'income').length > 0 ? pageIncomesTotal / expenses.filter(e => e.type === 'income').length : 0)
                                    : format(pageAvg)}
                            </h3>
                        </div>
                        <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="p-4 rounded-xl border border-purple-500/10 bg-purple-500/5 dark:bg-purple-950/10 flex items-center justify-between hover:scale-[1.01] transition-transform shadow-sm">
                        <div className="truncate pr-2">
                            <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                                {type === 'income' ? 'Top Income Source' : 'Top Spend Category'}
                            </p>
                            <h3 className="text-sm font-bold text-purple-800 dark:text-purple-300 mt-1 truncate capitalize" title={topCategory}>
                                {topCategory}
                            </h3>
                            <p className="text-xs font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-0.5">{format(topCategoryTotal)}</p>
                        </div>
                        <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg shrink-0">
                            <Receipt className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/5 dark:bg-amber-950/10 flex items-center justify-between hover:scale-[1.01] transition-transform shadow-sm">
                        <div className="truncate pr-2">
                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                {type === 'income' ? 'Top Single Income' : 'Top Single Spend'}
                            </p>
                            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 mt-1 truncate" title={type === 'income' ? pageIncomeMax?.reason : pageMax?.reason}>
                                {type === 'income' ? pageIncomeMax?.reason : pageMax?.reason}
                            </h3>
                            <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                                {type === 'income' 
                                    ? (pageIncomeMax ? format(pageIncomeMax.amount) : '')
                                    : (pageMax ? format(pageMax.amount) : '')}
                            </p>
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
                type={type}
                onTypeChange={setType}
                minAmount={minAmount}
                onMinAmountChange={setMinAmount}
                maxAmount={maxAmount}
                onMaxAmountChange={setMaxAmount}
                minDay={minDay}
                onMinDayChange={setMinDay}
                maxDay={maxDay}
                onMaxDayChange={setMaxDay}
            />

            <ExpenseTable
                expenses={expenses}
                loading={loading}
                error={error}
                page={page}
                total={total}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={setLimit}
                onDelete={refetch}
                onEdit={(expense) => setEditingExpense(expense)}
                onDeleteRequest={(expense) => {
                    setDeletingExpense(expense)
                    setDeletePassword('')
                    setDeleteError('')
                }}
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

            {/* Edit Expense Dialog - rendered at page root, outside any overflow/filter context */}
            <EditExpenseDialog
                isOpen={!!editingExpense}
                onClose={() => setEditingExpense(null)}
                onSuccess={() => {
                    refetch()
                    setEditingExpense(null)
                }}
                expense={editingExpense}
            />

            {/* Password-Protected Delete Modal - rendered at page root */}
            {deletingExpense && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200" style={{backgroundColor: 'hsl(var(--card))', backdropFilter: 'none'}}>
                        <div className="flex justify-between items-start border-b pb-3">
                            <div className="flex items-center space-x-2 text-destructive">
                                <Lock className="h-5 w-5" />
                                <h3 className="text-lg font-bold">Secure Deletion</h3>
                            </div>
                            <button
                                onClick={() => setDeletingExpense(null)}
                                className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleDeleteSubmit} className="mt-4 space-y-4">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                You are deleting the expense of <span className="font-bold text-foreground">₹{deletingExpense.amount.toFixed(2)}</span> for "<span className="font-bold text-foreground">{deletingExpense.reason}</span>". Enter deletion password to proceed.
                            </p>

                            {deleteError && (
                                <div className="p-2 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded font-medium">
                                    {deleteError}
                                </div>
                            )}

                            <div className="flex flex-col space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">Admin Password</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        className="w-full border border-border rounded-md pl-9 pr-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-destructive/30 text-sm font-mono"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-3 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDeletingExpense(null)}
                                    disabled={deleting}
                                    className="h-9 text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={deleting}
                                    className="h-9 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {deleting ? (
                                        <>
                                            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : 'Confirm Delete'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}