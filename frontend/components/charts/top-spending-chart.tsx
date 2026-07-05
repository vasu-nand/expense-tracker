import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useCurrency } from '@/hooks/use-currency'
import { Eye, X } from 'lucide-react'
import { cn } from '@/lib/utils'


interface TopSpendingChartProps {
    data: Array<{
        day: number;
        month?: string;
        date?: string;
        expense?: number;
        income?: number;
        total?: number;
    }>
}

export function TopSpendingChart({ data }: TopSpendingChartProps) {
    const { convert, symbol } = useCurrency()
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense')
    const [isFullScreen, setIsFullScreen] = useState(false)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsFullScreen(false)
            }
        }
        if (isFullScreen) {
            window.addEventListener('keydown', handleKeyDown)
        }
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isFullScreen])

    const chartTitle = activeTab === 'expense' ? 'Top Spending Days' : 'Top Income Days';
    const chartDesc = activeTab === 'expense' ? 'Days with the highest total expenses' : 'Days with the highest total income';

    // Convert chart data to display currency
    const convertedData = data.map(item => {
        let label = `Day ${item.day}`;
        if (item.date) {
            try {
                const [yyyy, mm, dd] = item.date.split('-');
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                label = `${monthNames[parseInt(mm) - 1]} ${parseInt(dd)}, ${yyyy}`;
            } catch {
                label = item.date;
            }
        }
        return {
            label,
            amount: convert(activeTab === 'expense' ? (item.expense !== undefined ? item.expense : item.total || 0) : (item.income || 0))
        };
    })

    // Sort by amount descending to show the top days clearly
    const sortedData = [...convertedData]
        .filter(item => item.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 7);

    const renderChartContent = (isModal: boolean = false) => {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedData} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                    <defs>
                        <linearGradient id={`barGradientTheme-${isModal ? 'modal' : 'normal'}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.25}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.1} />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
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
                        labelFormatter={(label) => label}
                    />
                    <Bar
                        dataKey="amount"
                        fill={`url(#barGradientTheme-${isModal ? 'modal' : 'normal'})`}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={isModal ? 65 : 45}
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
        )
    }

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
        <>
            <Card className="border border-border bg-card shadow-md transition-shadow hover:shadow-lg">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center justify-between w-full sm:w-auto">
                        <div className="flex items-center space-x-2">
                            <CardTitle className="text-xl font-bold text-custom-gradient">
                                {chartTitle}
                            </CardTitle>
                            <button
                                onClick={() => setIsFullScreen(true)}
                                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors shrink-0"
                                title="View Fullscreen"
                            >
                                <Eye className="h-4 w-4" />
                            </button>
                        </div>
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
                    {renderChartContent(false)}
                </CardContent>
            </Card>

            {isFullScreen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-200">
                    <Card className="bg-card border w-full max-w-5xl h-[80vh] flex flex-col p-6 rounded-2xl shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setIsFullScreen(false)}
                            className="absolute top-4 right-4 p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors z-10"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/10 flex-shrink-0">
                            <div>
                                <CardTitle className="text-custom-gradient text-xl">{chartTitle} (Fullscreen)</CardTitle>
                                <CardDescription className="text-xs">{chartDesc}</CardDescription>
                            </div>
                            
                            <div className="flex p-0.5 bg-muted/65 border rounded-lg self-start sm:self-center shrink-0 mr-8">
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
                        </div>
                        
                        <div className="flex-1 min-h-0 pt-6">
                            {renderChartContent(true)}
                        </div>
                    </Card>
                </div>
            )}
        </>
    )
}
