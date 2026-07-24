'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DatePickerProps {
    day: number;
    month: string; // "YYYY-MM"
    onChange: (day: number, month: string) => void;
    className?: string;
    triggerClassName?: string;
    label?: string;
    disabled?: boolean;
}

export function DatePicker({
    day,
    month,
    onChange,
    className,
    triggerClassName,
    label = "Select Date",
    disabled = false
}: DatePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)
    const sheetRef = React.useRef<HTMLDivElement>(null)

    // Current month/year view state inside the calendar (e.g. "2026-07")
    const [viewMonth, setViewMonth] = React.useState(month)

    React.useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    // Synchronize viewMonth when month prop changes or dialog opens
    React.useEffect(() => {
        if (isOpen && month) {
            setViewMonth(month)
        }
    }, [isOpen, month])

    // Prevent body scrolling when open
    React.useEffect(() => {
        if (!isOpen) return
        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = originalOverflow
        }
    }, [isOpen])

    // Close on escape key
    React.useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen])

    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate()

    const parseMonthString = (mStr: string) => {
        const [year, m] = mStr.split('-')
        return {
            year: parseInt(year) || new Date().getFullYear(),
            monthIndex: (parseInt(m) || (new Date().getMonth() + 1)) - 1
        }
    }

    const formatViewMonth = (mStr: string) => {
        const { year, monthIndex } = parseMonthString(mStr)
        const date = new Date(year, monthIndex, 1)
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }

    const formatSelectedDate = (d: number, mStr: string) => {
        if (!mStr) return 'Select Date'
        const { year, monthIndex } = parseMonthString(mStr)
        const date = new Date(year, monthIndex, d)
        if (isNaN(date.getTime())) return 'Select Date'
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const handlePrevMonth = () => {
        const { year, monthIndex } = parseMonthString(viewMonth)
        const prevDate = new Date(year, monthIndex - 1, 1)
        const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
        setViewMonth(prevMonthStr)
    }

    const handleNextMonth = () => {
        const { year, monthIndex } = parseMonthString(viewMonth)
        const nextDate = new Date(year, monthIndex + 1, 1)
        const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
        setViewMonth(nextMonthStr)
    }

    // Generate days for grid
    const generateCalendarDays = () => {
        const { year, monthIndex } = parseMonthString(viewMonth)
        const firstDayOfWeek = new Date(year, monthIndex, 1).getDay() // 0-6
        const totalDays = getDaysInMonth(year, monthIndex)
        
        const days = []

        // Previous month padding
        const prevMonthDate = new Date(year, monthIndex - 1, 1)
        const prevMonthYear = prevMonthDate.getFullYear()
        const prevMonthIdx = prevMonthDate.getMonth()
        const prevMonthTotalDays = getDaysInMonth(prevMonthYear, prevMonthIdx)

        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            days.push({
                dayNum: prevMonthTotalDays - i,
                monthStr: `${prevMonthYear}-${String(prevMonthIdx + 1).padStart(2, '0')}`,
                isCurrentMonth: false
            })
        }

        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            days.push({
                dayNum: i,
                monthStr: viewMonth,
                isCurrentMonth: true
            })
        }

        // Next month padding to reach 42 items (6 weeks grid)
        const nextMonthDate = new Date(year, monthIndex + 1, 1)
        const nextMonthYear = nextMonthDate.getFullYear()
        const nextMonthIdx = nextMonthDate.getMonth()
        const totalCells = 42
        const remainingCells = totalCells - days.length

        for (let i = 1; i <= remainingCells; i++) {
            days.push({
                dayNum: i,
                monthStr: `${nextMonthYear}-${String(nextMonthIdx + 1).padStart(2, '0')}`,
                isCurrentMonth: false
            })
        }

        return days
    }

    const handleSelectDay = (dayNum: number, targetMonthStr: string) => {
        onChange(dayNum, targetMonthStr)
        setIsOpen(false)
    }

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    const calendarDays = generateCalendarDays()

    // SSR / Initial render fallback
    if (!mounted) {
        return (
            <div className={cn("relative inline-block w-full", className)}>
                <button
                    type="button"
                    disabled={disabled}
                    className={cn(
                        "w-full flex items-center justify-between border border-border/80 bg-background/50 hover:bg-background/85 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25 shadow-sm text-left transition-all text-foreground h-10 disabled:opacity-50 disabled:pointer-events-none select-none",
                        triggerClassName
                    )}
                >
                    <span className="truncate flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary shrink-0" />
                        {formatSelectedDate(day, month)}
                    </span>
                </button>
            </div>
        )
    }

    return (
        <div className={cn("relative inline-block w-full", className)}>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                disabled={disabled}
                className={cn(
                    "w-full flex items-center justify-between border border-border/80 bg-background/50 hover:bg-background/85 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/25 shadow-sm text-left transition-all text-foreground h-10 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer",
                    triggerClassName
                )}
            >
                <span className="truncate flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    {formatSelectedDate(day, month)}
                </span>
            </button>

            {isOpen && createPortal(
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    />

                    {/* Bottom Sheet Centering Wrapper */}
                    <div className="fixed inset-0 z-[251] flex items-end justify-center pointer-events-none">
                        <div
                            ref={sheetRef}
                            role="dialog"
                            aria-modal="true"
                            className={cn(
                                "w-full bg-card border-t border-border/80 shadow-2xl flex flex-col pointer-events-auto rounded-t-[24px]",
                                "animate-in slide-in-from-bottom duration-300",
                                "sm:mb-6 sm:max-w-sm sm:border sm:rounded-b-[24px]"
                            )}
                        >
                            {/* Drag Handle */}
                            <div className="w-12 h-1 bg-muted-foreground/20 rounded-full mx-auto my-3 shrink-0" />

                            {/* Header */}
                            <div className="flex items-center justify-between px-5 pb-3 border-b border-border/40 shrink-0">
                                <h3 className="text-sm font-bold text-foreground tracking-wide">{label}</h3>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Calendar Body */}
                            <div className="p-4 flex flex-col space-y-4">
                                {/* Month/Year Selector row */}
                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={handlePrevMonth}
                                        className="h-8 w-8 rounded-lg flex items-center justify-center border border-border/70 hover:bg-muted/60 text-foreground transition-all active:scale-95 cursor-pointer"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className="text-xs font-black text-foreground">{formatViewMonth(viewMonth)}</span>
                                    <button
                                        type="button"
                                        onClick={handleNextMonth}
                                        className="h-8 w-8 rounded-lg flex items-center justify-center border border-border/70 hover:bg-muted/60 text-foreground transition-all active:scale-95 cursor-pointer"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Weekday Header Grid */}
                                <div className="grid grid-cols-7 gap-1 text-center">
                                    {weekDays.map(wd => (
                                        <span key={wd} className="text-[10px] font-black text-muted-foreground uppercase">{wd}</span>
                                    ))}
                                </div>

                                {/* Days Grid */}
                                <div className="grid grid-cols-7 gap-1 text-center">
                                    {calendarDays.map((cell, idx) => {
                                        const isSelected = cell.dayNum === day && cell.monthStr === month
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleSelectDay(cell.dayNum, cell.monthStr)}
                                                className={cn(
                                                    "h-8 w-8 text-xs font-bold rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-90",
                                                    cell.isCurrentMonth
                                                        ? isSelected
                                                            ? "bg-custom-btn-gradient text-white shadow-sm font-extrabold animate-in zoom-in-95 duration-100"
                                                            : "text-foreground hover:bg-muted/60"
                                                        : "text-muted-foreground/35 hover:bg-muted/30 font-medium"
                                                )}
                                            >
                                                {cell.dayNum}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    )
}
