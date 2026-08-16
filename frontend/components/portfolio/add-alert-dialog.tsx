'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Bell, ChevronDown, Check, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BottomSelect } from '@/components/ui/bottom-select'
import { api } from '@/services/api'
import { useCurrency } from '@/hooks/use-currency'

interface WatchlistItem {
    _id?: string
    symbol: string
    name: string
    currentPrice?: number
    assetType?: string
}

interface AddAlertDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    watchlist?: WatchlistItem[]
    defaultSymbol?: string
    defaultPrice?: number
}

const CONDITION_OPTIONS = [
    { value: 'above', label: 'Price Rises Above (>)' },
    { value: 'below', label: 'Price Drops Below (<)' }
]

export function AddAlertDialog({ 
    isOpen, 
    onClose, 
    onSuccess, 
    watchlist = [], 
    defaultSymbol = '',
    defaultPrice
}: AddAlertDialogProps) {
    const { format } = useCurrency()
    const [mounted, setMounted] = useState(false)
    const [selectedSymbol, setSelectedSymbol] = useState('')
    const [customSymbol, setCustomSymbol] = useState('')
    const [isCustomMode, setIsCustomMode] = useState(false)
    const [condition, setCondition] = useState<'above' | 'below'>('above')
    const [targetPrice, setTargetPrice] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const bodyRef = useRef<HTMLDivElement>(null)
    const [canScrollDown, setCanScrollDown] = useState(false)

    const checkScroll = () => {
        if (bodyRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = bodyRef.current
            setCanScrollDown(scrollTop + clientHeight < scrollHeight - 10)
        }
    }

    const handleScrollDown = () => {
        if (bodyRef.current) {
            bodyRef.current.scrollBy({ top: 120, behavior: 'smooth' })
        }
    }

    // Prepare dropdown options from watchlist items
    const watchlistOptions = watchlist.map((item) => ({
        value: item.symbol,
        label: `${item.symbol} - ${item.name}${item.currentPrice ? ` (${format(item.currentPrice)})` : ''}`
    }))

    const symbolSelectOptions = [
        ...watchlistOptions,
        { value: '__custom__', label: '+ Enter Custom Ticker Symbol' }
    ]

    useEffect(() => {
        setMounted(true)
        if (isOpen) {
            setError('')
            const initSymbol = defaultSymbol || (watchlist.length > 0 ? watchlist[0].symbol : '')
            if (initSymbol && !watchlist.some(w => w.symbol.toUpperCase() === initSymbol.toUpperCase())) {
                setIsCustomMode(true)
                setCustomSymbol(initSymbol)
            } else {
                setIsCustomMode(watchlist.length === 0)
                setSelectedSymbol(initSymbol || (watchlist.length > 0 ? watchlist[0].symbol : ''))
                setCustomSymbol('')
            }

            if (defaultPrice) {
                setTargetPrice(defaultPrice.toString())
            } else {
                const activeItem = watchlist.find(w => w.symbol.toUpperCase() === initSymbol.toUpperCase())
                if (activeItem?.currentPrice) {
                    setTargetPrice(activeItem.currentPrice.toString())
                }
            }

            setTimeout(checkScroll, 150)
        }
    }, [isOpen, defaultSymbol, defaultPrice, watchlist])

    // Update target price reference when selected symbol changes
    const activeWatchlistItem = watchlist.find(
        (w) => w.symbol.toUpperCase() === (isCustomMode ? customSymbol.trim().toUpperCase() : selectedSymbol.toUpperCase())
    )

    if (!isOpen || !mounted || typeof document === 'undefined') return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const finalSymbol = isCustomMode ? customSymbol.trim().toUpperCase() : selectedSymbol.trim().toUpperCase()
        if (!finalSymbol) {
            setError('Please select or enter a ticker symbol')
            return
        }

        if (!targetPrice) {
            setError('Please provide a target trigger price')
            return
        }

        const priceNum = parseFloat(targetPrice)
        if (isNaN(priceNum) || priceNum <= 0) {
            setError('Target price must be a positive number')
            return
        }

        try {
            setLoading(true)
            setError('')
            await api.post('/portfolio/alerts', {
                symbol: finalSymbol,
                condition,
                targetPrice: priceNum
            })
            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create price alert')
        } finally {
            setLoading(false)
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                {/* Fixed Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/60 bg-card shrink-0 z-10">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                            <Bell className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-extrabold text-foreground">Set Price Alert</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    {/* Scrollable Form Body */}
                    <div
                        ref={bodyRef}
                        onScroll={checkScroll}
                        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 [&-::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative"
                    >
                        {error && (
                            <div className="p-3 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                                {error}
                            </div>
                        )}

                        {/* Watchlist Asset Selector / Custom Input */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold text-muted-foreground block">Select Watchlist Asset *</label>
                                {watchlist.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setIsCustomMode(!isCustomMode)}
                                        className="text-[11px] font-semibold text-primary hover:underline"
                                    >
                                        {isCustomMode ? 'Choose from Watchlist' : '+ Enter Custom Ticker'}
                                    </button>
                                )}
                            </div>

                            {!isCustomMode && watchlist.length > 0 ? (
                                <BottomSelect
                                    value={selectedSymbol}
                                    onChange={(val) => {
                                        if (val === '__custom__') {
                                            setIsCustomMode(true)
                                            setCustomSymbol('')
                                        } else {
                                            setSelectedSymbol(val)
                                            const item = watchlist.find(w => w.symbol === val)
                                            if (item?.currentPrice) {
                                                setTargetPrice(item.currentPrice.toString())
                                            }
                                        }
                                    }}
                                    options={symbolSelectOptions}
                                    label="Select Asset from Watchlist"
                                    triggerClassName="py-2.5 text-xs font-bold font-mono"
                                />
                            ) : (
                                <input
                                    type="text"
                                    placeholder="e.g. RELIANCE, TSLA, BTC"
                                    value={customSymbol}
                                    onChange={(e) => setCustomSymbol(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-muted/50 border border-border rounded-xl focus:outline-none focus:border-primary uppercase font-mono text-foreground font-bold"
                                    required
                                />
                            )}
                        </div>

                        {/* Live Price Reference Badge */}
                        {activeWatchlistItem?.currentPrice && (
                            <div className="p-2.5 bg-muted/60 border border-border/80 rounded-xl text-xs flex items-center justify-between">
                                <span className="text-muted-foreground font-semibold flex items-center gap-1">
                                    <Info className="h-3.5 w-3.5 text-primary" /> Live Price ({activeWatchlistItem.symbol}):
                                </span>
                                <span className="font-mono font-extrabold text-foreground">{format(activeWatchlistItem.currentPrice)}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1">Alert Condition *</label>
                                <BottomSelect
                                    value={condition}
                                    onChange={(val) => setCondition(val as 'above' | 'below')}
                                    options={CONDITION_OPTIONS}
                                    label="Select Condition"
                                    triggerClassName="py-2 text-xs"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1">Trigger Price *</label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="Target Price"
                                    value={targetPrice}
                                    onChange={(e) => setTargetPrice(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-muted/50 border border-border rounded-xl focus:outline-none focus:border-primary text-foreground font-mono font-bold"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Animated Scroll Down Indicator Button */}
                    {canScrollDown && (
                        <button
                            type="button"
                            onClick={handleScrollDown}
                            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 h-8 w-8 rounded-full bg-card/80 backdrop-blur-md border border-border/80 shadow-xl flex items-center justify-center text-foreground hover:bg-card hover:scale-110 active:scale-95 transition-all animate-bounce"
                            aria-label="Scroll down form"
                        >
                            <ChevronDown className="h-4 w-4 text-foreground" />
                        </button>
                    )}

                    {/* Fixed Action Footer */}
                    <div className="flex items-center justify-end space-x-2 p-4 bg-card border-t border-border/60 shrink-0 z-10">
                        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="rounded-xl text-xs">
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={loading} className="rounded-xl text-xs bg-custom-btn-gradient text-white">
                            {loading ? 'Setting Alert...' : 'Set Alert'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}
