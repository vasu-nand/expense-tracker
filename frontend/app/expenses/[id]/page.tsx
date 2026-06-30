'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/services/api'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Tag, Sparkles, Clock, Loader2, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'
import { useCurrency } from '@/hooks/use-currency'
import { cn } from '@/lib/utils'

interface Expense {
    _id: string;
    day: number;
    amount: number;
    reason: string;
    category: string;
    month: string;
    type?: 'expense' | 'income';
}

export default function ExpenseDetailPage() {
    const { format } = useCurrency()
    const { id } = useParams()
    const router = useRouter()
    const [expense, setExpense] = useState<Expense | null>(null)
    const [similarExpenses, setSimilarExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!id) return

        const fetchDetails = async () => {
            try {
                setLoading(true)
                setError('')
                
                // Fetch the selected transaction
                const detailsRes = await api.get(`/expenses/${id}`)
                const currentExpense = detailsRes.data
                setExpense(currentExpense)

                // Fetch similar transactions in same category (limit to 20 across all months)
                const similarRes = await api.get(`/expenses?limit=20&category=${encodeURIComponent(currentExpense.category)}`)
                const matchingList = similarRes.data.expenses || []
                
                // Filter out the current transaction
                const filteredList = matchingList.filter((e: any) => e._id !== currentExpense._id)
                setSimilarExpenses(filteredList)
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to load transaction details')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchDetails()
    }, [id])

    const getCategoryBadgeStyles = (category: string) => {
        const cat = category.toLowerCase()
        if (cat.includes('breakfast')) return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200'
        if (cat.includes('lunch')) return 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200'
        if (cat.includes('dinner')) return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200'
        if (cat.includes('grocery') || cat.includes('blinkit')) return 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200'
        if (cat.includes('food')) return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200'
        if (cat.includes('drink')) return 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200'
        if (cat.includes('travel') || cat.includes('transport') || cat.includes('auto') || cat.includes('uber')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200'
        if (cat.includes('shopping')) return 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200'
        if (cat.includes('salary') || cat.includes('freelance') || cat.includes('investment') || cat.includes('gift')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200'
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200'
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
                <p className="text-muted-foreground animate-pulse font-medium">Loading transaction profile...</p>
            </div>
        )
    }

    if (error || !expense) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Card className="border-destructive/40 bg-destructive/5 text-center p-8">
                    <h3 className="text-xl font-bold text-destructive">Transaction Profile Error</h3>
                    <p className="text-muted-foreground mt-2">{error || 'Could not locate record details.'}</p>
                    <Link href="/expenses" className="inline-block mt-4 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                        Return to Transactions list
                    </Link>
                </Card>
            </div>
        )
    }

    const isIncome = expense.type === 'income'

    // Dynamic metrics computation — only compare same-type transactions
    const sametype = similarExpenses.filter(e => (e.type || 'expense') === (expense.type || 'expense'))
    const avgSimilarSpend = sametype.length > 0
        ? sametype.reduce((sum, e) => sum + e.amount, 0) / sametype.length
        : 0

    // For income: being ABOVE average is good (more earnings). For expenses: being ABOVE average is a warning.
    const diff = expense.amount - avgSimilarSpend
    const isAboveAverage = diff > 0
    const isPositiveVariance = isIncome ? isAboveAverage : !isAboveAverage

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <span className="text-xs text-muted-foreground font-mono">Transaction ID: {expense._id}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main details card */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="overflow-hidden border-border/80 bg-card/60 backdrop-blur shadow-lg">
                        {/* Type-aware accent stripe */}
                        <div className={cn("h-1.5", isIncome ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-custom-btn-gradient")} />
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${getCategoryBadgeStyles(expense.category)}`}>
                                            <Tag className="h-3 w-3 mr-1" /> {expense.category}
                                        </span>
                                        {/* Income / Expense badge */}
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                            isIncome
                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                        )}>
                                            {isIncome ? '↑ Income' : '↓ Expense'}
                                        </span>
                                    </div>
                                    <h1 className="text-2xl font-black tracking-tight text-foreground mt-3 leading-tight">
                                        {expense.reason}
                                    </h1>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-xs text-muted-foreground font-medium uppercase font-mono">Amount</p>
                                    <p className={cn(
                                        "text-3xl font-black font-mono mt-0.5",
                                        isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                    )}>
                                        {isIncome ? '+' : '-'}{format(expense.amount)}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        
                        <CardContent className="border-t border-border/40 pt-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Transaction Date</p>
                                        <p className="text-sm font-semibold text-foreground mt-0.5">
                                            Day {expense.day} of {expense.month}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Statement Month</p>
                                        <p className="text-sm font-semibold text-foreground mt-0.5">
                                            {expense.month}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Class Detection</p>
                                        <p className="text-sm font-semibold text-foreground mt-0.5">
                                            Automated Rule
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Similar Transactions List */}
                    <Card className="border-border/80 bg-card/60 backdrop-blur shadow-lg">
                        <CardHeader className="pb-3 border-b border-border/40">
                            <CardTitle className="text-lg font-bold text-foreground">
                                Similar {isIncome ? 'Income' : 'Expenses'} in &quot;{expense.category}&quot;
                            </CardTitle>
                            <CardDescription>Historical {isIncome ? 'income' : 'expense'} transactions of the same category chronologically ordered</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-muted/30 border-b text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Description</th>
                                            <th className="px-6 py-3 text-right">Amount</th>
                                            <th className="px-6 py-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {sametype.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground italic">
                                                    No other matching entries logged in this category.
                                                </td>
                                            </tr>
                                        ) : (
                                            sametype.map((exp) => {
                                                const expIsIncome = exp.type === 'income'
                                                return (
                                                    <tr key={exp._id} className="hover:bg-muted/20 transition-colors">
                                                        <td className="px-6 py-3.5 font-mono text-xs">
                                                            {exp.month}-{String(exp.day).padStart(2, '0')}
                                                        </td>
                                                        <td className="px-6 py-3.5 font-medium text-foreground">
                                                            <Link href={`/expenses/${exp._id}`} className="hover:underline hover:text-teal-600 transition-colors cursor-pointer">
                                                                {exp.reason}
                                                            </Link>
                                                        </td>
                                                        <td className={cn(
                                                            "px-6 py-3.5 text-right font-mono font-bold",
                                                            expIsIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                                        )}>
                                                            {expIsIncome ? '+' : '-'}{format(exp.amount)}
                                                        </td>
                                                        <td className="px-6 py-3.5 text-center">
                                                            <Link href={`/expenses/${exp._id}`} className="text-muted-foreground hover:text-foreground">
                                                                <ArrowRight className="h-4 w-4" />
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Insight Panel */}
                <div className="space-y-6">
                    <Card className="border-border/80 bg-card/60 backdrop-blur shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-base font-bold text-foreground flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4 text-purple-500" /> Transaction Intelligence
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            {sametype.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-muted/30 border rounded-lg">
                                        <p className="text-xs text-muted-foreground">Category Average ({isIncome ? 'Income' : 'Expense'})</p>
                                        <p className="text-lg font-extrabold text-foreground font-mono mt-0.5">
                                            {format(avgSimilarSpend)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-muted/30 border rounded-lg">
                                        <p className="text-xs text-muted-foreground">Variance</p>
                                        {isPositiveVariance ? (
                                            <p className={cn("text-sm font-semibold mt-0.5 flex items-center gap-1.5", isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-teal-600 dark:text-teal-400")}>
                                                <TrendingDown className="h-4 w-4" />
                                                {isIncome
                                                    ? `+${format(Math.abs(diff))} above category average`
                                                    : `-${format(Math.abs(diff))} below category average`
                                                }
                                            </p>
                                        ) : (
                                            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-0.5 flex items-center gap-1.5">
                                                <TrendingUp className="h-4 w-4 text-rose-500" />
                                                {isIncome
                                                    ? `-${format(Math.abs(diff))} below category average`
                                                    : `+${format(Math.abs(diff))} above category average`
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground italic leading-relaxed">
                                    Additional logs in the &quot;{expense.category}&quot; category are required to calculate comparative deviations.
                                </p>
                            )}

                            <div className="pt-4 border-t text-xs text-muted-foreground leading-relaxed">
                                <p className="font-semibold text-foreground mb-1">About Class Detection:</p>
                                Automatic classification associates descriptions with tags like Salary, Freelance, Groceries, etc., matching on text keywords.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
