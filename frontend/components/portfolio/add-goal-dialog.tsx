'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Target, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { api } from '@/services/api'

interface AddGoalDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    initialData?: {
        _id?: string
        name?: string
        targetAmount?: number
        currentProgress?: number
        deadline?: string
    } | null
}

export function AddGoalDialog({ isOpen, onClose, onSuccess, initialData }: AddGoalDialogProps) {
    const [mounted, setMounted] = useState(false)
    const [name, setName] = useState('')
    const [targetAmount, setTargetAmount] = useState('')
    const [currentProgress, setCurrentProgress] = useState('0')
    const [deadline, setDeadline] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

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
        if (initialData) {
            setName(initialData.name || '')
            setTargetAmount(initialData.targetAmount ? String(initialData.targetAmount) : '')
            setCurrentProgress(initialData.currentProgress ? String(initialData.currentProgress) : '0')
            setDeadline(initialData.deadline ? new Date(initialData.deadline).toISOString().slice(0, 10) : '')
        } else {
            setName('')
            setTargetAmount('')
            setCurrentProgress('0')
            const defaultDate = new Date()
            defaultDate.setFullYear(defaultDate.getFullYear() + 1)
            setDeadline(defaultDate.toISOString().slice(0, 10))
        }

        if (isOpen) {
            setTimeout(checkScroll, 150)
        }
    }, [initialData, isOpen])

    if (!isOpen || !mounted || typeof document === 'undefined') return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !targetAmount) {
            setError('Please provide goal name and target amount')
            return
        }

        const targetNum = parseFloat(targetAmount)
        const progressNum = parseFloat(currentProgress) || 0

        if (isNaN(targetNum) || targetNum <= 0) {
            setError('Target amount must be a positive number')
            return
        }

        try {
            setLoading(true)
            setError('')
            
            const payload = {
                name: name.trim(),
                targetAmount: targetNum,
                currentProgress: progressNum,
                deadline: new Date(deadline).toISOString()
            }

            if (initialData?._id) {
                await api.put(`/portfolio/goals/${initialData._id}`, payload)
            } else {
                await api.post('/portfolio/goals', payload)
            }

            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save wealth goal')
        } finally {
            setLoading(false)
        }
    }

    const dateObj = new Date(deadline || Date.now())
    const currentDay = isNaN(dateObj.getDate()) ? new Date().getDate() : dateObj.getDate()
    const currentMonthStr = isNaN(dateObj.getTime())
        ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
        : `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`

    const handleDateChange = (newDay: number, newMonth: string) => {
        setDeadline(`${newMonth}-${String(newDay).padStart(2, '0')}`)
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                {/* Fixed Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/60 bg-card shrink-0 z-10">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                            <Target className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-extrabold text-foreground">
                            {initialData?._id ? 'Edit Wealth Goal' : 'Create Wealth Goal'}
                        </h2>
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
                            <label className="text-xs font-bold text-muted-foreground block mb-1">Goal Name *</label>
                            <input
                                type="text"
                                placeholder="e.g. Retirement Corpus, House Down Payment, Emergency Fund"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-muted/50 border border-border rounded-xl focus:outline-none focus:border-primary text-foreground"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1">Target Amount *</label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 1000000"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-muted/50 border border-border rounded-xl focus:outline-none focus:border-primary text-foreground"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1">Current Savings / Progress</label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="0"
                                    value={currentProgress}
                                    onChange={(e) => setCurrentProgress(e.target.value)}
                                    className="w-full px-3 py-2 text-xs bg-muted/50 border border-border rounded-xl focus:outline-none focus:border-primary text-foreground"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-muted-foreground block mb-1">Target Completion Deadline *</label>
                            <DatePicker
                                day={currentDay}
                                month={currentMonthStr}
                                onChange={handleDateChange}
                                label="Select Target Completion Deadline"
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
                        <Button type="submit" size="sm" disabled={loading} className="rounded-xl text-xs bg-custom-btn-gradient text-white">
                            {loading ? 'Saving...' : initialData?._id ? 'Update Goal' : 'Create Goal'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}
