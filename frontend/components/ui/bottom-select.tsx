'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BottomSelectOption {
    value: string | number;
    label: string;
    icon?: React.ReactNode;
    color?: string;
}

interface BottomSelectProps {
    value: string | number;
    onChange: (value: any) => void;
    options: BottomSelectOption[];
    placeholder?: string;
    className?: string;
    triggerClassName?: string;
    label?: string; // Header title for bottom sheet
    disabled?: boolean;
}

export function BottomSelect({
    value,
    onChange,
    options,
    placeholder = "Select an option",
    className,
    triggerClassName,
    label = "Select Option",
    disabled = false
}: BottomSelectProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)
    const sheetRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    // Prevent body scrolling when open
    React.useEffect(() => {
        if (!isOpen) return
        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = originalOverflow
        }
    }, [isOpen])

    // Close on escape key press
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

    const selectedOption = options.find(opt => opt.value === value)

    const handleSelect = (val: string | number) => {
        onChange(val)
        setIsOpen(false)
    }

    // SSR / Initial render fallback
    if (!mounted) {
        return (
            <div className={cn("relative inline-block w-full", className)}>
                <button
                    type="button"
                    disabled={disabled}
                    className={cn(
                        "w-full flex items-center justify-between border border-border/80 bg-background/50 hover:bg-background/85 px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/25 shadow-sm text-left transition-all text-foreground h-9 disabled:opacity-50 disabled:pointer-events-none select-none",
                        triggerClassName
                    )}
                >
                    <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
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
                    "w-full flex items-center justify-between border border-border/80 bg-background/50 hover:bg-background/85 px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/25 shadow-sm text-left transition-all text-foreground h-9 disabled:opacity-50 disabled:pointer-events-none select-none",
                    triggerClassName
                )}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption?.color && (
                        <span 
                            className="h-2 w-2 rounded-full shrink-0" 
                            style={{ backgroundColor: selectedOption.color }}
                        />
                    )}
                    {selectedOption?.icon && (
                        <span className="shrink-0">{selectedOption.icon}</span>
                    )}
                    <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
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
                                "w-full bg-card border-t border-border/80 shadow-2xl flex flex-col max-h-[85vh] pointer-events-auto rounded-t-[24px]",
                                "animate-in slide-in-from-bottom duration-300",
                                "sm:mb-6 sm:max-w-md sm:border sm:rounded-b-[24px]"
                            )}
                        >
                            {/* Drag Handle */}
                            <div className="w-12 h-1 bg-muted-foreground/20 rounded-full mx-auto my-3 shrink-0" />

                            {/* Header */}
                            <div className="flex items-center justify-between px-5 pb-3 border-b border-border/40 shrink-0">
                                <h3 className="text-sm font-bold text-foreground capitalize tracking-wide">{label}</h3>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Options */}
                            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 max-h-[50vh]">
                                {options.map((opt) => {
                                    const isSelected = opt.value === value
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleSelect(opt.value)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-3 rounded-xl text-left transition-all active:scale-[0.99] select-none hover:bg-muted/60 text-xs font-medium",
                                                isSelected ? "bg-muted/80 text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 truncate">
                                                {opt.color && (
                                                    <span 
                                                        className="h-2.5 w-2.5 rounded-full shrink-0" 
                                                        style={{ backgroundColor: opt.color }}
                                                    />
                                                )}
                                                {opt.icon && (
                                                    <span className="shrink-0 text-foreground">{opt.icon}</span>
                                                )}
                                                <span className="truncate">{opt.label}</span>
                                            </div>
                                            {isSelected && (
                                                <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    )
}
