'use client'

import { useState, useEffect } from 'react'
import { 
    Layers, 
    Search, 
    Plus, 
    Trash2, 
    TrendingUp, 
    TrendingDown, 
    Building2, 
    Globe, 
    Receipt, 
    Coins,
    RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PortfolioNav } from '@/components/portfolio/portfolio-nav'
import { AddAssetDialog } from '@/components/portfolio/add-asset-dialog'
import { AddTransactionDialog } from '@/components/portfolio/add-transaction-dialog'
import { AddDividendDialog } from '@/components/portfolio/add-dividend-dialog'
import { PortfolioEmptyState } from '@/components/portfolio/portfolio-empty-state'
import { TradingViewLink } from '@/components/portfolio/tradingview-link'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'
import { api } from '@/services/api'
import { useCurrency } from '@/hooks/use-currency'
import { cn } from '@/lib/utils'

const CATEGORY_FILTERS = [
    { id: 'all', label: 'All Classes' },
    { id: 'stocks', label: 'Stocks' },
    { id: 'etfs', label: 'ETFs' },
    { id: 'mutual_funds', label: 'Mutual Funds' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'bonds', label: 'Bonds' },
    { id: 'fixed_deposits', label: 'Fixed Deposits' },
    { id: 'savings_accounts', label: 'Cash & Savings' }
]

export default function PortfolioAssetsPage() {
    const { format } = useCurrency()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [assets, setAssets] = useState<any[]>([])

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')

    // Modals
    const [isAddAssetOpen, setIsAddAssetOpen] = useState(false)
    const [isAddTxOpen, setIsAddTxOpen] = useState(false)
    const [isAddDividendOpen, setIsAddDividendOpen] = useState(false)
    const [selectedAssetIdForTx, setSelectedAssetIdForTx] = useState<string | undefined>(undefined)
    const [selectedAssetIdForDiv, setSelectedAssetIdForDiv] = useState<string | undefined>(undefined)

    const fetchAssets = async () => {
        try {
            setLoading(true)
            setError('')
            const res = await api.get('/portfolio/assets')
            setAssets(res.data || [])
        } catch (err: any) {
            console.error('Failed to fetch assets:', err)
            setError(err.response?.data?.error || 'Failed to load assets catalog')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAssets()

        const handlePricesRefreshed = () => {
            fetchAssets()
        }

        if (typeof window !== 'undefined') {
            window.addEventListener('portfolio-prices-refreshed', handlePricesRefreshed)
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('portfolio-prices-refreshed', handlePricesRefreshed)
            }
        }
    }, [])

    // Delete Modal state
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; id?: string; name?: string }>({ isOpen: false })
    const [deleting, setDeleting] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const confirmDeleteAsset = async () => {
        if (!deleteModalState.id) return
        const targetId = deleteModalState.id
        try {
            setDeleting(true)
            setDeletingId(targetId)
            setDeleteModalState({ isOpen: false })

            // Wait 300ms for smooth exit animation
            await new Promise(r => setTimeout(r, 300))

            await api.delete(`/portfolio/assets/${targetId}`)
            await fetchAssets()
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete asset')
        } finally {
            setDeleting(false)
            setDeletingId(null)
        }
    }

    // Filter Logic
    const filteredAssets = assets.filter(asset => {
        const matchesSearch = asset.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              asset.exchange?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              asset.currency?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = categoryFilter === 'all' ? true : asset.assetType === categoryFilter
        return matchesSearch && matchesCategory
    })

    const uniqueCategoriesCount = new Set(assets.map(a => a.assetType)).size
    const uniqueExchangesCount = new Set(assets.map(a => a.exchange || 'NSE')).size

    return (
        <div className="container mx-auto p-4 sm:p-6 space-y-6">
            <PortfolioNav
                onOpenAddAsset={() => setIsAddAssetOpen(true)}
                onOpenAddTx={() => setIsAddTxOpen(true)}
            />

            {/* Top Metric Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border border-border/80 bg-gradient-to-br from-card to-muted/40 shadow-sm rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-semibold flex items-center justify-between">
                            Total Registered Assets
                            <Layers className="h-4 w-4 text-indigo-500" />
                        </CardDescription>
                        <CardTitle className="text-2xl font-black text-indigo-500">
                            {loading ? '...' : assets.length} Symbols
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        Master investment directory catalog
                    </CardContent>
                </Card>

                <Card className="border border-border/80 bg-gradient-to-br from-card to-muted/40 shadow-sm rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-semibold flex items-center justify-between">
                            Asset Classes Tracked
                            <Building2 className="h-4 w-4 text-emerald-500" />
                        </CardDescription>
                        <CardTitle className="text-2xl font-black text-emerald-500">
                            {loading ? '...' : uniqueCategoriesCount} Categories
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        Stocks, ETFs, Mutual Funds, Crypto & Cash
                    </CardContent>
                </Card>

                <Card className="border border-border/80 bg-gradient-to-br from-card to-muted/40 shadow-sm rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-semibold flex items-center justify-between">
                            Exchanges & Markets
                            <Globe className="h-4 w-4 text-cyan-500" />
                        </CardDescription>
                        <CardTitle className="text-2xl font-black text-cyan-500">
                            {loading ? '...' : uniqueExchangesCount} Exchanges
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        NSE, BSE, NASDAQ, US & Global Markets
                    </CardContent>
                </Card>
            </div>

            {/* Assets Table Container */}
            <Card className="border border-border/80 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="pb-4 border-b border-border/60">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                                <Layers className="h-4 w-4 text-primary" />
                                Master Assets Directory
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                View, search, and manage all your registered portfolio assets & live market prices
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <input
                                    type="text"
                                    placeholder="Search ticker symbol or name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-4 py-2 bg-muted/50 border border-border/80 focus:border-primary rounded-xl text-xs transition-all outline-none text-foreground font-medium"
                                />
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            </div>

                            <Button
                                size="sm"
                                onClick={() => setIsAddAssetOpen(true)}
                                className="rounded-xl text-xs gap-1.5 bg-custom-btn-gradient text-white shadow-sm shrink-0"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add Asset</span>
                            </Button>
                        </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 [::-webkit-scrollbar]:hidden">
                        {CATEGORY_FILTERS.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setCategoryFilter(cat.id)}
                                className={cn(
                                    "px-3 py-1 rounded-full text-[11px] font-extrabold transition-all whitespace-nowrap",
                                    categoryFilter === cat.id
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
                            Loading master assets directory & live prices...
                        </div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="py-8">
                            <PortfolioEmptyState
                                imageSrc="/portfolio/assets-empty.svg"
                                title="No Investment Assets Found"
                                description="Add your stocks, mutual funds, ETFs, or cryptocurrencies to start tracking live prices and logging trades."
                                actionLabel="Add Investment Asset"
                                onAction={() => setIsAddAssetOpen(true)}
                            />
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-bold">
                                    <th className="p-3.5 pl-6">Ticker / Symbol</th>
                                    <th className="p-3.5">Asset Class</th>
                                    <th className="p-3.5">Exchange</th>
                                    <th className="p-3.5">Currency</th>
                                    <th className="p-3.5 text-right">Live Price</th>
                                    <th className="p-3.5 text-right">24h Change</th>
                                    <th className="p-3.5 pr-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40 font-medium">
                                {filteredAssets.map((asset) => {
                                    const isPositive = (asset.dayChange || 0) >= 0
                                    const isDeleting = deletingId === asset._id
                                    return (
                                        <tr
                                            key={asset._id}
                                            className={cn(
                                                "transition-all duration-300 ease-out",
                                                isDeleting
                                                    ? "opacity-0 scale-95 -translate-x-8 bg-rose-500/20 pointer-events-none"
                                                    : "hover:bg-muted/30"
                                            )}
                                        >
                                            <td className="p-3.5 pl-6">
                                                <div className="font-extrabold text-foreground font-mono text-xs flex items-center gap-1.5">
                                                    <span>{asset.symbol}</span>
                                                    <TradingViewLink symbol={asset.symbol} exchange={asset.exchange} />
                                                </div>
                                                <div className="text-[11px] text-muted-foreground truncate max-w-[220px]">{asset.name}</div>
                                            </td>
                                            <td className="p-3.5">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                                    {(asset.assetType || 'stocks').replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-3.5 font-semibold text-muted-foreground">{asset.exchange || 'NSE'}</td>
                                            <td className="p-3.5 font-mono font-bold text-foreground">{asset.currency || 'INR'}</td>
                                            <td className="p-3.5 text-right font-mono">
                                                <div className="font-extrabold text-foreground">{asset.currentPrice ? format(asset.currentPrice) : '—'}</div>
                                                {asset.isOffline ? (
                                                    <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full inline-block mt-0.5" title="Viewing cached offline price from DB">
                                                        Offline (Cached)
                                                    </span>
                                                ) : asset.lastPriceUpdatedAt ? (
                                                    <span className="text-[9px] text-muted-foreground block" title="Last recorded in database">
                                                        {new Date(asset.lastPriceUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="p-3.5 text-right font-mono">
                                                {asset.dayChange !== undefined ? (
                                                    <span className={cn(
                                                        "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold",
                                                        isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                                    )}>
                                                        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                        {isPositive ? '+' : ''}{asset.dayChange.toFixed(2)}%
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-[10px]">—</span>
                                                )}
                                            </td>
                                            <td className="p-3.5 pr-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedAssetIdForTx(asset._id)
                                                            setIsAddTxOpen(true)
                                                        }}
                                                        className="h-7 text-[11px] px-2 rounded-lg gap-1 border-primary/30 text-primary hover:bg-primary/10"
                                                        title="Record trade for this asset"
                                                    >
                                                        <Receipt className="h-3 w-3" /> Trade
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedAssetIdForDiv(asset._id)
                                                            setIsAddDividendOpen(true)
                                                        }}
                                                        className="h-7 text-[11px] px-2 rounded-lg gap-1 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                                                        title="Record dividend for this asset"
                                                    >
                                                        <Coins className="h-3 w-3" /> Dividend
                                                    </Button>
                                                    <button
                                                        onClick={() => setDeleteModalState({ isOpen: true, id: asset._id, name: `${asset.symbol} - ${asset.name}` })}
                                                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all hover:scale-110 active:scale-95"
                                                        title="Delete asset from catalog"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ isOpen: false })}
                onConfirm={confirmDeleteAsset}
                title="Delete Registered Asset"
                description="Are you sure you want to delete this asset from your master catalog? Associated buy/sell trade records will also be removed."
                itemName={deleteModalState.name}
                loading={deleting}
            />

            {/* Modals */}
            <AddAssetDialog
                isOpen={isAddAssetOpen}
                onClose={() => setIsAddAssetOpen(false)}
                onSuccess={fetchAssets}
            />

            <AddTransactionDialog
                isOpen={isAddTxOpen}
                onClose={() => {
                    setIsAddTxOpen(false)
                    setSelectedAssetIdForTx(undefined)
                }}
                onSuccess={fetchAssets}
                assets={assets}
                initialAssetId={selectedAssetIdForTx}
            />

            <AddDividendDialog
                isOpen={isAddDividendOpen}
                onClose={() => {
                    setIsAddDividendOpen(false)
                    setSelectedAssetIdForDiv(undefined)
                }}
                onSuccess={fetchAssets}
                assets={assets}
                initialAssetId={selectedAssetIdForDiv}
            />
        </div>
    )
}
