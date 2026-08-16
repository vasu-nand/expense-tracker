'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ArrowUpRight, ArrowDownLeft, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BottomSelect } from '@/components/ui/bottom-select'
import { DatePicker } from '@/components/ui/date-picker'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'
import { useCurrency } from '@/hooks/use-currency'

interface AddTransactionDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    assets: Array<{ _id: string; symbol: string; name: string; assetType: string }>
    initialAssetId?: string
    editingTransaction?: any
}

export function AddTransactionDialog({ isOpen, onClose, onSuccess, assets, initialAssetId, editingTransaction }: AddTransactionDialogProps) {
    const { convert, convertToBase, format, currency } = useCurrency()
    const [mounted, setMounted] = useState(false)
    const [assetId, setAssetId] = useState('')
    const [type, setType] = useState<'buy' | 'sell'>('buy')
    const [quantity, setQuantity] = useState('')
    const [price, setPrice] = useState('')
    const [fees, setFees] = useState('0')
    const [tax, setTax] = useState('0')
    const [dateTime, setDateTime] = useState(new Date().toISOString().slice(0, 16))
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [availableAssets, setAvailableAssets] = useState(assets)
    const [fetchingPrice, setFetchingPrice] = useState(false)
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
            if (editingTransaction) {
                const targetAssetId = editingTransaction.assetId?._id || editingTransaction.assetId || ''
                setAssetId(targetAssetId)
                setType(editingTransaction.type || 'buy')
                setQuantity(String(editingTransaction.quantity || ''))
                setPrice(String(convert(editingTransaction.price || 0).toFixed(2)))
                setFees(String(convert(editingTransaction.fees || 0)))
                setTax(String(convert(editingTransaction.tax || 0)))
                setNotes(editingTransaction.notes || '')
                setBankAccountId(editingTransaction.bankAccountId?._id || editingTransaction.bankAccountId || '')
                if (editingTransaction.dateTime) {
                    setDateTime(new Date(editingTransaction.dateTime).toISOString().slice(0, 16))
                }
            } else {
                setQuantity('')
                setPrice('')
                setFees('0')
                setTax('0')
                setNotes('')
                setDateTime(new Date().toISOString().slice(0, 16))
                if (initialAssetId) {
                    setAssetId(initialAssetId)
                }
            }

            api.get('/accounts')
                .then(res => {
                    const accs = res.data?.accounts || []
                    setBankAccounts(accs)
                    if (accs.length > 0 && !bankAccountId) {
                        const targetBankId = editingTransaction?.bankAccountId?._id || editingTransaction?.bankAccountId || accs[0]._id
                        setBankAccountId(targetBankId)
                    }
                })
                .catch(() => {})

            api.get('/portfolio/assets')
                .then(res => {
                    const fetched = res.data || []
                    setAvailableAssets(fetched)
                    if (fetched.length > 0) {
                        if (editingTransaction) {
                            const targetId = editingTransaction.assetId?._id || editingTransaction.assetId
                            setAssetId(targetId)
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
                        if (editingTransaction) {
                            setAssetId(editingTransaction.assetId?._id || editingTransaction.assetId)
                        } else if (initialAssetId) {
                            setAssetId(initialAssetId)
                        } else if (!assetId) {
                            setAssetId(assets[0]._id)
                        }
                    }
                })
            
            setTimeout(checkScroll, 150)
        }
    }, [isOpen, assets, initialAssetId, editingTransaction])

    // Auto-fetch current market price whenever selected assetId changes (only for new transaction)
    useEffect(() => {
        if (!editingTransaction && assetId && availableAssets.length > 0) {
            const targetAsset = availableAssets.find(a => String(a._id) === String(assetId))
            if (targetAsset?.symbol) {
                setFetchingPrice(true)
                api.get(`/portfolio/price/${targetAsset.symbol}`)
                    .then(res => {
                        if (res.data && res.data.price !== undefined) {
                            const priceInDisplayCurrency = convert(res.data.price)
                            setPrice(priceInDisplayCurrency.toFixed(2))
                        }
                    })
                    .catch(() => {})
                    .finally(() => setFetchingPrice(false))
            }
        }
    }, [assetId, availableAssets, currency, editingTransaction])

    if (!isOpen || !mounted || typeof document === 'undefined') return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!assetId) {
            setError('Please select or create an asset first')
            return
        }

        const qtyNum = parseFloat(quantity)
        const rawPriceInput = parseFloat(price)

        if (isNaN(qtyNum) || qtyNum <= 0 || isNaN(rawPriceInput) || rawPriceInput < 0) {
            setError('Please enter valid positive quantity and price')
            return
        }

        // Convert user input from current display currency back to INR base currency for backend storage
        const basePrice = convertToBase(rawPriceInput)
        const baseFees = Math.max(0, convertToBase(parseFloat(fees) || 0))
        const baseTax = Math.max(0, convertToBase(parseFloat(tax) || 0))

        try {
            setLoading(true)
            setError('')
            const payload = {
                assetId,
                bankAccountId: bankAccountId || undefined,
                type,
                quantity: qtyNum,
                price: basePrice,
                fees: baseFees,
                tax: baseTax,
                dateTime: new Date(dateTime).toISOString(),
                notes: notes.trim()
            }

            if (editingTransaction?._id) {
                await api.put(`/portfolio/transactions/${editingTransaction._id}`, payload)
            } else {
                await api.post('/portfolio/transactions', payload)
            }

            setQuantity('')
            setPrice('')
            setNotes('')
            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save transaction')
        } finally {
            setLoading(false)
        }
    }

    const calculatedTotalInInputCurrency = (parseFloat(quantity) || 0) * (parseFloat(price) || 0) + (parseFloat(fees) || 0) + (parseFloat(tax) || 0)
    const baseTotal = convertToBase(calculatedTotalInInputCurrency)

    const dateObj = new Date(dateTime || Date.now())
    const currentDay = isNaN(dateObj.getDate()) ? new Date().getDate() : dateObj.getDate()
    const currentMonthStr = isNaN(dateObj.getTime())
        ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
        : `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`

    const handleDateChange = (newDay: number, newMonth: string) => {
        const timePart = dateTime.includes('T') ? dateTime.split('T')[1] : '12:00'
        setDateTime(`${newMonth}-${String(newDay).padStart(2, '0')}T${timePart}`)
    }

    const assetOptions = availableAssets.map(a => ({
        value: a._id,
        label: `${a.symbol} - ${a.name} (${a.assetType})`
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
                        <div className={cn(
                            "p-2 rounded-xl text-white font-bold",
                            type === 'buy' ? "bg-emerald-500" : "bg-rose-500"
                        )}>
                            {type === 'buy' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                        </div>
                        <h2 className="text-lg font-extrabold text-foreground">{editingTransaction ? 'Edit Transaction' : 'Record Transaction'}</h2>
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

                        {/* Buy vs Sell toggle */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setType('buy')}
                                className={cn(
                                    "py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                                    type === 'buy' ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <ArrowUpRight className="h-3.5 w-3.5" />
                                BUY
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('sell')}
                                className={cn(
                                    "py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                                    type === 'sell' ? "bg-rose-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <ArrowDownLeft className="h-3.5 w-3.5" />
                                SELL
                            </button>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-muted-foreground block mb-1">Target Asset *</label>
                            <BottomSelect
                                value={assetId}
                                onChange={setAssetId}
                                options={assetOptions}
                                label="Select Investment Asset"
                                placeholder="Select asset..."
                                triggerClassName="py-2 text-xs"
                                disabled={availableAssets.length === 0}
                            />
                        </div>

                        {bankAccounts.length > 0 && (
                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1">Linked Bank Account</label>
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
                                <label className="text-xs font-bold text-muted-foreground block mb-1">Quantity *</label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="0.00"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-muted/50 border border-border rounded-xl focus:outline-none focus:border-primary text-foreground"
                                    required
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-bold text-muted-foreground block">Price per Unit *</label>
                                    {fetchingPrice ? (
                                        <span className="text-[10px] text-primary animate-pulse font-semibold">Fetching price...</span>
                                    ) : (
                                        <span className="text-[10px] text-emerald-500 font-semibold">Live price filled</span>
                                    )}
                                </div>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="0.00"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-muted/50 border border-border rounded-xl focus:outline-none focus:border-primary text-foreground font-mono font-semibold"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1">Broker Fees</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={fees}
                                    onChange={(e) => setFees(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-muted/50 border border-border rounded-xl focus:outline-none focus:border-primary text-foreground"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1">STT / Taxes</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={tax}
                                    onChange={(e) => setTax(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-muted/50 border border-border rounded-xl focus:outline-none focus:border-primary text-foreground"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-muted-foreground block mb-1">Transaction Date</label>
                            <DatePicker
                                day={currentDay}
                                month={currentMonthStr}
                                onChange={handleDateChange}
                                label="Select Transaction Date"
                                triggerClassName="py-2 text-xs"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-muted-foreground block mb-1">Notes (Optional)</label>
                            <input
                                type="text"
                                placeholder="SIP, Lumpsum, Rebalancing..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-muted/50 border border-border rounded-xl focus:outline-none focus:border-primary text-foreground"
                            />
                        </div>

                        <div className="p-3 bg-muted/40 rounded-xl flex items-center justify-between text-xs font-bold">
                            <span className="text-muted-foreground">Estimated Total Amount:</span>
                            <span className="text-foreground text-sm font-extrabold">{format(baseTotal)}</span>
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
                            {loading ? 'Saving...' : editingTransaction ? 'Update Transaction' : 'Record Transaction'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}
