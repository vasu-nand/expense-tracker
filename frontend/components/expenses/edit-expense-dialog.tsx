'use client'

import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { X, Loader2, Sparkles } from 'lucide-react'
import { useCurrency } from '@/hooks/use-currency'
import { useThemeCustomizer } from '@/components/theme-customizer-provider'
import { getDaysInMonth } from '@/lib/utils'
import { MonthPicker } from '@/components/ui/month-picker'

interface Expense {
    _id: string;
    day: number;
    amount: number;
    reason: string;
    category: string;
    month: string;
    type?: 'expense' | 'income';
}

interface EditExpenseDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    expense: Expense | null;
}

export function EditExpenseDialog({ isOpen, onClose, onSuccess, expense }: EditExpenseDialogProps) {
    const { convert, convertToBase, symbol } = useCurrency()
    const { categoryColors } = useThemeCustomizer()
    const [day, setDay] = useState<number>(1)
    const [amount, setAmount] = useState<string>('')
    const [reason, setReason] = useState<string>('')
    const [type, setType] = useState<'expense' | 'income'>('expense')
    const [category, setCategory] = useState<string>('auto')
    const [month, setMonth] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (expense) {
            setDay(expense.day)
            setAmount(Number(convert(expense.amount).toFixed(3)).toString())
            setReason(expense.reason)
            setType(expense.type || 'expense')
            setCategory(expense.category)
            setMonth(expense.month)
            setError('')
        }
    }, [expense, isOpen])

    useEffect(() => {
        if (isOpen && month) {
            const maxDays = getDaysInMonth(month)
            if (day > maxDays) {
                setDay(maxDays)
            }
        }
    }, [month, isOpen])

    if (!isOpen || !expense) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        const displayAmount = parseFloat(amount)
        if (isNaN(displayAmount) || displayAmount <= 0) {
            setError('Please enter a valid amount')
            return
        }

        const parsedAmount = convertToBase(displayAmount)

        const maxDays = getDaysInMonth(month)
        const parsedDay = parseInt(day.toString())
        if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > maxDays) {
            setError(`Please enter a valid day (1-${maxDays})`)
            return
        }

        if (!reason.trim()) {
            setError('Please enter a reason/description')
            return
        }

        try {
            setLoading(true)
            setError('')
            
            await api.put(`/expenses/${expense._id}`, {
                day: parsedDay,
                amount: parsedAmount,
                reason: reason.trim(),
                category,
                month,
                type
            })

            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.response?.data?.error || `Failed to update ${type}`)
        } finally {
            setLoading(false)
        }
    }

    const standardExpenses = ['Breakfast', 'Lunch', 'Dinner', 'Groceries', 'Food', 'Drinks', 'Transport', 'Shopping', 'Rent', 'Bills']
    const standardIncomes = ['Salary', 'Freelance', 'Investments', 'Gifts']

    const categoriesList = type === 'income'
        ? [...standardIncomes, ...Object.keys(categoryColors).filter(c => !standardExpenses.includes(c) && !standardIncomes.includes(c) && c !== 'Others')]
        : [...standardExpenses, ...Object.keys(categoryColors).filter(c => !standardExpenses.includes(c) && !standardIncomes.includes(c) && c !== 'Others')]

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md rounded-xl border border-border p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200" style={{backgroundColor: 'hsl(var(--card))', backdropFilter: 'none'}}>
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent capitalize">
                            Edit {type}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Modify transaction record parameters</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="rounded-full p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {error && (
                        <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-md font-medium">
                            {error}
                        </div>
                    )}

                    {/* Transaction Type Toggle */}
                    <div className="flex flex-col space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Transaction Type</label>
                        <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 border border-border/60 rounded-xl">
                            <button
                                type="button"
                                onClick={() => {
                                    setType('expense')
                                    setCategory('auto')
                                }}
                                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                                    type === 'expense'
                                        ? 'bg-card text-rose-500 shadow-sm border border-rose-500/10'
                                        : 'text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                Expense
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setType('income')
                                    setCategory('auto')
                                }}
                                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                                    type === 'income'
                                        ? 'bg-card text-emerald-500 shadow-sm border border-emerald-500/10'
                                        : 'text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                Income
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Day */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Day of Month</label>
                            <input
                                type="number"
                                min={1}
                                max={getDaysInMonth(month)}
                                required
                                value={day}
                                onChange={(e) => setDay(parseInt(e.target.value) || 0)}
                                className="border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        {/* Month */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Month</label>
                            <MonthPicker
                                value={month}
                                onChange={setMonth}
                                placeholder="Select Month"
                            />
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="flex flex-col space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Amount ({symbol})</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                        />
                    </div>

                    {/* Reason */}
                    <div className="flex flex-col space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Reason / Description</label>
                        <input
                            type="text"
                            placeholder={type === 'income' ? "e.g. Monthly salary or freelance payment" : "e.g. Lunch thali at office"}
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    {/* Category Select */}
                    <div className="flex flex-col space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-muted-foreground">Category</label>
                            {category === 'auto' && (
                                <span className="inline-flex items-center text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded gap-0.5">
                                    <Sparkles className="h-3 w-3 animate-pulse" /> Auto-Detect Enabled
                                </span>
                            )}
                        </div>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 capitalize"
                        >
                            <option value="auto">Auto-Detect Category</option>
                            {categoriesList.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat === 'Bills' ? 'Bills & Utilities' : cat}
                                </option>
                            ))}
                            <option value="Others">Others</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={onClose} 
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
