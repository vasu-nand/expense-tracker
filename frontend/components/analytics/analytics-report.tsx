'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sparkles, AlertTriangle, Lightbulb, PieChart, BarChart3, CalendarDays, Activity, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { useCurrency } from '@/hooks/use-currency'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'
import { cn } from '@/lib/utils'

interface AnalyticsReportProps {
    data: {
        month: string;
        totalExpense: number;
        totalIncome?: number;
        netSavings?: number;
        totalDays: number;
        averageDailyExpense: number;
        highestExpenseDay: number;
        categoryBreakdown: Record<string, number>;
        incomeCategoryBreakdown?: Record<string, number>;
        insights: string[];
        weekdayWeekend?: {
            weekdayTotal: number;
            weekendTotal: number;
            weekdayCount: number;
            weekendCount: number;
            weekdayAverage: number;
            weekendAverage: number;
        };
        weeklySpend?: Array<{
            name: string;
            amount: number;
            income?: number;
        }>;
        transactionSizes?: {
            low: number;
            medium: number;
            high: number;
            expense?: { low: number; medium: number; high: number };
            income?: { low: number; medium: number; high: number };
        };
    }
}

export function AnalyticsReport({ data }: AnalyticsReportProps) {
    const { convert, symbol, format } = useCurrency()
    const [categoryTab, setCategoryTab] = useState<'spending' | 'income'>('spending')

    const {
        totalExpense,
        totalIncome = 0,
        averageDailyExpense,
        highestExpenseDay,
        categoryBreakdown,
        incomeCategoryBreakdown = {},
        insights,
        weekdayWeekend,
        weeklySpend,
        transactionSizes
    } = data;

    const netSavings = totalIncome - totalExpense

    // Helper to dynamically adjust text size for large numbers to prevent overflow
    const getFontSizeClass = (amount: number) => {
        const formatted = format(amount)
        const len = formatted.length
        if (len > 14) return 'text-lg sm:text-xl md:text-2xl'
        if (len > 11) return 'text-xl sm:text-2xl md:text-3xl'
        if (len > 8) return 'text-2xl sm:text-3xl'
        return 'text-3xl'
    }

    // Helper to dynamically adjust text size for weekday/weekend metrics to prevent overflow
    const getDynamicsFontSizeClass = (amount: number) => {
        const formatted = format(amount)
        const len = formatted.length
        if (len > 14) return 'text-xs sm:text-sm md:text-base'
        if (len > 11) return 'text-sm sm:text-base md:text-lg'
        if (len > 8) return 'text-base sm:text-lg md:text-xl'
        return 'text-2xl'
    }

    // Convert weekly spend chart data to display currency
    const convertedWeeklySpend = weeklySpend?.map(item => ({
        name: item.name,
        Spending: convert(item.amount),
        Income: convert(item.income ?? 0),
    }));

    // Calculate percentages for expense category breakdown
    const expenseCategoryList = Object.entries(categoryBreakdown)
        .map(([name, amount]) => ({
            name,
            amount,
            percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount);

    // Calculate percentages for income category breakdown
    const totalIncomeCategories = Object.values(incomeCategoryBreakdown).reduce((s, v) => s + v, 0)
    const incomeCategoryList = Object.entries(incomeCategoryBreakdown)
        .map(([name, amount]) => ({
            name,
            amount,
            percentage: totalIncomeCategories > 0 ? (amount / totalIncomeCategories) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount);

    // Active category list based on selected tab
    const activeCategoryList = categoryTab === 'spending' ? expenseCategoryList : incomeCategoryList

    // Dynamic icon picker for insights based on words
    const getInsightIcon = (text: string) => {
        const lower = text.toLowerCase();
        if (lower.includes('warning') || lower.includes('high') || lower.includes('limit') || lower.includes('caution')) {
            return <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />;
        }
        if (lower.includes('suggest') || lower.includes('save') || lower.includes('opportunity')) {
            return <Lightbulb className="h-5 w-5 text-emerald-500 flex-shrink-0" />;
        }
        return <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />;
    };

    return (
        <div className="space-y-6">
            {/* Quick Metrics Grid — 4 columns */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Monthly Income */}
                <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                    <CardHeader className="pb-2 pt-4">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <ArrowUpRight className="h-3 w-3 text-emerald-500" /> Monthly Income
                        </CardDescription>
                        <CardTitle className={cn("font-extrabold truncate text-emerald-600 dark:text-emerald-400", getFontSizeClass(totalIncome || 0))} title={format(totalIncome || 0)}>
                            {format(totalIncome || 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Total earnings this month</p>
                    </CardContent>
                </Card>

                {/* Monthly Expenses */}
                <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-rose-400 to-red-500" />
                    <CardHeader className="pb-2 pt-4">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <ArrowDownRight className="h-3 w-3 text-rose-500" /> Monthly Expenses
                        </CardDescription>
                        <CardTitle className={cn("font-extrabold truncate text-rose-600 dark:text-rose-400", getFontSizeClass(totalExpense || 0))} title={format(totalExpense || 0)}>
                            {format(totalExpense || 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Aggregated across all entries</p>
                    </CardContent>
                </Card>

                {/* Net Flow */}
                <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className={cn("h-1", netSavings >= 0 ? "bg-gradient-to-r from-emerald-400 to-green-500" : "bg-gradient-to-r from-rose-400 to-red-500")} />
                    <CardHeader className="pb-2 pt-4">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            {netSavings >= 0 ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-rose-500" />}
                            Net Cash Flow
                        </CardDescription>
                        <CardTitle className={cn("font-extrabold truncate", netSavings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400", getFontSizeClass(netSavings))} title={(netSavings >= 0 ? '+' : '') + format(netSavings)}>
                            {netSavings >= 0 ? '+' : ''}{format(netSavings)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">{netSavings >= 0 ? 'Surplus this month' : 'Deficit this month'}</p>
                    </CardContent>
                </Card>

                {/* Daily Spend Average */}
                <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-teal-400 to-cyan-500" />
                    <CardHeader className="pb-2 pt-4">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Minus className="h-3 w-3 text-teal-500" /> Daily Spend Avg
                        </CardDescription>
                        <CardTitle className={cn("font-extrabold truncate text-primary", getFontSizeClass(averageDailyExpense || 0))} title={format(averageDailyExpense || 0)}>
                            {format(averageDailyExpense || 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Adjusted for active transaction days</p>
                    </CardContent>
                </Card>
            </div>

            {/* Smart Insights & Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Insights List */}
                <Card className="border border-border bg-card shadow-md transition-shadow hover:shadow-lg">
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                Smart Insights
                            </CardTitle>
                        </div>
                        <CardDescription>Automated observations and recommendations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {insights && insights.length > 0 ? (
                            <div className="space-y-4">
                                {insights.map((insight, index) => (
                                    <div 
                                        key={index}
                                        className="flex items-start space-x-3 p-3.5 bg-muted/40 rounded-xl hover:bg-muted/60 transition-colors border border-border/50"
                                    >
                                        {getInsightIcon(insight)}
                                        <p className="text-sm leading-relaxed text-foreground">{insight}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-48 flex flex-col items-center justify-center text-center">
                                <Sparkles className="h-10 w-10 text-muted/60 mb-2" />
                                <p className="text-muted-foreground text-sm">No insights available for this period yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Category Breakdown with tabs */}
                <Card className="border border-border bg-card shadow-md transition-shadow hover:shadow-lg">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <PieChart className="h-5 w-5 text-primary" />
                                <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                    Category Breakdown
                                </CardTitle>
                            </div>
                            {/* Tab Toggle */}
                            <div className="flex bg-muted rounded-lg p-0.5 text-xs font-bold">
                                <button
                                    onClick={() => setCategoryTab('spending')}
                                    className={cn(
                                        "px-3 py-1 rounded-md transition-all",
                                        categoryTab === 'spending'
                                            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    Spending
                                </button>
                                <button
                                    onClick={() => setCategoryTab('income')}
                                    className={cn(
                                        "px-3 py-1 rounded-md transition-all",
                                        categoryTab === 'income'
                                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    Income
                                </button>
                            </div>
                        </div>
                        <CardDescription>
                            {categoryTab === 'spending' ? 'Category-wise distribution of monthly expenses' : 'Sources driving monthly income'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {activeCategoryList.length > 0 ? (
                            <div className="space-y-5">
                                {activeCategoryList.map((category) => (
                                    <div key={category.name} className="space-y-1.5">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-semibold text-foreground capitalize">{category.name}</span>
                                            <div className="flex space-x-2 text-muted-foreground font-mono">
                                                <span>{format(category.amount)}</span>
                                                <span className={cn("font-bold", categoryTab === 'spending' ? "text-rose-500" : "text-emerald-500")}>
                                                    ({category.percentage.toFixed(1)}%)
                                                </span>
                                            </div>
                                        </div>
                                        {/* Progress Bar Container */}
                                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                            <div 
                                                className={cn("h-full rounded-full transition-all duration-500 ease-out", categoryTab === 'spending' ? "bg-rose-500" : "bg-emerald-500")}
                                                style={{ width: `${category.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-48 flex flex-col items-center justify-center text-center">
                                <PieChart className="h-10 w-10 text-muted/60 mb-2" />
                                <p className="text-muted-foreground text-sm">
                                    {categoryTab === 'spending' ? 'No expense category data available' : 'No income recorded this period'}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Weekly and Weekend/Weekday Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Spending + Income Bar Chart */}
                {convertedWeeklySpend && (
                    <Card className="border border-border bg-card shadow-md transition-shadow hover:shadow-lg">
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                <CardTitle className="text-xl font-bold text-custom-gradient">
                                    Weekly Flow Comparison
                                </CardTitle>
                            </div>
                            <CardDescription>Spending vs income grouped by calendar week</CardDescription>
                        </CardHeader>
                        <CardContent className="h-64 pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={convertedWeeklySpend} margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="weeklySpendGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="rgb(244, 63, 94)" stopOpacity={0.85}/>
                                            <stop offset="100%" stopColor="rgb(190, 18, 60)" stopOpacity={0.3}/>
                                        </linearGradient>
                                        <linearGradient id="weeklyIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="rgb(52, 211, 153)" stopOpacity={0.9}/>
                                            <stop offset="100%" stopColor="rgb(5, 150, 105)" stopOpacity={0.3}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.15} vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fontSize: 11, fill: 'currentColor' }} 
                                        className="text-muted-foreground"
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 11, fill: 'currentColor' }} 
                                        className="text-muted-foreground"
                                        tickFormatter={(value: number) => `${symbol}${value}`} 
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: 'var(--radius)',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                        }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                        formatter={(value: number, name: string) => [`${symbol}${Number(value).toFixed(2)}`, name]}
                                    />
                                    <Legend
                                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                                        formatter={(value) => <span style={{ color: 'hsl(var(--muted-foreground))' }}>{value}</span>}
                                    />
                                    <Bar 
                                        dataKey="Spending" 
                                        fill="url(#weeklySpendGrad)" 
                                        radius={[4, 4, 0, 0]}
                                        barSize={20}
                                        stroke="rgb(190, 18, 60)"
                                        strokeWidth={1}
                                    />
                                    <Bar 
                                        dataKey="Income" 
                                        fill="url(#weeklyIncomeGrad)" 
                                        radius={[4, 4, 0, 0]}
                                        barSize={20}
                                        stroke="rgb(5, 150, 105)"
                                        strokeWidth={1}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Weekday vs Weekend Analysis */}
                {weekdayWeekend && (
                    <Card className="border border-border bg-card shadow-md transition-shadow hover:shadow-lg">
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <CalendarDays className="h-5 w-5 text-primary" />
                                <CardTitle className="text-xl font-bold text-custom-gradient">
                                    Weekday vs Weekend Dynamics
                                </CardTitle>
                            </div>
                            <CardDescription>Comparison of spending behavior on workdays vs weekends</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-muted/40 rounded-xl border border-border/50 space-y-1 overflow-hidden">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block truncate">Workdays (Mon-Fri)</span>
                                    <div className={cn("font-bold truncate text-primary", getDynamicsFontSizeClass(weekdayWeekend.weekdayTotal))} title={format(weekdayWeekend.weekdayTotal)}>
                                        {format(weekdayWeekend.weekdayTotal)}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {weekdayWeekend.weekdayCount} txs, avg {format(weekdayWeekend.weekdayAverage)}/tx
                                    </p>
                                </div>
                                <div className="p-4 bg-muted/40 rounded-xl border border-border/50 space-y-1 overflow-hidden">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block truncate">Weekends (Sat-Sun)</span>
                                    <div className={cn("font-bold truncate text-primary/75", getDynamicsFontSizeClass(weekdayWeekend.weekendTotal))} title={format(weekdayWeekend.weekendTotal)}>
                                        {format(weekdayWeekend.weekendTotal)}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {weekdayWeekend.weekendCount} txs, avg {format(weekdayWeekend.weekendAverage)}/tx
                                    </p>
                                </div>
                            </div>

                            {/* Comparison Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                    <span>Workdays ({((weekdayWeekend.weekdayTotal / (weekdayWeekend.weekdayTotal + weekdayWeekend.weekendTotal || 1)) * 100).toFixed(0)}%)</span>
                                    <span>Weekends ({((weekdayWeekend.weekendTotal / (weekdayWeekend.weekdayTotal + weekdayWeekend.weekendTotal || 1)) * 100).toFixed(0)}%)</span>
                                </div>
                                <div className="h-3 w-full bg-primary/10 rounded-full overflow-hidden flex">
                                    <div 
                                        className="bg-primary h-full transition-all duration-500" 
                                        style={{ width: `${(weekdayWeekend.weekdayTotal / (weekdayWeekend.weekdayTotal + weekdayWeekend.weekendTotal || 1)) * 100}%` }}
                                    />
                                    <div 
                                        className="bg-primary/50 h-full transition-all duration-500" 
                                        style={{ width: `${(weekdayWeekend.weekendTotal / (weekdayWeekend.weekdayTotal + weekdayWeekend.weekendTotal || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Transaction Sizes Card */}
            {transactionSizes && (
                <Card className="border border-border bg-card shadow-md transition-shadow hover:shadow-lg">
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Activity className="h-5 w-5 text-primary" />
                            <CardTitle className="text-xl font-bold text-custom-gradient">
                                Transaction Size Distribution
                            </CardTitle>
                        </div>
                        <CardDescription>Number of transactions categorized by amount range</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-semibold text-foreground">Micro / Small (&lt; {format(250)})</span>
                                    <span className="font-mono font-bold text-muted-foreground">
                                        {(transactionSizes.expense?.low ?? transactionSizes.low)} exp
                                        {transactionSizes.income !== undefined && ` / ${transactionSizes.income.low} inc`}
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${(transactionSizes.low / (transactionSizes.low + transactionSizes.medium + transactionSizes.high || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-semibold text-foreground">Medium ({format(250)} – {format(1000)})</span>
                                    <span className="font-mono font-bold text-muted-foreground">
                                        {(transactionSizes.expense?.medium ?? transactionSizes.medium)} exp
                                        {transactionSizes.income !== undefined && ` / ${transactionSizes.income.medium} inc`}
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${(transactionSizes.medium / (transactionSizes.low + transactionSizes.medium + transactionSizes.high || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-semibold text-foreground">Large (&gt; {format(1000)})</span>
                                    <span className="font-mono font-bold text-muted-foreground">
                                        {(transactionSizes.expense?.high ?? transactionSizes.high)} exp
                                        {transactionSizes.income !== undefined && ` / ${transactionSizes.income.high} inc`}
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="bg-red-500 h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${(transactionSizes.high / (transactionSizes.low + transactionSizes.medium + transactionSizes.high || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
