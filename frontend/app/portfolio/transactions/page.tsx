'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { 
    Receipt, 
    Coins, 
    Layers,
    ArrowUpRight, 
    ArrowDownLeft, 
    Search, 
    Filter, 
    Plus, 
    Trash2, 
    Pencil,
    RefreshCw, 
    Calendar,
    DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PortfolioNav } from '@/components/portfolio/portfolio-nav'
import { AddTransactionDialog } from '@/components/portfolio/add-transaction-dialog'
import { AddDividendDialog } from '@/components/portfolio/add-dividend-dialog'
import { AddAssetDialog } from '@/components/portfolio/add-asset-dialog'
import { api } from '@/services/api'
import { useCurrency } from '@/hooks/use-currency'
import { cn } from '@/lib/utils'

import { PortfolioEmptyState } from '@/components/portfolio/portfolio-empty-state'
import { BottomSelect } from '@/components/ui/bottom-select'
import { TradingViewLink } from '@/components/portfolio/tradingview-link'

export default function PortfolioTransactionsPage() {
    const { format } = useCurrency()
    const [activeTab, setActiveTab] = useState<'transactions' | 'dividends' | 'assets'>('transactions')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [transactions, setTransactions] = useState<any[]>([])
    const [dividends, setDividends] = useState<any[]>([])
    const [assetsList, setAssetsList] = useState<any[]>([])

    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('')
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [typeFilter, setTypeFilter] = useState<'all' | 'buy' | 'sell'>('all')

    const searchRef = useRef<HTMLInputElement>(null)
    const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 })

    const updatePopoverCoords = () => {
        if (searchRef.current) {
            const rect = searchRef.current.getBoundingClientRect()
            setPopoverCoords({
                top: rect.bottom + 6,
                left: rect.left,
                width: rect.width
            })
        }
    }

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.tx-search-container')) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    useEffect(() => {
        if (showSuggestions) {
            updatePopoverCoords()
            window.addEventListener('resize', updatePopoverCoords)
            window.addEventListener('scroll', updatePopoverCoords, true)
        }
        return () => {
            window.removeEventListener('resize', updatePopoverCoords)
            window.removeEventListener('scroll', updatePopoverCoords, true)
        }
    }, [showSuggestions, searchQuery])

    // Modals
    const [isAddTxOpen, setIsAddTxOpen] = useState(false)
    const [isAddDividendOpen, setIsAddDividendOpen] = useState(false)
    const [isAddAssetOpen, setIsAddAssetOpen] = useState(false)
    const [editingTx, setEditingTx] = useState<any>(null)
    const [editingDividend, setEditingDividend] = useState<any>(null)

    const fetchAllData = async () => {
        try {
            setLoading(true)
            setError('')
            const [txRes, divRes, assetRes] = await Promise.all([
                api.get('/portfolio/transactions'),
                api.get('/portfolio/dividends'),
                api.get('/portfolio/assets')
            ])
            setTransactions(txRes.data || [])
            setDividends(divRes.data || [])
            setAssetsList(assetRes.data || [])
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load portfolio ledgers')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAllData()
    }, [])

    const handleDeleteTx = async (id: string) => {
        if (!confirm('Are you sure you want to delete this transaction record?')) return
        try {
            await api.delete(`/portfolio/transactions/${id}`)
            fetchDataSilently()
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete transaction')
        }
    }

    const handleDeleteDividend = async (id: string) => {
        if (!confirm('Are you sure you want to delete this dividend entry?')) return
        try {
            await api.delete(`/portfolio/dividends/${id}`)
            fetchDataSilently()
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete dividend entry')
        }
    }

    const handleDeleteAsset = async (id: string) => {
        if (!confirm('Are you sure you want to delete this asset from your registered catalog? Associated records will also be removed.')) return
        try {
            await api.delete(`/portfolio/assets/${id}`)
            fetchDataSilently()
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete asset')
        }
    }

    const fetchDataSilently = async () => {
        try {
            const [txRes, divRes, assetRes] = await Promise.all([
                api.get('/portfolio/transactions'),
                api.get('/portfolio/dividends'),
                api.get('/portfolio/assets')
            ])
            setTransactions(txRes.data || [])
            setDividends(divRes.data || [])
            setAssetsList(assetRes.data || [])
        } catch (err) {}
    }

    // Filter Logic
    const filteredTransactions = transactions.filter(tx => {
        const symbolMatch = tx.assetId?.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            tx.assetId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        const typeMatch = typeFilter === 'all' ? true : tx.type === typeFilter
        return symbolMatch && typeMatch
    })

    const filteredDividends = dividends.filter(div => {
        return div.assetId?.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               div.assetId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    })

    const filteredAssets = assetsList.filter(asset => {
        return asset.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               asset.assetType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
               asset.exchange?.toLowerCase().includes(searchQuery.toLowerCase())
    })

    const suggestionsList = (activeTab === 'transactions' ? transactions : activeTab === 'dividends' ? dividends : assetsList)
        .filter(item => {
            if (!searchQuery.trim()) return false
            const q = searchQuery.toLowerCase()
            const sym = item.assetId?.symbol || item.symbol || ''
            const name = item.assetId?.name || item.name || ''
            return sym.toLowerCase().includes(q) || name.toLowerCase().includes(q)
        })
        .slice(0, 5)

    const totalTxValue = transactions.reduce((acc, tx) => acc + (tx.price * tx.quantity), 0)
    const totalDividendValue = dividends.reduce((acc, div) => acc + (div.amount - (div.tax || 0)), 0)

    return (
        <div className="container mx-auto p-4 sm:p-6 space-y-6">
            <PortfolioNav
                onOpenAddAsset={() => setIsAddAssetOpen(true)}
                onOpenAddTx={() => setIsAddTxOpen(true)}
            />

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border border-border/80 bg-gradient-to-br from-card to-muted/40 shadow-sm rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-semibold flex items-center justify-between">
                            Total Trades Logged
                            <Receipt className="h-4 w-4 text-primary" />
                        </CardDescription>
                        <CardTitle className="text-2xl font-black text-foreground">
                            {loading ? '...' : transactions.length} Records
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        Cumulative Volume: <span className="font-bold text-foreground">{format(totalTxValue)}</span>
                    </CardContent>
                </Card>

                <Card className="border border-border/80 bg-gradient-to-br from-card to-muted/40 shadow-sm rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-semibold flex items-center justify-between">
                            Net Dividends Earned
                            <Coins className="h-4 w-4 text-emerald-500" />
                        </CardDescription>
                        <CardTitle className="text-2xl font-black text-emerald-500">
                            {loading ? '...' : format(totalDividendValue)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        Across <span className="font-bold text-foreground">{dividends.length} payout events</span>
                    </CardContent>
                </Card>

                <Card 
                    onClick={() => setActiveTab('assets')}
                    className="border border-border/80 bg-gradient-to-br from-card to-muted/40 shadow-sm rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all"
                >
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-semibold flex items-center justify-between">
                            Tracked Assets Catalog
                            <Layers className="h-4 w-4 text-indigo-500" />
                        </CardDescription>
                        <CardTitle className="text-2xl font-black text-indigo-500">
                            {loading ? '...' : assetsList.length} Symbols
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        Click to view & manage registered assets
                    </CardContent>
                </Card>
            </div>

            {/* Sub-Header Tabs & Filter Controls */}
            <Card className="border border-border/80 rounded-2xl shadow-sm">
                <CardHeader className="pb-3 border-b border-border/60">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => setActiveTab('transactions')}
                                className={cn(
                                    "px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5",
                                    activeTab === 'transactions'
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-muted/50 text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Receipt className="h-4 w-4" />
                                Buy / Sell Trades ({transactions.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('dividends')}
                                className={cn(
                                    "px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5",
                                    activeTab === 'dividends'
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-muted/50 text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Coins className="h-4 w-4" />
                                Dividend Ledger ({dividends.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('assets')}
                                className={cn(
                                    "px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5",
                                    activeTab === 'assets'
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-muted/50 text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Layers className="h-4 w-4" />
                                Registered Assets ({assetsList.length})
                            </button>
                        </div>

                        <div className="flex items-center gap-2 flex-nowrap w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                            {activeTab === 'transactions' && (
                                <div className="min-w-[110px] shrink-0">
                                    <BottomSelect
                                        value={typeFilter}
                                        onChange={(val) => setTypeFilter(val as any)}
                                        options={[
                                            { value: 'all', label: 'All Types' },
                                            { value: 'buy', label: 'Buy Only' },
                                            { value: 'sell', label: 'Sell Only' }
                                        ]}
                                        label="Filter Type"
                                        triggerClassName="py-1.5 text-xs h-8"
                                    />
                                </div>
                            )}

                            <div className="relative flex-1 min-w-[160px] sm:w-64 shrink-0 tx-search-container z-30">
                                <div className="relative">
                                    <input
                                        ref={searchRef}
                                        type="text"
                                        placeholder={activeTab === 'assets' ? "Search ticker or asset name..." : "Search symbol or name..."}
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value)
                                            updatePopoverCoords()
                                            setShowSuggestions(true)
                                        }}
                                        onFocus={() => {
                                            updatePopoverCoords()
                                            setShowSuggestions(true)
                                        }}
                                        className="w-full pl-8 pr-4 py-1.5 bg-muted/50 border border-border/80 focus:border-primary rounded-full text-xs transition-all duration-200 outline-none focus:ring-2 focus:ring-primary/20 text-foreground font-medium"
                                    />
                                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                            </div>

                            {activeTab === 'assets' && (
                                <Button
                                    size="sm"
                                    onClick={() => setIsAddAssetOpen(true)}
                                    className="rounded-xl text-xs gap-1.5 bg-custom-btn-gradient text-white shadow-sm shrink-0"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Add Asset</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
                            Loading portfolio ledgers...
                        </div>
                    ) : activeTab === 'transactions' ? (
                        filteredTransactions.length === 0 ? (
                            <div className="py-8">
                                <PortfolioEmptyState
                                    imageSrc="/portfolio/transactions-empty.svg"
                                    title="No Transactions Found"
                                    description="Record your buy/sell stock trades to track real-time unrealized gains, cost basis, and portfolio returns."
                                    actionLabel="Record Transaction"
                                    onAction={() => setIsAddTxOpen(true)}
                                />
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-bold">
                                        <th className="p-3 pl-6">Type</th>
                                        <th className="p-3">Asset / Symbol</th>
                                        <th className="p-3 text-right">Quantity</th>
                                        <th className="p-3 text-right">Price per Unit</th>
                                        <th className="p-3 text-right">Fees & Tax</th>
                                        <th className="p-3 text-right">Total Amount</th>
                                        <th className="p-3">Date</th>
                                        <th className="p-3 pr-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40 font-medium">
                                    {filteredTransactions.map((tx) => {
                                        const totalAmt = (tx.price * tx.quantity) + (tx.type === 'buy' ? (tx.fees + tx.tax) : -(tx.fees + tx.tax))
                                        return (
                                            <tr key={tx._id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-3 pl-6">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                        tx.type === 'buy' 
                                                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                                                            : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                                    )}>
                                                        {tx.type === 'buy' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-bold text-foreground flex items-center gap-1.5">
                                                        <span>{tx.assetId?.symbol || 'UNASSIGNED'}</span>
                                                        {tx.assetId?.symbol && <TradingViewLink symbol={tx.assetId.symbol} exchange={tx.assetId.exchange} />}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{tx.assetId?.name}</div>
                                                </td>
                                                <td className="p-3 text-right font-mono font-bold">{tx.quantity}</td>
                                                <td className="p-3 text-right font-mono">{format(tx.price)}</td>
                                                <td className="p-3 text-right font-mono text-muted-foreground">{format(tx.fees + tx.tax)}</td>
                                                <td className="p-3 text-right font-mono font-bold text-foreground">{format(totalAmt)}</td>
                                                <td className="p-3 text-muted-foreground whitespace-nowrap">
                                                    {new Date(tx.dateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="p-3 pr-6 text-right flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditingTx(tx)
                                                            setIsAddTxOpen(true)
                                                        }}
                                                        className="p-1 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                                                        title="Edit transaction"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTx(tx._id)}
                                                        className="p-1 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                                                        title="Delete record"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )
                    ) : activeTab === 'dividends' ? (
                        filteredDividends.length === 0 ? (
                            <div className="py-8">
                                <PortfolioEmptyState
                                    imageSrc="/portfolio/transactions-empty.svg"
                                    title="No Dividend Records"
                                    description="Log cash dividends, bonus share payouts, and interest income earned across your portfolio holdings."
                                    actionLabel="Record Dividend"
                                    onAction={() => setIsAddDividendOpen(true)}
                                />
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-bold">
                                        <th className="p-3 pl-6">Asset / Symbol</th>
                                        <th className="p-3 text-right">Gross Amount</th>
                                        <th className="p-3 text-right">Withholding Tax</th>
                                        <th className="p-3 text-right">Net Income</th>
                                        <th className="p-3">Payout Date</th>
                                        <th className="p-3 pr-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40 font-medium">
                                    {filteredDividends.map((div) => {
                                        const netAmt = div.amount - (div.tax || 0)
                                        return (
                                            <tr key={div._id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-3 pl-6">
                                                    <div className="font-bold text-foreground flex items-center gap-1.5">
                                                        <span>{div.assetId?.symbol || 'UNASSIGNED'}</span>
                                                        {div.assetId?.symbol && <TradingViewLink symbol={div.assetId.symbol} exchange={div.assetId.exchange} />}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{div.assetId?.name}</div>
                                                </td>
                                                <td className="p-3 text-right font-mono">{format(div.amount)}</td>
                                                <td className="p-3 text-right font-mono text-muted-foreground">{format(div.tax || 0)}</td>
                                                <td className="p-3 text-right font-mono font-bold text-emerald-500">{format(netAmt)}</td>
                                                <td className="p-3 text-muted-foreground whitespace-nowrap">
                                                    {new Date(div.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="p-3 pr-6 text-right flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditingDividend(div)
                                                            setIsAddDividendOpen(true)
                                                        }}
                                                        className="p-1 rounded-lg text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors"
                                                        title="Edit dividend entry"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteDividend(div._id)}
                                                        className="p-1 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                                                        title="Delete entry"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )
                    ) : (
                        filteredAssets.length === 0 ? (
                            <div className="py-8">
                                <PortfolioEmptyState
                                    imageSrc="/portfolio/portfolio-empty.svg"
                                    title="No Investment Assets Registered"
                                    description="Add investment assets (Stocks, ETFs, Crypto, Mutual Funds, Bonds) to build your portfolio master directory."
                                    actionLabel="Add Investment Asset"
                                    onAction={() => setIsAddAssetOpen(true)}
                                />
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground font-bold">
                                        <th className="p-3 pl-6">Asset / Symbol</th>
                                        <th className="p-3">Asset Class</th>
                                        <th className="p-3">Exchange</th>
                                        <th className="p-3">Currency</th>
                                        <th className="p-3 pr-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40 font-medium">
                                    {filteredAssets.map((asset) => (
                                        <tr key={asset._id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-3 pl-6">
                                                <div className="font-bold text-foreground font-mono flex items-center gap-1.5">
                                                    <span>{asset.symbol}</span>
                                                    <TradingViewLink symbol={asset.symbol} exchange={asset.exchange} />
                                                </div>
                                                <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">{asset.name}</div>
                                            </td>
                                            <td className="p-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                                                    {(asset.assetType || 'stocks').replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-3 font-semibold text-muted-foreground">{asset.exchange || 'NSE'}</td>
                                            <td className="p-3 font-mono font-bold text-foreground">{asset.currency || 'INR'}</td>
                                            <td className="p-3 pr-6 text-right flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setIsAddTxOpen(true)}
                                                    className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-extrabold transition-colors"
                                                    title="Record buy/sell transaction for this asset"
                                                >
                                                    Record Trade
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAsset(asset._id)}
                                                    className="p-1 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                                                    title="Delete asset"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )
                    )}
                </CardContent>
            </Card>

            {/* Dialog Modals */}
            <AddTransactionDialog
                isOpen={isAddTxOpen}
                onClose={() => {
                    setIsAddTxOpen(false)
                    setEditingTx(null)
                }}
                onSuccess={fetchAllData}
                assets={assetsList}
                editingTransaction={editingTx}
            />

            <AddDividendDialog
                isOpen={isAddDividendOpen}
                onClose={() => {
                    setIsAddDividendOpen(false)
                    setEditingDividend(null)
                }}
                onSuccess={fetchAllData}
                assets={assetsList}
                editingDividend={editingDividend}
            />

            <AddAssetDialog
                isOpen={isAddAssetOpen}
                onClose={() => setIsAddAssetOpen(false)}
                onSuccess={fetchAllData}
            />

            {/* Suggestions Portal for Search Input */}
            {showSuggestions && searchQuery.trim().length > 0 && typeof document !== 'undefined' && createPortal(
                <div
                    style={{ top: popoverCoords.top, left: popoverCoords.left, width: popoverCoords.width }}
                    className="fixed bg-white dark:bg-zinc-900 border border-border/95 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-[9999] overflow-hidden text-[10px] max-h-60 overflow-y-auto opacity-100 ring-1 ring-border/80"
                >
                    {suggestionsList.length === 0 ? (
                        <div className="p-3 text-center text-muted-foreground italic">No matching records</div>
                    ) : (
                        <div className="py-1 divide-y divide-border/40">
                            {suggestionsList.map((item: any) => {
                                const sym = item.assetId?.symbol || item.symbol || 'UNKNOWN'
                                const name = item.assetId?.name || item.name || ''
                                return (
                                    <button
                                        key={item._id}
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery(sym)
                                            setShowSuggestions(false)
                                        }}
                                        className="w-full text-left px-3 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/90 flex justify-between items-center transition-colors"
                                    >
                                        <div className="truncate pr-2">
                                            <p className="font-bold text-foreground truncate">{sym}</p>
                                            <p className="text-[9px] text-muted-foreground truncate">{name}</p>
                                        </div>
                                        <span className="font-mono font-bold text-primary shrink-0">
                                            {item.price ? format(item.price * item.quantity) : item.amount ? format(item.amount - (item.tax || 0)) : (item.exchange || 'ASSET')}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>,
                document.body
            )}
        </div>
    )
}
