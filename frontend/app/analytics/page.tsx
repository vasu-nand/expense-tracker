'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
const AnalyticsReport = dynamic(() => import('@/components/analytics/analytics-report').then(mod => mod.AnalyticsReport), { ssr: false })
const SpendingPredictor = dynamic(() => import('@/components/analytics/spending-predictor').then(mod => mod.SpendingPredictor), { ssr: false })
import { api } from '@/services/api'
import { Loader2, HelpCircle } from 'lucide-react'
import { getLocalMonth, cn } from '@/lib/utils'
import { useAccount } from '@/components/account-context'
import { Card } from '@/components/ui/card'
import { MonthPicker } from '@/components/ui/month-picker'
import { AnalyticsEmptyState } from '@/components/analytics/analytics-empty-state'
const AddExpenseDialog = dynamic(() => import('@/components/expenses/add-expense-dialog').then(mod => mod.AddExpenseDialog), { ssr: false })

export default function AnalyticsPage() {
    const { selectedAccount } = useAccount()
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    
    const [filterType, setFilterType] = useState<'single' | 'range'>('single')
    const [month, setMonth] = useState(getLocalMonth())
    const [startMonth, setStartMonth] = useState(getLocalMonth())
    const [endMonth, setEndMonth] = useState(getLocalMonth())

    const activeQueryMonth = filterType === 'single' ? month : `${startMonth}:${endMonth}`
    const [isAddOpen, setIsAddOpen] = useState(false)

    const fetchAnalytics = async () => {
        try {
            setLoading(true)
            setError('')
            const response = await api.get(`/analytics?month=${activeQueryMonth}`)
            setAnalytics(response.data)
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load analytics')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAnalytics()

        // Sync with dashboard/expense changes
        const handleExpenseAdded = () => fetchAnalytics()
        window.addEventListener('expense-added', handleExpenseAdded)
        return () => window.removeEventListener('expense-added', handleExpenseAdded)
    }, [activeQueryMonth, selectedAccount?._id])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
                <p className="text-muted-foreground animate-pulse text-sm">Loading financial analytics...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-destructive">Error</h2>
                    <p className="text-muted-foreground mt-2">{error}</p>
                </div>
            </div>
        )
    }

    const hasNoData = !analytics || analytics.totalEntries === 0

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header + Range Select Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-border/20">
                <div>
                    <h1 className="text-3xl font-bold text-custom-gradient">Analytics</h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        Income, spending, and net flow insights for {filterType === 'single' ? month : `${startMonth} to ${endMonth}`}
                    </p>
                </div>

                {/* Range Selection Control */}
                <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-muted/30 border border-border/40 p-1.5 rounded-2xl shadow-sm">
                    <div className="grid grid-cols-2 gap-1 bg-muted/65 p-1 rounded-xl">
                        <button
                            onClick={() => setFilterType('single')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all text-center select-none",
                                filterType === 'single' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Single Month
                        </button>
                        <button
                            onClick={() => setFilterType('range')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all text-center select-none",
                                filterType === 'range' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Month Range
                        </button>
                    </div>

                    {filterType === 'single' ? (
                        <div className="flex items-center justify-between sm:justify-start gap-2 px-1 py-0.5 w-full sm:w-40">
                            <MonthPicker
                                value={month}
                                onChange={setMonth}
                                placeholder="Select Month"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between sm:justify-start gap-2 px-1 py-0.5">
                            <MonthPicker
                                value={startMonth}
                                onChange={setStartMonth}
                                placeholder="From"
                            />
                            <span className="text-[10px] text-muted-foreground font-black uppercase">to</span>
                            <MonthPicker
                                value={endMonth}
                                onChange={setEndMonth}
                                placeholder="To"
                            />
                        </div>
                    )}
                </div>
            </div>

            {hasNoData ? (
                <div className="border border-border rounded-lg bg-card shadow-sm overflow-hidden">
                    <AnalyticsEmptyState onAction={() => setIsAddOpen(true)} />
                </div>
            ) : (
                <>
                    <AnalyticsReport data={analytics} />
                    <SpendingPredictor data={analytics} selectedMonth={filterType === 'single' ? month : startMonth} />
                </>
            )}

            <AddExpenseDialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={() => {
                    setIsAddOpen(false)
                }}
                defaultMonth={filterType === 'single' ? month : startMonth}
            />
        </div>
    )
}