'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, Loader2, X } from 'lucide-react'

interface DeleteConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => Promise<void> | void
    title?: string
    description?: string
    itemName?: string
    loading?: boolean
}

export function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Deletion',
    description = 'Are you sure you want to delete this record? This operation is permanent and cannot be undone.',
    itemName,
    loading = false
}: DeleteConfirmationModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted || !isOpen) return null

    const handleConfirm = async () => {
        await onConfirm()
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card dark:bg-zinc-950 border border-border/80 shadow-[0_25px_60px_rgba(0,0,0,0.5)] rounded-2xl p-6 w-full max-w-md space-y-4 animate-in zoom-in-95 duration-200 relative">
                {/* Close X button */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Header Icon + Title */}
                <div className="flex items-start gap-3.5 pr-6">
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 shrink-0">
                        <AlertTriangle className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-lg font-extrabold text-foreground tracking-tight">
                            {title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Permanent action confirmation
                        </p>
                    </div>
                </div>

                {/* Description & Item Name */}
                <div className="space-y-2 py-1">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {description}
                    </p>

                    {itemName && (
                        <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs font-mono font-bold text-foreground flex items-center gap-2 truncate">
                            <Trash2 className="h-4 w-4 text-rose-500 shrink-0" />
                            <span className="truncate">{itemName}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/40">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-xl text-xs font-bold w-full sm:w-auto flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                        className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto flex-1 gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4" /> Confirm Delete
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    )
}
