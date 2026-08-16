'use client'

import React, { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ExternalLink, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TradingViewLinkProps {
    symbol: string
    exchange?: string
    className?: string
    iconClassName?: string
}

export function getTradingViewUrl(symbol: string, exchange?: string): string {
    if (!symbol) return 'https://www.tradingview.com'
    
    let cleanSym = symbol.trim().toUpperCase()
    let exch = exchange ? exchange.toUpperCase() : 'NSE'

    if (cleanSym.endsWith('.NS')) {
        cleanSym = cleanSym.slice(0, -3)
        exch = 'NSE'
    } else if (cleanSym.endsWith('.BO')) {
        cleanSym = cleanSym.slice(0, -3)
        exch = 'BSE'
    }

    if (exch === 'CRYPTO' || exch === 'BINANCE' || exch === 'US' || exch === 'NASDAQ' || exch === 'NYSE') {
        return `https://www.tradingview.com/symbols/${cleanSym}/`
    }

    return `https://www.tradingview.com/symbols/${exch}-${cleanSym}/`
}

export function TradingViewLink({ symbol, exchange, className, iconClassName }: TradingViewLinkProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [position, setPosition] = useState<{ top: number; left: number; placeAbove: boolean }>({ top: 0, left: 0, placeAbove: true })
    const linkRef = useRef<HTMLAnchorElement>(null)

    if (!symbol) return null
    const url = getTradingViewUrl(symbol, exchange)

    let cleanSym = symbol.trim().toUpperCase()
    let exch = exchange ? exchange.toUpperCase() : 'NSE'
    if (cleanSym.endsWith('.NS')) {
        cleanSym = cleanSym.slice(0, -3)
        exch = 'NSE'
    } else if (cleanSym.endsWith('.BO')) {
        cleanSym = cleanSym.slice(0, -3)
        exch = 'BSE'
    }

    const updateCoords = () => {
        if (linkRef.current && typeof window !== 'undefined') {
            const rect = linkRef.current.getBoundingClientRect()
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            const tooltipWidth = 240
            const tooltipHeight = 60

            const placeAbove = rect.top > tooltipHeight + 15
            
            let top = placeAbove ? rect.top - 8 : rect.bottom + 8
            top = Math.max(10, Math.min(viewportHeight - tooltipHeight - 10, top))

            let left = rect.left + rect.width / 2
            const minLeft = tooltipWidth / 2 + 12
            const maxLeft = viewportWidth - (tooltipWidth / 2) - 12
            left = Math.max(minLeft, Math.min(maxLeft, left))

            setPosition({ top, left, placeAbove })
        }
    }

    const handleMouseEnter = () => {
        updateCoords()
        setIsHovered(true)
    }

    const handleMouseLeave = () => {
        setIsHovered(false)
    }

    return (
        <>
            <a
                ref={linkRef}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={cn(
                    "inline-flex items-center justify-center p-1 rounded-lg text-muted-foreground/70 hover:text-blue-500 hover:bg-blue-500/10 transition-all duration-200 group active:scale-95",
                    className
                )}
                aria-label={`Open ${symbol} live chart on TradingView`}
            >
                <ExternalLink className={cn("h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110 group-hover:translate-x-0.5 group-hover:-translate-y-0.5", iconClassName)} />
            </a>

            {isHovered && typeof document !== 'undefined' && createPortal(
                <div
                    style={{
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                        transform: position.placeAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)'
                    }}
                    className="fixed z-[99999] pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                >
                    <div className="relative flex flex-col gap-1 p-2.5 px-3 rounded-xl bg-card/95 backdrop-blur-xl border border-blue-500/30 shadow-[0_10px_38px_rgba(0,0,0,0.35)] ring-1 ring-blue-500/20 text-xs max-w-xs whitespace-nowrap">
                        {/* Header Badge */}
                        <div className="flex items-center gap-1.5 font-extrabold text-[11px] text-foreground">
                            <div className="p-1 rounded-md bg-blue-500/15 text-blue-500 flex items-center justify-center">
                                <TrendingUp className="h-3 w-3" />
                            </div>
                            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                                TradingView Chart
                            </span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                                {exch}:{cleanSym}
                            </span>
                        </div>

                        {/* Description Text */}
                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                            Open real-time interactive technical graph in a new tab ↗
                        </p>

                        {/* Pointer Arrow */}
                        <div className={cn(
                            "absolute w-2 h-2 rotate-45 bg-card/95 border-blue-500/30",
                            position.placeAbove 
                                ? "-bottom-1 left-1/2 -translate-x-1/2 border-r border-b" 
                                : "-top-1 left-1/2 -translate-x-1/2 border-l border-t"
                        )} />
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}
