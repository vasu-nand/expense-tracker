'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Coins, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BottomSelect } from '@/components/ui/bottom-select'
import { DatePicker } from '@/components/ui/date-picker'
import { api } from '@/services/api'

interface AddDividendDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    assets: Array<{ _id: string; symbol: string; name: string; assetType: string }>
    initialAssetId?: string
    editingDividend?: any
}

export function AddDividendDialog({ isOpen, onClose, onSuccess, assets, initialAssetId, editingDividend }: AddDividendDialogProps) {
    const [mounted, setMounted] = useState(false)
    const [assetId, setAssetId] = useState('')
    const [amount, setAmount] = useState('')
    const [tax, setTax] = useState('0')
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [availableAssets, setAvailableAssets] = useState(assets)
    const [bankAccounts, setBankAccounts] = useState<any[]>([])
    const [bankAccountId, setBankAccountId] = useState('')

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

    useEffect(() => {
        setMounted(true)
        if (isOpen) {
            if (editingDividend) {
                setAssetId(editingDividend.assetId?._id || editingDividend.assetId || '')
                setAmount(String(editingDividend.amount || ''))
                setTax(String(editingDividend.tax || 0))
                setBankAccountId(editingDividend.bankAccountId?._id || editingDividend.bankAccountId || '')
                if (editingDividend.date) {
                    setDate(new Date(editingDividend.date).toISOString().slice(0, 10))
                }
            } else {
                setAmount('')
                setTax('0')
                setDate(new Date().toISOString().slice(0, 10))
                if (initialAssetId) {
                    setAssetId(initialAssetId)
                }
            }

            api.get('/accounts')
                .then(res => {
                    const accs = res.data?.accounts || []
                    setBankAccounts(accs)
                    if (accs.length > 0 && !bankAccountId) {
                        const targetBankId = editingDividend?.bankAccountId?._id || editingDividend?.bankAccountId || accs[0]._id
                        setBankAccountId(targetBankId)
                    }
                })
                .catch(() => {})

            api.get('/portfolio/assets')
                .then(res => {
                    const fetched = res.data || []
                    setAvailableAssets(fetched)
                    if (fetched.length > 0) {
                        if (editingDividend) {
                            setAssetId(editingDividend.assetId?._id || editingDividend.assetId)
                        } else if (initialAssetId) {
                            setAssetId(initialAssetId)
                        } else if (!assetId) {
                            setAssetId(fetched[0]._id)
                        }
                    }
                })
                .catch(() => {
                    setAvailableAssets(assets)
                    if (assets.length > 0) {
                        if (editingDividend) {
                            setAssetId(editingDividend.assetId?._id || editingDividend.assetId)
                        } else if (initialAssetId) {
                            setAssetId(initialAssetId)
                        } else if (!assetId) {
                            setAssetId(assets[0]._id)
                        }
                    }
                })
            
            setTimeout(checkScroll, 150)
        }
    }, [isOpen, assets, initialAssetId, editingDividend])

    if (!isOpen || !mounted || typeof document === 'undefined') return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!assetId) {
            setError('Please select an asset')
            return
        }

        const amtNum = parseFloat(amount)
        if (isNaN(amtNum) || amtNum <= 0) {
            setError('Please enter a valid positive dividend amount')
            return
        }

        try {
            setLoading(true)
            setError('')
            const payload = {
                assetId,
                bankAccountId: bankAccountId || undefined,
                amount: amtNum,
                tax: Math.max(0, parseFloat(tax) || 0),
                date: new Date(date).toISOString()
            }

            if (editingDividend?._id) {
                await api.put(`/portfolio/dividends/${editingDividend._id}`, payload)
            } else {
                await api.post('/portfolio/dividends', payload)
            }

            setAmount('')
            setTax('0')
            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save dividend')
        } finally {
            setLoading(false)
        }
    }

    const dateObj = new Date(date || Date.now())
    const currentDay = isNaN(dateObj.getDate()) ? new Date().getDate() : dateObj.getDate()
    const currentMonthStr = isNaN(dateObj.getTime())
        ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
        : `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`

    const handleDateChange = (newDay: number, newMonth: string) => {
        setDate(`${newMonth}-${String(newDay).padStart(2, '0')}`)
    }

    const assetOptions = availableAssets.map(a => ({
        value: a._id,
        label: `${a.symbol} - ${a.name}`
    }))

    const bankAccountOptions = bankAccounts.map(b => ({
        value: b._id,
        label: `${b.name} (${b.bankName})`
    }))

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                {/* Fixed Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/60 bg-card shrink-0 z-10">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                            <Coins className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-extrabold text-foreground">{editingDividend ? 'Edit Dividend Entry' : 'Record Dividend Income'}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    {/* Scrollable Form Body (Hidden Scrollbar) */}
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

                        <div>
                            <label className="text-xs font-bold text-muted-foreground block mb-1">Select Asset *</label>
                            <BottomSelect
                                value={assetId}
                                onChange={setAssetId}
                                options={assetOptions}
                                label="Select Dividend Asset"
                                placeholder="Select asset..."
                                triggerClassName="py-2 text-xs"
                                disabled={availableAssets.length === 0}
                            />
                        </div>

                        {bankAccounts.length > 0 && (
                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1">Deposit Bank Account</label>
                                <BottomSelect
                                    value={bankAccountId}
                                    onChange={setBankAccountId}
                                    options={bankAccountOptions}
                                    label="Select Bank Account"
                                    placeholder="Select bank account..."
                                    triggerClassName="py-2 text-xs"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1">Gross Amount *</label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-muted/50 border border-border rounded-xl focus:outline-none focus:border-primary text-foreground"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1">TDS / Tax Withheld</label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="0.00"
                                    value={tax}
                                    onChange={(e) => setTax(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-muted/50 border border-border rounded-xl focus:outline-none focus:border-primary text-foreground"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-muted-foreground block mb-1">Payout Date</label>
                            <DatePicker
                                day={currentDay}
                                month={currentMonthStr}
                                onChange={handleDateChange}
                                label="Select Dividend Payout Date"
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
                        <Button type="submit" size="sm" disabled={loading || !assetId} className="rounded-xl text-xs bg-custom-btn-gradient text-white">
                            {loading ? 'Saving...' : editingDividend ? 'Update Dividend' : 'Record Dividend'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}
