import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrency } from '@/hooks/use-currency'

interface DailyTrendChartProps {
    data: Array<{
        day: number
        expense?: number
        income?: number
        total?: number
    }>
}

export function DailyTrendChart({ data }: DailyTrendChartProps) {
    const { convert, symbol } = useCurrency()
    const [viewMode, setViewMode] = useState<'all' | 'income' | 'expense' | 'net'>('all')

    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-custom-gradient">Daily Cash Flow Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                </CardContent>
            </Card>
        )
    }

    // Convert chart data to display currency and compute net flow
    const convertedData = data.map(item => {
        const incomeVal = item.income || 0
        const expenseVal = item.expense !== undefined ? item.expense : item.total || 0
        return {
            day: item.day,
            expense: convert(expenseVal),
            income: convert(incomeVal),
            net: convert(incomeVal - expenseVal)
        }
    })

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                <CardTitle className="text-custom-gradient">Daily Cash Flow Trend</CardTitle>
                <div className="flex bg-muted/60 p-1 rounded-xl border border-border/40 backdrop-blur-sm">
                    {(['all', 'income', 'expense', 'net'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-200 capitalize ${
                                viewMode === mode
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {mode === 'all' ? 'All' : mode === 'net' ? 'Net Flow' : mode}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={convertedData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.2} />
                        <XAxis
                            dataKey="day"
                            label={{ value: 'Day', position: 'bottom' }}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            label={{ value: `Amount (${symbol})`, angle: -90, position: 'insideLeft' }}
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                            formatter={(value: number, name: string) => {
                                const prefix = value < 0 ? '-' : ''
                                const absValue = Math.abs(value)
                                return [`${prefix}${symbol}${absValue.toFixed(2)}`, name]
                            }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        {(viewMode === 'all' || viewMode === 'income') && (
                            <Line
                                type="monotone"
                                dataKey="income"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ fill: '#10b981' }}
                                name="Income"
                            />
                        )}
                        {(viewMode === 'all' || viewMode === 'expense') && (
                            <Line
                                type="monotone"
                                dataKey="expense"
                                stroke="#f43f5e"
                                strokeWidth={2}
                                dot={{ fill: '#f43f5e' }}
                                name="Expense"
                            />
                        )}
                        {(viewMode === 'all' || viewMode === 'net') && (
                            <Line
                                type="monotone"
                                dataKey="net"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ fill: '#3b82f6' }}
                                name="Net Flow"
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}