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
    ArrowLeft
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
    
    // API Data
    const [comparisonData, setComparisonData] = useState<{
        accounts: AccountComparisonStat[];
        leaderboard: AccountComparisonStat[];
        biggestTransactions: BiggestTransaction[];
    } | null>(null)

    const [monthlyTrends, setMonthlyTrends] = useState<any[]>([])
    const [categoryChartData, setCategoryChartData] = useState<any[]>([])
    const [topCategories, setTopCategories] = useState<any[]>([])

    const fetchComparisonData = async () => {
        try {
            setLoading(true)
            setError('')
            
            const params = new URLSearchParams({
                filterType,
                ...(filterType === 'custom' && { startMonth, endMonth })
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
    }, [filterType, startMonth, endMonth])

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
                <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    {/* Predefined Range Selectors */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap bg-muted rounded-xl p-0.5 text-xs font-bold border border-border/40 gap-0.5">
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
                                    "px-3 py-1.5 rounded-lg transition-all text-xs text-center",
                                    filterType === btn.type
                                        ? 'bg-custom-btn-gradient text-white shadow-sm font-extrabold'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    {/* Custom Month Inputs */}
                    {filterType === 'custom' && (
                        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 text-xs">
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
                    
                    {/* 1. Account Summary Workspace Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {comparisonData.accounts.map((acc) => (
                            <Card 
                                key={acc.accountId}
                                className="border border-border/60 bg-card/30 backdrop-blur shadow hover:shadow-md transition-shadow relative overflow-hidden"
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
                        <Card className="border border-border bg-card/60 backdrop-blur shadow-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-extrabold text-custom-gradient flex items-center gap-1.5 uppercase tracking-wider">
                                    <Award className="h-4 w-4 text-primary" /> Total Spending Comparison
                                </CardTitle>
                                <CardDescription>Cumulative total spend per bank account workspace</CardDescription>
                            </CardHeader>
                            <CardContent className="h-64 pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={cumulativeTotalData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${symbol}${v}`} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                            formatter={(v: any) => [`${symbol}${Number(v).toFixed(2)}`, 'Spend']}
                                        />
                                        <Bar dataKey="Total Spending" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={35}>
                                            {cumulativeTotalData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* 2.2 Monthly Trend Comparison */}
                        <Card className="border border-border bg-card/60 backdrop-blur shadow-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-extrabold text-custom-gradient flex items-center gap-1.5 uppercase tracking-wider">
                                    <TrendingUp className="h-4 w-4 text-primary" /> Monthly Trend Comparison
                                </CardTitle>
                                <CardDescription>Month-over-month trend comparison lines</CardDescription>
                            </CardHeader>
                            <CardContent className="h-64 pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={convertedMonthlyTrends} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${symbol}${v}`} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                            formatter={(v: any, name: string) => [`${symbol}${Number(v).toFixed(2)}`, name]}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 10 }} />
                                        {comparisonData.accounts.map((acc) => (
                                            <Line 
                                                key={acc.accountId} 
                                                type="monotone" 
                                                dataKey={acc.name} 
                                                stroke={acc.color} 
                                                strokeWidth={2.5}
                                                activeDot={{ r: 6 }} 
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* 2.3 Category Comparison Stacked */}
                        <Card className="border border-border bg-card/60 backdrop-blur shadow-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-extrabold text-custom-gradient flex items-center gap-1.5 uppercase tracking-wider">
                                    <Percent className="h-4 w-4 text-primary" /> Stacked Category Spend
                                </CardTitle>
                                <CardDescription>Contribution per bank account workspace per category</CardDescription>
                            </CardHeader>
                            <CardContent className="h-64 pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={convertedCategoryData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
                                        <XAxis dataKey="category" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${symbol}${v}`} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                            formatter={(v: any, name: string) => [`${symbol}${Number(v).toFixed(2)}`, name]}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 10 }} />
                                        {comparisonData.accounts.map((acc) => (
                                            <Bar 
                                                key={acc.accountId} 
                                                dataKey={acc.name} 
                                                stackId="a" 
                                                fill={acc.color} 
                                                radius={[0, 0, 0, 0]}
                                                barSize={20}
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* 2.4 Average Daily Spend Chart */}
                        <Card className="border border-border bg-card/60 backdrop-blur shadow-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-extrabold text-custom-gradient flex items-center gap-1.5 uppercase tracking-wider">
                                    <Activity className="h-4 w-4 text-primary" /> Daily Spend Intensity average
                                </CardTitle>
                                <CardDescription>Average daily spending rate across active entries</CardDescription>
                            </CardHeader>
                            <CardContent className="h-64 pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={avgDailyData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${symbol}${v}`} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                                            formatter={(v: any) => [`${symbol}${Number(v).toFixed(2)}`, 'Avg Daily Spend']}
                                        />
                                        <Bar dataKey="Avg Daily Spend" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={35}>
                                            {avgDailyData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
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
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie
                                                                    data={rawCategorySpend}
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    innerRadius={30}
                                                                    outerRadius={60}
                                                                    paddingAngle={2}
                                                                    dataKey="value"
                                                                >
                                                                    {rawCategorySpend.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip formatter={(v: any) => [`${symbol}${Number(v).toFixed(2)}`, 'Spend']} />
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
                        <CardHeader>
                            <CardTitle className="text-sm font-extrabold text-custom-gradient flex items-center gap-1.5 uppercase tracking-wider">
                                <Grid className="h-4 w-4 text-primary" /> Multi-Account Mini Heatmaps
                            </CardTitle>
                            <CardDescription>Daily spending frequency and intensity layouts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {comparisonData.accounts.map((acc) => {
                                    // Render 31 mini day blocks in a grid
                                    const blocks = Array.from({ length: 31 }, (_, i) => i + 1)
                                    return (
                                        <div key={acc.accountId} className="p-4 bg-muted/10 border border-border/10 rounded-2xl space-y-3">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-bold text-foreground">{acc.name}</span>
                                                <span className="text-[10px] text-muted-foreground">Active Days: {Object.keys(acc.dailyTotals).length}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {blocks.map(day => {
                                                    const amount = acc.dailyTotals[day] || 0
                                                    
                                                    // Determine color opacity class based on amount
                                                    let colorClass = 'bg-muted/40 text-muted-foreground border-border/20'
                                                    if (amount > 0) {
                                                        if (amount < 500) colorClass = 'bg-primary/20 border-primary/30 text-primary-foreground font-bold'
                                                        else if (amount < 2500) colorClass = 'bg-primary/50 border-primary/50 text-white font-bold'
                                                        else colorClass = 'bg-primary border-primary text-white font-black'
                                                    }

                                                    return (
                                                        <div 
                                                            key={day} 
                                                            className={cn(
                                                                "w-6 h-6 rounded flex items-center justify-center text-[9px] border shadow-sm select-none", 
                                                                colorClass
                                                            )}
                                                            style={{
                                                                backgroundColor: amount > 0 ? acc.color : undefined,
                                                                opacity: amount > 0 ? (amount < 500 ? 0.35 : amount < 2500 ? 0.7 : 1) : undefined
                                                            }}
                                                            title={`Day ${day}: ${format(amount)}`}
                                                        >
                                                            {day}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
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
        </div>
    )
}
