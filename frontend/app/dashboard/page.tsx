'use client'

import { useEffect, useState, useMemo } from 'react'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import dynamic from 'next/dynamic'

const DailyTrendChart = dynamic(() => import('@/components/charts/daily-trend-chart').then(mod => mod.DailyTrendChart), { ssr: false })
const CategoryPieChart = dynamic(() => import('@/components/charts/category-pie-chart').then(mod => mod.CategoryPieChart), { ssr: false })
const TopSpendingChart = dynamic(() => import('@/components/charts/top-spending-chart').then(mod => mod.TopSpendingChart), { ssr: false })
const ExpenseHeatmap = dynamic(() => import('@/components/charts/expense-heatmap').then(mod => mod.ExpenseHeatmap), { ssr: false })
const MonthComparisonChart = dynamic(() => import('@/components/charts/month-comparison-chart').then(mod => mod.MonthComparisonChart), { ssr: false })
import { useDashboard } from '@/hooks/useDashboard'
import { Skeleton } from '@/components/ui/skeleton'
import { DayExpensesDialog } from '@/components/dashboard/day-expenses-dialog'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getLocalMonth, cn } from '@/lib/utils'
import { MonthPicker } from '@/components/ui/month-picker'
import { useCurrency } from '@/hooks/use-currency'


export default function DashboardPage() {
    const [filterType, setFilterType] = useState<'single' | 'range'>('single')
    const [month, setMonth] = useState(getLocalMonth())
    const [startMonth, setStartMonth] = useState(getLocalMonth())
    const [endMonth, setEndMonth] = useState(getLocalMonth())

    const { convert } = useCurrency()

    const activeQueryMonth = filterType === 'single' ? month : `${startMonth}:${endMonth}`
    const { data, loading, error } = useDashboard(activeQueryMonth)
    const [selectedDay, setSelectedDay] = useState<number | null>(null)

    const isMultipleMonthsRange = filterType === 'range' && startMonth !== endMonth

    const monthlySummary = useMemo(() => {
        if (!data || !data.dailyTrend) return []
        
        const map = new Map<string, { month: string; expense: number; income: number; net: number }>()
        data.dailyTrend.forEach((item: any) => {
            const m = item.month || 'Unknown'
            const exp = item.expense || 0
            const inc = item.income || 0
            
            if (!map.has(m)) {
                map.set(m, { month: m, expense: 0, income: 0, net: 0 })
            }
            const existing = map.get(m)!
            existing.expense += exp
            existing.income += inc
            existing.net = existing.income - existing.expense
        })
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return Array.from(map.values())
            .map((item: any) => {
                let name = item.month
                try {
                    const [year, mNum] = item.month.split('-')
                    name = `${monthNames[parseInt(mNum) - 1]} ${year}`
                } catch {}
                return {
                    ...item,
                    name,
                    expense: convert(item.expense),
                    income: convert(item.income),
                    net: convert(item.net)
                }
            })
            .sort((a, b) => a.month.localeCompare(b.month))
    }, [data?.dailyTrend, convert])


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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-border/20">
                <h1 className="text-3xl font-bold text-custom-gradient">Dashboard</h1>
                
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

            <DashboardStats data={data} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DailyTrendChart data={data?.dailyTrend || []} />
                <CategoryPieChart data={data?.categoryBreakdown || {}} incomeData={data?.incomeCategoryBreakdown || {}} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopSpendingChart data={data?.dailyTrend || []} />
                {isMultipleMonthsRange ? (
                    <MonthComparisonChart data={monthlySummary} />
                ) : (
                    <ExpenseHeatmap 
                        data={data?.dailyTrend || []} 
                        month={filterType === 'single' ? month : startMonth}
                        onDayClick={setSelectedDay}
                    />
                )}
            </div>

            <DayExpensesDialog
                isOpen={selectedDay !== null}
                onClose={() => setSelectedDay(null)}
                day={selectedDay}
                month={activeQueryMonth}
            />
        </div>
    )
}