import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useCurrency } from '@/hooks/use-currency'
import { useThemeCustomizer } from '@/components/theme-customizer-provider'
import { Eye, X } from 'lucide-react'
import { cn } from '@/lib/utils'



interface CategoryPieChartProps {
    data: Record<string, number>
    incomeData?: Record<string, number>
}

// Sleek, modern Tailwind-inspired color palette fallback
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

export function CategoryPieChart({ data, incomeData = {} }: CategoryPieChartProps) {
    const { convert, symbol } = useCurrency()
    const { categoryColors } = useThemeCustomizer()
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense')
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

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

    useEffect(() => {
        setHoveredCategory(null)
    }, [isFullScreen, activeTab])

    const currentSource = activeTab === 'expense' ? data : incomeData

    const chartData = Object.entries(currentSource)
        .map(([name, value]) => ({
            name,
            value: convert(value)
        }))
        .sort((a, b) => b.value - a.value);

    const totalAmount = chartData.reduce((sum, item) => sum + item.value, 0);

    const renderMainContent = (isModal: boolean = false) => {
        if (chartData.length === 0) {
            return (
                <div className="h-[200px] flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">No data available for this month</p>
                </div>
            )
        }

        return (
            <div className={cn("flex flex-col items-center justify-between gap-6 w-full", isModal ? "md:flex-row h-[55vh] pb-8" : "md:flex-row")}>
                {/* Donut Chart Container */}
                <div className={cn("relative flex-shrink-0 mx-auto md:mx-0", isModal ? "w-[260px] h-[260px] md:w-[320px] md:h-[320px]" : "w-[200px] h-[200px]")}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={isModal ? 80 : 65}
                                outerRadius={isModal ? 110 : 85}
                                paddingAngle={3}
                                dataKey="value"
                                labelLine={false}
                                onMouseEnter={(data) => {
                                    if (isModal && data && data.name) {
                                        setHoveredCategory(data.name)
                                    }
                                }}
                                onMouseLeave={() => {
                                    if (isModal) {
                                        setHoveredCategory(null)
                                    }
                                }}
                            >
                                {chartData.map((entry, index) => {
                                    const normalizedName = entry.name.charAt(0).toUpperCase() + entry.name.slice(1)
                                    const cellColor = categoryColors[normalizedName] || categoryColors[entry.name] || COLORS[index % COLORS.length]
                                    
                                    const isHighlighted = hoveredCategory === null || hoveredCategory === entry.name
                                    
                                    return (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={cellColor} 
                                            opacity={isHighlighted ? 1.0 : 0.25}
                                            className="transition-all duration-300 hover:opacity-85"
                                        />
                                    )
                                })}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                    color: 'black'
                                }}
                                itemStyle={{ color: 'black' }}
                                labelStyle={{ color: 'black' }}
                                formatter={(value: number) => [`${symbol}${value.toFixed(2)}`, activeTab === 'expense' ? 'Spend' : 'Income']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text inside Donut */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className={cn("font-semibold tracking-wider text-muted-foreground uppercase", isModal ? "text-xs" : "text-[10px]")}>
                            Total
                        </span>
                        <span className={cn("font-bold text-foreground mt-0.5", isModal ? "text-2xl" : "text-lg")}>
                            {symbol}{Math.round(totalAmount).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Custom Legend / Category List */}
                <div className={cn("flex-1 w-full space-y-2.5 overflow-y-auto pr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/35 transition-colors", isModal ? "max-h-[320px] space-y-3" : "max-h-[200px]")}>
                    {chartData.map((item, index) => {
                        const percentage = (item.value / (totalAmount || 1)) * 100
                        const normalizedName = item.name.charAt(0).toUpperCase() + item.name.slice(1)
                        const color = categoryColors[normalizedName] || categoryColors[item.name] || COLORS[index % COLORS.length]
                        
                        const isHovered = isModal && hoveredCategory === item.name
                        
                        return (
                            <div 
                                key={item.name} 
                                className={cn(
                                    "flex items-center justify-between py-0.5 border-b border-border/30 last:border-0 cursor-pointer transition-all duration-200", 
                                    isModal ? "text-base py-1.5" : "text-sm",
                                    isHovered && "scale-[1.02] pl-2 font-bold text-teal-500 dark:text-teal-400 bg-muted/20 rounded-lg shadow-sm"
                                )}
                                onMouseEnter={() => isModal && setHoveredCategory(item.name)}
                                onMouseLeave={() => isModal && setHoveredCategory(null)}
                            >
                                <div className="flex items-center space-x-2">
                                    <div 
                                        className={cn("rounded-full flex-shrink-0", isModal ? "w-4 h-4" : "w-3 h-3")} 
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
        )
    }

    return (
        <>
            <Card className="border border-border bg-card shadow-md transition-shadow hover:shadow-lg">
                <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center justify-between w-full sm:w-auto">
                        <div className="flex items-center space-x-2">
                            <CardTitle className="text-xl font-bold text-custom-gradient">
                                Category Breakdown
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
                    {/* Segments switch */}
                    <div className="flex p-0.5 bg-muted/65 border rounded-lg self-start sm:self-center shrink-0">
                        <button
                            type="button"
                            onClick={() => setActiveTab('expense')}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                activeTab === 'expense'
                                    ? 'bg-card text-rose-500 shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Expenses
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('income')}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                activeTab === 'income'
                                    ? 'bg-card text-emerald-500 shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Income
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    {renderMainContent(false)}
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
                                <CardTitle className="text-custom-gradient text-xl">Category Breakdown (Fullscreen)</CardTitle>
                                <CardDescription className="text-xs">
                                    {activeTab === 'expense' 
                                        ? 'Distribution of expenses across categories' 
                                        : 'Distribution of income across categories'}
                                </CardDescription>
                            </div>
                            
                            <div className="flex p-0.5 bg-muted/65 border rounded-lg self-start sm:self-center shrink-0 mr-8">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('expense')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                        activeTab === 'expense'
                                            ? 'bg-card text-rose-500 shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Expenses
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('income')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                        activeTab === 'income'
                                            ? 'bg-card text-emerald-500 shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Income
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 min-h-0 pt-6">
                            {renderMainContent(true)}
                        </div>
                    </Card>
                </div>
            )}
        </>
    )
}