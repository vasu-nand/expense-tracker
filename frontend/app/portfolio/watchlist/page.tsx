'use client'

import { useState, useEffect } from 'react'
import { 
    Eye, 
    Bell, 
    Plus, 
    Trash2, 
    TrendingUp, 
    TrendingDown, 
    AlertCircle, 
    CheckCircle2,
    RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PortfolioNav } from '@/components/portfolio/portfolio-nav'
import { AddWatchlistDialog } from '@/components/portfolio/add-watchlist-dialog'
import { AddAlertDialog } from '@/components/portfolio/add-alert-dialog'
import { api } from '@/services/api'
import { useCurrency } from '@/hooks/use-currency'
import { cn } from '@/lib/utils'
import { PortfolioEmptyState } from '@/components/portfolio/portfolio-empty-state'

export default function WatchlistPage() {
    const { format } = useCurrency()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [watchlist, setWatchlist] = useState<any[]>([])
    const [alerts, setAlerts] = useState<any[]>([])

    // Dialog state
    const [isAddWatchlistOpen, setIsAddWatchlistOpen] = useState(false)
    const [isAddAlertOpen, setIsAddAlertOpen] = useState(false)
    const [selectedAlertSymbol, setSelectedAlertSymbol] = useState('')
    const [selectedAlertPrice, setSelectedAlertPrice] = useState<number | undefined>(undefined)

    const fetchData = async () => {
        try {
            setLoading(true)
            setError('')
            const [watchRes, alertRes] = await Promise.all([
                api.get('/portfolio/watchlist'),
                api.get('/portfolio/alerts')
            ])
            setWatchlist(watchRes.data || [])
            setAlerts(alertRes.data || [])
        } catch (err: any) {
            console.error('Failed to fetch watchlist/alerts:', err)
            setError(err.response?.data?.error || 'Failed to load watchlist details')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleRemoveWatchlist = async (id: string) => {
        try {
            await api.delete(`/portfolio/watchlist/${id}`)
            fetchData()
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to remove item from watchlist')
        }
    }

    const handleDeleteAlert = async (id: string) => {
        try {
            await api.delete(`/portfolio/alerts/${id}`)
            fetchData()
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete price alert')
        }
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 space-y-6">
            <PortfolioNav
                onOpenAddWatchlist={() => setIsAddWatchlistOpen(true)}
                onOpenAddAlert={() => setIsAddAlertOpen(true)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Watchlist Section */}
                <Card className="border border-border/80 rounded-2xl shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
                        <div>
                            <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                                <Eye className="h-4 w-4 text-cyan-500" />
                                Market Watchlist
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Real-time price tracking for target tickers
                            </CardDescription>
                        </div>
                        <Button size="sm" onClick={() => setIsAddWatchlistOpen(true)} className="text-xs gap-1 rounded-xl bg-custom-btn-gradient text-white">
                            <Plus className="h-3.5 w-3.5" /> Watch Ticker
                        </Button>
                    </CardHeader>

                    <CardContent className="p-0 overflow-x-auto">
                        {loading ? (
                            <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
                                Fetching live watchlist prices...
                            </div>
                        ) : watchlist.length === 0 ? (
                            <PortfolioEmptyState
                                imageSrc="/portfolio/watchlist-empty.svg"
                                title="Your Watchlist is Empty"
                                description="Track your favorite stocks, ETFs, or cryptocurrencies in real-time."
                                actionLabel="Watch Ticker"
                                onAction={() => setIsAddWatchlistOpen(true)}
                            />
                        ) : (
                            <table className="w-full min-w-[480px] text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-bold uppercase tracking-wider">
                                        <th className="p-3.5">Ticker / Asset</th>
                                        <th className="p-3.5">Category</th>
                                        <th className="p-3.5 text-right">Live Price</th>
                                        <th className="p-3.5 text-right">24h Change</th>
                                        <th className="p-3.5 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {watchlist.map((item: any) => {
                                        const isUp = (item.dayChange || 0) >= 0
                                        return (
                                            <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-3.5 font-bold text-foreground">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-sm">{item.symbol}</span>
                                                        <span className="text-[11px] text-muted-foreground font-normal">{item.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3.5">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-primary/10 text-primary">
                                                        {item.assetType}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-right font-mono font-bold text-foreground">
                                                    {format(item.currentPrice)}
                                                </td>
                                                <td className="p-3.5 text-right font-mono font-bold">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-0.5",
                                                        isUp ? "text-emerald-500" : "text-rose-500"
                                                    )}>
                                                        {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                        {isUp ? '+' : ''}{item.dayChange ? item.dayChange.toFixed(2) : '0.00'}%
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-center flex items-center justify-center gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setSelectedAlertSymbol(item.symbol)
                                                            setSelectedAlertPrice(item.currentPrice)
                                                            setIsAddAlertOpen(true)
                                                        }}
                                                        className="h-7 px-2 text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-500/10 rounded-lg gap-1 font-bold"
                                                        title={`Set price alert for ${item.symbol}`}
                                                    >
                                                        <Bell className="h-3.5 w-3.5" />
                                                        <span className="hidden sm:inline">Set Alert</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleRemoveWatchlist(item._id)}
                                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                                                        title="Remove from watchlist"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>

                {/* Price Alerts Section */}
                <Card className="border border-border/80 rounded-2xl shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
                        <div>
                            <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                                <Bell className="h-4 w-4 text-orange-500" />
                                Price Alerts & Notifications
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Triggers when market prices breach your threshold
                            </CardDescription>
                        </div>
                        <Button size="sm" onClick={() => setIsAddAlertOpen(true)} className="text-xs gap-1 rounded-xl bg-custom-btn-gradient text-white">
                            <Plus className="h-3.5 w-3.5" /> Set Alert
                        </Button>
                    </CardHeader>

                    <CardContent className="p-0 overflow-x-auto">
                        {loading ? (
                            <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
                                Checking price alert conditions...
                            </div>
                        ) : alerts.length === 0 ? (
                            <PortfolioEmptyState
                                imageSrc="/portfolio/watchlist-empty.svg"
                                title="No Price Alerts Set"
                                description="Get notified instantly when stock or asset prices reach your target threshold."
                                actionLabel="Set Price Alert"
                                onAction={() => setIsAddAlertOpen(true)}
                            />
                        ) : (
                            <table className="w-full min-w-[480px] text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-bold uppercase tracking-wider">
                                        <th className="p-3.5">Symbol</th>
                                        <th className="p-3.5">Condition</th>
                                        <th className="p-3.5 text-right">Target Price</th>
                                        <th className="p-3.5 text-center">Status</th>
                                        <th className="p-3.5 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {alerts.map((alertItem: any) => {
                                        return (
                                            <tr key={alertItem._id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-3.5 font-black text-foreground font-mono">
                                                    {alertItem.symbol}
                                                </td>
                                                <td className="p-3.5 font-semibold text-muted-foreground">
                                                    {alertItem.condition === 'above' ? 'Price Rises >' : 'Price Drops <'}
                                                </td>
                                                <td className="p-3.5 text-right font-mono font-bold text-foreground">
                                                    {format(alertItem.targetPrice)}
                                                </td>
                                                <td className="p-3.5 text-center">
                                                    <span className={cn(
                                                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1",
                                                        alertItem.triggered
                                                            ? "bg-rose-500/10 text-rose-500 animate-pulse"
                                                            : "bg-emerald-500/10 text-emerald-500"
                                                    )}>
                                                        {alertItem.triggered ? <AlertCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                                                        {alertItem.triggered ? 'Triggered!' : 'Monitoring'}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-center">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteAlert(alertItem._id)}
                                                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
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

            <AddWatchlistDialog
                isOpen={isAddWatchlistOpen}
                onClose={() => setIsAddWatchlistOpen(false)}
                onSuccess={fetchData}
            />
            <AddAlertDialog
                isOpen={isAddAlertOpen}
                onClose={() => {
                    setIsAddAlertOpen(false)
                    setSelectedAlertSymbol('')
                    setSelectedAlertPrice(undefined)
                }}
                onSuccess={fetchData}
                watchlist={watchlist}
                defaultSymbol={selectedAlertSymbol}
                defaultPrice={selectedAlertPrice}
            />
        </div>
    )
}
