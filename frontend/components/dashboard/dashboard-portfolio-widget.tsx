'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    PieChart as PieIcon, 
    Award, 
    Activity, 
    ArrowUpRight, 
    ArrowDownRight,
    ChevronRight,
    Coins,
    ShieldCheck,
    Layers
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCurrency } from '@/hooks/use-currency'
import { cn } from '@/lib/utils'
import { TradingViewLink } from '@/components/portfolio/tradingview-link'
import { ChartTooltip } from '@/components/charts/chart-tooltip'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface DashboardPortfolioWidgetProps {
    summaryData: any
    loading?: boolean
}

const COLOR_PALETTE = ['#6366f1', '#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#f43f5e', '#eab308']

export function DashboardPortfolioWidget({ summaryData, loading }: DashboardPortfolioWidgetProps) {
    const [chartView, setChartView] = useState<'shares' | 'allocation'>('shares')
    const { format } = useCurrency()

    const summary = summaryData?.summary || {}
    const holdings = summaryData?.holdings || []

    const totalVal = summary.currentValue || summary.netWorth || 0
    const totalCost = summary.totalInvestment || 0
    const totalPL = summary.totalProfitLoss || 0
    const plPercent = summary.totalProfitLossPercentage || 0
    const totalDivs = summary.totalDividends || 0
    const xirr = summary.xirr || 0
    const isPositivePL = totalPL >= 0

    // 1. Invested Value by Shares / Assets
    const sharesData = React.useMemo(() => {
        if (!holdings || holdings.length === 0) return []
        const sorted = [...holdings].sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0))
        
        if (sorted.length <= 5) {
            return sorted.map((h, idx) => ({
                category: h.symbol,
                fullName: h.name,
                value: h.currentValue || 0,
                color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
            }))
        }

        const top = sorted.slice(0, 4).map((h, idx) => ({
            category: h.symbol,
            fullName: h.name,
            value: h.currentValue || 0,
            color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
        }))

        const otherVal = sorted.slice(4).reduce((sum, h) => sum + (h.currentValue || 0), 0)
        if (otherVal > 0) {
            top.push({
                category: 'OTHERS',
                fullName: 'Other Asset Holdings',
                value: otherVal,
                color: '#94a3b8'
            })
        }
        return top
    }, [holdings])

    // 2. Capital Allocation by Asset Type
    const allocationData = React.useMemo(() => {
        return Object.entries(summary.assetAllocation || {}).map(([key, val], idx) => ({
            category: key.replace('_', ' ').toUpperCase(),
            fullName: key.replace('_', ' ').toUpperCase(),
            value: Number(val),
            color: COLOR_PALETTE[idx % COLOR_PALETTE.length]
        })).filter(item => item.value > 0).sort((a, b) => b.value - a.value)
    }, [summary.assetAllocation])

    const activeChartData = chartView === 'shares' ? sharesData : allocationData
    const topHoldings = holdings.slice(0, 4)

    const [bannerHidden, setBannerHidden] = React.useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('hide-empty-portfolio-banner') === 'true'
        }
        return false
    })

    const handleDismissBanner = () => {
        setBannerHidden(true)
        if (typeof window !== 'undefined') {
            localStorage.setItem('hide-empty-portfolio-banner', 'true')
        }
    }

    if (loading) {
        return (
            <Card className="border border-border/80 bg-card shadow-sm rounded-2xl p-6 animate-pulse">
                <div className="h-6 w-48 bg-muted rounded mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 bg-muted/60 rounded-xl" />
                    ))}
                </div>
            </Card>
        )
    }

    if (!summaryData || holdings.length === 0) {
        if (bannerHidden) return null

        return (
            <Card className="border border-border/80 bg-gradient-to-br from-card via-card to-indigo-950/20 shadow-md rounded-2xl overflow-hidden p-6 sm:p-8 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Left SVG Vector Illustration */}
                    <div className="flex items-center justify-center p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 shrink-0">
                        <svg className="w-20 h-20 sm:w-24 sm:h-24 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 005.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941M3.75 21h16.5a1.5 1.5 0 001.5-1.5V3.75a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v15.75a1.5 1.5 0 001.5 1.5z" />
                        </svg>
                    </div>

                    {/* Middle Text Details */}
                    <div className="space-y-2 text-center md:text-left flex-1 min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-extrabold uppercase tracking-wider border border-indigo-500/20">
                            <Layers className="h-3 w-3" /> Wealth Portfolio Tracker
                        </div>
                        <h3 className="text-xl font-extrabold text-foreground tracking-tight">
                            Build & Track Your Investment Portfolio
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                            Record your first stock purchase, mutual fund SIP, gold, or crypto trade to unlock live market pricing, dividend tracking, capital allocation charts, and annualized XIRR yields.
                        </p>
                    </div>

                    {/* Right Actions */}
                    <div className="flex flex-col sm:flex-row md:flex-col items-center gap-2.5 shrink-0 w-full sm:w-auto">
                        <Button asChild className="w-full sm:w-auto rounded-xl text-xs font-bold gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md">
                            <Link href="/upload">
                                <Coins className="h-4 w-4" /> Add Your First Investment
                            </Link>
                        </Button>

                        <button
                            type="button"
                            onClick={handleDismissBanner}
                            className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors underline decoration-dotted"
                        >
                            Don't show this banner again
                        </button>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 shadow-md rounded-2xl overflow-hidden transition-all duration-300">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-border/40 gap-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                            <Coins className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-base font-extrabold text-foreground tracking-tight">
                            Portfolio & Wealth Overview
                        </CardTitle>
                    </div>
                    <CardDescription className="text-xs text-muted-foreground">
                        Real-time investment positions, capital allocation & asset returns
                    </CardDescription>
                </div>

                <Button size="sm" variant="outline" asChild className="rounded-xl text-xs font-bold gap-1.5 self-start sm:self-auto hover:bg-primary/10 hover:text-primary transition-all">
                    <Link href="/portfolio">
                        View Master Portfolio <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </Button>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-6">
                {/* Metric Summary Ribbon */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Portfolio Market Value */}
                    <div className="p-3.5 rounded-xl bg-card border border-border/60 shadow-sm space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            Portfolio Value
                        </span>
                        <div className="text-xl font-black font-mono text-foreground">
                            {format(totalVal)}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium block">
                            Invested: <span className="font-bold text-foreground font-mono">{format(totalCost)}</span>
                        </span>
                    </div>

                    {/* Total Profit / Loss */}
                    <div className="p-3.5 rounded-xl bg-card border border-border/60 shadow-sm space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            Total Return (P&L)
                        </span>
                        <div className={cn("text-xl font-black font-mono flex items-center gap-1", isPositivePL ? "text-emerald-500" : "text-rose-500")}>
                            {isPositivePL ? '+' : ''}{format(totalPL)}
                        </div>
                        <span className={cn("text-[10px] font-extrabold font-mono inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md", isPositivePL ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                            {isPositivePL ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {plPercent >= 0 ? '+' : ''}{(plPercent || 0).toFixed(2)}% ROI
                        </span>
                    </div>

                    {/* Dividends Earned */}
                    <div className="p-3.5 rounded-xl bg-card border border-border/60 shadow-sm space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            Dividends Income
                        </span>
                        <div className="text-xl font-black font-mono text-emerald-500">
                            {format(totalDivs)}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium block">
                            Passive payouts received
                        </span>
                    </div>

                    {/* Compounding XIRR */}
                    <div className="p-3.5 rounded-xl bg-card border border-border/60 shadow-sm space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            Annualized XIRR
                        </span>
                        <div className="text-xl font-black font-mono text-indigo-500">
                            {(xirr || 0).toFixed(2)}%
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium block">
                            Money-weighted yield
                        </span>
                    </div>
                </div>

                {/* Split Layout: Asset Donut Chart + Top Positions */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Left: Donut Chart with View Toggle */}
                    <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl bg-muted/20 border border-border/40 min-h-[230px]">
                        <div className="flex items-center justify-between w-full mb-2 gap-2">
                            <span className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5 truncate">
                                <PieIcon className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                {chartView === 'shares' ? 'Invested Share Distribution' : 'Capital Allocation'}
                            </span>

                            {/* Chart View Mode Switcher */}
                            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/40 shrink-0 select-none">
                                <button
                                    onClick={() => setChartView('shares')}
                                    className={cn(
                                        "px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all",
                                        chartView === 'shares' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    By Shares
                                </button>
                                <button
                                    onClick={() => setChartView('allocation')}
                                    className={cn(
                                        "px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all",
                                        chartView === 'allocation' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Allocation
                                </button>
                            </div>
                        </div>

                        <div className="relative w-full h-[160px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={activeChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={65}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {activeChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} className="transition-opacity duration-300 hover:opacity-85" />
                                        ))}
                                    </Pie>
                                    <Tooltip wrapperStyle={{ zIndex: 1000 }} content={<ChartTooltip showPercentage totalValue={totalVal} />} />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Center Net Worth Label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                                    {chartView === 'shares' ? 'By Shares' : 'By Type'}
                                </span>
                                <span className="text-xs font-black font-mono text-foreground">
                                    {activeChartData.length} Items
                                </span>
                            </div>
                        </div>

                        {/* Legend pills */}
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[10px]">
                            {activeChartData.slice(0, 4).map((item) => (
                                <span key={item.category} className="inline-flex items-center gap-1 font-bold text-muted-foreground bg-card px-2 py-0.5 rounded-md border border-border/60">
                                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                    {item.category}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Right: Top Asset Positions */}
                    <div className="lg:col-span-7 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Award className="h-3.5 w-3.5 text-amber-500" /> Top Asset Positions
                            </span>
                            <span className="text-[11px] text-muted-foreground font-medium">Sorted by Market Value</span>
                        </div>

                        <div className="space-y-2">
                            {topHoldings.map((h: any) => {
                                const hPLPercent = h.totalProfitLossPercentage ?? h.unrealizedPLPercentage ?? 0
                                const hPos = (h.totalProfitLoss ?? h.unrealizedPL ?? 0) >= 0
                                return (
                                    <div key={h.assetId || h.symbol} className="p-3 rounded-xl bg-card border border-border/60 flex items-center justify-between gap-3 hover:border-border transition-colors">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center font-black font-mono text-xs text-foreground shrink-0 border border-border/40">
                                                {h.symbol.slice(0, 3)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-extrabold text-foreground text-xs font-mono">{h.symbol}</span>
                                                    <TradingViewLink symbol={h.symbol} exchange={h.exchange} />
                                                </div>
                                                <p className="text-[10px] text-muted-foreground truncate">{h.name}</p>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <div className="font-mono font-black text-xs text-foreground">
                                                {format(h.currentValue || 0)}
                                            </div>
                                            <span className={cn("text-[10px] font-mono font-bold inline-flex items-center gap-0.5", hPos ? "text-emerald-500" : "text-rose-500")}>
                                                {hPos ? '+' : ''}{hPLPercent.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
