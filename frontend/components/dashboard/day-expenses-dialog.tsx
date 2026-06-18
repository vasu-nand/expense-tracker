'use client'

import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { X, Loader2, Calendar } from 'lucide-react'

interface Expense {
    _id: string;
    day: number;
    amount: number;
    reason: string;
    category: string;
    month: string;
}

interface DayExpensesDialogProps {
    isOpen: boolean;
    onClose: () => void;
    day: number | null;
    month: string;
}

export function DayExpensesDialog({ isOpen, onClose, day, month }: DayExpensesDialogProps) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && day !== null && month) {
            fetchDayExpenses();
        } else {
            setExpenses([]);
        }
    }, [isOpen, day, month]);

    const fetchDayExpenses = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get(`/expenses?month=${month}&day=${day}&limit=100`);
            setExpenses(response.data.expenses || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || day === null) return null;

    const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);

    const getCategoryBadgeStyles = (category: string) => {
        const cat = category.toLowerCase();
        if (cat.includes('breakfast')) {
            return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30';
        }
        if (cat.includes('lunch')) {
            return 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-900/30';
        }
        if (cat.includes('dinner')) {
            return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/30';
        }
        if (cat.includes('grocery') || cat.includes('blinkit')) {
            return 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-900/30';
        }
        if (cat.includes('food')) {
            return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/30';
        }
        if (cat.includes('drink')) {
            return 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-900/30';
        }
        if (cat.includes('travel') || cat.includes('transport') || cat.includes('auto') || cat.includes('uber') || cat.includes('ola')) {
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/30';
        }
        if (cat.includes('shopping')) {
            return 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-900/30';
        }
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/50';
    };

    // Formatted Date (e.g. Month YYYY)
    const getFormattedDate = () => {
        try {
            const [year, monthNum] = month.split('-');
            const date = new Date(parseInt(year), parseInt(monthNum) - 1, day);
            return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch {
            return `Day ${day} (${month})`;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                Day Expenses
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">{getFormattedDate()}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="rounded-full p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto py-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/35 transition-colors pr-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Fetching day details...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-md font-medium text-center">
                            {error}
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                            No transactions recorded on this day.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {expenses.map((expense) => (
                                <div 
                                    key={expense._id} 
                                    className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl hover:bg-muted/60 transition-colors border border-border/50"
                                >
                                    <div className="space-y-1.5">
                                        <p className="text-sm font-semibold text-foreground leading-snug">
                                            {expense.reason}
                                        </p>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${getCategoryBadgeStyles(expense.category)}`}>
                                            {expense.category}
                                        </span>
                                    </div>
                                    <div className="font-mono font-bold text-foreground text-sm">
                                        ₹{expense.amount.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t flex-shrink-0 mt-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                            Daily Total
                        </span>
                        <span className="text-lg font-extrabold text-foreground font-mono">
                            ₹{totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <Button onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    )
}
