'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sparkles, AlertTriangle, Lightbulb, PieChart, BarChart3, CalendarDays, Activity } from 'lucide-react'
import { useCurrency } from '@/hooks/use-currency'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'

interface AnalyticsReportProps {
    data: {
        month: string;
        totalExpense: number;
        totalDays: number;
        averageDailyExpense: number;
        highestExpenseDay: number;
        categoryBreakdown: Record<string, number>;
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
        }>;
        transactionSizes?: {
            low: number;
            medium: number;
            high: number;
        };
    }
}

export function AnalyticsReport({ data }: AnalyticsReportProps) {
    const { convert, symbol, format } = useCurrency()
    const {
        totalExpense,
        averageDailyExpense,
        highestExpenseDay,
        categoryBreakdown,
        insights,
        weekdayWeekend,
        weeklySpend,
        transactionSizes
    } = data;

    // Convert weekly spend chart data to display currency
    const convertedWeeklySpend = weeklySpend?.map(item => ({
        name: item.name,
        amount: convert(item.amount)
    }));

    // Calculate percentages for category breakdown
    const categoryList = Object.entries(categoryBreakdown)
        .map(([name, amount]) => ({
            name,
            amount,
            percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount);

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
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Monthly Total
                        </CardDescription>
                        <CardTitle className="text-3xl font-extrabold text-primary">
                            {format(totalExpense || 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Aggregated across all entries</p>
                    </CardContent>
                </Card>

                <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Daily Average
                        </CardDescription>
                        <CardTitle className="text-3xl font-extrabold text-primary">
                            {format(averageDailyExpense || 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Adjusted for active transaction days</p>
                    </CardContent>
                </Card>

                <Card className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Peak Spending Day
                        </CardDescription>
                        <CardTitle className="text-3xl font-extrabold text-primary">
                            Day {highestExpenseDay}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Day with highest combined transaction total</p>
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

                {/* Category Progress Bars */}
                <Card className="border border-border bg-card shadow-md transition-shadow hover:shadow-lg">
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <PieChart className="h-5 w-5 text-primary" />
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                Spending Breakdown
                            </CardTitle>
                        </div>
                        <CardDescription>Category-wise distribution of monthly expenses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {categoryList.length > 0 ? (
                            <div className="space-y-5">
                                {categoryList.map((category) => (
                                    <div key={category.name} className="space-y-1.5">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-semibold text-foreground capitalize">{category.name}</span>
                                            <div className="flex space-x-2 text-muted-foreground font-mono">
                                                <span>{format(category.amount)}</span>
                                                <span className="text-primary font-bold">({category.percentage.toFixed(1)}%)</span>
                                            </div>
                                        </div>
                                        {/* Progress Bar Container */}
                                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                            <div 
                                                className="bg-primary h-full rounded-full transition-all duration-500 ease-out" 
                                                style={{ width: `${category.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-48 flex flex-col items-center justify-center text-center">
                                <PieChart className="h-10 w-10 text-muted/60 mb-2" />
                                <p className="text-muted-foreground text-sm">No category data available</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Weekly and Weekend/Weekday Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Spending Bar Chart */}
                {convertedWeeklySpend && (
                    <Card className="border border-border bg-card shadow-md transition-shadow hover:shadow-lg">
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                <CardTitle className="text-xl font-bold text-custom-gradient">
                                    Weekly Spending Comparison
                                </CardTitle>
                            </div>
                            <CardDescription>Total spending divided by calendar weeks</CardDescription>
                        </CardHeader>
                        <CardContent className="h-64 pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={convertedWeeklySpend} margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="weeklyTealGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--btn-gradient-start, rgb(45, 212, 191))" stopOpacity={0.9}/>
                                            <stop offset="100%" stopColor="var(--btn-gradient-end, rgb(15, 118, 110))" stopOpacity={0.25}/>
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
                                        formatter={(value: number) => [`${symbol}${value.toFixed(2)}`, 'Spend']}
                                    />
                                    <Bar 
                                        dataKey="amount" 
                                        fill="url(#weeklyTealGrad)" 
                                        radius={[6, 6, 0, 0]}
                                        barSize={38}
                                        stroke="rgb(13, 148, 136)"
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
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-muted/40 rounded-xl border border-border/50 space-y-1">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Workdays (Mon-Fri)</span>
                                    <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                                        {format(weekdayWeekend.weekdayTotal)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {weekdayWeekend.weekdayCount} txs, avg {format(weekdayWeekend.weekdayAverage)}/tx
                                    </p>
                                </div>
                                <div className="p-4 bg-muted/40 rounded-xl border border-border/50 space-y-1">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weekends (Sat-Sun)</span>
                                    <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                                        {format(weekdayWeekend.weekendTotal)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
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
                                <div className="h-3 w-full bg-teal-800/20 dark:bg-teal-900/10 rounded-full overflow-hidden flex">
                                    <div 
                                        className="bg-teal-500 h-full transition-all duration-500" 
                                        style={{ width: `${(weekdayWeekend.weekdayTotal / (weekdayWeekend.weekdayTotal + weekdayWeekend.weekendTotal || 1)) * 100}%` }}
                                    />
                                    <div 
                                        className="bg-teal-700 h-full transition-all duration-500" 
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
                                    <span className="font-semibold text-foreground">Micro / Small Spend (&lt; {format(250)})</span>
                                    <span className="font-mono font-bold text-muted-foreground">{transactionSizes.low} txs</span>
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
                                    <span className="font-semibold text-foreground">Medium Spend ({format(250)} - {format(1000)})</span>
                                    <span className="font-mono font-bold text-muted-foreground">{transactionSizes.medium} txs</span>
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
                                    <span className="font-semibold text-foreground">Large Spend (&gt; {format(1000)})</span>
                                    <span className="font-mono font-bold text-muted-foreground">{transactionSizes.high} txs</span>
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
