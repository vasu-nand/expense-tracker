'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Calendar, Filter, Sparkles, Download, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Transaction {
    _id: string
    day: number
    amount: number
    reason: string
    category: string
    month: string
}

interface AnalyticsData {
    month: string
    totalExpense: number
    totalDays: number
    averageDailyExpense: number
    highestExpenseDay: number
    categoryBreakdown: Record<string, number>
    insights: string[]
    totalEntries?: number
    weekdayWeekend?: {
        weekdayTotal: number;
        weekendTotal: number;
        weekdayCount: number;
        weekendCount: number;
        weekdayAverage: number;
        weekendAverage: number;
    }
    weeklySpend?: Array<{ name: string; amount: number }>
    transactionSizes?: { low: number; medium: number; high: number }
}

export default function ExportPage() {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [categories, setCategories] = useState<string[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [error, setError] = useState('')
    
    const reportRef = useRef<HTMLDivElement>(null)

    // Load data based on filters
    const loadData = async () => {
        try {
            setLoading(true)
            setError('')
            
            // Get category list first (for the filter dropdown)
            const categoriesRes = await api.get(`/categories?month=${month}`)
            setCategories(categoriesRes.data)
            
            // Fetch all matching expenses (limit: 1000 to get full log)
            const params = new URLSearchParams({
                page: '1',
                limit: '1000',
                month: month,
                ...(selectedCategory !== 'all' && { category: selectedCategory })
            })
            
            const [expensesRes, analyticsRes] = await Promise.all([
                api.get(`/expenses?${params}`),
                api.get(`/analytics?month=${month}`)
            ])
            
            setTransactions(expensesRes.data.expenses)
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
    }, [month, selectedCategory])

    // Partition transactions for PDF pages (max 15 rows per page for spacing)
    const TRANSACTIONS_PER_PAGE = 15
    const chunkedTransactions = []
    if (transactions && transactions.length > 0) {
        for (let i = 0; i < transactions.length; i += TRANSACTIONS_PER_PAGE) {
            chunkedTransactions.push(transactions.slice(i, i + TRANSACTIONS_PER_PAGE))
        }
    }

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return
        
        try {
            setExporting(true)
            
            // Import libraries dynamically to prevent Next.js SSR crashes
            const { jsPDF } = await import('jspdf')
            const html2canvas = (await import('html2canvas')).default
            
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pages = reportRef.current.querySelectorAll('.pdf-page')
            
            for (let index = 0; index < pages.length; index++) {
                const pageEl = pages[index] as HTMLElement
                
                // Render element to canvas
                const canvas = await html2canvas(pageEl, {
                    scale: 2, // Retains high resolution
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false
                })
                
                const imgData = canvas.toDataURL('image/jpeg', 0.95)
                const imgWidth = 210 // A4 width in mm
                const imgHeight = 297 // A4 height in mm
                
                if (index > 0) {
                    pdf.addPage()
                }
                
                pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight)
            }
            
            pdf.save(`Expense_Report_${month}_${selectedCategory}.pdf`)
        } catch (err) {
            console.error('PDF generation error:', err)
            alert('Failed to generate PDF. Please try again.')
        } finally {
            setExporting(false)
        }
    }

    const formatCurrency = (val: number) => {
        return `₹${(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Export PDF Report
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Configure filters and export dynamic expense statements with security watermarks.</p>
                </div>
                <Link href="/dashboard">
                    <Button variant="outline" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>
            </div>

            {/* Filter Configuration Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card/60 backdrop-blur border-border/80">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-teal-500" /> Statement Period
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="border rounded-md px-3 py-2 bg-background/50 border-border/80 text-foreground w-full focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                    </CardContent>
                </Card>

                <Card className="bg-card/60 backdrop-blur border-border/80">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Filter className="h-4 w-4 text-teal-500" /> Category Filter
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="border rounded-md px-3 py-2 bg-background/50 border-border/80 text-foreground w-full capitalize focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        >
                            <option value="all">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </CardContent>
                </Card>

                <Card className="bg-card/60 backdrop-blur border-border/80 flex items-center justify-center p-6">
                    <Button
                        onClick={handleDownloadPDF}
                        disabled={loading || exporting || transactions.length === 0}
                        className="w-full bg-gradient-to-r from-teal-500 to-teal-700 hover:from-teal-600 hover:to-teal-800 text-white font-bold py-6 shadow-md transition-all duration-300 hover:shadow-teal-500/20 flex items-center justify-center gap-2"
                    >
                        {exporting ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Generating Report...
                            </>
                        ) : (
                            <>
                                <Download className="h-5 w-5" />
                                Export as PDF Statement
                            </>
                        )}
                    </Button>
                </Card>
            </div>

            {/* Content Status Handling */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
                    <p className="text-muted-foreground animate-pulse">Assembling expense transactions and insights...</p>
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
                    <h3 className="text-xl font-bold">No Records Available</h3>
                    <p className="text-muted-foreground mt-2">No expenses matched your selected filters for {month}. Try choosing a different period or category.</p>
                </Card>
            )}

            {/* PDF Render Preview Container (Formatted for A4 dimensions) */}
            {!loading && !error && transactions.length > 0 && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-2">
                        <div>
                            <span className="text-sm font-semibold text-muted-foreground">Document Print Preview ({chunkedTransactions.length + 2} pages)</span>
                            <p className="text-[10px] text-teal-600 dark:text-teal-400 md:hidden animate-pulse mt-0.5 font-medium">
                                Swipe horizontally to preview full page layout
                            </p>
                        </div>
                        <span className="text-xs text-zinc-400 font-mono">Watermark (Logo_BG_Rmv.png) is active</span>
                    </div>

                    <div className="w-full overflow-x-auto py-10 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-inner select-none">
                        <div className="flex min-w-max justify-start md:justify-center px-4">
                            {/* Printable Area Wrapper */}
                            <div ref={reportRef} className="flex flex-col gap-10 bg-zinc-900 text-zinc-950 p-2">
                                
                                {/* PAGE 1: EXECUTIVE COVER PAGE */}
                                <div className="pdf-page relative w-[210mm] h-[297mm] bg-white border shadow-2xl p-[20mm] flex flex-col justify-between overflow-hidden select-none flex-shrink-0">
                                    {/* WATERMARK LOGO */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.18] z-0">
                                        <img src="/Logo_BG_Rmv.png" alt="Watermark" className="w-[380px] h-[380px] object-contain select-none" />
                                    </div>

                                    {/* Header */}
                                    <div className="z-10 border-b-2 border-teal-600 pb-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <h1 className="text-3xl font-extrabold text-teal-800 tracking-tight">EXPENSE STATEMENT</h1>
                                                <p className="text-xs text-zinc-500 font-mono tracking-wider mt-1 uppercase">EXECUTIVE SUMMARY REPORT</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-lg text-teal-900">ExpenseTracker</span>
                                                <p className="text-[10px] text-zinc-400 font-mono">FINANCIAL INTELLIGENCE</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metadata Grid */}
                                    <div className="z-10 grid grid-cols-2 gap-6 my-6 text-sm bg-teal-50/50 border border-teal-100 rounded-lg p-4 font-sans">
                                        <div>
                                            <p className="text-zinc-500 font-semibold text-xs uppercase">Statement Period</p>
                                            <p className="font-bold text-teal-900 text-base">{month}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500 font-semibold text-xs uppercase">Category Filter</p>
                                            <p className="font-bold text-teal-900 text-base capitalize">{selectedCategory}</p>
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

                                    {/* Core KPI Summary Card Grid */}
                                    <div className="z-10 grid grid-cols-2 gap-4 my-4">
                                        <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50">
                                            <p className="text-xs text-zinc-500 font-semibold uppercase">Total Spending</p>
                                            <p className="text-2xl font-black text-teal-800 mt-1">
                                                {formatCurrency(transactions.reduce((sum, tx) => sum + tx.amount, 0))}
                                            </p>
                                            <p className="text-[10px] text-zinc-400 mt-1">Sum of filtered expenses</p>
                                        </div>
                                        <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50">
                                            <p className="text-xs text-zinc-500 font-semibold uppercase">Daily Average</p>
                                            <p className="text-2xl font-black text-teal-800 mt-1">
                                                {formatCurrency(analytics?.averageDailyExpense || 0)}
                                            </p>
                                            <p className="text-[10px] text-zinc-400 mt-1">Active daily spend rate</p>
                                        </div>
                                        <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50">
                                            <p className="text-xs text-zinc-500 font-semibold uppercase">Peak Spending Day</p>
                                            <p className="text-2xl font-black text-teal-800 mt-1">
                                                Day {analytics?.highestExpenseDay || 0}
                                            </p>
                                            <p className="text-[10px] text-zinc-400 mt-1">Highest cumulative total</p>
                                        </div>
                                        <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50">
                                            <p className="text-xs text-zinc-500 font-semibold uppercase">Total Transactions</p>
                                            <p className="text-2xl font-black text-teal-800 mt-1">
                                                {transactions.length}
                                            </p>
                                            <p className="text-[10px] text-zinc-400 mt-1">Total transactions in this report</p>
                                        </div>
                                    </div>

                                    {/* Automated Smart Insights */}
                                    <div className="z-10 flex-grow mt-4">
                                        <h2 className="text-sm font-bold text-teal-900 border-b border-zinc-200 pb-1 flex items-center gap-1">
                                            <Sparkles className="h-4 w-4 text-teal-600" /> SMART INSIGHTS OBSERVED
                                        </h2>
                                        <div className="mt-3 space-y-2.5">
                                            {analytics?.insights && analytics.insights.length > 0 ? (
                                                analytics.insights.slice(0, 4).map((insight, idx) => (
                                                    <div key={idx} className="flex gap-2 p-2.5 bg-zinc-50/70 border border-zinc-100 rounded-md text-xs leading-relaxed text-zinc-700">
                                                        <span className="text-teal-600 font-bold">•</span>
                                                        <p>{insight}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-zinc-400 italic">No automated insights computed for this month.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer info */}
                                    <div className="z-10 border-t border-zinc-200 pt-4 flex justify-between text-[9px] text-zinc-400 font-mono">
                                        <span>CONFIDENTIAL - FOR PERSONAL USE ONLY</span>
                                        <span>Page 1 of {chunkedTransactions.length + 2}</span>
                                    </div>
                                </div>

                                {/* PAGE 2: METRICS & CATEGORY BREAKDOWN */}
                                <div className="pdf-page relative w-[210mm] h-[297mm] bg-white border shadow-2xl p-[20mm] flex flex-col justify-between overflow-hidden select-none flex-shrink-0">
                                    {/* WATERMARK LOGO */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.18] z-0">
                                        <img src="/Logo_BG_Rmv.png" alt="Watermark" className="w-[380px] h-[380px] object-contain select-none" />
                                    </div>

                                    <div className="z-10">
                                        {/* Page Header */}
                                        <div className="border-b border-zinc-200 pb-3 mb-6">
                                            <h2 className="text-xl font-bold text-teal-800">CATEGORY BREAKDOWN & PROFILE</h2>
                                            <p className="text-[10px] text-zinc-400 font-mono uppercase">FINANCIAL STATEMENTS PROFILE</p>
                                        </div>

                                        {/* Category list distribution */}
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-bold text-teal-900 border-b border-zinc-200 pb-1 mb-2">CATEGORY DISTRIBUTION</h3>
                                            {analytics?.categoryBreakdown && Object.keys(analytics.categoryBreakdown).length > 0 ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    {Object.entries(analytics.categoryBreakdown)
                                                        .sort((a, b) => b[1] - a[1])
                                                        .map(([catName, amount], index) => {
                                                            const pct = (amount / (analytics.totalExpense || 1)) * 100
                                                            return (
                                                                <div key={catName} className="border border-zinc-200 rounded p-2.5 bg-zinc-50/50">
                                                                    <div className="flex justify-between items-center text-xs">
                                                                        <span className="font-bold text-zinc-800 capitalize">{index + 1}. {catName}</span>
                                                                        <span className="font-semibold text-teal-700">{pct.toFixed(1)}%</span>
                                                                    </div>
                                                                    <p className="text-xs font-black text-zinc-900 mt-1">{formatCurrency(amount)}</p>
                                                                    <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                                                        <div className="bg-teal-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-zinc-400 italic">No category data compiled.</p>
                                            )}
                                        </div>

                                        {/* Weekday Weekend comparison */}
                                        {analytics?.weekdayWeekend && (
                                            <div className="mt-8 space-y-3">
                                                <h3 className="text-xs font-bold text-teal-900 border-b border-zinc-200 pb-1 mb-2">WEEKDAY VS. WEEKEND SPLIT</h3>
                                                <div className="grid grid-cols-2 gap-6 bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                                                    <div>
                                                        <span className="text-[10px] font-semibold text-zinc-400 uppercase font-mono">Workday Purchases (Mon-Fri)</span>
                                                        <p className="text-lg font-black text-teal-900 mt-0.5">{formatCurrency(analytics.weekdayWeekend.weekdayTotal)}</p>
                                                        <p className="text-[10px] text-zinc-500 mt-1">{analytics.weekdayWeekend.weekdayCount} transactions (avg {formatCurrency(analytics.weekdayWeekend.weekdayAverage)}/tx)</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-semibold text-zinc-400 uppercase font-mono">Weekend Spending (Sat-Sun)</span>
                                                        <p className="text-lg font-black text-teal-900 mt-0.5">{formatCurrency(analytics.weekdayWeekend.weekendTotal)}</p>
                                                        <p className="text-[10px] text-zinc-500 mt-1">{analytics.weekdayWeekend.weekendCount} transactions (avg {formatCurrency(analytics.weekdayWeekend.weekendAverage)}/tx)</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Sizes */}
                                        {analytics?.transactionSizes && (
                                            <div className="mt-8 space-y-3">
                                                <h3 className="text-xs font-bold text-teal-900 border-b border-zinc-200 pb-1 mb-2">TRANSACTION SIZE ANALYSIS</h3>
                                                <div className="space-y-2 bg-zinc-50 border border-zinc-200 rounded-lg p-4 text-xs">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-zinc-600 font-medium">Micro / Small Purchases (&lt; ₹250):</span>
                                                        <span className="font-bold text-teal-800">{analytics.transactionSizes.low} Transactions</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-zinc-600 font-medium">Medium Transactions (₹250 - ₹1000):</span>
                                                        <span className="font-bold text-teal-800">{analytics.transactionSizes.medium} Transactions</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-zinc-600 font-medium">Large Ticket Purchases (&gt; ₹1000):</span>
                                                        <span className="font-bold text-teal-800">{analytics.transactionSizes.high} Transactions</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer info */}
                                    <div className="z-10 border-t border-zinc-200 pt-4 flex justify-between text-[9px] text-zinc-400 font-mono font-bold">
                                        <span>STATISTICS ANALYSIS REPORT</span>
                                        <span>Page 2 of {chunkedTransactions.length + 2}</span>
                                    </div>
                                </div>

                                {/* PAGES 3+: TRANSACTION LISTINGS */}
                                {chunkedTransactions.map((chunk, pageIndex) => (
                                    <div 
                                        key={pageIndex} 
                                        className="pdf-page relative w-[210mm] h-[297mm] bg-white border shadow-2xl p-[20mm] flex flex-col justify-between overflow-hidden select-none flex-shrink-0"
                                    >
                                        {/* WATERMARK LOGO */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.18] z-0">
                                            <img src="/Logo_BG_Rmv.png" alt="Watermark" className="w-[380px] h-[380px] object-contain select-none" />
                                        </div>

                                        <div className="z-10">
                                            {/* Page Header */}
                                            <div className="border-b border-zinc-200 pb-3 mb-6">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <h2 className="text-xl font-bold text-teal-800">TRANSACTION LEDGER</h2>
                                                        <p className="text-[10px] text-zinc-400 font-mono uppercase">LINE ITEM PURCHASE LISTINGS</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-zinc-500 font-mono">PART {pageIndex + 1} OF {chunkedTransactions.length}</span>
                                                </div>
                                            </div>

                                            {/* Table */}
                                            <div className="border border-zinc-300 rounded-lg overflow-hidden">
                                                <table className="w-full text-left border-collapse text-xs">
                                                    <thead>
                                                        <tr className="bg-teal-700 text-white font-bold uppercase text-[10px]">
                                                            <th className="py-2.5 px-3 border-b border-zinc-300">Date</th>
                                                            <th className="py-2.5 px-3 border-b border-zinc-300">Category</th>
                                                            <th className="py-2.5 px-3 border-b border-zinc-300">Description</th>
                                                            <th className="py-2.5 px-3 border-b border-zinc-300 text-right">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-200 text-zinc-700">
                                                        {chunk.map((tx) => (
                                                            <tr key={tx._id} className="hover:bg-zinc-50/50">
                                                                <td className="py-2 px-3 border-b font-mono">{tx.month}-{String(tx.day).padStart(2, '0')}</td>
                                                                <td className="py-2 px-3 border-b capitalize font-semibold text-teal-800">{tx.category}</td>
                                                                <td className="py-2 px-3 border-b max-w-[200px] truncate">{tx.reason}</td>
                                                                <td className="py-2 px-3 border-b text-right font-bold font-mono">{formatCurrency(tx.amount)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Footer info */}
                                        <div className="z-10 border-t border-zinc-200 pt-4 flex justify-between text-[9px] text-zinc-400 font-mono">
                                            <span>RECORD LISTINGS STATEMENTS</span>
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
