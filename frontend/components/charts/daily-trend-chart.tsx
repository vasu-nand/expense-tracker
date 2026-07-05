import { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrency } from '@/hooks/use-currency'
import { Eye, X } from 'lucide-react'


interface DailyTrendChartProps {
    data: Array<{
        day: number
        month?: string
        date?: string
        expense?: number
        income?: number
        total?: number
    }>
}

export function DailyTrendChart({ data }: DailyTrendChartProps) {
    const { convert, symbol } = useCurrency()
    const [viewMode, setViewMode] = useState<'all' | 'income' | 'expense' | 'net'>('all')
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [zoomRange, setZoomRange] = useState<'all' | '7d' | '14d' | '30d'>('all')

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
        
        let label = `Day ${item.day}`;
        if (item.date) {
            try {
                const [yyyy, mm, dd] = item.date.split('-');
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                label = `${monthNames[parseInt(mm) - 1]} ${parseInt(dd)}`;
            } catch {
                label = item.date;
            }
        }

        return {
            label,
            day: item.day,
            expense: convert(expenseVal),
            income: convert(incomeVal),
            net: convert(incomeVal - expenseVal)
        }
    })

    const zoomedData = useMemo(() => {
        if (!isFullScreen || zoomRange === 'all') return convertedData
        
        // Find the last index with transaction activity (income > 0 or expense > 0)
        let lastActiveIndex = convertedData.length - 1
        for (let i = convertedData.length - 1; i >= 0; i--) {
            if (convertedData[i].income > 0 || convertedData[i].expense > 0) {
                lastActiveIndex = i
                break
            }
        }
        
        const count = zoomRange === '7d' ? 7 : zoomRange === '14d' ? 14 : 30
        const startIndex = Math.max(0, lastActiveIndex - count + 1)
        return convertedData.slice(startIndex, lastActiveIndex + 1)
    }, [convertedData, zoomRange, isFullScreen])

    return (
        <>
            <Card className="border border-border bg-card shadow-md transition-shadow hover:shadow-lg">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
                    <div className="flex items-center justify-between w-full sm:w-auto">
                        <div className="flex items-center space-x-2">
                            <CardTitle className="text-xl font-bold text-custom-gradient">
                                Daily Cash Flow Trend
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
                        {(['all', 'income', 'expense', 'net'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                    viewMode === mode
                                        ? 'bg-card text-primary shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {mode === 'all' ? 'All' : mode === 'net' ? 'Net Flow' : mode}
                            </button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={convertedData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.2} />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
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
                            <CardTitle className="text-custom-gradient text-xl">Daily Cash Flow Trend (Fullscreen)</CardTitle>
                            
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Zoom Presets Selector */}
                                <div className="flex items-center space-x-1.5">
                                    <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Zoom:</span>
                                    <div className="flex bg-muted/65 p-0.5 rounded-lg border border-border/40 backdrop-blur-sm">
                                        {([
                                            { range: 'all', label: 'All' },
                                            { range: '30d', label: '30d' },
                                            { range: '14d', label: '14d' },
                                            { range: '7d', label: '7d' }
                                        ] as const).map((z) => (
                                            <button
                                                key={z.range}
                                                onClick={() => setZoomRange(z.range)}
                                                className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md transition-all ${
                                                    zoomRange === z.range
                                                        ? 'bg-card text-primary shadow-sm'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                {z.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* View Mode Selector */}
                                <div className="flex items-center space-x-1.5 mr-8">
                                    <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">View:</span>
                                    <div className="flex bg-muted/65 p-0.5 rounded-lg border border-border/40 backdrop-blur-sm">
                                        {(['all', 'income', 'expense', 'net'] as const).map((mode) => (
                                            <button
                                                key={mode}
                                                onClick={() => setViewMode(mode)}
                                                className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md transition-all capitalize ${
                                                    viewMode === mode
                                                        ? 'bg-card text-primary shadow-sm'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                {mode === 'all' ? 'All' : mode === 'net' ? 'Net' : mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex-1 min-h-0 pt-6">
                            <ResponsiveContainer width="100%" height="90%">
                                <LineChart data={zoomedData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.2} />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'white', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
                                        itemStyle={{ color: 'black' }}
                                        labelStyle={{ color: 'black' }}
                                        formatter={(value: number, name: string) => {
                                            const prefix = value < 0 ? '-' : ''
                                            const absValue = Math.abs(value)
                                            return [`${prefix}${symbol}${absValue.toFixed(2)}`, name]
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    {(viewMode === 'all' || viewMode === 'income') && (
                                        <Line
                                            type="monotone"
                                            dataKey="income"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            dot={{ fill: '#10b981', r: 3 }}
                                            name="Income"
                                        />
                                    )}
                                    {(viewMode === 'all' || viewMode === 'expense') && (
                                        <Line
                                            type="monotone"
                                            dataKey="expense"
                                            stroke="#f43f5e"
                                            strokeWidth={3}
                                            dot={{ fill: '#f43f5e', r: 3 }}
                                            name="Expense"
                                        />
                                    )}
                                    {(viewMode === 'all' || viewMode === 'net') && (
                                        <Line
                                            type="monotone"
                                            dataKey="net"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            dot={{ fill: '#3b82f6', r: 3 }}
                                            name="Net Flow"
                                        />
                                    )}
                                    <Brush 
                                        dataKey="label" 
                                        height={28} 
                                        stroke="#14b8a6"
                                        fill="rgba(20, 184, 166, 0.03)"
                                        className="text-[10px] font-mono text-muted-foreground"
                                        travellerWidth={8}
                                        startIndex={0}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            )}
        </>
    )
}