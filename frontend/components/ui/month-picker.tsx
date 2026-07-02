'use client'

import { useState, useEffect, useRef } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MonthPickerProps {
    value: string // e.g. "2026-07"
    onChange: (value: string) => void
    className?: string
    placeholder?: string
}

export function MonthPicker({ value, onChange, className, placeholder = "Select Month" }: MonthPickerProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // Parse current value
    const [year, setYear] = useState(() => {
        if (value) {
            const parts = value.split('-')
            return parseInt(parts[0]) || new Date().getFullYear()
        }
        return new Date().getFullYear()
    })

    const selectedMonth = value ? parseInt(value.split('-')[1]) - 1 : null

    // Sync internal year with external value changes
    useEffect(() => {
        if (value) {
            const parts = value.split('-')
            const parsedYear = parseInt(parts[0])
            if (parsedYear) setYear(parsedYear)
        }
    }, [value])

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({})

    useEffect(() => {
        if (open && ref.current) {
            const rect = ref.current.getBoundingClientRect()
            const popupWidth = 240 // w-60 is 240px
            const viewportWidth = window.innerWidth

            let left = (rect.width - popupWidth) / 2
            
            // Adjust if it goes off-screen to the right
            if (rect.left + left + popupWidth > viewportWidth - 10) {
                left = viewportWidth - rect.left - popupWidth - 10
            }
            
            // Adjust if it goes off-screen to the left
            if (rect.left + left < 10) {
                left = -rect.left + 10
            }

            setPositionStyle({
                left: `${left}px`,
                transform: 'none'
            })
        }
    }, [open])

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr',
        'May', 'Jun', 'Jul', 'Aug',
        'Sep', 'Oct', 'Nov', 'Dec'
    ]

    const handleSelectMonth = (monthIndex: number) => {
        const mStr = String(monthIndex + 1).padStart(2, '0')
        onChange(`${year}-${mStr}`)
        setOpen(false)
    }

    const handlePreviousYear = () => setYear(y => y - 1)
    const handleNextYear = () => setYear(y => y + 1)

    const handleClear = () => {
        onChange('')
        setOpen(false)
    }

    const handleCurrentMonth = () => {
        const now = new Date()
        const y = now.getFullYear()
        const m = String(now.getMonth() + 1).padStart(2, '0')
        onChange(`${y}-${m}`)
        setOpen(false)
    }

    // Format display label
    let displayLabel = placeholder
    if (value) {
        const parts = value.split('-')
        const y = parts[0]
        const mIndex = parseInt(parts[1]) - 1
        if (mIndex >= 0 && mIndex < 12) {
            const monthNames = [
                'Jan', 'Feb', 'Mar', 'Apr',
                'May', 'Jun', 'Jul', 'Aug',
                'Sep', 'Oct', 'Nov', 'Dec'
            ]
            displayLabel = `${monthNames[mIndex]}, ${y}`
        }
    }

    return (
        <div className="relative w-full" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={cn(
                    "w-full flex items-center justify-between border border-border/80 bg-background/50 hover:bg-background/85 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/25 shadow-sm text-center cursor-pointer transition-all select-none text-foreground h-9",
                    className
                )}
            >
                <span className="truncate mx-auto">{displayLabel}</span>
                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 ml-1" />
            </button>

            {open && (
                <div 
                    style={positionStyle}
                    className="absolute z-50 top-full mt-1.5 w-60 bg-white dark:bg-zinc-900 border border-border/95 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.5)] p-3 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                    {/* Year selection row */}
                    <div className="flex items-center justify-between pb-2 border-b border-border/10">
                        <button
                            type="button"
                            onClick={handlePreviousYear}
                            className="p-1 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-xs font-black text-foreground tracking-widest">{year}</span>
                        <button
                            type="button"
                            onClick={handleNextYear}
                            className="p-1 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Months grid */}
                    <div className="grid grid-cols-4 gap-1 py-3">
                        {months.map((m, index) => {
                            const isSelected = selectedMonth === index && (value && value.startsWith(String(year)))
                            return (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => handleSelectMonth(index)}
                                    className={cn(
                                        "py-2 text-[11px] font-bold rounded-xl transition-all border",
                                        isSelected
                                            ? "bg-custom-btn-gradient text-white border-transparent shadow-sm"
                                            : "bg-transparent text-muted-foreground hover:text-foreground border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:scale-105"
                                    )}
                                >
                                    {m}
                                </button>
                            )
                        })}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/10 text-[10px] font-black select-none">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-wider px-2 py-1 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={handleCurrentMonth}
                            className="text-primary hover:text-primary-focus transition-colors uppercase tracking-wider px-2 py-1 hover:bg-primary/10 rounded-lg"
                        >
                            This Month
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
