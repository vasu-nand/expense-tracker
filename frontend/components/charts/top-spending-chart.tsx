'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface TopSpendingChartProps {
    data: Array<{
        day: number;
        total: number;
    }>
}

export function TopSpendingChart({ data }: TopSpendingChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card className="border border-border bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Top Spending Days</CardTitle>
                    <CardDescription>Days with the highest total expenses</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">No data available for the selected month</p>
                </CardContent>
            </Card>
        )
    }

    // Sort by total descending to show the top days clearly
    const sortedData = [...data].sort((a, b) => b.total - a.total).slice(0, 7);

    return (
        <Card className="border border-border bg-card shadow-md transition-shadow hover:shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Top Spending Days
                </CardTitle>
                <CardDescription>Days with the highest total expenses this month</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sortedData} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgb(45, 212, 191)" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="rgb(15, 118, 110)" stopOpacity={0.25}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.1} />
                        <XAxis
                            dataKey="day"
                            tickFormatter={(value) => `Day ${value}`}
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tickFormatter={(value) => `₹${value}`}
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }}
                            formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Total Spending']}
                            labelFormatter={(label) => `Day ${label}`}
                        />
                        <Bar
                            dataKey="total"
                            fill="url(#barGradient)"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={45}
                            stroke="rgb(13, 148, 136)"
                            strokeWidth={1}
                        >
                            {sortedData.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    className="transition-opacity duration-300 hover:opacity-80"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
