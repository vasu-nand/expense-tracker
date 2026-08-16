'use client'

import React from 'react'
import { useCurrency } from '@/hooks/use-currency'
import { cn } from '@/lib/utils'

export interface ChartTooltipProps {
    active?: boolean
    payload?: any[]
    label?: string | number
    title?: string
    valueFormatter?: (value: number) => string
    showPercentage?: boolean
    totalValue?: number
    className?: string
}

export function ChartTooltip({
    active,
    payload,
    label,
    title,
    valueFormatter,
    showPercentage = false,
    totalValue,
    className
}: ChartTooltipProps) {
    const { format } = useCurrency()

    if (!active || !payload || !payload.length) return null

    const firstEntry = payload[0]
    const headerText = title || label || firstEntry?.name || firstEntry?.payload?.name || firstEntry?.payload?.category || firstEntry?.payload?.fullName

    return (
        <div className={cn(
            "bg-card/95 dark:bg-zinc-950/90 backdrop-blur-3xl dark:backdrop-blur-[40px] border border-border/90 dark:border-zinc-800/90 shadow-[0_20px_50px_rgba(0,0,0,0.8)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.95)] rounded-2xl p-3.5 min-w-[190px] max-w-xs text-xs space-y-2 ring-1 ring-black/5 dark:ring-white/15 animate-in fade-in zoom-in-95 duration-150 z-50 pointer-events-none",
            className
        )}>
            {/* Tooltip Header */}
            {headerText && (
                <div className="flex items-center justify-between border-b border-border/60 dark:border-zinc-800 pb-1.5 gap-2">
                    <span className="font-black text-foreground dark:text-zinc-50 tracking-wide text-xs truncate capitalize">
                        {headerText}
                    </span>
                    {firstEntry?.payload?.assetType && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 shrink-0">
                            {String(firstEntry.payload.assetType).replace('_', ' ')}
                        </span>
                    )}
                </div>
            )}

            {/* Tooltip Content Body */}
            <div className="space-y-1.5 pt-0.5">
                {payload.map((entry: any, index: number) => {
                    const rawVal = Number(entry.value || 0)
                    const absVal = Math.abs(rawVal)
                    const prefix = rawVal < 0 ? '-' : ''
                    const itemName = payload.length === 1 
                        ? (entry.payload?.label || 'Value') 
                        : (entry.name || entry.dataKey || 'Series')

                    let color = entry.color || entry.stroke || entry.fill || entry.payload?.color || entry.payload?.fill || '#6366f1'
                    if (typeof color === 'string' && color.startsWith('url')) {
                        color = '#6366f1'
                    }

                    const formattedVal = valueFormatter ? valueFormatter(rawVal) : `${prefix}${format(absVal)}`

                    const currentTotal = totalValue || entry.payload?.total || entry.payload?.totalValue
                    const percent = currentTotal && currentTotal > 0 ? ((absVal / currentTotal) * 100).toFixed(1) : null

                    return (
                        <div key={index} className="flex items-center justify-between text-muted-foreground dark:text-zinc-300 gap-4">
                            <div className="flex items-center gap-1.5 truncate">
                                <span
                                    className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm ring-1 ring-black/10 dark:ring-white/20"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="font-semibold text-foreground dark:text-zinc-200 truncate capitalize">
                                    {itemName}:
                                </span>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="font-mono font-black text-foreground dark:text-zinc-50 block">
                                    {formattedVal}
                                </span>
                                {(showPercentage && percent) && (
                                    <span className="text-[10px] font-mono font-bold text-primary dark:text-indigo-400 block">
                                        {percent}%
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
