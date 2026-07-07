'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { format } from 'date-fns'
import { MonthPicker } from '@/components/ui/month-picker'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Calendar, Filter, Sparkles, Download,
    ArrowLeft, Loader2, ChevronDown, Check, X,
    TrendingUp, TrendingDown, Wallet, PieChart, Clock,
    IndianRupee
} from 'lucide-react'
import Link from 'next/link'
import { useCurrency } from '@/hooks/use-currency'
import { cn, getLocalMonth } from '@/lib/utils'
import { useAccount } from '@/components/account-context'
import { HelpCircle as HelpIcon } from 'lucide-react'

interface Transaction {
    _id: string
    day: number
    amount: number
    reason: string
    category: string
    month: string
    type?: 'expense' | 'income'
}

interface AnalyticsData {
    month: string
    totalExpense: number
    totalIncome?: number
    netSavings?: number
    totalDays: number
    averageDailyExpense: number
    highestExpenseDay: number
    categoryBreakdown: Record<string, number>
    incomeCategoryBreakdown?: Record<string, number>
    insights: string[]
    totalEntries?: number
    weekdayWeekend?: {
        weekdayTotal: number
        weekendTotal: number
        weekdayCount: number
        weekendCount: number
        weekdayAverage: number
        weekendAverage: number
    }
    transactionSizes?: {
        low: number
        medium: number
        high: number
        expense?: { low: number; medium: number; high: number }
        income?: { low: number; medium: number; high: number }
    }
}

// ─── Multi-select category dropdown ──────────────────────────────────────────
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
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between border rounded-md px-3 py-2 bg-background/50 border-border/80 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 capitalize"
            >
                <span className="truncate">{label}</span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground ml-2 flex-shrink-0 transition-transform", open && "rotate-180")} />
            </button>

            {open && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => { onChange([]); setOpen(false) }}
                        className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors",
                            allSelected && "text-teal-600 dark:text-teal-400 font-semibold"
                        )}
                    >
                        <div className={cn("h-4 w-4 rounded border flex items-center justify-center flex-shrink-0", allSelected ? "bg-teal-500 border-teal-500" : "border-border")}>
                            {allSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        All Categories
                    </button>

                    <div className="border-t border-border/40 max-h-48 overflow-y-auto">
                        {categories.map(cat => {
                            const checked = selected.includes(cat)
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => toggle(cat)}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 text-sm capitalize hover:bg-muted/50 transition-colors",
                                        checked && "text-teal-600 dark:text-teal-400"
                                    )}
                                >
                                    <div className={cn("h-4 w-4 rounded border flex items-center justify-center flex-shrink-0", checked ? "bg-teal-500 border-teal-500" : "border-border")}>
                                        {checked && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                    {cat}
                                </button>
                            )
                        })}
                    </div>

                    {selected.length > 0 && (
                        <div className="border-t border-border/40 p-2">
                            <button
                                type="button"
                                onClick={() => onChange([])}
                                className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 justify-center py-1"
                            >
                                <X className="h-3 w-3" /> Clear selection
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── PDF Page Components ──────────────────────────────────────────────────────

function PDFWatermark() {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0">
            <img src="/Logo_BG_Rmv.png" alt="" className="w-[450px] h-[450px] object-contain select-none" />
        </div>
    )
}

function PDFGradientBar() {
    return (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 z-10" />
    )
}

function PDFPageFooter({ page, total }: { page: number; total: number }) {
    return (
        <div className="z-10 border-t-2 border-teal-100 pt-3 flex justify-between items-center text-[9px] text-zinc-400 font-mono">
            <div className="flex items-center gap-4">
                <span className="font-bold text-teal-600">◆</span>
                <span>CONFIDENTIAL · GENERATED BY EXPENSETRACKER</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="h-px w-6 bg-teal-200" />
                <span className="font-bold text-teal-700">{String(page).padStart(2, '0')}</span>
                <span className="text-zinc-300">/</span>
                <span className="text-zinc-400">{String(total).padStart(2, '0')}</span>
            </div>
        </div>
    )
}

// ─── Main Export Page ─────────────────────────────────────────────────────────
export default function ExportPage() {
    const { format: formatCurrency } = useCurrency()
    const { selectedAccount } = useAccount()

    const formatTxDate = (monthStr: string, dayNum: number) => {
        try {
            const [y, m] = monthStr.split('-').map(Number)
            return format(new Date(y, m - 1, dayNum), 'dd MMM yyyy')
        } catch {
            return `${monthStr}-${String(dayNum).padStart(2, '0')}`
        }
    }

    const nowMonth = getLocalMonth()
    const [startMonth, setStartMonth] = useState(nowMonth)
    const [endMonth, setEndMonth] = useState(nowMonth)

    const [categories, setCategories] = useState<string[]>([])
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])

    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [error, setError] = useState('')

    const reportRef = useRef<HTMLDivElement>(null)

    const loadData = async () => {
        try {
            setLoading(true)
            setError('')

            const monthParam = startMonth === endMonth ? startMonth : `${startMonth}:${endMonth}`

            const catRes = await api.get(`/categories/active?month=${monthParam}`)
            setCategories(catRes.data || [])

            const params = new URLSearchParams({ page: '1', limit: '2000' })

            if (startMonth === endMonth) {
                params.set('month', startMonth)
            } else {
                params.set('startMonth', startMonth)
                params.set('endMonth', endMonth)
            }

            if (selectedCategories.length > 0) {
                params.set('category', selectedCategories.join(','))
            }

            const [expRes, analyticsRes] = await Promise.all([
                api.get(`/expenses?${params}`),
                api.get(`/analytics?month=${monthParam}`)
            ])

            setTransactions(expRes.data.expenses || [])
            setAnalytics(analyticsRes.data)
        } catch (err: any) {
            setError('Failed to fetch report data. Make sure backend and database are running.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [startMonth, endMonth, selectedCategories, selectedAccount?._id])

    const { totalExpense, totalIncome, netSavings, chunkedTransactions } = useMemo(() => {
        const expenses = transactions.filter(t => t.type !== 'income')
        const incomes = transactions.filter(t => t.type === 'income')
        
        const totalExp = expenses.reduce((s, tx) => s + tx.amount, 0)
        const totalInc = incomes.reduce((s, tx) => s + tx.amount, 0)
        const net = totalInc - totalExp

        const chunks: Transaction[][] = []
        for (let i = 0; i < transactions.length; i += 26) {
            chunks.push(transactions.slice(i, i + 26))
        }

        return {
            totalExpense: totalExp,
            totalIncome: totalInc,
            netSavings: net,
            chunkedTransactions: chunks
        }
    }, [transactions])

    const periodLabel = startMonth === endMonth ? startMonth : `${startMonth} → ${endMonth}`
    const categoryLabel = selectedCategories.length === 0 ? 'All Categories' : selectedCategories.join(', ')
    const totalPages = chunkedTransactions.length + 2

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return
        try {
            setExporting(true)
            const { jsPDF } = await import('jspdf')
            const html2canvas = (await import('html2canvas')).default
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pages = reportRef.current.querySelectorAll('.pdf-page')

            for (let i = 0; i < pages.length; i++) {
                const canvas = await html2canvas(pages[i] as HTMLElement, {
                    scale: 2.5,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false
                })
                const imgData = canvas.toDataURL('image/jpeg', 0.98)
                if (i > 0) pdf.addPage()
                pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)
            }

            const bankName = (selectedAccount?.bankName || 'Bank').replace(/\s+/g, '_')
            const accountName = (selectedAccount?.name || 'Account').replace(/\s+/g, '_')
            const monthLabel = startMonth === endMonth ? startMonth : `${startMonth}_to_${endMonth}`
            pdf.save(`${bankName}-${accountName}-${monthLabel}.pdf`)
        } catch (err) {
            console.error('PDF generation error:', err)
            alert('Failed to generate PDF. Please try again.')
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                        Export PDF Statement
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Configure date range &amp; categories, then export a professional financial statement.
                    </p>
                </div>
                <Link href="/dashboard">
                    <Button variant="outline" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>
            </div>

            {/* Filter Config */}
            <div className="relative z-30 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="bg-card/60 backdrop-blur border-border/80">
                    <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-teal-500" /> From Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <MonthPicker
                            value={startMonth}
                            onChange={setStartMonth}
                            placeholder="Select From Month"
                        />
                    </CardContent>
                </Card>

                <Card className="bg-card/60 backdrop-blur border-border/80">
                    <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-teal-500" /> To Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <MonthPicker
                            value={endMonth}
                            onChange={setEndMonth}
                            placeholder="Select To Month"
                        />
                    </CardContent>
                </Card>

                <Card className="relative z-30 bg-card/60 backdrop-blur border-border/80">
                    <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Filter className="h-3.5 w-3.5 text-teal-500" /> Categories
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CategoryMultiSelect
                            categories={categories}
                            selected={selectedCategories}
                            onChange={setSelectedCategories}
                        />
                        {selectedCategories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {selectedCategories.map(cat => (
                                    <span key={cat} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-bold capitalize border border-teal-500/20">
                                        {cat}
                                        <button onClick={() => setSelectedCategories(s => s.filter(c => c !== cat))}>
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-card/60 backdrop-blur border-border/80 flex items-center justify-center p-5">
                    <Button
                        onClick={handleDownloadPDF}
                        disabled={loading || exporting || transactions.length === 0}
                        className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold py-6 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02]"
                    >
                        {exporting ? (
                            <><Loader2 className="h-5 w-5 animate-spin" /> Generating...</>
                        ) : (
                            <><Download className="h-5 w-5" /> Export as PDF</>
                        )}
                    </Button>
                </Card>
            </div>

            {/* Summary row */}
            {!loading && !error && transactions.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground px-1">
                    <span className="font-semibold text-foreground">{transactions.length} transactions</span>
                    <span>·</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{formatCurrency(totalIncome)} income</span>
                    <span>·</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">-{formatCurrency(totalExpense)} expenses</span>
                    <span>·</span>
                    <span className={cn("font-black", netSavings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                        net {netSavings >= 0 ? '+' : ''}{formatCurrency(netSavings)}
                    </span>
                    <span className="ml-auto font-mono">{periodLabel} · {categoryLabel}</span>
                </div>
            )}

            {/* States */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
                    <p className="text-muted-foreground animate-pulse">Assembling financial records...</p>
                </div>
            )}
            {error && (
                <Card className="border-destructive/50 bg-destructive/10 text-destructive p-6 text-center">
                    <h3 className="font-bold text-lg">Failed to Load Statement</h3>
                    <p className="text-sm mt-1">{error}</p>
                </Card>
            )}
            {!loading && !error && transactions.length === 0 && (
                <Card className="p-16 text-center bg-card/40 border-dashed border-2 border-border/80 rounded-2xl max-w-xl mx-auto">
                    <div className="space-y-4">
                        <HelpIcon className="h-12 w-12 text-muted-foreground/60 mx-auto" />
                        <h3 className="text-xl font-bold">No Expenses Available</h3>
                        <p className="text-muted-foreground text-sm">
                            No expenses available for export. Upload a statement or add expenses first.
                        </p>
                    </div>
                </Card>
            )}

            {/* PDF Preview */}
            {!loading && !error && transactions.length > 0 && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-2">
                        <span className="text-sm font-semibold text-muted-foreground">
                            Document Preview ({totalPages} pages)
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">Premium Financial Report</span>
                    </div>

                    <div className="w-full overflow-x-auto py-10 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-800 border border-zinc-700 shadow-2xl select-none">
                        <div className="flex min-w-max justify-start md:justify-center px-4">
                            <div ref={reportRef} className="flex flex-col gap-10 bg-zinc-900 p-2">

                                {/* ── PAGE 1: EXECUTIVE COVER ──────────────────────────── */}
                                <div className="pdf-page relative w-[210mm] h-[297mm] bg-gradient-to-br from-slate-50 via-white to-slate-50 border shadow-2xl p-[18mm] flex flex-col justify-between overflow-hidden select-none flex-shrink-0">
                                    <PDFWatermark />
                                    <PDFGradientBar />

                                    {/* Decorative elements */}
                                    <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-teal-500/5 blur-3xl z-0" />
                                    <div className="absolute bottom-20 left-20 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl z-0" />

                                    {/* Header */}
                                    <div className="z-10">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center shadow-lg">
                                                        <Wallet className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Financial Statement</h1>
                                                        <p className="text-xs text-slate-500 font-mono tracking-wider uppercase">Executive Summary Report</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text">
                                                    ExpenseTracker
                                                </div>
                                                <p className="text-[8px] text-slate-400 font-mono tracking-[0.2em] uppercase">Financial Intelligence</p>
                                            </div>
                                        </div>

                                        {/* Decorative line */}
                                        <div className="mt-4 h-px bg-gradient-to-r from-teal-200 via-slate-200 to-transparent" />
                                    </div>

                                    {/* Account Info */}
                                    <div className="z-10 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-5 shadow-sm">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Statement Period</p>
                                                <p className="font-bold text-slate-800 text-sm mt-1">{periodLabel}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Account</p>
                                                <p className="font-bold text-slate-800 text-sm mt-1 truncate">
                                                    {selectedAccount ? `${selectedAccount.bankName}` : 'Default'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Categories</p>
                                                <p className="font-bold text-slate-800 text-sm mt-1 truncate">{categoryLabel}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Generated</p>
                                                <p className="font-bold text-slate-800 text-sm mt-1">{new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* KPI Grid */}
                                    <div className="z-10 grid grid-cols-2 gap-3">
                                        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-4 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Income</p>
                                            </div>
                                            <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalIncome)}</p>
                                            <p className="text-[8px] text-slate-400 mt-0.5">Earnings in period</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-rose-50 to-white border border-rose-100 rounded-xl p-4 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <TrendingDown className="h-4 w-4 text-rose-500" />
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Spending</p>
                                            </div>
                                            <p className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(totalExpense)}</p>
                                            <p className="text-[8px] text-slate-400 mt-0.5">Expenses in period</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-4 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <Wallet className="h-4 w-4 text-blue-500" />
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Net Cash Flow</p>
                                            </div>
                                            <p className={cn("text-2xl font-bold mt-1", netSavings >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                                {netSavings >= 0 ? '+' : ''}{formatCurrency(netSavings)}
                                            </p>
                                            <p className="text-[8px] text-slate-400 mt-0.5">Income minus spending</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-teal-50 to-white border border-teal-100 rounded-xl p-4 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-teal-500" />
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Daily Average</p>
                                            </div>
                                            <p className="text-2xl font-bold text-teal-700 mt-1">{formatCurrency(analytics?.averageDailyExpense || 0)}</p>
                                            <p className="text-[8px] text-slate-400 mt-0.5">Daily spending intensity</p>
                                        </div>
                                    </div>

                                    {/* Insights */}
                                    <div className="z-10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="h-4 w-4 text-teal-500" />
                                            <h2 className="text-xs font-bold text-slate-700 tracking-wider uppercase">Analyst Insights</h2>
                                        </div>
                                        <div className="space-y-1.5">
                                            {analytics?.insights && analytics.insights.length > 0 ? (
                                                analytics.insights.slice(0, 3).map((insight, idx) => (
                                                    <div key={idx} className="flex items-start gap-2 p-2.5 bg-white/70 border border-slate-100 rounded-lg text-[10px] text-slate-600 leading-relaxed">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                                                        <p className="font-medium">{insight}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-[10px] text-slate-400 italic">No automated insights available for this period.</p>
                                            )}
                                        </div>
                                    </div>

                                    <PDFPageFooter page={1} total={totalPages} />
                                </div>

                                {/* ── PAGE 2: METRICS & CATEGORY BREAKDOWN ─────────────── */}
                                <div className="pdf-page relative w-[210mm] h-[297mm] bg-gradient-to-br from-slate-50 via-white to-slate-50 border shadow-2xl p-[18mm] flex flex-col justify-between overflow-hidden select-none flex-shrink-0">
                                    <PDFWatermark />
                                    <PDFGradientBar />

                                    <div className="z-10 space-y-4">
                                        <div className="flex items-center gap-3 border-b-2 border-teal-100 pb-3">
                                            <PieChart className="h-5 w-5 text-teal-600" />
                                            <div>
                                                <h2 className="text-xl font-bold text-slate-800">Category Breakdown</h2>
                                                <p className="text-[8px] text-slate-400 font-mono uppercase tracking-wider">Distribution Analysis</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Expense breakdown */}
                                            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-4 shadow-sm">
                                                <h3 className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                                                    Spending Distribution
                                                </h3>
                                                {analytics?.categoryBreakdown && Object.keys(analytics.categoryBreakdown).length > 0 ? (
                                                    <div className="space-y-2 mt-2">
                                                        {Object.entries(analytics.categoryBreakdown)
                                                            .sort((a, b) => b[1] - a[1])
                                                            .slice(0, 5)
                                                            .map(([name, amount]) => {
                                                                const pct = (amount / (analytics.totalExpense || 1)) * 100
                                                                return (
                                                                    <div key={name}>
                                                                        <div className="flex justify-between text-[10px]">
                                                                            <span className="font-bold text-slate-700 capitalize truncate max-w-[80px]">{name}</span>
                                                                            <span className="font-bold text-rose-600">{pct.toFixed(0)}%</span>
                                                                        </div>
                                                                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-0.5 overflow-hidden">
                                                                            <div className="bg-gradient-to-r from-rose-400 to-rose-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                                        </div>
                                                                        <p className="text-[9px] font-bold text-slate-600 mt-0.5">{formatCurrency(amount)}</p>
                                                                    </div>
                                                                )
                                                            })}
                                                    </div>
                                                ) : <p className="text-[10px] text-slate-400 italic mt-2">No spending data available.</p>}
                                            </div>

                                            {/* Income breakdown */}
                                            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-4 shadow-sm">
                                                <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    Income Distribution
                                                </h3>
                                                {analytics?.incomeCategoryBreakdown && Object.keys(analytics.incomeCategoryBreakdown).length > 0 ? (
                                                    <div className="space-y-2 mt-2">
                                                        {Object.entries(analytics.incomeCategoryBreakdown)
                                                            .sort((a, b) => b[1] - a[1])
                                                            .slice(0, 5)
                                                            .map(([name, amount]) => {
                                                                const totalInc = Object.values(analytics.incomeCategoryBreakdown!).reduce((s, v) => s + v, 0)
                                                                const pct = (amount / (totalInc || 1)) * 100
                                                                return (
                                                                    <div key={name}>
                                                                        <div className="flex justify-between text-[10px]">
                                                                            <span className="font-bold text-slate-700 capitalize truncate max-w-[80px]">{name}</span>
                                                                            <span className="font-bold text-emerald-600">{pct.toFixed(0)}%</span>
                                                                        </div>
                                                                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-0.5 overflow-hidden">
                                                                            <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                                        </div>
                                                                        <p className="text-[9px] font-bold text-slate-600 mt-0.5">{formatCurrency(amount)}</p>
                                                                    </div>
                                                                )
                                                            })}
                                                    </div>
                                                ) : <p className="text-[10px] text-slate-400 italic mt-2">No income data available.</p>}
                                            </div>
                                        </div>

                                        {/* Weekday vs Weekend & Transaction Sizes */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {analytics?.weekdayWeekend && (
                                                <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-4 shadow-sm">
                                                    <h3 className="text-[10px] font-bold text-teal-600 uppercase tracking-wider flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3" />
                                                        Weekday vs Weekend
                                                    </h3>
                                                    <div className="mt-2 space-y-1.5">
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="text-slate-600">Mon-Fri</span>
                                                            <span className="font-bold text-teal-700">{formatCurrency(analytics.weekdayWeekend.weekdayTotal)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="text-slate-600">Sat-Sun</span>
                                                            <span className="font-bold text-teal-700">{formatCurrency(analytics.weekdayWeekend.weekendTotal)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-100">
                                                            <span>Transactions: {analytics.weekdayWeekend.weekdayCount + analytics.weekdayWeekend.weekendCount}</span>
                                                            <span>Avg: {formatCurrency((analytics.weekdayWeekend.weekdayTotal + analytics.weekdayWeekend.weekendTotal) / (analytics.weekdayWeekend.weekdayCount + analytics.weekdayWeekend.weekendCount || 1))}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {analytics?.transactionSizes && (
                                                <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-4 shadow-sm">
                                                    <h3 className="text-[10px] font-bold text-teal-600 uppercase tracking-wider flex items-center gap-1.5">
                                                        <IndianRupee className="w-4 h-4" />
                                                        Transaction Sizes
                                                    </h3>
                                                    <div className="mt-2 space-y-1.5">
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="text-slate-600">Small (&lt;₹250)</span>
                                                            <span className="font-bold text-teal-700">{analytics.transactionSizes.expense?.low ?? analytics.transactionSizes.low}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="text-slate-600">Medium (₹250-₹1000)</span>
                                                            <span className="font-bold text-teal-700">{analytics.transactionSizes.expense?.medium ?? analytics.transactionSizes.medium}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="text-slate-600">Large (&gt;₹1000)</span>
                                                            <span className="font-bold text-teal-700">{analytics.transactionSizes.expense?.high ?? analytics.transactionSizes.high}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <PDFPageFooter page={2} total={totalPages} />
                                </div>

                                {/* ── PAGES 3+: LEDGER ─────────────────────────────────── */}
                                {chunkedTransactions.map((chunk, pageIndex) => {
                                    const pageIncome = chunk.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
                                    const pageExpense = chunk.filter(t => t.type !== 'income').reduce((s, t) => s + t.amount, 0)
                                    const pageNet = pageIncome - pageExpense

                                    return (
                                        <div
                                            key={pageIndex}
                                            className="pdf-page relative w-[210mm] h-[297mm] bg-gradient-to-br from-slate-50 via-white to-slate-50 border shadow-2xl p-[18mm] flex flex-col justify-between overflow-hidden select-none flex-shrink-0"
                                        >
                                            <PDFWatermark />
                                            <PDFGradientBar />

                                            <div className="z-10">
                                                <div className="flex justify-between items-end border-b-2 border-teal-100 pb-3 mb-4">
                                                    <div>
                                                        <h2 className="text-xl font-bold text-slate-800">Transaction Ledger</h2>
                                                        <p className="text-[8px] text-slate-400 font-mono uppercase tracking-wider">
                                                            {selectedAccount ? `${selectedAccount.bankName} · ${selectedAccount.name}` : 'Line Item Listings'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                                            Page {pageIndex + 1}/{chunkedTransactions.length}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                    <table className="w-full text-left border-collapse text-[10px] table-fixed">
                                                        <colgroup>
                                                            <col className="w-[15%]" />
                                                            <col className="w-[8%]" />
                                                            <col className="w-[15%]" />
                                                            <col className="w-[37%]" />
                                                            <col className="w-[25%]" />
                                                        </colgroup>
                                                        <thead>
                                                            <tr className="bg-gradient-to-r from-teal-700 to-teal-800 text-white">
                                                                <th className="py-2.5 px-3 text-[9px] font-bold uppercase tracking-wider">Date</th>
                                                                <th className="py-2.5 px-3 text-[9px] font-bold uppercase tracking-wider">Type</th>
                                                                <th className="py-2.5 px-3 text-[9px] font-bold uppercase tracking-wider">Category</th>
                                                                <th className="py-2.5 px-3 text-[9px] font-bold uppercase tracking-wider">Description</th>
                                                                <th className="py-2.5 px-3 text-[9px] font-bold uppercase tracking-wider text-right">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {chunk.map((tx, idx) => {
                                                                const isInc = tx.type === 'income'
                                                                return (
                                                                    <tr key={tx._id} className={cn(
                                                                        "hover:bg-slate-50/50 transition-colors",
                                                                        isInc ? "bg-emerald-50/30" : (idx % 2 === 0 ? "bg-white" : "bg-slate-50/30")
                                                                    )}>
                                                                        <td className="py-2 px-3 font-mono text-[9px] text-slate-600 whitespace-nowrap">
                                                                            {formatTxDate(tx.month, tx.day)}
                                                                        </td>
                                                                        <td className="py-2 px-3">
                                                                            <span className={cn(
                                                                                "inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                                                                                isInc ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                                                            )}>
                                                                                {isInc ? 'INC' : 'EXP'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-2 px-3 font-bold text-slate-700 capitalize truncate">{tx.category}</td>
                                                                        <td className="py-2 px-3 text-slate-600 truncate">{tx.reason}</td>
                                                                        <td className={cn(
                                                                            "py-2 px-3 text-right font-bold font-mono text-[10px] whitespace-nowrap",
                                                                            isInc ? "text-emerald-600" : "text-rose-600"
                                                                        )}>
                                                                            {isInc ? '+' : '-'}{formatCurrency(tx.amount)}
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })}
                                                            {/* Subtotal row */}
                                                            <tr className="bg-slate-100 border-t-2 border-slate-300">
                                                                <td colSpan={4} className="py-2 px-3 text-right text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                                                                    Page Subtotal
                                                                </td>
                                                                <td className={cn(
                                                                    "py-2 px-3 text-right font-bold font-mono text-[10px]",
                                                                    pageNet >= 0 ? "text-emerald-600" : "text-rose-600"
                                                                )}>
                                                                    {pageNet >= 0 ? '+' : ''}{formatCurrency(pageNet)}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            <PDFPageFooter page={pageIndex + 3} total={totalPages} />
                                        </div>
                                    )
                                })}

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}