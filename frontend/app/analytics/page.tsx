'use client'

import { useEffect, useState } from 'react'
import { AnalyticsReport } from '@/components/analytics/analytics-report'
import { SpendingPredictor } from '@/components/analytics/spending-predictor'
import { api } from '@/services/api'
import { Loader2 } from 'lucide-react'

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))

    useEffect(() => {
        fetchAnalytics()
    }, [month])

    const fetchAnalytics = async () => {
        try {
            setLoading(true)
            setError('')
            const response = await api.get(`/analytics?month=${month}`)
            setAnalytics(response.data)
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load analytics')
        } finally {
            setLoading(false)
        }
    }

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

    if (!analytics) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">No Data</h2>
                    <p className="text-muted-foreground mt-2">Upload transactions to see analytics</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-custom-gradient">Analytics</h1>
                    <p className="text-sm text-muted-foreground mt-1">Income, spending, and net flow insights for {month}</p>
                </div>
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="border rounded-md px-3 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-full sm:w-auto"
                />
            </div>

            <AnalyticsReport data={analytics} />
            <SpendingPredictor data={analytics} selectedMonth={month} />
        </div>
    )
}