'use client'

import { useEffect, useState } from 'react'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { DailyTrendChart } from '@/components/charts/daily-trend-chart'
import { CategoryPieChart } from '@/components/charts/category-pie-chart'
import { TopSpendingChart } from '@/components/charts/top-spending-chart'
import { ExpenseHeatmap } from '@/components/charts/expense-heatmap'
import { useDashboard } from '@/hooks/useDashboard'
import { Skeleton } from '@/components/ui/skeleton'
import { DayExpensesDialog } from '@/components/dashboard/day-expenses-dialog'

export default function DashboardPage() {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
    const { data, loading, error } = useDashboard(month)
    const [selectedDay, setSelectedDay] = useState<number | null>(null)

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
                <Skeleton className="h-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                </div>
                <Skeleton className="h-64" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-destructive">Error loading dashboard</h2>
                    <p className="text-muted-foreground">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="border rounded-md px-3 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-full sm:w-auto"
                />
            </div>

            <DashboardStats data={data} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DailyTrendChart data={data?.dailyTrend || []} />
                <CategoryPieChart data={data?.categoryBreakdown || {}} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopSpendingChart data={data?.topSpendingDays || []} />
                <ExpenseHeatmap 
                    data={data?.dailyTrend || []} 
                    month={month}
                    onDayClick={setSelectedDay}
                />
            </div>

            <DayExpensesDialog
                isOpen={selectedDay !== null}
                onClose={() => setSelectedDay(null)}
                day={selectedDay}
                month={month}
            />
        </div>
    )
}