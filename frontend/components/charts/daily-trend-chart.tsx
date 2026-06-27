import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrency } from '@/hooks/use-currency'

interface DailyTrendChartProps {
    data: Array<{
        day: number
        total: number
    }>
}

export function DailyTrendChart({ data }: DailyTrendChartProps) {
    const { convert, symbol } = useCurrency()

    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-custom-gradient">Daily Expense Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                </CardContent>
            </Card>
        )
    }

    // Convert chart data to display currency
    const convertedData = data.map(item => ({
        day: item.day,
        total: convert(item.total)
    }))

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-custom-gradient">Daily Expense Trend</CardTitle>
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
                            label={{ value: `Expense (${symbol})`, angle: -90, position: 'insideLeft' }}
                            tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                            formatter={(value: number) => [`${symbol}${value.toFixed(2)}`, 'Total']}
                        />
                        <Line
                            type="monotone"
                            dataKey="total"
                            stroke="var(--btn-gradient-end, hsl(var(--primary)))"
                            strokeWidth={2}
                            dot={{ fill: 'var(--btn-gradient-end, hsl(var(--primary)))' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}