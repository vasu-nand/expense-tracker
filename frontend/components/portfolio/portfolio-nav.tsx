'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
    LayoutDashboard, 
    Layers,
    Receipt, 
    Target, 
    Eye, 
    BarChart3, 
    Plus, 
    ChevronLeft, 
    ChevronRight,
    RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'

interface PortfolioNavProps {
    onOpenAddAsset?: () => void
    onOpenAddTx?: () => void
    onOpenAddGoal?: () => void
    onOpenAddWatchlist?: () => void
    onOpenAddAlert?: () => void
    netWorth?: number
    currentValue?: number
}

const navTabs = [
    { href: '/portfolio', label: 'Overview', icon: LayoutDashboard },
    { href: '/portfolio/assets', label: 'Assets Catalog', icon: Layers },
    { href: '/portfolio/transactions', label: 'Transactions & Dividends', icon: Receipt },
    { href: '/portfolio/goals', label: 'Wealth Goals', icon: Target },
    { href: '/portfolio/watchlist', label: 'Watchlist & Alerts', icon: Eye },
    { href: '/portfolio/analytics', label: 'Analytics', icon: BarChart3 },
]

export function PortfolioNav({
    onOpenAddAsset,
    onOpenAddTx,
    onOpenAddGoal,
    onOpenAddWatchlist,
    onOpenAddAlert
}: PortfolioNavProps) {
    const pathname = usePathname()
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const activeTabRef = useRef<HTMLAnchorElement>(null)

    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [lastRefreshed, setLastRefreshed] = useState<string | null>(null)

    const checkScrollState = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
            setCanScrollLeft(scrollLeft > 4)
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4)
        }
    }

    const handleRefreshPrices = async () => {
        try {
            setRefreshing(true)
            await api.post('/portfolio/refresh-prices')
            const now = new Date()
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            setLastRefreshed(timeStr)
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('portfolio-prices-refreshed', { detail: { time: timeStr } }))
            }
        } catch (err) {
            console.error('Failed to refresh prices:', err)
        } finally {
            setRefreshing(false)
        }
    }

    // Auto-scroll to active tab on mobile/desktop and check scroll indicators
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTabRef.current && scrollContainerRef.current) {
                activeTabRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                })
            }
            checkScrollState()
        }, 100)

        window.addEventListener('resize', checkScrollState)
        return () => {
            clearTimeout(timer)
            window.removeEventListener('resize', checkScrollState)
        }
    }, [pathname])

    const handleScrollClick = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const amount = direction === 'left' ? -150 : 150
            scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' })
        }
    }

    return (
        <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/20">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-custom-gradient">Portfolio</h1>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>Track holdings, capital allocation, wealth goals, dividends & live performance</span>
                        {lastRefreshed && (
                            <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                Refreshed {lastRefreshed}
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRefreshPrices}
                        disabled={refreshing}
                        className="text-[11px] sm:text-xs h-8 sm:h-9 px-2.5 sm:px-3 gap-1.5 rounded-xl border-border/80"
                        title="Recorded every 15 mins to DB. Click to refresh live prices manually."
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5 text-primary", refreshing && "animate-spin")} />
                        <span>{refreshing ? 'Refreshing...' : 'Refresh Prices'}</span>
                    </Button>

                    {onOpenAddAsset && (
                        <Button size="sm" variant="outline" onClick={onOpenAddAsset} className="text-[11px] sm:text-xs h-8 sm:h-9 px-2.5 sm:px-3 gap-1 rounded-xl">
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Asset</span>
                        </Button>
                    )}
                    {onOpenAddTx && (
                        <Button size="sm" onClick={onOpenAddTx} className="text-[11px] sm:text-xs h-8 sm:h-9 px-2.5 sm:px-3 gap-1 rounded-xl bg-custom-btn-gradient text-white">
                            <Plus className="h-3.5 w-3.5" />
                            <span>Record Tx</span>
                        </Button>
                    )}
                    {onOpenAddGoal && (
                        <Button size="sm" variant="secondary" onClick={onOpenAddGoal} className="text-[11px] sm:text-xs h-8 sm:h-9 px-2.5 sm:px-3 gap-1 rounded-xl">
                            <Target className="h-3.5 w-3.5" />
                            <span>New Goal</span>
                        </Button>
                    )}
                    {onOpenAddWatchlist && (
                        <Button size="sm" variant="outline" onClick={onOpenAddWatchlist} className="text-[11px] sm:text-xs h-8 sm:h-9 px-2.5 sm:px-3 gap-1 rounded-xl">
                            <Eye className="h-3.5 w-3.5" />
                            <span>Add Watchlist</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Horizontal Sub-nav tabs container with scroll controls */}
            <div className="relative flex items-center border-b border-border/60 pb-1">
                {/* Left Scroll Arrow */}
                {canScrollLeft && (
                    <button
                        type="button"
                        onClick={() => handleScrollClick('left')}
                        className="absolute left-0 z-10 flex items-center justify-center h-8 w-8 rounded-full bg-card/90 backdrop-blur border border-border shadow-md text-primary transition-all -ml-2 hover:scale-110 active:scale-95"
                        aria-label="Scroll tabs left"
                    >
                        <ChevronLeft className="h-4 w-4 animate-pulse" />
                    </button>
                )}

                {/* Sub-nav Tab Links */}
                <div
                    ref={scrollContainerRef}
                    onScroll={checkScrollState}
                    className="flex items-center space-x-1 overflow-x-auto [::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full px-1 scroll-smooth"
                >
                    {navTabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = pathname === tab.href
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                ref={isActive ? activeTabRef : null}
                                className={cn(
                                    "flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all duration-200 shrink-0 select-none",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-sm font-extrabold scale-[1.02]"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span>{tab.label}</span>
                            </Link>
                        )
                    })}
                </div>

                {/* Right Scroll Arrow */}
                {canScrollRight && (
                    <button
                        type="button"
                        onClick={() => handleScrollClick('right')}
                        className="absolute right-0 z-10 flex items-center justify-center h-8 w-8 rounded-full bg-card/90 backdrop-blur border border-border shadow-md text-primary transition-all -mr-2 hover:scale-110 active:scale-95"
                        aria-label="Scroll tabs right"
                    >
                        <ChevronRight className="h-4 w-4 animate-pulse" />
                    </button>
                )}
            </div>
        </div>
    )
}
