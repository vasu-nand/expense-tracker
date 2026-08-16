'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Eye, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BottomSelect } from '@/components/ui/bottom-select'
import { api } from '@/services/api'

interface AddWatchlistDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

const CATEGORY_OPTIONS = [
    { value: 'stocks', label: 'Stocks' },
    { value: 'etfs', label: 'ETFs' },
    { value: 'mutual_funds', label: 'Mutual Funds' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'bonds', label: 'Bonds' }
]

export function AddWatchlistDialog({ isOpen, onClose, onSuccess }: AddWatchlistDialogProps) {
    const [mounted, setMounted] = useState(false)
    const [symbol, setSymbol] = useState('')
    const [name, setName] = useState('')
    const [assetType, setAssetType] = useState('stocks')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Stock autocomplete search state
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [searching, setSearching] = useState(false)
    const [selectedStockInfo, setSelectedStockInfo] = useState<string | null>(null)

    const inputRef = useRef<HTMLInputElement>(null)
    const bodyRef = useRef<HTMLDivElement>(null)
    const [canScrollDown, setCanScrollDown] = useState(false)
    const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 })

    const updatePopoverCoords = () => {
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect()
            setPopoverCoords({
                top: rect.bottom + 6,
                left: rect.left,
                width: rect.width
            })
        }
    }

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

    useEffect(() => {
        setMounted(true)
        if (isOpen) {
            setTimeout(checkScroll, 150)
        }
    }, [isOpen])

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
    }, [showSuggestions, symbol])

    // Live debounced search effect for registered stock suggestions
    useEffect(() => {
        if (!symbol || symbol.trim().length < 2) {
            setSuggestions([])
            setShowSuggestions(false)
            return
        }

        const timer = setTimeout(() => {
            setSearching(true)
            api.get(`/portfolio/search-symbols?q=${encodeURIComponent(symbol)}`)
                .then(res => {
                    setSuggestions(res.data || [])
                    updatePopoverCoords()
                    setShowSuggestions(true)
                })
                .catch(() => setSuggestions([]))
                .finally(() => setSearching(false))
        }, 250)

        return () => clearTimeout(timer)
    }, [symbol])

    const selectStockSuggestion = (item: any) => {
        setSymbol(item.symbol)
        setName(item.name)
        if (item.assetType) setAssetType(item.assetType)
        setSelectedStockInfo(`${item.name} (${item.exchange || 'LIVE'})`)
        setShowSuggestions(false)
    }

    if (!isOpen || !mounted || typeof document === 'undefined') return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!symbol.trim() || !name.trim()) {
            setError('Please provide ticker symbol and company name')
            return
        }

        try {
            setLoading(true)
            setError('')
            await api.post('/portfolio/watchlist', {
                symbol: symbol.trim().toUpperCase(),
                name: name.trim(),
                assetType
            })
            setSymbol('')
            setName('')
            setSelectedStockInfo(null)
            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add item to watchlist')
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
                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                            <Eye className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-extrabold text-foreground">Add to Watchlist</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    {/* Scrollable Form Body (Hidden Scrollbar) */}
                    <div
                        ref={bodyRef}
                        onScroll={() => {
                            checkScroll()
                            if (showSuggestions) updatePopoverCoords()
                        }}
                        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 [&-::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative"
                    >
                        {error && (
                            <div className="p-3 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                                {error}
                            </div>
                        )}

                        {selectedStockInfo && (
                            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-500 font-semibold flex items-center gap-1.5">
                                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                                <span className="truncate">Auto-linked: {selectedStockInfo}</span>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-bold text-muted-foreground block mb-1">Ticker / Symbol *</label>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="e.g. IRB, RELIANCE, TCS, AAPL"
                                value={symbol}
                                onChange={(e) => {
                                    setSymbol(e.target.value)
                                    setSelectedStockInfo(null)
                                }}
                                onFocus={() => {
                                    if (suggestions.length > 0) {
                                        updatePopoverCoords()
                                        setShowSuggestions(true)
                                    }
                                }}
                                className="w-full px-3 py-2 text-xs bg-muted/50 border border-border rounded-xl focus:outline-none focus:border-primary uppercase font-mono text-foreground font-bold"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-muted-foreground block mb-1">Name / Label *</label>
                            <input
                                type="text"
                                placeholder="e.g. IRB Infrastructure Developers Limited"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-muted/50 border border-border rounded-xl focus:outline-none focus:border-primary text-foreground"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-muted-foreground block mb-1">Asset Category</label>
                            <BottomSelect
                                value={assetType}
                                onChange={setAssetType}
                                options={CATEGORY_OPTIONS}
                                label="Select Asset Category"
                                triggerClassName="py-2 text-xs"
                            />
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
                            {loading ? 'Adding...' : 'Add to Watchlist'}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Portal Suggestion Dropdown floating ABOVE all dialog elements & buttons */}
            {showSuggestions && createPortal(
                <div
                    style={{ top: popoverCoords.top, left: popoverCoords.left, width: popoverCoords.width }}
                    className="fixed bg-white dark:bg-zinc-900 border border-border/95 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-[9999] overflow-hidden text-xs max-h-56 overflow-y-auto opacity-100 ring-1 ring-border/80"
                >
                    {searching ? (
                        <div className="p-3 text-center text-muted-foreground animate-pulse text-[11px]">Searching official stock exchange...</div>
                    ) : suggestions.length === 0 ? (
                        <div className="p-3 text-center text-muted-foreground italic text-[11px]">No matching stock found</div>
                    ) : (
                        <div className="py-1 divide-y divide-border/40">
                            {suggestions.map((item: any, idx: number) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => selectStockSuggestion(item)}
                                    className="w-full text-left px-3 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/90 flex items-center justify-between transition-colors"
                                >
                                    <div className="truncate pr-2">
                                        <p className="font-extrabold text-foreground truncate">{item.displaySymbol || item.symbol} <span className="text-muted-foreground font-normal text-[10px]">- {item.name}</span></p>
                                        <p className="text-[9px] text-muted-foreground font-mono">{item.exchange} • {item.currency}</p>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold shrink-0">
                                        {item.exchange}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>,
                document.body
            )}
        </div>,
        document.body
    )
}
