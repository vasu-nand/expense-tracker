'use client'

import { useState, useEffect } from 'react'
import { 
    TrendingUp, 
    TrendingDown, 
    Wallet, 
    PieChart as PieIcon, 
    ArrowUpRight, 
    ArrowDownLeft, 
    DollarSign, 
    RefreshCw, 
    Plus, 
    Receipt, 
    Target, 
    Coins, 
    CheckCircle2, 
    AlertTriangle,
    Building2,
    ShieldCheck
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PortfolioNav } from '@/components/portfolio/portfolio-nav'
import { AddAssetDialog } from '@/components/portfolio/add-asset-dialog'
import { AddTransactionDialog } from '@/components/portfolio/add-transaction-dialog'
import { AddDividendDialog } from '@/components/portfolio/add-dividend-dialog'
import { AddGoalDialog } from '@/components/portfolio/add-goal-dialog'
import { api } from '@/services/api'
import { useCurrency } from '@/hooks/use-currency'
import { cn } from '@/lib/utils'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const ASSET_COLORS: Record<string, string> = {
    stocks: '#6366f1',
    etfs: '#10b981',
    mutual_funds: '#06b6d4',
    bonds: '#f59e0b',
    crypto: '#ec4899',
    gold_silver: '#eab308',
    real_estate: '#8b5cf6',
    fixed_deposits: '#14b8a6',
    retirement_plans: '#3b82f6',
    savings_accounts: '#64748b'
}

import { PortfolioEmptyState } from '@/components/portfolio/portfolio-empty-state'

export default function PortfolioOverviewPage() {
    const { format } = useCurrency()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [summaryData, setSummaryData] = useState<any>(null)
    const [assetsList, setAssetsList] = useState<any[]>([])

    // Modals state
    const [isAddAssetOpen, setIsAddAssetOpen] = useState(false)
    const [isAddTxOpen, setIsAddTxOpen] = useState(false)
    const [isAddDividendOpen, setIsAddDividendOpen] = useState(false)
    const [isAddGoalOpen, setIsAddGoalOpen] = useState(false)

    const fetchPortfolioData = async () => {
        try {
            setLoading(true)
            setError('')
            const [sumRes, assetsRes] = await Promise.all([
                api.get('/portfolio/summary'),
                api.get('/portfolio/assets')
            ])
            setSummaryData(sumRes.data)
            setAssetsList(assetsRes.data || [])
        } catch (err: any) {
            console.error('Failed to fetch portfolio summary:', err)
            setError(err.response?.data?.error || 'Failed to load portfolio details')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPortfolioData()
    }, [])

    const summary = summaryData?.summary || {}
    const holdings = summaryData?.holdings || []

    const allocationData = Object.entries(summary.assetAllocation || {}).map(([key, value]) => ({
        name: key.replace('_', ' ').toUpperCase(),
        value: Number(value),
        key
    }))

    const isPositivePL = (summary.totalProfitLoss || 0) >= 0

    return (
        <div className="container mx-auto p-4 sm:p-6 space-y-6">
            <PortfolioNav
                onOpenAddAsset={() => setIsAddAssetOpen(true)}
                onOpenAddTx={() => setIsAddTxOpen(true)}
                onOpenAddGoal={() => setIsAddGoalOpen(true)}
            />

            {error && (
                <div className="p-4 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between">
                    <span>{error}</span>
                    <Button size="sm" variant="ghost" onClick={fetchPortfolioData} className="text-xs">
                        <RefreshCw className="h-4 w-4 mr-1" /> Retry
                    </Button>
                </div>
            )}

            {/* Top Net Worth & Performance Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-border/80 bg-gradient-to-br from-card to-muted/40 shadow-sm rounded-2xl relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Total Net Worth
                        </CardDescription>
                        <CardTitle className="text-2xl sm:text-3xl font-black text-foreground">
                            {loading ? '...' : format(summary.netWorth || 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
                        <span>Inv Value: {format(summary.currentValue || 0)}</span>
                        <span>Cash: {format(summary.bankBalances || 0)}</span>
                    </CardContent>
                </Card>

                <Card className="border border-border/80 bg-gradient-to-br from-card to-muted/40 shadow-sm rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Invested Capital
                        </CardDescription>
                        <CardTitle className="text-2xl sm:text-3xl font-black text-foreground">
                            {loading ? '...' : format(summary.totalInvestment || 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
                        <span>Current: {format(summary.currentValue || 0)}</span>
                        <span className="font-semibold text-primary">Holdings: {holdings.length}</span>
                    </CardContent>
                </Card>

                <Card className="border border-border/80 bg-gradient-to-br from-card to-muted/40 shadow-sm rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Total Profit & Loss
                        </CardDescription>
                        <CardTitle className={cn(
                            "text-2xl sm:text-3xl font-black flex items-center gap-1.5",
                            isPositivePL ? "text-emerald-500" : "text-rose-500"
                        )}>
                            {isPositivePL ? <TrendingUp className="h-6 w-6 shrink-0" /> : <TrendingDown className="h-6 w-6 shrink-0" />}
                            {loading ? '...' : format(summary.totalProfitLoss || 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs font-semibold flex items-center justify-between">
                        <span className={isPositivePL ? "text-emerald-500" : "text-rose-500"}>
                            {summary.totalProfitLossPercentage ? summary.totalProfitLossPercentage.toFixed(2) : '0.00'}%
                        </span>
                        <span className="text-muted-foreground">
                            Dividends: {format(summary.totalDividends || 0)}
                        </span>
                    </CardContent>
                </Card>

                <Card className="border border-border/80 bg-gradient-to-br from-card to-muted/40 shadow-sm rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Annualized XIRR Return
                        </CardDescription>
                        <CardTitle className="text-2xl sm:text-3xl font-black text-indigo-500">
                            {loading ? '...' : `${(summary.xirr || 0).toFixed(2)}%`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
                        <span>Realized P&L: {format(summary.realizedPL || 0)}</span>
                        <span>Unrealized: {format(summary.unrealizedPL || 0)}</span>
                    </CardContent>
                </Card>
            </div>

            {/* Middle Section: Holdings & Asset Allocation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Holdings Table */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="border border-border/80 rounded-2xl shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
                            <div>
                                <CardTitle className="text-base font-extrabold text-foreground">
                                    Active Holdings & Positions
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Real-time valuation and cost basis for open positions
                                </CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button size="sm" variant="outline" onClick={() => setIsAddAssetOpen(true)} className="text-xs gap-1 rounded-xl">
                                    <Plus className="h-3.5 w-3.5" /> Asset
                                </Button>
                                <Button size="sm" onClick={() => setIsAddTxOpen(true)} className="text-xs gap-1 rounded-xl bg-custom-btn-gradient text-white">
                                    <Plus className="h-3.5 w-3.5" /> Record Tx
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0 overflow-x-auto">
                            {loading ? (
                                <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
                                    Loading active portfolio positions...
                                </div>
                            ) : holdings.length === 0 ? (
                                <PortfolioEmptyState
                                    title="No Active Holdings Recorded Yet"
                                    description="Start building your investment portfolio by registering an asset and recording your first buy transaction."
                                    actionLabel="Record Buy Transaction"
                                    onAction={() => setIsAddTxOpen(true)}
                                    secondaryActionLabel="Add Asset Ticker"
                                    onSecondaryAction={() => setIsAddAssetOpen(true)}
                                />
                            ) : (
                                <table className="w-full min-w-[640px] text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-bold uppercase tracking-wider">
                                            <th className="p-3.5">Asset / Ticker</th>
                                            <th className="p-3.5">Category</th>
                                            <th className="p-3.5 text-right">Quantity</th>
                                            <th className="p-3.5 text-right">Avg Cost</th>
                                            <th className="p-3.5 text-right">Live Price</th>
                                            <th className="p-3.5 text-right">Current Value</th>
                                            <th className="p-3.5 text-right">Unrealized P&L</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {holdings.map((h: any) => {
                                            const isGain = h.unrealizedPL >= 0
                                            return (
                                                <tr key={h.assetId} className="hover:bg-muted/30 transition-colors">
                                                    <td className="p-3.5 font-bold text-foreground">
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-sm">{h.symbol}</span>
                                                            <span className="text-[11px] text-muted-foreground font-normal truncate max-w-[140px]">{h.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-primary/10 text-primary">
                                                            {h.assetType.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 text-right font-mono font-semibold">
                                                        {h.quantity.toLocaleString('en-IN', { maximumFractionDigits: 4 })}
                                                    </td>
                                                    <td className="p-3.5 text-right font-mono text-muted-foreground">
                                                        {format(h.averageBuyPrice)}
                                                    </td>
                                                    <td className="p-3.5 text-right font-mono font-bold text-foreground">
                                                        {format(h.currentPrice)}
                                                        {h.dayChange !== undefined && (
                                                            <span className={cn(
                                                                "block text-[10px]",
                                                                h.dayChange >= 0 ? "text-emerald-500" : "text-rose-500"
                                                            )}>
                                                                {h.dayChange >= 0 ? '+' : ''}{h.dayChange.toFixed(2)}%
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3.5 text-right font-mono font-black text-foreground">
                                                        {format(h.currentValue)}
                                                    </td>
                                                    <td className="p-3.5 text-right font-mono">
                                                        <span className={cn(
                                                            "font-bold block",
                                                            isGain ? "text-emerald-500" : "text-rose-500"
                                                        )}>
                                                            {isGain ? '+' : ''}{format(h.unrealizedPL)}
                                                        </span>
                                                        <span className={cn(
                                                            "text-[10px] font-semibold",
                                                            isGain ? "text-emerald-500" : "text-rose-500"
                                                        )}>
                                                            ({isGain ? '+' : ''}{h.unrealizedPLPercentage.toFixed(2)}%)
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Asset Allocation Chart */}
                <div className="space-y-4">
                    <Card className="border border-border/80 rounded-2xl shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                                <PieIcon className="h-4 w-4 text-primary" />
                                Asset Class Breakdown
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Capital distribution across asset classes
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4">
                            {allocationData.length === 0 ? (
                                <div className="p-8 text-center text-xs text-muted-foreground italic">
                                    No capital allocation data available
                                </div>
                            ) : (
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={allocationData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={85}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {allocationData.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={ASSET_COLORS[entry.key] || '#6366f1'} 
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                formatter={(value: any) => [format(Number(value)), 'Value']}
                                                contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px' }}
                                            />
                                            <Legend 
                                                formatter={(value) => <span className="text-[11px] font-bold text-foreground">{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Dividend Log Widget */}
                    <Card className="border border-border/80 rounded-2xl shadow-sm bg-gradient-to-br from-amber-500/5 to-muted/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-extrabold text-foreground flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Coins className="h-4 w-4 text-amber-500" />
                                    Dividend Passive Income
                                </span>
                                <Button size="sm" variant="outline" onClick={() => setIsAddDividendOpen(true)} className="text-[11px] h-7 px-2 rounded-lg">
                                    + Dividend
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                            <div className="flex items-center justify-between font-bold">
                                <span className="text-muted-foreground">Total Dividends Received:</span>
                                <span className="text-amber-500 text-sm font-black">{format(summary.totalDividends || 0)}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Log dividend payments to accurately compute cash inflows and true total investment return (XIRR).
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modals */}
            <AddAssetDialog
                isOpen={isAddAssetOpen}
                onClose={() => setIsAddAssetOpen(false)}
                onSuccess={fetchPortfolioData}
            />
            <AddTransactionDialog
                isOpen={isAddTxOpen}
                onClose={() => setIsAddTxOpen(false)}
                onSuccess={fetchPortfolioData}
                assets={assetsList}
            />
            <AddDividendDialog
                isOpen={isAddDividendOpen}
                onClose={() => setIsAddDividendOpen(false)}
                onSuccess={fetchPortfolioData}
                assets={assetsList}
            />
            <AddGoalDialog
                isOpen={isAddGoalOpen}
                onClose={() => setIsAddGoalOpen(false)}
                onSuccess={fetchPortfolioData}
            />
        </div>
    )
}
