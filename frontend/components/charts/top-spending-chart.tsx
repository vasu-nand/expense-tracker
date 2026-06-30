import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useCurrency } from '@/hooks/use-currency'

interface TopSpendingChartProps {
    data: Array<{
        day: number;
        expense?: number;
        income?: number;
        total?: number;
    }>
}

export function TopSpendingChart({ data }: TopSpendingChartProps) {
    const { convert, symbol } = useCurrency()
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense')

    const chartTitle = activeTab === 'expense' ? 'Top Spending Days' : 'Top Income Days';
    const chartDesc = activeTab === 'expense' ? 'Days with the highest total expenses' : 'Days with the highest total income';

    // Convert chart data to display currency
    const convertedData = data.map(item => ({
        day: item.day,
        amount: convert(activeTab === 'expense' ? (item.expense !== undefined ? item.expense : item.total || 0) : (item.income || 0))
    }))

    // Sort by amount descending to show the top days clearly
    const sortedData = [...convertedData]
        .filter(item => item.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 7);

    if (!data || data.length === 0 || sortedData.length === 0) {
        return (
            <Card className="border border-border bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold">{chartTitle}</CardTitle>
                        <CardDescription>{chartDesc}</CardDescription>
                    </div>
                    {/* Switcher inside fallback card */}
                    <div className="flex p-0.5 bg-muted/65 border rounded-lg shrink-0">
                        <button
                            type="button"
                            onClick={() => setActiveTab('expense')}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                activeTab === 'expense'
                                    ? 'bg-card text-primary shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Spending
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('income')}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                activeTab === 'income'
                                    ? 'bg-card text-primary shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Income
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">No transactions registered for the selected view</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border border-border bg-card shadow-md transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <CardTitle className="text-xl font-bold text-custom-gradient">
                        {chartTitle}
                    </CardTitle>
                    <CardDescription>{chartDesc}</CardDescription>
                </div>
                {/* Switcher */}
                <div className="flex p-0.5 bg-muted/65 border rounded-lg self-start sm:self-center shrink-0">
                    <button
                        type="button"
                        onClick={() => setActiveTab('expense')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                            activeTab === 'expense'
                                ? 'bg-card text-primary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Spending
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('income')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                            activeTab === 'income'
                                ? 'bg-card text-primary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Income
                    </button>
                </div>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sortedData} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                        <defs>
                            <linearGradient id="barGradientTheme" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.25}/>
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
                            tickFormatter={(value) => `${symbol}${value}`}
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
                            formatter={(value: number) => [`${symbol}${value.toFixed(2)}`, activeTab === 'expense' ? 'Spending' : 'Income']}
                            labelFormatter={(label) => `Day ${label}`}
                        />
                        <Bar
                            dataKey="amount"
                            fill="url(#barGradientTheme)"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={45}
                            stroke="hsl(var(--primary))"
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
