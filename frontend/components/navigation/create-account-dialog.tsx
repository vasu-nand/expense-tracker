'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Wallet, CreditCard, Landmark, PiggyBank, Coins, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccount } from '@/components/account-context'
import { DynamicIcon } from '../navigation'
import { cn } from '@/lib/utils'

interface CreateAccountDialogProps {
    isOpen: boolean
    onClose: () => void
}

export function CreateAccountDialog({ isOpen, onClose }: CreateAccountDialogProps) {
    const { createAccount } = useAccount()
    const [mounted, setMounted] = useState(false)
    const [accName, setAccName] = useState('')
    const [bankNameInput, setBankNameInput] = useState('')
    const [accNum, setAccNum] = useState('')
    const [accColor, setAccColor] = useState('#0d9488')
    const [accIcon, setAccIcon] = useState('Wallet')
    const [delPass, setDelPass] = useState('')
    const [confPass, setConfPass] = useState('')
    const [createError, setCreateError] = useState('')
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    if (!isOpen || !mounted || typeof document === 'undefined') {
        return null
    }

    const handleCreateAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreateError('')
        
        if (!accName.trim() || !bankNameInput.trim() || !accNum.trim()) {
            setCreateError('Please fill out all required fields')
            return
        }

        if (!delPass) {
            setCreateError('Deletion password is required')
            return
        }

        if (delPass.length < 6) {
            setCreateError('Password must be at least 6 characters long')
            return
        }

        if (delPass !== confPass) {
            setCreateError('Passwords do not match')
            return
        }

        try {
            setCreating(true)
            await createAccount({
                name: accName.trim(),
                bankName: bankNameInput.trim(),
                accountNumber: accNum.trim(),
                color: accColor,
                icon: accIcon,
                deletePassword: delPass,
                confirmPassword: confPass
            })
            
            // Reset form
            setAccName('')
            setBankNameInput('')
            setAccNum('')
            setAccColor('#0d9488')
            setAccIcon('Wallet')
            setDelPass('')
            setConfPass('')
            onClose()
        } catch (err: any) {
            setCreateError(err.message || 'Failed to create account')
        } finally {
            setCreating(false)
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                onClick={onClose}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
            />

            {/* Dialog Container */}
            <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200 select-none">
                <div className="flex justify-between items-start border-b border-border/40 pb-3 mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-custom-gradient">Create Workspace</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Initialize a new isolated bank account workspace.</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {createError && (
                    <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        <span>{createError}</span>
                    </div>
                )}

                <form onSubmit={handleCreateAccountSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground font-semibold">Account Name *</label>
                            <input
                                type="text"
                                value={accName}
                                onChange={e => setAccName(e.target.value)}
                                placeholder="e.g. Salary Account"
                                className="w-full border rounded-lg px-3 py-2 bg-background/50 border-border/80 focus:border-primary text-xs outline-none"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground font-semibold">Bank Name *</label>
                            <input
                                type="text"
                                value={bankNameInput}
                                onChange={e => setBankNameInput(e.target.value)}
                                placeholder="e.g. HDFC Bank"
                                className="w-full border rounded-lg px-3 py-2 bg-background/50 border-border/80 focus:border-primary text-xs outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5 col-span-2">
                            <label className="text-xs text-muted-foreground font-semibold">Masked Account Number *</label>
                            <input
                                type="text"
                                value={accNum}
                                onChange={e => setAccNum(e.target.value)}
                                placeholder="e.g. XXXX-4829"
                                className="w-full border rounded-lg px-3 py-2 bg-background/50 border-border/80 focus:border-primary text-xs outline-none"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground font-semibold">Accent Color</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="color"
                                    value={accColor}
                                    onChange={e => setAccColor(e.target.value)}
                                    className="w-8 h-8 rounded border border-border cursor-pointer p-0 bg-transparent block"
                                />
                                <span className="text-[10px] text-muted-foreground font-mono">{accColor}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-muted-foreground font-semibold block">Select Account Icon</label>
                        <div className="flex justify-around bg-muted/40 p-2 rounded-xl border border-border/30">
                            {[
                                { name: 'Wallet', icon: Wallet },
                                { name: 'CreditCard', icon: CreditCard },
                                { name: 'Landmark', icon: Landmark },
                                { name: 'PiggyBank', icon: PiggyBank },
                                { name: 'Coins', icon: Coins }
                            ].map((item) => {
                                const ItemIcon = item.icon
                                return (
                                    <button
                                        key={item.name}
                                        type="button"
                                        onClick={() => setAccIcon(item.name)}
                                        className={cn(
                                            "p-2.5 rounded-lg border transition-all flex flex-col items-center gap-1",
                                            accIcon === item.name
                                                ? "bg-primary border-primary text-white shadow-md scale-105"
                                                : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <ItemIcon className="h-4.5 w-4.5" />
                                        <span className="text-[9px] font-bold">{item.name}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground font-semibold">Deletion Password *</label>
                            <input
                                type="password"
                                value={delPass}
                                onChange={e => setDelPass(e.target.value)}
                                placeholder="Min 6 characters"
                                className="w-full border rounded-lg px-3 py-2 bg-background/50 border-border/80 focus:border-primary text-xs outline-none"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground font-semibold">Confirm Password *</label>
                            <input
                                type="password"
                                value={confPass}
                                onChange={e => setConfPass(e.target.value)}
                                placeholder="Re-enter password"
                                className="w-full border rounded-lg px-3 py-2 bg-background/50 border-border/80 focus:border-primary text-xs outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="rounded-xl font-bold text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={creating}
                            className="rounded-xl bg-custom-btn-gradient text-white font-bold text-xs"
                        >
                            {creating ? 'Creating...' : 'Create Account'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}
