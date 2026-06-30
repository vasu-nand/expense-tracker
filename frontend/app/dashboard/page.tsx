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
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-custom-gradient">Dashboard</h1>
                
                <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-muted-foreground bg-card border border-border/80 px-3 py-2 rounded-xl font-mono shadow-sm">
                        {new Date(month + '-02').toLocaleString('default', { month: 'short', year: 'numeric' })}
                    </span>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="relative h-9 w-9 rounded-xl border-border/80 text-muted-foreground hover:text-foreground shadow-sm"
                    >
                        <Calendar className="h-4 w-4" />
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                    </Button>
                </div>
            </div>

            <DashboardStats data={data} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DailyTrendChart data={data?.dailyTrend || []} />
                <CategoryPieChart data={data?.categoryBreakdown || {}} incomeData={data?.incomeCategoryBreakdown || {}} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopSpendingChart data={data?.dailyTrend || []} />
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