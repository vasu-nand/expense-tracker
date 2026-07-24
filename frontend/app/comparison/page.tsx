'use client'

import { useState, useEffect, useMemo } from 'react'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCurrency } from '@/hooks/use-currency'
import { 
    GitCompare, 
    Calendar, 
    ArrowUpRight, 
    ArrowDownRight, 
    Filter, 
    Loader2, 
    HelpCircle, 
    TrendingUp, 
    TrendingDown, 
    Percent, 
    DollarSign,
    Award,
    Activity,
    Grid,
    Flame,
    ArrowLeft,
    Coins,
    Eye,
    X
} from 'lucide-react'
import Link from 'next/link'
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell 
} from 'recharts'
import { getLocalMonth, cn } from '@/lib/utils'
import { MonthPicker } from '@/components/ui/month-picker'
import { DynamicIcon } from '@/components/navigation'

type FilterType = 'current-month' | 'last-month' | 'current-year' | 'all-time' | 'custom'

interface AccountComparisonStat {
    accountId: string
    name: string
    bankName: string
    accountNumber: string
    color: string
    icon: string
    isPrimary: boolean
    createdAt: string
    totalExpenses: number
    transactionCount: number
    averageTransaction: number
    largestExpense: { amount: number; reason: string; category: string } | null
    categoriesUsed: number
    averageMonthlySpend: number
    highestMonth: { month: string; amount: number } | null
    dailyTotals: Record<string, number>
    growthPercentage: number
    lastUpload: string
}

interface BiggestTransaction {
    id: string
    amount: number
    reason: string
    category: string
    month: string
    day: string
    accountName: string
    bankName: string
    accountColor: string
}

export default function ComparisonPage() {
    const { format, convert, symbol } = useCurrency()
    const [filterType, setFilterType] = useState<FilterType>('all-time')
    const [startMonth, setStartMonth] = useState(getLocalMonth())
    const [endMonth, setEndMonth] = useState(getLocalMonth())
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [fullscreenChart, setFullscreenChart] = useState<'total' | 'trend' | 'category' | 'intensity' | null>(null)
    const [heatmapMonth, setHeatmapMonth] = useState(getLocalMonth())
    
    // API Data
    const [comparisonData, setComparisonData] = useState<{
        accounts: AccountComparisonStat[];
        leaderboard: AccountComparisonStat[];
        biggestTransactions: BiggestTransaction[];
    } | null>(null)

    const [monthlyTrends, setMonthlyTrends] = useState<any[]>([])
    const [categoryChartData, setCategoryChartData] = useState<any[]>([])
    const [topCategories, setTopCategories] = useState<any[]>([])

    const overviewStats = useMemo(() => {
        if (!comparisonData || comparisonData.accounts.length === 0) return null;
        
        const totalCombinedSpend = comparisonData.accounts.reduce((sum, acc) => sum + acc.totalExpenses, 0);
        const totalTxCount = comparisonData.accounts.reduce((sum, acc) => sum + acc.transactionCount, 0);
        const combinedAvgMonthlySpend = comparisonData.accounts.reduce((sum, acc) => sum + acc.averageMonthlySpend, 0);
        
        let highestSpender = comparisonData.accounts[0];
        for (const acc of comparisonData.accounts) {
            if (acc.totalExpenses > highestSpender.totalExpenses) {
                highestSpender = acc;
            }
        }
        
        return {
            totalCombinedSpend,
            totalTxCount,
            combinedAvgMonthlySpend,
            highestSpender
        };
    }, [comparisonData]);

    const calendarMonth = heatmapMonth

    const firstDayWeekday = useMemo(() => {
        try {
            const [year, monthNum] = calendarMonth.split('-').map(Number);
            return new Date(year, monthNum - 1, 1).getDay();
        } catch {
            return 0;
        }
    }, [calendarMonth]);

    const daysCount = useMemo(() => {
        try {
            const [year, monthNum] = calendarMonth.split('-').map(Number);
            return new Date(year, monthNum, 0).getDate();
        } catch {
            return 31;
        }
    }, [calendarMonth]);

    const calendarMonthName = useMemo(() => {
        try {
            const [year, monthNum] = calendarMonth.split('-').map(Number);
            const date = new Date(year, monthNum - 1, 1);
            return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } catch {
            return calendarMonth;
        }
    }, [calendarMonth]);


    const fetchComparisonData = async () => {
        try {
            setLoading(true)
            setError('')
            
            const params = new URLSearchParams({
                filterType,
                ...(filterType === 'custom' && { startMonth, endMonth }),
                heatmapMonth
            })

            const [generalRes, monthlyRes, categoryRes] = await Promise.all([
                api.get(`/comparison?${params}`),
                api.get(`/comparison/monthly?${params}`),
                api.get(`/comparison/categories?${params}`)
            ])

            setComparisonData(generalRes.data)
            setMonthlyTrends(monthlyRes.data)
            setCategoryChartData(categoryRes.data.chartData)
            setTopCategories(categoryRes.data.topCategories)
        } catch (err: any) {
            console.error('Failed to load comparison data:', err)
            setError('Failed to fetch account comparison data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchComparisonData()
    }, [filterType, startMonth, endMonth, heatmapMonth])

    // Leaderboard sorted by total expenses (already sorted on backend, but memoized for safety)
    const sortedLeaderboard = useMemo(() => {
        if (!comparisonData) return []
        return [...comparisonData.accounts].sort((a, b) => b.totalExpenses - a.totalExpenses)
    }, [comparisonData])

    // Average Daily Spend comparisons
    const avgDailyData = useMemo(() => {
        if (!comparisonData) return []
        return comparisonData.accounts.map(acc => {
            const daysWithData = Object.keys(acc.dailyTotals).length || 1
            const avgDaily = acc.totalExpenses / daysWithData
            return {
                name: acc.name,
                "Avg Daily Spend": convert(avgDaily),
                color: acc.color
            }
        })
    }, [comparisonData, convert])

    // Cumulative Total Spend comparison
    const cumulativeTotalData = useMemo(() => {
        if (!comparisonData) return []
        return comparisonData.accounts.map(acc => ({
            name: acc.name,
            "Total Spending": convert(acc.totalExpenses),
            color: acc.color
        }))
    }, [comparisonData, convert])

    // Monthly trends converted to current currency
    const convertedMonthlyTrends = useMemo(() => {
        return monthlyTrends.map(row => {
            const newRow: any = { name: row.name }
            Object.keys(row).forEach(k => {
                if (k !== 'name') {
                    newRow[k] = convert(row[k])
                }
            })
            return newRow
        })
    }, [monthlyTrends, convert])

    // Category chart data converted to current currency
    const convertedCategoryData = useMemo(() => {
        return categoryChartData.map(row => {
            const newRow: any = { category: row.category }
            Object.keys(row).forEach(k => {
                if (k !== 'category') {
                    newRow[k] = convert(row[k])
                }
            })
            return newRow
        })
    }, [categoryChartData, convert])

    if (loading && !comparisonData) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
                <p className="text-muted-foreground animate-pulse text-sm">Aggregating comparison metrics across accounts...</p>
            </div>
        )
    }

    if (error) {
        return (
            <Card className="border border-destructive/40 bg-destructive/10 text-destructive p-8 text-center max-w-xl mx-auto my-20">
                <h3 className="text-xl font-bold">Failed to Load Comparisons</h3>
                <p className="text-sm mt-2">{error}</p>
                <Button onClick={fetchComparisonData} className="mt-4 bg-destructive text-white hover:bg-destructive/90">
                    Retry
                </Button>
            </Card>
        )
    }

    const hasAccounts = comparisonData && comparisonData.accounts.length > 0

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/40">
                <div>
                    <h1 className="text-3xl font-extrabold text-custom-gradient">
                        Bank Account Comparisons
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Analyze and compare spending behaviors, trends, and statistics across your isolated workspaces.
                    </p>
                </div>
                
                {/* Custom Filters Wrapper */}
                <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    {/* Predefined Range Selectors */}
                    <div className="flex flex-wrap bg-muted/80 backdrop-blur-sm rounded-xl p-1 text-xs font-semibold border border-border/40 gap-1 w-full md:w-auto">
                        {[
                            { type: 'all-time', label: 'All Time' },
                            { type: 'current-month', label: 'This Month' },
                            { type: 'last-month', label: 'Last Month' },
                            { type: 'current-year', label: 'This Year' },
                            { type: 'custom', label: 'Custom Range' }
                        ].map((btn) => (
                            <button
                                key={btn.type}
                                onClick={() => setFilterType(btn.type as FilterType)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg transition-all text-xs font-bold flex-1 sm:flex-initial text-center whitespace-nowrap",
                                    filterType === btn.type
                                        ? 'bg-custom-btn-gradient text-white shadow-sm font-extrabold'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                                )}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    {/* Custom Month Inputs */}
                    {filterType === 'custom' && (
                        <div className="w-full md:w-auto flex items-center justify-center md:justify-start gap-2.5 text-xs animate-in slide-in-from-left-2 duration-300">
                            <MonthPicker
                                value={startMonth}
                                onChange={setStartMonth}
                                placeholder="From"
                            />
                            <span className="text-zinc-500 font-black uppercase text-[10px] shrink-0">to</span>
                            <MonthPicker
                                value={endMonth}
                                onChange={setEndMonth}
                                placeholder="To"
                            />
                        </div>
                    )}
                </div>
            </div>

            {!hasAccounts ? (
                <Card className="p-16 text-center border-dashed border-2 bg-card/20 border-border/80">
                    <HelpCircle className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
                    <h3 className="text-xl font-bold">No Accounts Found</h3>
                    <p className="text-muted-foreground mt-2">
                        You need at least one bank account to begin comparisons. Add an account from the settings or navigation menu.
                    </p>
                </Card>
            ) : (
                <div className="space-y-8">
                    
                    {/* Combined Metrics Overview Banner */}
                    {overviewStats && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                            <Card className="border border-border/80 bg-card/40 backdrop-blur-md shadow-md hover:shadow-lg transition-all duration-300">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Combined Total Spend</p>
                                        <h3 className="text-xl font-black text-rose-500 font-mono">
                                            {format(overviewStats.totalCombinedSpend)}
                                        </h3>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                                        <Coins className="h-5 w-5" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border border-border/80 bg-card/40 backdrop-blur-md shadow-md hover:shadow-lg transition-all duration-300">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Combined Monthly Avg</p>
                                        <h3 className="text-xl font-black text-teal-500 font-mono">
                                            {format(overviewStats.combinedAvgMonthlySpend)}
                                        </h3>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">
                                        <Activity className="h-5 w-5" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border border-border/80 bg-card/40 backdrop-blur-md shadow-md hover:shadow-lg transition-all duration-300">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Combined Transactions</p>
                                        <h3 className="text-xl font-black text-indigo-500 font-mono">
                                            {overviewStats.totalTxCount} entries
                                        </h3>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                        <GitCompare className="h-5 w-5" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border border-border/80 bg-card/40 backdrop-blur-md shadow-md hover:shadow-lg transition-all duration-300">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="space-y-1 truncate pr-1">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Top Spender Account</p>
                                        <h3 className="text-sm font-extrabold text-foreground truncate flex items-center gap-1.5 mt-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: overviewStats.highestSpender.color }} />
                                            {overviewStats.highestSpender.name}
                                        </h3>
                                    </div>
                                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                        <Award className="h-5 w-5" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    
                    {/* 1. Account Summary Workspace Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {comparisonData.accounts.map((acc) => (
                            <Card 
                                key={acc.accountId}
                                className="border border-border/80 bg-card/40 backdrop-blur-md shadow hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                            >
                                <div className="h-1.5 w-full absolute top-0 left-0 right-0" style={{ backgroundColor: acc.color }} />
                                
                                <CardHeader className="pb-2 pt-5">
                                    <div className="flex items-center space-x-2">
                                        <div 
                                            className="h-7 w-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                                            style={{ backgroundColor: acc.color }}
                                        >
                                            <DynamicIcon name={acc.icon} className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-sm text-foreground truncate">{acc.name}</h3>
                                            <p className="text-[10px] text-muted-foreground truncate">{acc.bankName} • {acc.accountNumber}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                
                                <CardContent className="p-4 pt-2 space-y-2.5 text-xs">
                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                        <div className="p-2 bg-background/50 border border-border/10 rounded-lg">
                                            <span className="text-muted-foreground font-semibold block uppercase">Total Spend</span>
                                            <span className="font-bold text-rose-500 font-mono text-xs">{format(acc.totalExpenses)}</span>
                                        </div>
                                        <div className="p-2 bg-background/50 border border-border/10 rounded-lg">
                                            <span className="text-muted-foreground font-semibold block uppercase">Avg Monthly Spend</span>
                                            <span className="font-bold text-teal-500 font-mono text-xs">{format(acc.averageMonthlySpend)}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                        <div className="p-2 bg-background/50 border border-border/10 rounded-lg">
                                            <span className="text-muted-foreground font-semibold block uppercase">Avg Tx Size</span>
                                            <span className="font-bold text-foreground font-mono text-xs">{format(acc.averageTransaction)}</span>
                                        </div>
                                        <div className="p-2 bg-background/50 border border-border/10 rounded-lg">
                                            <span className="text-muted-foreground font-semibold block uppercase">Categories Used</span>
                                            <span className="font-bold text-foreground font-mono text-xs">{acc.categoriesUsed} categories</span>
                                        </div>
                                    </div>

                                    {/* Month/Growth details */}
                                    <div className="bg-background/30 p-2.5 rounded-lg border border-border/10 space-y-1 text-[10px]">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Highest Month:</span>
                                            <span className="font-semibold text-foreground font-mono">
                                                {acc.highestMonth ? `${acc.highestMonth.month} (${format(acc.highestMonth.amount)})` : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Largest Expense:</span>
                                            <span className="font-semibold text-foreground font-mono truncate max-w-[140px]" title={acc.largestExpense?.reason}>
                                                {acc.largestExpense ? `${format(acc.largestExpense.amount)} (${acc.largestExpense.reason})` : 'N/A'}
                                            </span>
                                        </div>
                                        {filterType === 'current-month' && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">MoM Growth:</span>
                                                <span className={cn(
                                                    "font-bold flex items-center gap-0.5",
                                                    acc.growthPercentage > 0 ? "text-rose-500" : acc.growthPercentage < 0 ? "text-emerald-500" : "text-muted-foreground"
                                                )}>
                                                    {acc.growthPercentage > 0 ? <TrendingUp className="h-3 w-3" /> : acc.growthPercentage < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                                                    {acc.growthPercentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    {/* 2. Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* 2.1 Total Spending Comparison */}
                        <Card className="border border-border/80 bg-card/40 backdrop-blur-md shadow-md transition-shadow hover:shadow-lg">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-sm font-extrabold text-custom-gradient flex items-center gap-1.5 uppercase tracking-wider">
                                        <Award className="h-4 w-4 text-primary" /> Total Spending Comparison
                                    </CardTitle>
                                    <CardDescription className="text-[11px]">Cumulative total spend per bank account workspace</CardDescription>
                                </div>
                                <button
                                    onClick={() => setFullscreenChart('total')}
                                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors shrink-0"
                                    title="View Fullscreen"
                                >
                                    <Eye className="h-4 w-4" />
                                </button>
                            </CardHeader>
                            <CardContent className="h-[300px] pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={cumulativeTotalData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                        <defs>
                                            {comparisonData.accounts.map(acc => (
                                                <linearGradient key={`grad-tot-${acc.accountId}`} id={`grad-tot-${acc.accountId}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={acc.color} stopOpacity={0.95}/>
                                                    <stop offset="100%" stopColor={acc.color} stopOpacity={0.3}/>
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${symbol}${v}`} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const rowData = payload[0].payload;
                                                    return (
                                                        <div className="bg-zinc-950/95 dark:bg-zinc-900/95 text-white p-3 rounded-xl border border-border/20 shadow-xl text-xs font-mono">
                                                            <div className="flex items-center space-x-1.5 font-bold mb-1">
                                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rowData.color }} />
                                                                <span>{rowData.name}</span>
                                                            </div>
                                                            <p className="text-[10px] text-zinc-400">Total Spending:</p>
                                                            <p className="text-sm font-black text-rose-400">{symbol}{Number(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="Total Spending" fill="#0d9488" radius={[6, 6, 0, 0]} barSize={32}>
                                            {cumulativeTotalData.map((entry, index) => {
                                                const acc = comparisonData.accounts.find(a => a.name === entry.name);
                                                return (
                                                    <Cell key={`cell-${index}`} fill={`url(#grad-tot-${acc?.accountId || index})`} className="hover:opacity-85 transition-opacity" />
                                                );
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
 
                        {/* 2.2 Monthly Trend Comparison */}
                        <Card className="border border-border/80 bg-card/40 backdrop-blur-md shadow-md transition-shadow hover:shadow-lg">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-sm font-extrabold text-custom-gradient flex items-center gap-1.5 uppercase tracking-wider">
                                        <TrendingUp className="h-4 w-4 text-primary" /> Monthly Trend Comparison
                                    </CardTitle>
                                    <CardDescription className="text-[11px]">Month-over-month trend comparison lines</CardDescription>
                                </div>
                                <button
                                    onClick={() => setFullscreenChart('trend')}
                                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors shrink-0"
                                    title="View Fullscreen"
                                >
                                    <Eye className="h-4 w-4" />
                                </button>
                            </CardHeader>
                            <CardContent className="h-[300px] pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={convertedMonthlyTrends} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${symbol}${v}`} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-zinc-950/95 dark:bg-zinc-900/95 text-white p-3 rounded-xl border border-border/20 shadow-xl text-xs font-mono space-y-1.5 min-w-[140px]">
                                                            <p className="font-black text-zinc-300 border-b border-border/10 pb-1 mb-1">{label}</p>
                                                            {[...payload]
                                                                .sort((a, b) => Number(b.value) - Number(a.value))
                                                                .map((p) => {
                                                                    const acc = comparisonData.accounts.find(a => a.name === p.name);
                                                                    return (
                                                                        <div key={p.name} className="flex justify-between items-center space-x-4">
                                                                            <div className="flex items-center space-x-1.5">
                                                                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: acc?.color || p.color }} />
                                                                                <span className="text-[10px] text-zinc-400 font-bold truncate max-w-[80px]">{p.name}</span>
                                                                            </div>
                                                                            <span className="font-extrabold text-zinc-100">{symbol}{Number(p.value).toFixed(0)}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: '10px' }} />
                                        {comparisonData.accounts.map((acc) => (
                                            <Line 
                                                key={acc.accountId} 
                                                type="monotone" 
                                                dataKey={acc.name} 
                                                stroke={acc.color} 
                                                strokeWidth={3}
                                                dot={{ fill: acc.color, r: 3 }}
                                                activeDot={{ r: 5.5, strokeWidth: 0, fill: acc.color }} 
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
 
                        {/* 2.3 Category Comparison Stacked */}
                        <Card className="border border-border/80 bg-card/40 backdrop-blur-md shadow-md transition-shadow hover:shadow-lg">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-sm font-extrabold text-custom-gradient flex items-center gap-1.5 uppercase tracking-wider">
                                        <Percent className="h-4 w-4 text-primary" /> Stacked Category Spend
                                    </CardTitle>
                                    <CardDescription className="text-[11px]">Contribution per bank account workspace per category</CardDescription>
                                </div>
                                <button
                                    onClick={() => setFullscreenChart('category')}
                                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors shrink-0"
                                    title="View Fullscreen"
                                >
                                    <Eye className="h-4 w-4" />
                                </button>
                            </CardHeader>
                            <CardContent className="h-[300px] pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={convertedCategoryData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                        <defs>
                                            {comparisonData.accounts.map(acc => (
                                                <linearGradient key={`grad-cat-${acc.accountId}`} id={`grad-cat-${acc.accountId}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={acc.color} stopOpacity={0.95}/>
                                                    <stop offset="100%" stopColor={acc.color} stopOpacity={0.3}/>
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                                        <XAxis dataKey="category" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${symbol}${v}`} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    const total = payload.reduce((sum, p) => sum + Number(p.value), 0);
                                                    return (
                                                        <div className="bg-zinc-950/95 dark:bg-zinc-900/95 text-white p-3 rounded-xl border border-border/20 shadow-xl text-xs font-mono space-y-1.5 min-w-[150px]">
                                                            <p className="font-black text-zinc-300 border-b border-border/10 pb-1 mb-1 capitalize">{label}</p>
                                                            {[...payload]
                                                                .sort((a, b) => Number(b.value) - Number(a.value))
                                                                .map((p) => {
                                                                    const acc = comparisonData.accounts.find(a => a.name === p.name);
                                                                    const percent = total > 0 ? (Number(p.value) / total) * 100 : 0;
                                                                    return (
                                                                        <div key={p.name} className="flex justify-between items-center space-x-4">
                                                                            <div className="flex items-center space-x-1.5">
                                                                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: acc?.color || p.color }} />
                                                                                <span className="text-[10px] text-zinc-400 font-bold truncate max-w-[80px]">{p.name}</span>
                                                                            </div>
                                                                            <span className="font-extrabold text-zinc-100">{symbol}{Number(p.value).toFixed(0)} <span className="text-[9px] text-teal-400 font-normal">({percent.toFixed(0)}%)</span></span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            <div className="border-t border-border/10 pt-1 mt-1 flex justify-between font-black text-primary">
                                                                <span>Total:</span>
                                                                <span>{symbol}{total.toFixed(0)}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: '10px' }} />
                                        {comparisonData.accounts.map((acc) => (
                                            <Bar 
                                                key={acc.accountId} 
                                                dataKey={acc.name} 
                                                stackId="a" 
                                                fill={`url(#grad-cat-${acc.accountId})`} 
                                                radius={[3, 3, 0, 0]}
                                                barSize={20}
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
 
                        {/* 2.4 Average Daily Spend Chart */}
                        <Card className="border border-border/80 bg-card/40 backdrop-blur-md shadow-md transition-shadow hover:shadow-lg">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-sm font-extrabold text-custom-gradient flex items-center gap-1.5 uppercase tracking-wider">
                                        <Activity className="h-4 w-4 text-primary" /> Daily Spend Intensity average
                                    </CardTitle>
                                    <CardDescription className="text-[11px]">Average daily spending rate across active entries</CardDescription>
                                </div>
                                <button
                                    onClick={() => setFullscreenChart('intensity')}
                                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors shrink-0"
                                    title="View Fullscreen"
                                >
                                    <Eye className="h-4 w-4" />
                                </button>
                            </CardHeader>
                            <CardContent className="h-[300px] pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={avgDailyData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                        <defs>
                                            {comparisonData.accounts.map(acc => (
                                                <linearGradient key={`grad-int-${acc.accountId}`} id={`grad-int-${acc.accountId}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={acc.color} stopOpacity={0.95}/>
                                                    <stop offset="100%" stopColor={acc.color} stopOpacity={0.3}/>
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${symbol}${v}`} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const rowData = payload[0].payload;
                                                    return (
                                                        <div className="bg-zinc-950/95 dark:bg-zinc-900/95 text-white p-3 rounded-xl border border-border/20 shadow-xl text-xs font-mono">
                                                            <div className="flex items-center space-x-1.5 font-bold mb-1">
                                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rowData.color }} />
                                                                <span>{rowData.name}</span>
                                                            </div>
                                                            <p className="text-[10px] text-zinc-400">Avg Daily Spend:</p>
                                                            <p className="text-sm font-black text-teal-400">{symbol}{Number(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="Avg Daily Spend" fill="#0d9488" radius={[6, 6, 0, 0]} barSize={32}>
                                            {avgDailyData.map((entry, index) => {
                                                const acc = comparisonData.accounts.find(a => a.name === entry.name);
                                                return (
                                                    <Cell key={`cell-${index}`} fill={`url(#grad-int-${acc?.accountId || index})`} className="hover:opacity-85 transition-opacity" />
                                                );
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 3. Distribution Pie Charts grid */}
                    <Card className="border border-border bg-card/60 backdrop-blur shadow-md">
                        <CardHeader>
                            <CardTitle className="text-sm font-extrabold text-custom-gradient flex items-center gap-1.5 uppercase tracking-wider">
                                <Grid className="h-4 w-4 text-primary" /> Spending Distributions
                            </CardTitle>
                            <CardDescription>Visual share percentage profiles of category groups per account</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {comparisonData.accounts.map((acc) => {
                                    // Prepare data for account categories
                                    const accCatData = topCategories.find(tc => tc.accountId === acc.accountId)
                                    // Aggregate categories
                                    const rawCategorySpend = categoryChartData.map(row => ({
                                        name: row.category,
                                        value: convert(row[acc.name] || 0)
                                    })).filter(c => c.value > 0)

                                    const COLORS = [acc.color, '#a855f7', '#fb923c', '#f43f5e', '#3b82f6', '#10b981', '#71717a']

                                    return (
                                        <div key={acc.accountId} className="flex flex-col items-center p-4 bg-muted/20 border border-border/10 rounded-2xl text-center space-y-3">
                                            <div className="flex items-center space-x-1.5">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: acc.color }} />
                                                <span className="font-bold text-xs">{acc.name}</span>
                                            </div>

                                            {rawCategorySpend.length > 0 ? (
                                                <>
                                                    <div className="h-40 w-full relative">
                                                        {/* Center Donut Label */}
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                            <span className="text-[8px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Total Spend</span>
                                                            <span className="text-xs font-black text-foreground font-mono mt-1 leading-none">{format(acc.totalExpenses)}</span>
                                                        </div>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie
                                                                    data={rawCategorySpend}
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    innerRadius={38}
                                                                    outerRadius={58}
                                                                    paddingAngle={2.5}
                                                                    dataKey="value"
                                                                >
                                                                    {rawCategorySpend.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-85 transition-opacity" />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip 
                                                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                                                    formatter={(v: any) => [`${symbol}${Number(v).toFixed(2)}`, 'Spend']} 
                                                                />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                    <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-[9px] text-muted-foreground">
                                                        {rawCategorySpend.slice(0, 4).map((entry, index) => (
                                                            <span key={entry.name} className="flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                                {entry.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="h-40 flex items-center justify-center text-xs text-muted-foreground italic">
                                                    No transactions recorded.
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. Leaderboard & Top Categories Table */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* 4.1 Leaderboard List Cards */}
                        <Card className="border border-border bg-card/60 backdrop-blur shadow-md">
                            <CardHeader>
                                <CardTitle className="text-sm font-extrabold text-custom-gradient flex items-center gap-1.5 uppercase tracking-wider">
                                    <Flame className="h-4 w-4 text-primary" /> Spending Leaderboard
                                </CardTitle>
                                <CardDescription>Ranking from highest spending workspace to lowest</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {sortedLeaderboard.map((acc, index) => (
                                    <div 
                                        key={acc.accountId}
                                        className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50 transition-transform duration-300 hover:scale-[1.01]"
                                    >
                                        <div className="flex items-center space-x-3 truncate">
                                            <div className="font-black text-sm text-muted-foreground w-5 text-center">
                                                #{index + 1}
                                            </div>
                                            <div 
                                                className="h-8 w-8 rounded-lg flex items-center justify-center text-white shrink-0"
                                                style={{ backgroundColor: acc.color }}
                                            >
                                                <DynamicIcon name={acc.icon} className="h-4.5 w-4.5" />
                                            </div>
                                            <div className="truncate">
                                                <span className="font-bold text-xs text-foreground block truncate">{acc.name}</span>
                                                <span className="text-[10px] text-muted-foreground truncate">{acc.bankName}</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="font-black font-mono text-rose-500 text-xs">{format(acc.totalExpenses)}</span>
                                            <p className="text-[9px] text-muted-foreground font-semibold">{acc.transactionCount} transactions</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* 4.2 Top Categories table */}
                        <Card className="border border-border bg-card/60 backdrop-blur shadow-md overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-sm font-extrabold text-custom-gradient flex items-center gap-1.5 uppercase tracking-wider">
                                    <Percent className="h-4 w-4 text-primary" /> Top Categories Profile
                                </CardTitle>
                                <CardDescription>Workspace-wise primary expense groupings</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 border-t border-border/10">
                                {/* Desktop Table View */}
                                <div className="w-full overflow-x-auto hidden md:block">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase text-[9px] font-black tracking-wider">
                                                <th className="py-3 px-4">Account</th>
                                                <th className="py-3 px-4">Top Category</th>
                                                <th className="py-3 px-4 text-right">Amount</th>
                                                <th className="py-3 px-4 text-right">Share</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/20 text-zinc-300">
                                            {topCategories.map((tc) => (
                                                <tr key={tc.accountId} className="hover:bg-muted/10 transition-colors">
                                                    <td className="py-3 px-4 flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tc.color }} />
                                                        <div className="font-bold text-foreground">
                                                            <span>{tc.accountName}</span>
                                                            <span className="text-[9px] font-medium text-muted-foreground block font-mono">{tc.bankName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-foreground capitalize">{tc.topCategory}</td>
                                                    <td className="py-3 px-4 text-right font-bold text-rose-500 font-mono">{format(tc.amount)}</td>
                                                    <td className="py-3 px-4 text-right font-bold text-teal-400 font-mono">{tc.percentage.toFixed(0)}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile List View */}
                                <div className="block md:hidden divide-y divide-border/10">
                                    {topCategories.map((tc) => (
                                        <div key={tc.accountId} className="p-4 flex justify-between items-center gap-3">
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tc.color }} />
                                                    <span className="font-bold text-xs text-foreground">{tc.accountName}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground block font-mono pl-3.5">{tc.bankName}</span>
                                                <span className="text-[11px] font-bold text-foreground capitalize pl-3.5 block mt-1">{tc.topCategory}</span>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="font-bold text-xs text-rose-500 font-mono block">{format(tc.amount)}</span>
                                                <span className="text-[10px] text-teal-400 font-mono font-bold block mt-0.5">{tc.percentage.toFixed(0)}% share</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 5. Mini Heatmap Grid comparisons */}
                    <Card className="border border-border bg-card/60 backdrop-blur shadow-md">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-extrabold text-custom-gradient flex items-center gap-1.5 uppercase tracking-wider">
                                    <Grid className="h-4 w-4 text-primary" /> Multi-Account Mini Heatmaps
                                </CardTitle>
                                <CardDescription>Daily spending frequency and intensity layouts ({calendarMonthName})</CardDescription>
                            </div>
                            <div className="w-40 shrink-0">
                                <MonthPicker
                                    value={heatmapMonth}
                                    onChange={setHeatmapMonth}
                                    placeholder="Change Month"
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {comparisonData.accounts.map((acc) => {
                                    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                                    const blocks = Array.from({ length: daysCount }, (_, i) => i + 1)
                                    const spacers = Array.from({ length: firstDayWeekday }, (_, i) => i)

                                    return (
                                        <div key={acc.accountId} className="p-4 bg-muted/10 border border-border/10 rounded-2xl space-y-4 shadow-inner">
                                            <div className="flex justify-between items-center text-xs border-b border-border/10 pb-2">
                                                <div className="flex items-center space-x-2">
                                                    <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: acc.color }} />
                                                    <span className="font-extrabold text-foreground">{acc.name}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-mono">Active Days: {Object.keys(acc.dailyTotals).length}</span>
                                            </div>
                                            <div className="grid grid-cols-7 gap-1 md:gap-1.5 max-w-[240px] mx-auto">
                                                {/* Weekday labels */}
                                                {weekdays.map((wd, i) => (
                                                    <div key={`header-${i}`} className="text-[9px] font-black text-muted-foreground uppercase text-center font-mono opacity-60">
                                                        {wd}
                                                    </div>
                                                ))}

                                                {/* Spacer blocks */}
                                                {spacers.map(s => (
                                                    <div key={`spacer-${s}`} className="w-7 h-7 bg-transparent rounded-md pointer-events-none" />
                                                ))}

                                                {/* Active days */}
                                                {blocks.map(day => {
                                                    const amount = acc.dailyTotals[day] || 0
                                                    
                                                    let bgStyle: React.CSSProperties = {
                                                        borderColor: 'transparent'
                                                    }
                                                    let colorClass = 'bg-muted/20 dark:bg-muted/10 text-muted-foreground/60 hover:bg-muted/30'
                                                    if (amount > 0) {
                                                        colorClass = 'text-white border shadow-sm'
                                                        bgStyle = {
                                                            backgroundColor: acc.color,
                                                            borderColor: acc.color,
                                                            opacity: amount < 500 ? 0.35 : amount < 2500 ? 0.7 : 1
                                                        }
                                                    }

                                                    return (
                                                        <div 
                                                            key={day} 
                                                            style={bgStyle}
                                                            className={cn(
                                                                "relative group w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-bold font-mono transition-all duration-200 select-none cursor-help hover:scale-110 hover:shadow-md hover:ring-2 hover:ring-primary/20", 
                                                                colorClass
                                                            )}
                                                        >
                                                            {day}

                                                            {/* Micro Tooltip */}
                                                            <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-30 transition-all duration-200">
                                                                <div className="bg-zinc-950/95 dark:bg-zinc-50/95 text-zinc-50 dark:text-zinc-950 text-[9px] font-bold rounded-md py-1 px-2 shadow-lg border border-zinc-800/10 dark:border-zinc-200/10 whitespace-nowrap font-mono">
                                                                    Day {day}: {format(amount)}
                                                                </div>
                                                                <div className="w-1 h-1 -mt-0.5 rotate-45 bg-zinc-950/95 dark:bg-zinc-50/95" />
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Heatmap Legend */}
                            <div className="flex items-center justify-end space-x-2 text-[10px] text-muted-foreground pt-4 border-t border-border/20 mt-4 font-semibold">
                                <span>No activity</span>
                                <div className="w-3.5 h-3.5 rounded-sm bg-muted/20 dark:bg-muted/10 border border-border/10"></div>
                                <div className="w-3.5 h-3.5 rounded-sm bg-primary/30 border border-primary/20" style={{ opacity: 0.35 }}></div>
                                <div className="w-3.5 h-3.5 rounded-sm bg-primary/60 border border-primary/40" style={{ opacity: 0.7 }}></div>
                                <div className="w-3.5 h-3.5 rounded-sm bg-primary border border-primary/20" style={{ opacity: 1 }}></div>
                                <span>More spending</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 6. Biggest Transactions Table */}
                    <Card className="border border-border bg-card/60 backdrop-blur shadow-md overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-sm font-extrabold text-custom-gradient flex items-center gap-1.5 uppercase tracking-wider">
                                <GitCompare className="h-4 w-4 text-primary" /> Largest Cross-Account Transactions
                            </CardTitle>
                            <CardDescription>Top 10 highest value transaction entries across all bank workspaces</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 border-t border-border/10">
                            {/* Desktop Table View */}
                            <div className="w-full overflow-x-auto hidden md:block">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border/60 text-muted-foreground uppercase text-[9px] font-black tracking-wider">
                                            <th className="py-3 px-4">Account</th>
                                            <th className="py-3 px-4">Reason</th>
                                            <th className="py-3 px-4">Category</th>
                                            <th className="py-3 px-4">Date</th>
                                            <th className="py-3 px-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20 text-zinc-300">
                                        {comparisonData.biggestTransactions.length > 0 ? (
                                            comparisonData.biggestTransactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-muted/10 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tx.accountColor }} />
                                                            <div className="font-bold text-foreground">
                                                                <span>{tx.accountName}</span>
                                                                <span className="text-[9px] font-medium text-muted-foreground block font-mono">{tx.bankName}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-foreground truncate max-w-[150px]" title={tx.reason}>{tx.reason}</td>
                                                    <td className="py-3 px-4 font-medium text-zinc-400 capitalize">{tx.category}</td>
                                                    <td className="py-3 px-4 font-mono text-zinc-400">Day {tx.day} • {tx.month}</td>
                                                    <td className="py-3 px-4 text-right font-black text-rose-500 font-mono">{format(tx.amount)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-6 text-center text-muted-foreground italic">
                                                    No large transactions found for this period.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card List View (using expense card style layout) */}
                            <div className="block md:hidden divide-y divide-border/10">
                                {comparisonData.biggestTransactions.length > 0 ? (
                                    comparisonData.biggestTransactions.map((tx) => (
                                        <div key={tx.id} className="p-4 space-y-2">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="truncate">
                                                    <p className="font-extrabold text-xs text-foreground truncate">{tx.reason}</p>
                                                    <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{tx.category} • Day {tx.day} • {tx.month}</p>
                                                </div>
                                                <span className="font-black text-xs text-rose-500 font-mono shrink-0">{format(tx.amount)}</span>
                                            </div>
                                            <div className="flex items-center space-x-1.5 pt-1">
                                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tx.accountColor }} />
                                                <span className="text-[10px] text-muted-foreground font-semibold truncate">{tx.accountName} ({tx.bankName})</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-muted-foreground italic text-xs">
                                        No large transactions found for this period.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            )}

            {/* Interactive Fullscreen Charts Modal Overlay */}
            {fullscreenChart && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-200">
                    <Card className="bg-card border w-full max-w-5xl h-[80vh] flex flex-col p-6 rounded-2xl shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setFullscreenChart(null)}
                            className="absolute top-4 right-4 p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors z-10"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        
                        <div className="flex flex-col pb-4 border-b border-border/10 flex-shrink-0">
                            <CardTitle className="text-custom-gradient text-xl">
                                {fullscreenChart === 'total' && 'Total Spending Comparison (Fullscreen)'}
                                {fullscreenChart === 'trend' && 'Monthly Trend Comparison (Fullscreen)'}
                                {fullscreenChart === 'category' && 'Stacked Category Spend (Fullscreen)'}
                                {fullscreenChart === 'intensity' && 'Daily Spend Intensity (Fullscreen)'}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                                {fullscreenChart === 'total' && 'Cumulative total spend per bank account workspace'}
                                {fullscreenChart === 'trend' && 'Month-over-month trend comparison lines'}
                                {fullscreenChart === 'category' && 'Contribution per bank account workspace per category'}
                                {fullscreenChart === 'intensity' && 'Average daily spending rate across active entries'}
                            </CardDescription>
                        </div>
                        
                        <div className="flex-1 min-h-0 pt-6">
                            {fullscreenChart === 'total' && (
                                <ResponsiveContainer width="100%" height="90%">
                                    <BarChart data={cumulativeTotalData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                                        <defs>
                                            {comparisonData?.accounts.map(acc => (
                                                <linearGradient key={`grad-fs-${acc.accountId}`} id={`grad-fs-${acc.accountId}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={acc.color} stopOpacity={0.95}/>
                                                    <stop offset="100%" stopColor={acc.color} stopOpacity={0.25}/>
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${symbol}${v}`} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const rowData = payload[0].payload;
                                                    return (
                                                        <div className="bg-zinc-950/95 dark:bg-zinc-900/95 text-white p-3 rounded-xl border border-border/20 shadow-xl text-xs font-mono">
                                                            <div className="flex items-center space-x-1.5 font-bold mb-1">
                                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rowData.color }} />
                                                                <span>{rowData.name}</span>
                                                            </div>
                                                            <p className="text-[10px] text-zinc-400">Total Spending:</p>
                                                            <p className="text-sm font-black text-rose-400">{symbol}{Number(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="Total Spending" fill="#0d9488" radius={[8, 8, 0, 0]} maxBarSize={60}>
                                            {cumulativeTotalData.map((entry, index) => {
                                                const acc = comparisonData?.accounts.find(a => a.name === entry.name);
                                                return (
                                                    <Cell key={`cell-${index}`} fill={`url(#grad-fs-${acc?.accountId || index})`} className="hover:opacity-85 transition-opacity" />
                                                );
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                            
                            {fullscreenChart === 'trend' && (
                                <ResponsiveContainer width="100%" height="90%">
                                    <LineChart data={convertedMonthlyTrends} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${symbol}${v}`} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-zinc-950/95 dark:bg-zinc-900/95 text-white p-3 rounded-xl border border-border/20 shadow-xl text-xs font-mono space-y-1.5 min-w-[150px]">
                                                            <p className="font-black text-zinc-300 border-b border-border/10 pb-1 mb-1">{label}</p>
                                                            {[...payload]
                                                                .sort((a, b) => Number(b.value) - Number(a.value))
                                                                .map((p) => {
                                                                    const acc = comparisonData?.accounts.find(a => a.name === p.name);
                                                                    return (
                                                                        <div key={p.name} className="flex justify-between items-center space-x-4">
                                                                            <div className="flex items-center space-x-1.5">
                                                                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: acc?.color || p.color }} />
                                                                                <span className="text-[10px] text-zinc-400 font-bold truncate max-w-[80px]">{p.name}</span>
                                                                            </div>
                                                                            <span className="font-extrabold text-zinc-100">{symbol}{Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} />
                                        {comparisonData?.accounts.map((acc) => (
                                            <Line 
                                                key={acc.accountId} 
                                                type="monotone" 
                                                dataKey={acc.name} 
                                                stroke={acc.color} 
                                                strokeWidth={3}
                                                dot={{ fill: acc.color, r: 4 }}
                                                activeDot={{ r: 6, strokeWidth: 0, fill: acc.color }} 
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                            
                            {fullscreenChart === 'category' && (
                                <ResponsiveContainer width="100%" height="90%">
                                    <BarChart data={convertedCategoryData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                                        <defs>
                                            {comparisonData?.accounts.map(acc => (
                                                <linearGradient key={`grad-cat-fs-${acc.accountId}`} id={`grad-cat-fs-${acc.accountId}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={acc.color} stopOpacity={0.95}/>
                                                    <stop offset="100%" stopColor={acc.color} stopOpacity={0.25}/>
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                                        <XAxis dataKey="category" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${symbol}${v}`} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    const total = payload.reduce((sum, p) => sum + Number(p.value), 0);
                                                    return (
                                                        <div className="bg-zinc-950/95 dark:bg-zinc-900/95 text-white p-3 rounded-xl border border-border/20 shadow-xl text-xs font-mono space-y-1.5 min-w-[160px]">
                                                            <p className="font-black text-zinc-300 border-b border-border/10 pb-1 mb-1 capitalize">{label}</p>
                                                            {[...payload]
                                                                .sort((a, b) => Number(b.value) - Number(a.value))
                                                                .map((p) => {
                                                                    const acc = comparisonData?.accounts.find(a => a.name === p.name);
                                                                    const percent = total > 0 ? (Number(p.value) / total) * 100 : 0;
                                                                    return (
                                                                        <div key={p.name} className="flex justify-between items-center space-x-4">
                                                                            <div className="flex items-center space-x-1.5">
                                                                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: acc?.color || p.color }} />
                                                                                <span className="text-[10px] text-zinc-400 font-bold truncate max-w-[80px]">{p.name}</span>
                                                                            </div>
                                                                            <span className="font-extrabold text-zinc-100">{symbol}{Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[9px] text-teal-400 font-normal">({percent.toFixed(0)}%)</span></span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            <div className="border-t border-border/10 pt-1 mt-1 flex justify-between font-black text-primary">
                                                                <span>Total:</span>
                                                                <span>{symbol}{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} />
                                        {comparisonData?.accounts.map((acc) => (
                                            <Bar 
                                                key={acc.accountId} 
                                                dataKey={acc.name} 
                                                stackId="a" 
                                                fill={`url(#grad-cat-fs-${acc.accountId})`} 
                                                radius={[4, 4, 0, 0]}
                                                barSize={36}
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                            
                            {fullscreenChart === 'intensity' && (
                                <ResponsiveContainer width="100%" height="90%">
                                    <BarChart data={avgDailyData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                                        <defs>
                                            {comparisonData?.accounts.map(acc => (
                                                <linearGradient key={`grad-int-fs-${acc.accountId}`} id={`grad-int-fs-${acc.accountId}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={acc.color} stopOpacity={0.95}/>
                                                    <stop offset="100%" stopColor={acc.color} stopOpacity={0.25}/>
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${symbol}${v}`} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const rowData = payload[0].payload;
                                                    return (
                                                        <div className="bg-zinc-950/95 dark:bg-zinc-900/95 text-white p-3 rounded-xl border border-border/20 shadow-xl text-xs font-mono">
                                                            <div className="flex items-center space-x-1.5 font-bold mb-1">
                                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rowData.color }} />
                                                                <span>{rowData.name}</span>
                                                            </div>
                                                            <p className="text-[10px] text-zinc-400">Avg Daily Spend:</p>
                                                            <p className="text-sm font-black text-teal-400">{symbol}{Number(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="Avg Daily Spend" fill="#0d9488" radius={[8, 8, 0, 0]} maxBarSize={60}>
                                            {avgDailyData.map((entry, index) => {
                                                const acc = comparisonData?.accounts.find(a => a.name === entry.name);
                                                return (
                                                    <Cell key={`cell-${index}`} fill={`url(#grad-int-fs-${acc?.accountId || index})`} className="hover:opacity-85 transition-opacity" />
                                                );
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
