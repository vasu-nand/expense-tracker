'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    FileText, Calendar, Filter, Sparkles, Download,
    ArrowLeft, Loader2, ChevronDown, Check, X
} from 'lucide-react'
import Link from 'next/link'
import { useCurrency } from '@/hooks/use-currency'
import { cn } from '@/lib/utils'

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
                    {/* "All" option */}
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

                    {/* Clear selected */}
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

// ─── Main Export Page ─────────────────────────────────────────────────────────
export default function ExportPage() {
    const { format: formatCurrency } = useCurrency()

    // Date range — default: current month, start to end
    const nowMonth = new Date().toISOString().slice(0, 7)
    const [startMonth, setStartMonth] = useState(nowMonth)
    const [endMonth, setEndMonth] = useState(nowMonth)

    // Category multi-select
    const [categories, setCategories] = useState<string[]>([])
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])

    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [error, setError] = useState('')

    const reportRef = useRef<HTMLDivElement>(null)

    // ── Load data ──────────────────────────────────────────────────────────────
    const loadData = async () => {
        try {
            setLoading(true)
            setError('')

            // Fetch all unique categories (pull from a broad query)
            const catRes = await api.get(`/categories/active?month=${startMonth}`)
            setCategories(catRes.data || [])

            // Build params
            const params = new URLSearchParams({ page: '1', limit: '2000' })

            if (startMonth === endMonth) {
                // Single month — use simple ?month= param for analytics compat
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
                // Analytics is always for the start month (single-month summary)
                api.get(`/analytics?month=${startMonth}`)
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
    }, [startMonth, endMonth, selectedCategories])

    // ── Derived totals ─────────────────────────────────────────────────────────
    const totalExpense = transactions.filter(t => t.type !== 'income').reduce((s, tx) => s + tx.amount, 0)
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, tx) => s + tx.amount, 0)
    const netSavings = totalIncome - totalExpense

    // Period label for display
    const periodLabel = startMonth === endMonth ? startMonth : `${startMonth} → ${endMonth}`
    // Category label
    const categoryLabel = selectedCategories.length === 0 ? 'All Categories' : selectedCategories.join(', ')

    // Chunk transactions for PDF pages (15 rows each)
    const TRANSACTIONS_PER_PAGE = 15
    const chunkedTransactions: Transaction[][] = []
    for (let i = 0; i < transactions.length; i += TRANSACTIONS_PER_PAGE) {
        chunkedTransactions.push(transactions.slice(i, i + TRANSACTIONS_PER_PAGE))
    }

    // ── PDF Export ─────────────────────────────────────────────────────────────
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
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false
                })
                const imgData = canvas.toDataURL('image/jpeg', 0.95)
                if (i > 0) pdf.addPage()
                pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)
            }

            const safePeriod = periodLabel.replace(' → ', '_to_')
            const safeCats = selectedCategories.length === 0 ? 'all' : selectedCategories.slice(0, 3).join('-')
            pdf.save(`Statement_${safePeriod}_${safeCats}.pdf`)
        } catch (err) {
            console.error('PDF generation error:', err)
            alert('Failed to generate PDF. Please try again.')
        } finally {
            setExporting(false)
        }
    }

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
                <div>
                    <h1 className="text-3xl font-bold text-custom-gradient flex items-center gap-2">
                        <FileText className="h-7 w-7 text-primary shrink-0" /> Export PDF Statement
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Configure date range &amp; categories, then export a watermarked financial statement.
                    </p>
                </div>
                <Link href="/dashboard">
                    <Button variant="outline" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>
            </div>

            {/* ── Filter Config ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Start Month */}
                <Card className="bg-card/60 backdrop-blur border-border/80">
                    <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-teal-500" /> From Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <input
                            type="month"
                            value={startMonth}
                            max={endMonth}
                            onChange={e => setStartMonth(e.target.value)}
                            className="border rounded-md px-3 py-2 bg-background/50 border-border/80 text-foreground w-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </CardContent>
                </Card>

                {/* End Month */}
                <Card className="bg-card/60 backdrop-blur border-border/80">
                    <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-teal-500" /> To Month
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <input
                            type="month"
                            value={endMonth}
                            min={startMonth}
                            onChange={e => setEndMonth(e.target.value)}
                            className="border rounded-md px-3 py-2 bg-background/50 border-border/80 text-foreground w-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </CardContent>
                </Card>

                {/* Multi-select Category */}
                <Card className="bg-card/60 backdrop-blur border-border/80">
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

                {/* Export Button */}
                <Card className="bg-card/60 backdrop-blur border-border/80 flex items-center justify-center p-5">
                    <Button
                        onClick={handleDownloadPDF}
                        disabled={loading || exporting || transactions.length === 0}
                        className="w-full bg-custom-btn-gradient text-white font-bold py-6 shadow-md transition-all duration-300 flex items-center justify-center gap-2 hover:opacity-90"
                    >
                        {exporting ? (
                            <><Loader2 className="h-5 w-5 animate-spin" /> Generating...</>
                        ) : (
                            <><Download className="h-5 w-5" /> Export as PDF</>
                        )}
                    </Button>
                </Card>
            </div>

            {/* Summary row for selected filters */}
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
                <Card className="p-12 text-center bg-card/40 border-dashed border-2">
                    <h3 className="text-xl font-bold">No Records Found</h3>
                    <p className="text-muted-foreground mt-2">
                        No transactions matched your filters for {periodLabel}. Try adjusting the date range or category selection.
                    </p>
                </Card>
            )}

            {/* ── PDF Preview ───────────────────────────────────────────────── */}
            {!loading && !error && transactions.length > 0 && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-2">
                        <span className="text-sm font-semibold text-muted-foreground">
                            Document Preview ({chunkedTransactions.length + 2} pages)
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">Watermark (Logo_BG_Rmv.png) active</span>
                    </div>

                    <div className="w-full overflow-x-auto py-10 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-inner select-none">
                        <div className="flex min-w-max justify-start md:justify-center px-4">
                            <div ref={reportRef} className="flex flex-col gap-10 bg-zinc-900 text-zinc-950 p-2">

                                {/* ── PAGE 1: EXECUTIVE COVER ──────────────────────────── */}
                                <div className="pdf-page relative w-[210mm] h-[297mm] bg-white border shadow-2xl p-[20mm] flex flex-col justify-between overflow-hidden select-none flex-shrink-0">
                                    {/* Watermark */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.18] z-0">
                                        <img src="/Logo_BG_Rmv.png" alt="Watermark" className="w-[380px] h-[380px] object-contain select-none" />
                                    </div>

                                    {/* Header */}
                                    <div className="z-10 border-b-2 border-teal-600 pb-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <h1 className="text-3xl font-extrabold text-teal-800 tracking-tight">FINANCIAL STATEMENT</h1>
                                                <p className="text-xs text-zinc-500 font-mono tracking-wider mt-1 uppercase">Executive Summary Report</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-lg text-teal-900">ExpenseTracker</span>
                                                <p className="text-[10px] text-zinc-400 font-mono">FINANCIAL INTELLIGENCE</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metadata */}
                                    <div className="z-10 grid grid-cols-2 gap-5 my-5 text-sm bg-teal-50/50 border border-teal-100 rounded-lg p-4 font-sans">
                                        <div>
                                            <p className="text-zinc-500 font-semibold text-xs uppercase">Statement Period</p>
                                            <p className="font-bold text-teal-900 text-base">{periodLabel}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 font-semibold text-xs uppercase">Category Filter</p>
                                            <p className="font-bold text-teal-900 text-base capitalize truncate max-w-[200px]">{categoryLabel}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 font-semibold text-xs uppercase">Generated On</p>
                                            <p className="font-medium text-zinc-700">{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 font-semibold text-xs uppercase">Total Records</p>
                                            <p className="font-bold text-teal-900">{transactions.length} Transactions</p>
                                        </div>
                                    </div>

                                    {/* KPI Grid */}
                                    <div className="z-10 grid grid-cols-2 gap-3 my-2">
                                        <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50">
                                            <p className="text-[10px] text-zinc-500 font-semibold uppercase">Total Income</p>
                                            <p className="text-xl font-black text-emerald-600 mt-0.5">{formatCurrency(totalIncome)}</p>
                                            <p className="text-[9px] text-zinc-400">Sum of earnings in period</p>
                                        </div>
                                        <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50">
                                            <p className="text-[10px] text-zinc-500 font-semibold uppercase">Total Spending</p>
                                            <p className="text-xl font-black text-rose-600 mt-0.5">{formatCurrency(totalExpense)}</p>
                                            <p className="text-[9px] text-zinc-400">Sum of expenses in period</p>
                                        </div>
                                        <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50">
                                            <p className="text-[10px] text-zinc-500 font-semibold uppercase">Net Cash Flow</p>
                                            <p className={cn("text-xl font-black mt-0.5", netSavings >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                                {netSavings >= 0 ? '+' : ''}{formatCurrency(netSavings)}
                                            </p>
                                            <p className="text-[9px] text-zinc-400">Income minus spending</p>
                                        </div>
                                        <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50">
                                            <p className="text-[10px] text-zinc-500 font-semibold uppercase">Daily Spend Avg</p>
                                            <p className="text-xl font-black text-teal-800 mt-0.5">{formatCurrency(analytics?.averageDailyExpense || 0)}</p>
                                            <p className="text-[9px] text-zinc-400">Daily spending intensity</p>
                                        </div>
                                    </div>

                                    {/* Insights */}
                                    <div className="z-10 flex-grow mt-3">
                                        <h2 className="text-sm font-bold text-teal-900 border-b border-zinc-200 pb-1 flex items-center gap-1">
                                            <Sparkles className="h-4 w-4 text-teal-600" /> SMART INSIGHTS
                                        </h2>
                                        <div className="mt-2 space-y-2">
                                            {analytics?.insights && analytics.insights.length > 0 ? (
                                                analytics.insights.slice(0, 4).map((insight, idx) => (
                                                    <div key={idx} className="flex gap-2 p-2.5 bg-zinc-50/70 border border-zinc-100 rounded-md text-xs text-zinc-700 leading-relaxed">
                                                        <span className="text-teal-600 font-bold flex-shrink-0">•</span>
                                                        <p>{insight}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-zinc-400 italic">No automated insights for this period.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="z-10 border-t border-zinc-200 pt-3 flex justify-between text-[9px] text-zinc-400 font-mono">
                                        <span>CONFIDENTIAL – FOR PERSONAL USE ONLY</span>
                                        <span>Page 1 of {chunkedTransactions.length + 2}</span>
                                    </div>
                                </div>

                                {/* ── PAGE 2: METRICS & CATEGORY BREAKDOWN ─────────────── */}
                                <div className="pdf-page relative w-[210mm] h-[297mm] bg-white border shadow-2xl p-[20mm] flex flex-col justify-between overflow-hidden select-none flex-shrink-0">
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.18] z-0">
                                        <img src="/Logo_BG_Rmv.png" alt="Watermark" className="w-[380px] h-[380px] object-contain select-none" />
                                    </div>

                                    <div className="z-10">
                                        <div className="border-b border-zinc-200 pb-3 mb-5">
                                            <h2 className="text-xl font-bold text-teal-800">CATEGORY BREAKDOWN &amp; PROFILE</h2>
                                            <p className="text-[10px] text-zinc-400 font-mono uppercase">Financial Statements Profile</p>
                                        </div>

                                        {/* Spending + Income category columns */}
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold text-teal-900 border-b border-zinc-200 pb-1">CATEGORY DISTRIBUTION</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Expense breakdown */}
                                                <div>
                                                    <h4 className="text-[10px] font-bold text-rose-600 mb-2 uppercase">Spending Distribution</h4>
                                                    {analytics?.categoryBreakdown && Object.keys(analytics.categoryBreakdown).length > 0 ? (
                                                        <div className="space-y-2">
                                                            {Object.entries(analytics.categoryBreakdown)
                                                                .sort((a, b) => b[1] - a[1])
                                                                .slice(0, 5)
                                                                .map(([name, amount]) => {
                                                                    const pct = (amount / (analytics.totalExpense || 1)) * 100
                                                                    return (
                                                                        <div key={name} className="border border-zinc-200 rounded p-2 bg-zinc-50/50 text-[11px]">
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="font-bold text-zinc-800 capitalize truncate max-w-[100px]">{name}</span>
                                                                                <span className="font-semibold text-rose-600">{pct.toFixed(0)}%</span>
                                                                            </div>
                                                                            <p className="font-black text-zinc-900 mt-0.5">{formatCurrency(amount)}</p>
                                                                            <div className="w-full bg-zinc-200 h-1 rounded-full mt-1.5 overflow-hidden">
                                                                                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                        </div>
                                                    ) : <p className="text-xs text-zinc-400 italic">No spending data.</p>}
                                                </div>

                                                {/* Income breakdown */}
                                                <div>
                                                    <h4 className="text-[10px] font-bold text-emerald-600 mb-2 uppercase">Income Distribution</h4>
                                                    {analytics?.incomeCategoryBreakdown && Object.keys(analytics.incomeCategoryBreakdown).length > 0 ? (
                                                        <div className="space-y-2">
                                                            {Object.entries(analytics.incomeCategoryBreakdown)
                                                                .sort((a, b) => b[1] - a[1])
                                                                .slice(0, 5)
                                                                .map(([name, amount]) => {
                                                                    const totalInc = Object.values(analytics.incomeCategoryBreakdown!).reduce((s, v) => s + v, 0)
                                                                    const pct = (amount / (totalInc || 1)) * 100
                                                                    return (
                                                                        <div key={name} className="border border-zinc-200 rounded p-2 bg-zinc-50/50 text-[11px]">
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="font-bold text-zinc-800 capitalize truncate max-w-[100px]">{name}</span>
                                                                                <span className="font-semibold text-emerald-600">{pct.toFixed(0)}%</span>
                                                                            </div>
                                                                            <p className="font-black text-zinc-900 mt-0.5">{formatCurrency(amount)}</p>
                                                                            <div className="w-full bg-zinc-200 h-1 rounded-full mt-1.5 overflow-hidden">
                                                                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                        </div>
                                                    ) : <p className="text-xs text-zinc-400 italic">No income source data.</p>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Weekday vs Weekend */}
                                        {analytics?.weekdayWeekend && (
                                            <div className="mt-5 space-y-2">
                                                <h3 className="text-xs font-bold text-teal-900 border-b border-zinc-200 pb-1">WEEKDAY VS. WEEKEND SPLIT</h3>
                                                <div className="grid grid-cols-2 gap-4 bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs">
                                                    <div>
                                                        <span className="text-[9px] font-semibold text-zinc-400 uppercase font-mono">Workday Expenses (Mon-Fri)</span>
                                                        <p className="text-base font-black text-teal-900 mt-0.5">{formatCurrency(analytics.weekdayWeekend.weekdayTotal)}</p>
                                                        <p className="text-[9px] text-zinc-500">{analytics.weekdayWeekend.weekdayCount} txs · avg {formatCurrency(analytics.weekdayWeekend.weekdayAverage)}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] font-semibold text-zinc-400 uppercase font-mono">Weekend Spending (Sat-Sun)</span>
                                                        <p className="text-base font-black text-teal-900 mt-0.5">{formatCurrency(analytics.weekdayWeekend.weekendTotal)}</p>
                                                        <p className="text-[9px] text-zinc-500">{analytics.weekdayWeekend.weekendCount} txs · avg {formatCurrency(analytics.weekdayWeekend.weekendAverage)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Transaction sizes */}
                                        {analytics?.transactionSizes && (
                                            <div className="mt-5 space-y-2">
                                                <h3 className="text-xs font-bold text-teal-900 border-b border-zinc-200 pb-1">TRANSACTION SIZE ANALYSIS</h3>
                                                <div className="space-y-1.5 bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs">
                                                    <div className="flex justify-between">
                                                        <span>Micro / Small (&lt; ₹250)</span>
                                                        <span className="font-bold text-teal-800">
                                                            {analytics.transactionSizes.expense?.low ?? analytics.transactionSizes.low} Expenses
                                                            {analytics.transactionSizes.income != null && ` | ${analytics.transactionSizes.income.low} Incomes`}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Medium (₹250 – ₹1000)</span>
                                                        <span className="font-bold text-teal-800">
                                                            {analytics.transactionSizes.expense?.medium ?? analytics.transactionSizes.medium} Expenses
                                                            {analytics.transactionSizes.income != null && ` | ${analytics.transactionSizes.income.medium} Incomes`}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Large (&gt; ₹1000)</span>
                                                        <span className="font-bold text-teal-800">
                                                            {analytics.transactionSizes.expense?.high ?? analytics.transactionSizes.high} Expenses
                                                            {analytics.transactionSizes.income != null && ` | ${analytics.transactionSizes.income.high} Incomes`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="z-10 border-t border-zinc-200 pt-3 flex justify-between text-[9px] text-zinc-400 font-mono font-bold">
                                        <span>STATISTICS ANALYSIS REPORT</span>
                                        <span>Page 2 of {chunkedTransactions.length + 2}</span>
                                    </div>
                                </div>

                                {/* ── PAGES 3+: LEDGER ─────────────────────────────────── */}
                                {chunkedTransactions.map((chunk, pageIndex) => (
                                    <div
                                        key={pageIndex}
                                        className="pdf-page relative w-[210mm] h-[297mm] bg-white border shadow-2xl p-[20mm] flex flex-col justify-between overflow-hidden select-none flex-shrink-0"
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.18] z-0">
                                            <img src="/Logo_BG_Rmv.png" alt="Watermark" className="w-[380px] h-[380px] object-contain select-none" />
                                        </div>

                                        <div className="z-10">
                                            <div className="border-b border-zinc-200 pb-3 mb-5">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <h2 className="text-xl font-bold text-teal-800">TRANSACTION LEDGER</h2>
                                                        <p className="text-[10px] text-zinc-400 font-mono uppercase">Line Item Account Listings</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-zinc-500 font-mono">PART {pageIndex + 1} OF {chunkedTransactions.length}</span>
                                                </div>
                                            </div>

                                            <div className="border border-zinc-300 rounded-lg overflow-hidden">
                                                <table className="w-full text-left border-collapse text-xs">
                                                    <thead>
                                                        <tr className="bg-teal-700 text-white font-bold uppercase text-[10px]">
                                                            <th className="py-2.5 px-3 border-b border-zinc-300">Date</th>
                                                            <th className="py-2.5 px-3 border-b border-zinc-300">Type</th>
                                                            <th className="py-2.5 px-3 border-b border-zinc-300">Category</th>
                                                            <th className="py-2.5 px-3 border-b border-zinc-300">Description</th>
                                                            <th className="py-2.5 px-3 border-b border-zinc-300 text-right">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-200 text-zinc-700">
                                                        {chunk.map(tx => {
                                                            const isInc = tx.type === 'income'
                                                            return (
                                                                <tr key={tx._id} className={cn(isInc ? "bg-emerald-50/40" : "")}>
                                                                    <td className="py-1.5 px-3 font-mono">{tx.month}-{String(tx.day).padStart(2, '0')}</td>
                                                                    <td className="py-1.5 px-3">
                                                                        <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-black uppercase", isInc ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                                                                            {isInc ? 'INC' : 'EXP'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-1.5 px-3 capitalize font-semibold text-teal-800">{tx.category}</td>
                                                                    <td className="py-1.5 px-3 max-w-[140px] truncate">{tx.reason}</td>
                                                                    <td className={cn("py-1.5 px-3 text-right font-bold font-mono", isInc ? "text-emerald-600" : "text-rose-600")}>
                                                                        {isInc ? '+' : '-'}{formatCurrency(tx.amount)}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div className="z-10 border-t border-zinc-200 pt-3 flex justify-between text-[9px] text-zinc-400 font-mono">
                                            <span>RECORD LISTINGS STATEMENT</span>
                                            <span>Page {pageIndex + 3} of {chunkedTransactions.length + 2}</span>
                                        </div>
                                    </div>
                                ))}

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
