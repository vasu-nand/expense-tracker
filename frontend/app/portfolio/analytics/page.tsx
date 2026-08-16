'use client'

import { useState, useEffect } from 'react'
import { 
    BarChart3, 
    TrendingUp, 
    PieChart as PieIcon, 
    ShieldCheck, 
    Zap, 
    Award, 
    Activity,
    RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PortfolioNav } from '@/components/portfolio/portfolio-nav'
import { api } from '@/services/api'
import { useCurrency } from '@/hooks/use-currency'
import { cn } from '@/lib/utils'
import { PortfolioEmptyState } from '@/components/portfolio/portfolio-empty-state'
import { ChartTooltip } from '@/components/charts/chart-tooltip'
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer, 
    Cell, 
    PieChart, 
    Pie 
} from 'recharts'

const COLOR_PALETTE = ['#6366f1', '#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6']

export default function PortfolioAnalyticsPage() {
    const { format } = useCurrency()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [summaryData, setSummaryData] = useState<any>(null)
    const [allocationView, setAllocationView] = useState<'bar' | 'donut'>('donut')

    const fetchAnalytics = async () => {
        try {
            setLoading(true)
            setError('')
            const res = await api.get('/portfolio/summary')
            setSummaryData(res.data)
        } catch (err: any) {
            console.error('Failed to fetch portfolio analytics:', err)
            setError(err.response?.data?.error || 'Failed to load analytics details')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAnalytics()
    }, [])

    const summary = summaryData?.summary || {}
    const holdings = summaryData?.holdings || []
    const totalVal = summary.currentValue || 0

    const allocationList = Object.entries(summary.assetAllocation || {}).map(([key, val], idx) => ({
        category: key.replace('_', ' ').toUpperCase(),
        value: Number(val),
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
    })).sort((a, b) => b.value - a.value)

    const topHoldingsData = holdings.slice(0, 5).map((h: any, idx: number) => ({
        name: h.symbol,
        fullName: h.name,
        value: h.currentValue,
        color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
    }))

    const top1Concentration = totalVal > 0 && holdings.length > 0 ? ((holdings[0]?.currentValue || 0) / totalVal) * 100 : 0
    const top3Concentration = totalVal > 0 ? (holdings.slice(0, 3).reduce((acc: number, h: any) => acc + (h.currentValue || 0), 0) / totalVal) * 100 : 0

    const dividendYield = summary.totalInvestment > 0 ? ((summary.totalDividends || 0) / summary.totalInvestment) * 100 : 0

    // Compute diversification health score
    const categoryCount = allocationList.length
    const rawScore = categoryCount > 0 ? Math.round((categoryCount * 18) + Math.max(0, 100 - top1Concentration * 1.2)) : 0
    const diversificationScore = Math.min(100, Math.max(0, rawScore))

    const getScoreBadge = (score: number) => {
        if (score >= 75) return { label: 'Optimal Diversification', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
        if (score >= 45) return { label: 'Moderate Spread', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' }
        return { label: 'High Concentration Risk', color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' }
    }

    const scoreBadge = getScoreBadge(diversificationScore)

    const formatAxisNumber = (val: number) => {
        if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
        if (val >= 1000) return `${(val / 1000).toFixed(0)}k`
        return `${val}`
    }

    // Fully Theme-Responsive Glassmorphism Custom Tooltips
    const CustomAllocationTooltip = (props: any) => (
        <ChartTooltip {...props} showPercentage totalValue={totalVal} />
    )

    const CustomHoldingsTooltip = (props: any) => (
        <ChartTooltip {...props} showPercentage totalValue={totalVal} />
    )

    return (
        <div className="container mx-auto p-4 sm:p-6 space-y-6">
            <PortfolioNav />

            {error && (
                <div className="p-4 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between">
                    <span>{error}</span>
                    <Button size="sm" variant="ghost" onClick={fetchAnalytics} className="text-xs">
                        <RefreshCw className="h-4 w-4 mr-1" /> Retry
                    </Button>
                </div>
            )}

            {/* Performance Indicators Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-border/80 bg-card shadow-sm rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                            Internal Rate of Return (XIRR)
                            <Activity className="h-4 w-4 text-indigo-500" />
                        </CardDescription>
                        <CardTitle className="text-2xl font-black text-indigo-500">
                            {loading ? '...' : `${(summary.xirr || 0).toFixed(2)}%`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        Annualized compounding yield rate
                    </CardContent>
                </Card>

                <Card className="border border-border/80 bg-card shadow-sm rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                            Total Net ROI %
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </CardDescription>
                        <CardTitle className={cn(
                            "text-2xl font-black",
                            (summary.totalProfitLossPercentage || 0) >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                            {loading ? '...' : `${(summary.totalProfitLossPercentage || 0).toFixed(2)}%`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        Profit: {format(summary.totalProfitLoss || 0)}
                    </CardContent>
                </Card>

                <Card className="border border-border/80 bg-card shadow-sm rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                            Dividend Income Yield
                            <Award className="h-4 w-4 text-amber-500" />
                        </CardDescription>
                        <CardTitle className="text-2xl font-black text-amber-500">
                            {loading ? '...' : `${dividendYield.toFixed(2)}%`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        Cash Dividends: {format(summary.totalDividends || 0)}
                    </CardContent>
                </Card>

                <Card className="border border-border/80 bg-card shadow-sm rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                            Diversification Health
                            <ShieldCheck className="h-4 w-4 text-cyan-500" />
                        </CardDescription>
                        <CardTitle className="text-2xl font-black text-cyan-500">
                            {loading ? '...' : `${diversificationScore} / 100`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
                        <span>Across {categoryCount} Classes</span>
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border", scoreBadge.color)}>
                            {scoreBadge.label}
                        </span>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Asset Allocation Card */}
                <Card className="border border-border/80 bg-card shadow-sm rounded-2xl">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-border/40 mb-2">
                        <div>
                            <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-primary" />
                                Asset Allocation Breakdown
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Capital valuation across asset classes
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
                            <button
                                onClick={() => setAllocationView('donut')}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1",
                                    allocationView === 'donut'
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <PieIcon className="h-3.5 w-3.5" /> Donut
                            </button>
                            <button
                                onClick={() => setAllocationView('bar')}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1",
                                    allocationView === 'bar'
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <BarChart3 className="h-3.5 w-3.5" /> Bar
                            </button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-4">
                        {allocationList.length === 0 ? (
                            <PortfolioEmptyState
                                imageSrc="/portfolio/analytics-empty.svg"
                                title="No Asset Distribution Available"
                                description="Add assets and record transactions to analyze your asset class distribution."
                            />
                        ) : allocationView === 'donut' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center min-h-[290px]">
                                <div className="h-64 w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Tooltip content={<CustomAllocationTooltip />} />
                                            <Pie
                                                data={allocationList}
                                                dataKey="value"
                                                nameKey="category"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={65}
                                                outerRadius={95}
                                                paddingAngle={4}
                                                strokeWidth={0}
                                            >
                                                {allocationList.map((entry, index) => (
                                                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Capital</span>
                                        <span className="text-base font-black text-foreground font-mono">{format(totalVal)}</span>
                                    </div>
                                </div>

                                {/* Theme Responsive Legend with Percentage Badges */}
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 [::-webkit-scrollbar]:hidden">
                                    {allocationList.map((item, idx) => {
                                        const share = totalVal > 0 ? ((item.value / totalVal) * 100).toFixed(1) : '0.0'
                                        return (
                                            <div key={idx} className="p-2.5 rounded-xl bg-card border border-border/60 hover:bg-muted/40 flex items-center justify-between text-xs transition-colors">
                                                <div className="flex items-center gap-2 truncate pr-2">
                                                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                                    <span className="font-bold text-foreground truncate text-xs">{item.category}</span>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="font-mono font-bold text-foreground text-xs block">{format(item.value)}</span>
                                                    <span className="font-mono text-xs text-primary font-bold">{share}%</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="h-72 w-full pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={allocationList} margin={{ top: 15, right: 15, left: 15, bottom: 30 }}>
                                        <XAxis 
                                            dataKey="category" 
                                            className="text-muted-foreground"
                                            tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 600 }} 
                                            interval={0}
                                            angle={-15}
                                            textAnchor="end"
                                        />
                                        <YAxis 
                                            className="text-muted-foreground"
                                            tick={{ fill: 'currentColor', fontSize: 11 }} 
                                            tickFormatter={formatAxisNumber}
                                        />
                                        <Tooltip content={<CustomAllocationTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.3 }} />
                                        <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                                            {allocationList.map((entry, index) => (
                                                <Cell key={`bar-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Holdings Concentration Chart */}
                <Card className="border border-border/80 bg-card shadow-sm rounded-2xl">
                    <CardHeader className="pb-2 border-b border-border/40 mb-2">
                        <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                            <Zap className="h-4 w-4 text-amber-500" />
                            Top Position Capital Weight
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            Highest value holdings in your investment portfolio
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-4">
                        {topHoldingsData.length === 0 ? (
                            <PortfolioEmptyState
                                imageSrc="/portfolio/analytics-empty.svg"
                                title="No Position Holdings Found"
                                description="Record holdings to visualize your top capital concentration."
                            />
                        ) : (
                            <div className="h-72 w-full pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topHoldingsData} layout="vertical" margin={{ top: 10, right: 20, left: 25, bottom: 10 }}>
                                        <XAxis 
                                            type="number" 
                                            className="text-muted-foreground"
                                            tick={{ fill: 'currentColor', fontSize: 11 }}
                                            tickFormatter={formatAxisNumber}
                                        />
                                        <YAxis 
                                            dataKey="name" 
                                            type="category" 
                                            className="text-foreground"
                                            tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 800 }} 
                                        />
                                        <Tooltip content={<CustomHoldingsTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.3 }} />
                                        <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                                            {topHoldingsData.map((entry: any, index: number) => (
                                                <Cell key={`holding-bar-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Risk & Concentration Analytics Card */}
            <Card className="border border-border/80 bg-card shadow-sm rounded-2xl">
                <CardHeader className="pb-3 border-b border-border/60">
                    <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        Portfolio Risk Metrics & Concentration Analysis
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div className="p-4 bg-muted/30 border border-border/60 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between text-muted-foreground font-semibold text-xs">
                                <span>Largest Single Position Weight</span>
                                <span className="font-bold text-foreground text-xs">{top1Concentration.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                <div 
                                    className={cn(
                                        "h-full rounded-full transition-all duration-500",
                                        top1Concentration > 40 ? "bg-rose-500" : top1Concentration > 25 ? "bg-amber-500" : "bg-emerald-500"
                                    )}
                                    style={{ width: `${Math.min(100, top1Concentration)}%` }}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground block">
                                {top1Concentration > 40 ? 'High concentration in top asset' : 'Balanced single-asset exposure'}
                            </span>
                        </div>

                        <div className="p-4 bg-muted/30 border border-border/60 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between text-muted-foreground font-semibold text-xs">
                                <span>Top 3 Holdings Weight</span>
                                <span className="font-bold text-foreground text-xs">{top3Concentration.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                <div 
                                    className={cn(
                                        "h-full rounded-full transition-all duration-500",
                                        top3Concentration > 70 ? "bg-rose-500" : top3Concentration > 50 ? "bg-amber-500" : "bg-indigo-500"
                                    )}
                                    style={{ width: `${Math.min(100, top3Concentration)}%` }}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground block">
                                {top3Concentration > 70 ? 'Top 3 assets dominate portfolio' : 'Healthy multi-asset allocation'}
                            </span>
                        </div>

                        <div className="p-4 bg-muted/30 border border-border/60 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between text-muted-foreground font-semibold text-xs">
                                <span>Realized vs Unrealized Gain</span>
                                <span className="font-bold text-foreground font-mono text-xs">
                                    {(summary.totalProfitLoss || 0) >= 0 ? '+' : ''}{format(summary.totalProfitLoss || 0)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono pt-1">
                                <span className="text-muted-foreground">Realized: <strong className="text-foreground">{format(summary.realizedPL || 0)}</strong></span>
                                <span className="text-muted-foreground">Unrealized: <strong className="text-emerald-500">{format(summary.unrealizedPL || 0)}</strong></span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
