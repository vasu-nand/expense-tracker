'use client'

import { useState } from 'react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { X, Loader2, Sparkles } from 'lucide-react'

interface AddExpenseDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    defaultMonth: string;
}

export function AddExpenseDialog({ isOpen, onClose, onSuccess, defaultMonth }: AddExpenseDialogProps) {
    const [day, setDay] = useState<number>(new Date().getDate())
    const [amount, setAmount] = useState<string>('')
    const [reason, setReason] = useState<string>('')
    const [category, setCategory] = useState<string>('auto')
    const [month, setMonth] = useState<string>(defaultMonth)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        const parsedAmount = parseFloat(amount)
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('Please enter a valid amount')
            return
        }

        const parsedDay = parseInt(day.toString())
        if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
            setError('Please enter a valid day (1-31)')
            return
        }

        if (!reason.trim()) {
            setError('Please enter a reason/description')
            return
        }

        try {
            setLoading(true)
            setError('')
            
            await api.post('/expenses', {
                day: parsedDay,
                amount: parsedAmount,
                reason: reason.trim(),
                category,
                month
            })

            // Reset form
            setAmount('')
            setReason('')
            setCategory('auto')
            
            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add expense')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            Add New Expense
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Enter details for manual transaction logging</p>
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

                    <div className="grid grid-cols-2 gap-4">
                        {/* Day */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Day of Month</label>
                            <input
                                type="number"
                                min={1}
                                max={31}
                                required
                                value={day}
                                onChange={(e) => setDay(parseInt(e.target.value) || 0)}
                                className="border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        {/* Month */}
                        <div className="flex flex-col space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Month</label>
                            <input
                                type="month"
                                required
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="border border-border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="flex flex-col space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Amount (₹)</label>
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
                            placeholder="e.g. Lunch thali at office"
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
                            <option value="auto">🪄 Auto-Detect Category</option>
                            <option value="Breakfast">Breakfast</option>
                            <option value="Lunch">Lunch</option>
                            <option value="Dinner">Dinner</option>
                            <option value="Groceries">Groceries</option>
                            <option value="Food">Food</option>
                            <option value="Drinks">Drinks</option>
                            <option value="Transport">Transport</option>
                            <option value="Shopping">Shopping</option>
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
                            ) : 'Add Expense'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
