'use client'

import { useEffect, useState } from 'react'
import { AnalyticsReport } from '@/components/analytics/analytics-report'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/services/api'

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
            const response = await api.get(`/analytics?month=${month}`)
            setAnalytics(response.data)
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load analytics')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-destructive">Error</h2>
                    <p className="text-muted-foreground">{error}</p>
                </div>
            </div>
        )
    }

    if (!analytics) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">No Data</h2>
                    <p className="text-muted-foreground">Upload expenses to see analytics</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-3xl font-bold">Analytics</h1>
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="border rounded-md px-3 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-full sm:w-auto"
                />
            </div>

            <AnalyticsReport data={analytics} />
        </div>
    )
}