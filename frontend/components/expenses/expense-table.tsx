'use client'

import Link from 'next/link'
import { Trash2, Loader2, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCurrency } from '@/hooks/use-currency'
import { cn } from '@/lib/utils'
import { BottomSelect } from '@/components/ui/bottom-select'

interface Expense {
    _id: string;
    day: number;
    amount: number;
    reason: string;
    category: string;
    month: string;
    type?: 'expense' | 'income';
}

interface ExpenseTableProps {
    expenses: Expense[];
    loading: boolean;
    error: string;
    page: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    onDelete: () => void;
    onEdit: (expense: Expense) => void;
    onDeleteRequest: (expense: Expense) => void;
}

export function ExpenseTable({
    expenses,
    loading,
    error,
    page,
    total,
    limit,
    onPageChange,
    onLimitChange,
    onDelete,
    onEdit,
    onDeleteRequest
}: ExpenseTableProps) {
    const { format } = useCurrency()
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const getCategoryBadgeStyles = (category: string, type?: string) => {
        const cat = category.toLowerCase();
        if (type === 'income') {
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/30';
        }
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
    
    const getCategoryColorClass = (category: string, type?: string) => {
        const cat = category.toLowerCase();
        if (type === 'income') return 'bg-emerald-500';
        if (cat.includes('breakfast')) return 'bg-amber-500';
        if (cat.includes('lunch')) return 'bg-orange-500';
        if (cat.includes('dinner')) return 'bg-indigo-500';
        if (cat.includes('grocery') || cat.includes('blinkit')) return 'bg-teal-500';
        if (cat.includes('food')) return 'bg-rose-500';
        if (cat.includes('drink')) return 'bg-sky-500';
        if (cat.includes('travel') || cat.includes('transport') || cat.includes('auto') || cat.includes('uber') || cat.includes('ola')) return 'bg-emerald-500';
        if (cat.includes('shopping')) return 'bg-purple-500';
        return 'bg-zinc-400 dark:bg-zinc-650';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 border rounded-lg bg-card">
                <div className="flex flex-col items-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading transactions...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64 border rounded-lg bg-card text-destructive">
                <p>{error}</p>
            </div>
        )
    }

    return (
        <div className="border border-border rounded-lg bg-card shadow-sm overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="border-b bg-muted/50 text-muted-foreground font-medium">
                            <th className="px-6 py-3.5 w-20 text-center">Day</th>
                            <th className="px-6 py-3.5">Reason / Description</th>
                            <th className="px-6 py-3.5">Category</th>
                            <th className="px-6 py-3.5 text-right">Amount</th>
                            <th className="px-6 py-3.5 text-center w-28">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                                    No transactions found matching the selected criteria.
                                </td>
                            </tr>
                        ) : (
                            expenses.map((expense) => {
                                const isIncome = expense.type === 'income';
                                return (
                                    <tr key={expense._id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 text-center font-semibold text-foreground">
                                            {expense.day}
                                        </td>
                                        <td className="px-6 py-4 text-foreground font-medium">
                                            <Link 
                                                href={`/expenses/${expense._id}`} 
                                                className="hover:underline hover:text-teal-650 transition-colors cursor-pointer"
                                            >
                                                {expense.reason}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getCategoryBadgeStyles(expense.category, expense.type)}`}>
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className={cn("px-6 py-4 text-right font-mono font-bold", isIncome ? "text-emerald-500" : "text-rose-500")}>
                                            {isIncome ? '+' : '-'}{format(expense.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center space-x-1">
                                                {/* Edit Button */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onEdit(expense)}
                                                    className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                {/* Delete Button */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onDeleteRequest(expense)}
                                                    className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden">
                {expenses.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                        No transactions found matching the selected criteria.
                    </div>
                ) : (
                    <div className="p-4 space-y-3.5">
                        {expenses.map((expense) => {
                            const isIncome = expense.type === 'income';
                            return (
                                <div 
                                    key={expense._id} 
                                    className="relative bg-card border border-border/60 hover:border-border/95 rounded-xl p-4 flex justify-between items-center transition-all duration-200 overflow-hidden shadow-sm hover:shadow"
                                >
                                    {/* Left Side: Details */}
                                    <div className="flex-1 min-w-0 pr-4 space-y-1.5">
                                        <Link 
                                            href={`/expenses/${expense._id}`} 
                                            className="font-bold text-sm text-foreground hover:underline hover:text-teal-650 transition-colors cursor-pointer block truncate"
                                        >
                                            {expense.reason}
                                        </Link>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[10px] font-bold text-muted-foreground font-mono bg-muted/65 px-1.5 py-0.5 rounded">
                                                Day {expense.day}
                                            </span>
                                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold capitalize", getCategoryBadgeStyles(expense.category, expense.type))}>
                                                {expense.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right Side: Amount and Actions */}
                                    <div className="flex flex-col items-end space-y-1 pr-2 z-10">
                                        <span className={cn("font-mono font-bold text-sm", isIncome ? "text-emerald-500" : "text-rose-500")}>
                                            {isIncome ? '+' : '-'}{format(expense.amount)}
                                        </span>
                                        <div className="flex items-center space-x-0.5">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(expense)}
                                                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDeleteRequest(expense)}
                                                className="h-7 w-7 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Category Color Line Indicator at the Right Side */}
                                    <div className={cn("absolute right-0 top-0 bottom-0 w-1.5", getCategoryColorClass(expense.category, expense.type))} />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {total > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-muted/20">
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="text-xs text-muted-foreground">
                            Showing <span className="font-semibold text-foreground">{((page - 1) * limit) + 1}</span> to{' '}
                            <span className="font-semibold text-foreground">
                                {Math.min(page * limit, total)}
                            </span>{' '}
                            of <span className="font-semibold text-foreground">{total}</span> transactions
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-l border-border/40 pl-3">
                            <span>Show</span>
                            <BottomSelect
                                value={limit}
                                onChange={(val) => onLimitChange(Number(val))}
                                options={[
                                    { value: 10, label: '10' },
                                    { value: 20, label: '20' },
                                    { value: 50, label: '50' },
                                    { value: 100, label: '100' },
                                ]}
                                label="Transactions per page"
                                className="w-16"
                                triggerClassName="h-7 py-0 px-2 rounded-lg text-xs"
                            />
                            <span>per page</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(page - 1)}
                            disabled={page === 1}
                            className="h-8 px-3"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground px-2">
                            Page <span className="font-semibold text-foreground">{page}</span> of{' '}
                            <span className="font-semibold text-foreground">{totalPages}</span>
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(page + 1)}
                            disabled={page === totalPages}
                            className="h-8 px-3"
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

        </div>
    )
}
