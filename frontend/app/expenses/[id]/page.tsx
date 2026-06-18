'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/services/api'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, DollarSign, Tag, Sparkles, Clock, Loader2, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'

interface Expense {
    _id: string;
    day: number;
    amount: number;
    reason: string;
    category: string;
    month: string;
}

export default function ExpenseDetailPage() {
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
                
                // Fetch the selected expense
                const detailsRes = await api.get(`/expenses/${id}`)
                const currentExpense = detailsRes.data
                setExpense(currentExpense)

                // Fetch similar expenses in same category (limit to 20 across all months)
                const similarRes = await api.get(`/expenses?limit=20&category=${encodeURIComponent(currentExpense.category)}`)
                const matchingList = similarRes.data.expenses || []
                
                // Filter out the current expense
                const filteredList = matchingList.filter((e: any) => e._id !== currentExpense._id)
                setSimilarExpenses(filteredList)
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to load expense details')
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
                    <h3 className="text-xl font-bold text-destructive">Expense Profile Error</h3>
                    <p className="text-muted-foreground mt-2">{error || 'Could not locate record details.'}</p>
                    <Link href="/expenses" className="inline-block mt-4 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                        Return to Expenses list
                    </Link>
                </Card>
            </div>
        )
    }

    // Dynamic metrics computation
    const avgSimilarSpend = similarExpenses.length > 0
        ? similarExpenses.reduce((sum, e) => sum + e.amount, 0) / similarExpenses.length
        : 0

    const isAboveAverage = expense.amount > avgSimilarSpend

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
                        <div className="h-1.5 bg-gradient-to-r from-teal-500 via-teal-600 to-indigo-600" />
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${getCategoryBadgeStyles(expense.category)}`}>
                                        <Tag className="h-3 w-3 mr-1" /> {expense.category}
                                    </span>
                                    <h1 className="text-2xl font-black tracking-tight text-foreground mt-3 leading-tight">
                                        {expense.reason}
                                    </h1>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground font-medium uppercase font-mono">Amount</p>
                                    <p className="text-3xl font-black text-teal-600 dark:text-teal-400 font-mono mt-0.5">
                                        ₹{expense.amount.toFixed(2)}
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
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Date of Expense</p>
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

                    {/* Similar Expenses List */}
                    <Card className="border-border/80 bg-card/60 backdrop-blur shadow-lg">
                        <CardHeader className="pb-3 border-b border-border/40">
                            <CardTitle className="text-lg font-bold text-foreground">
                                Similar Expenses in "{expense.category}"
                            </CardTitle>
                            <CardDescription>Historical transactions of the same category chronologically ordered</CardDescription>
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
                                        {similarExpenses.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground italic">
                                                    No other matching entries logged in this category.
                                                </td>
                                            </tr>
                                        ) : (
                                            similarExpenses.map((exp) => (
                                                <tr key={exp._id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="px-6 py-3.5 font-mono text-xs">
                                                        {exp.month}-{String(exp.day).padStart(2, '0')}
                                                    </td>
                                                    <td className="px-6 py-3.5 font-medium text-foreground">
                                                        <Link href={`/expenses/${exp._id}`} className="hover:underline hover:text-teal-600 transition-colors cursor-pointer">
                                                            {exp.reason}
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-right font-mono font-bold text-foreground">
                                                        ₹{exp.amount.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-3.5 text-center">
                                                        <Link href={`/expenses/${exp._id}`} className="text-muted-foreground hover:text-foreground">
                                                            <ArrowRight className="h-4 w-4" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
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
                            {similarExpenses.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-muted/30 border rounded-lg">
                                        <p className="text-xs text-muted-foreground">Category Average</p>
                                        <p className="text-lg font-extrabold text-foreground font-mono mt-0.5">
                                            ₹{avgSimilarSpend.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-muted/30 border rounded-lg">
                                        <p className="text-xs text-muted-foreground">Variance</p>
                                        {isAboveAverage ? (
                                            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-0.5 flex items-center gap-1.5">
                                                <TrendingUp className="h-4 w-4 text-rose-500" /> +₹{(expense.amount - avgSimilarSpend).toFixed(2)} above category average
                                            </p>
                                        ) : (
                                            <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 mt-0.5 flex items-center gap-1.5">
                                                <TrendingDown className="h-4 w-4 text-teal-500" /> -₹{(avgSimilarSpend - expense.amount).toFixed(2)} below category average
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground italic leading-relaxed">
                                    Additional logs in the "{expense.category}" category are required to calculate comparative deviations.
                                </p>
                            )}

                            <div className="pt-4 border-t text-xs text-muted-foreground leading-relaxed">
                                <p className="font-semibold text-foreground mb-1">About Class Detection:</p>
                                Automatic classification associates descriptions with tags like Lunch, Breakfast, Groceries, etc., matching on text properties.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
