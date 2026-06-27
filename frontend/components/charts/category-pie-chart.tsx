import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useCurrency } from '@/hooks/use-currency'

interface CategoryPieChartProps {
    data: Record<string, number>
}

// Sleek, modern Tailwind-inspired color palette
const COLORS = [
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#f97316', // Orange
]

export function CategoryPieChart({ data }: CategoryPieChartProps) {
    const { convert, symbol, format } = useCurrency()

    const chartData = Object.entries(data)
        .map(([name, value]) => ({
            name,
            value: convert(value)
        }))
        .sort((a, b) => b.value - a.value);

    const totalSpend = chartData.reduce((sum, item) => sum + item.value, 0);

    if (chartData.length === 0) {
        return (
            <Card className="border border-border bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Category Breakdown</CardTitle>
                    <CardDescription>Visual distribution of spending</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">No data available for this month</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border border-border bg-card shadow-md transition-shadow hover:shadow-lg">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold text-custom-gradient">
                    Category Breakdown
                </CardTitle>
                <CardDescription>Distribution of expenses across categories</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Donut Chart Container */}
                    <div className="relative w-[200px] h-[200px] flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={85}
                                    paddingAngle={3}
                                    dataKey="value"
                                    labelLine={false}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={COLORS[index % COLORS.length]} 
                                            className="transition-opacity duration-300 hover:opacity-85"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
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
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text inside Donut */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                Total
                            </span>
                            <span className="text-lg font-bold text-foreground mt-0.5">
                                {symbol}{Math.round(totalSpend).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Custom Legend / Category List */}
                    <div className="flex-1 w-full space-y-2.5 max-h-[200px] overflow-y-auto pr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/35 transition-colors">
                        {chartData.map((item, index) => {
                            const percentage = (item.value / (totalSpend || 1)) * 100;
                            const color = COLORS[index % COLORS.length];
                            
                            return (
                                <div key={item.name} className="flex items-center justify-between text-sm py-0.5 border-b border-border/30 last:border-0">
                                    <div className="flex items-center space-x-2">
                                        <div 
                                            className="w-3 h-3 rounded-full flex-shrink-0" 
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className="font-medium text-foreground capitalize">
                                            {item.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-3 text-right font-mono">
                                        <span className="text-muted-foreground">
                                            {symbol}{item.value.toFixed(2)}
                                        </span>
                                        <span className="font-bold text-primary w-12">
                                            {percentage.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}