import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useCurrency } from '@/hooks/use-currency'
import { Eye, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MonthComparisonChartProps {
    data: Array<{
        month: string;
        name: string;
        expense: number;
        income: number;
        net: number;
    }>;
}

const PALETTE_COLORS = {
    classic: {
        monthA: { income: ['#10b981', '#059669'], expense: ['#f43f5e', '#e11d48'] },
        monthB: { income: ['#06b6d4', '#0891b2'], expense: ['#8b5cf6', '#7c3aed'] }
    },
    ocean: {
        monthA: { income: ['#0d9488', '#0f766e'], expense: ['#4f46e5', '#4338ca'] },
        monthB: { income: ['#0ea5e9', '#0284c7'], expense: ['#64748b', '#475569'] }
    },
    sunset: {
        monthA: { income: ['#f59e0b', '#d97706'], expense: ['#ec4899', '#db2777'] },
        monthB: { income: ['#f97316', '#ea580c'], expense: ['#ef4444', '#dc2626'] }
    }
};

export function MonthComparisonChart({ data }: MonthComparisonChartProps) {
    const { symbol } = useCurrency()
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [activePalette, setActivePalette] = useState<'classic' | 'ocean' | 'sunset'>('classic')

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

    const isPieView = data.length < 3;

    const renderPieChartContent = (isModal: boolean = false) => {
        const pieData = [
            { name: `${data[0]?.name || ''} Income`, value: data[0]?.income || 0, fill: 'url(#grad-monthA-income)', type: 'income' },
            { name: `${data[0]?.name || ''} Expense`, value: data[0]?.expense || 0, fill: 'url(#grad-monthA-expense)', type: 'expense' },
            { name: `${data[1]?.name || ''} Income`, value: data[1]?.income || 0, fill: 'url(#grad-monthB-income)', type: 'income' },
            { name: `${data[1]?.name || ''} Expense`, value: data[1]?.expense || 0, fill: 'url(#grad-monthB-expense)', type: 'expense' },
        ].filter(item => item.value > 0);

        const overallNet = (data[0]?.income || 0) - (data[0]?.expense || 0) + (data[1]?.income || 0) - (data[1]?.expense || 0);
        const colors = PALETTE_COLORS[activePalette];

        const colorMap: Record<string, string> = {
            'url(#grad-monthA-income)': colors.monthA.income[0],
            'url(#grad-monthA-expense)': colors.monthA.expense[0],
            'url(#grad-monthB-income)': colors.monthB.income[0],
            'url(#grad-monthB-expense)': colors.monthB.expense[0],
        };

        return (
            <div className={cn("flex flex-col items-stretch gap-6 w-full h-full md:flex-row", isModal && "pb-8")}>
                {/* Left Side Option Bar */}
                <div className="flex flex-row md:flex-col md:space-y-3 border-b md:border-b-0 md:border-r border-border/20 pb-4 md:pb-0 md:pr-4 flex-shrink-0 gap-2">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider hidden md:block">Theme Palette</span>
                    <button 
                        onClick={() => setActivePalette('classic')} 
                        className={cn("px-2.5 py-1.5 rounded-xl border flex items-center justify-between text-xs hover:bg-muted/30 transition-all gap-3 flex-1 md:flex-initial", activePalette === 'classic' ? 'border-primary bg-primary/10 font-bold' : 'border-border/30')}
                    >
                        <div className="flex space-x-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        </div>
                        <span className="text-[9px] uppercase font-mono tracking-wider">Classic</span>
                    </button>
                    <button 
                        onClick={() => setActivePalette('ocean')} 
                        className={cn("px-2.5 py-1.5 rounded-xl border flex items-center justify-between text-xs hover:bg-muted/30 transition-all gap-3 flex-1 md:flex-initial", activePalette === 'ocean' ? 'border-primary bg-primary/10 font-bold' : 'border-border/30')}
                    >
                        <div className="flex space-x-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        </div>
                        <span className="text-[9px] uppercase font-mono tracking-wider">Ocean</span>
                    </button>
                    <button 
                        onClick={() => setActivePalette('sunset')} 
                        className={cn("px-2.5 py-1.5 rounded-xl border flex items-center justify-between text-xs hover:bg-muted/30 transition-all gap-3 flex-1 md:flex-initial", activePalette === 'sunset' ? 'border-primary bg-primary/10 font-bold' : 'border-border/30')}
                    >
                        <div className="flex space-x-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                            <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                        </div>
                        <span className="text-[9px] uppercase font-mono tracking-wider">Sunset</span>
                    </button>
                </div>

                {/* Donut Chart Container */}
                <div className={cn("relative flex-shrink-0 mx-auto md:mx-0", isModal ? "w-[260px] h-[260px] md:w-[320px] md:h-[320px]" : "w-[200px] h-[200px]")}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <defs>
                                <linearGradient id="grad-monthA-income" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor={colors.monthA.income[0]} stopOpacity={0.95}/>
                                    <stop offset="100%" stopColor={colors.monthA.income[1]} stopOpacity={0.75}/>
                                </linearGradient>
                                <linearGradient id="grad-monthA-expense" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor={colors.monthA.expense[0]} stopOpacity={0.95}/>
                                    <stop offset="100%" stopColor={colors.monthA.expense[1]} stopOpacity={0.75}/>
                                </linearGradient>
                                <linearGradient id="grad-monthB-income" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor={colors.monthB.income[0]} stopOpacity={0.95}/>
                                    <stop offset="100%" stopColor={colors.monthB.income[1]} stopOpacity={0.75}/>
                                </linearGradient>
                                <linearGradient id="grad-monthB-expense" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor={colors.monthB.expense[0]} stopOpacity={0.95}/>
                                    <stop offset="100%" stopColor={colors.monthB.expense[1]} stopOpacity={0.75}/>
                                </linearGradient>
                            </defs>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={isModal ? 80 : 60}
                                outerRadius={isModal ? 115 : 85}
                                paddingAngle={3.5}
                                dataKey="value"
                                labelLine={false}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} className="transition-opacity duration-300 hover:opacity-85" />
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
                                formatter={(value: number) => [`${symbol}${value.toFixed(2)}`, 'Amount']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Net Savings */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className={cn("font-semibold tracking-wider text-muted-foreground uppercase", isModal ? "text-xs" : "text-[9px]")}>
                            Net Savings
                        </span>
                        <span className={cn("font-black mt-0.5 font-mono", isModal ? "text-2xl" : "text-base", overallNet >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            {overallNet >= 0 ? '+' : ''}{symbol}{Math.round(overallNet).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Legend list */}
                <div className={cn("flex-1 w-full space-y-2.5 overflow-y-auto pr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/35 transition-colors", isModal ? "max-h-[320px] space-y-3" : "max-h-[200px]")}>
                    {pieData.map((item, index) => {
                        const color = colorMap[item.fill] || '#888888';
                        return (
                            <div key={item.name} className={cn("flex items-center justify-between py-0.5 border-b border-border/30 last:border-0", isModal ? "text-base py-1.5" : "text-sm")}>
                                <div className="flex items-center space-x-2">
                                    <div 
                                        className={cn("rounded-full flex-shrink-0", isModal ? "w-4 h-4" : "w-3 h-3")} 
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="font-semibold text-foreground capitalize text-[13px]">
                                        {item.name}
                                    </span>
                                </div>
                                <span className="font-mono font-bold text-muted-foreground text-right text-[13px]">
                                    {symbol}{item.value.toFixed(2)}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const renderBarChartContent = (isModal: boolean = false) => {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                    <defs>
                        <linearGradient id={`monthExpGrad-${isModal ? 'modal' : 'normal'}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.95}/>
                            <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.3}/>
                        </linearGradient>
                        <linearGradient id={`monthIncGrad-${isModal ? 'modal' : 'normal'}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.95}/>
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.3}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.1} />
                    <XAxis
                        dataKey="name"
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
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }}
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                const exp = payload.find(p => p.name === 'Expense')?.value || 0;
                                const inc = payload.find(p => p.name === 'Income')?.value || 0;
                                const net = Number(inc) - Number(exp);
                                return (
                                    <div className="bg-zinc-950/95 dark:bg-zinc-900/95 text-white p-3 rounded-xl border border-border/20 shadow-xl text-xs font-mono space-y-1.5 min-w-[155px]">
                                        <p className="font-black text-zinc-300 border-b border-border/10 pb-1 mb-1">{label}</p>
                                        <div className="flex justify-between items-center gap-4">
                                            <span className="text-zinc-400">Income:</span>
                                            <span className="font-extrabold text-emerald-400">{symbol}{Number(inc).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center gap-4">
                                            <span className="text-zinc-400">Expense:</span>
                                            <span className="font-extrabold text-rose-400">{symbol}{Number(exp).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="border-t border-border/10 pt-1 mt-1 flex justify-between font-bold gap-4">
                                            <span className="text-zinc-400">Net Savings:</span>
                                            <span className={cn("font-black font-mono", net >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                                {net >= 0 ? '+' : ''}{symbol}{net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} />
                    <Bar
                        dataKey="income"
                        name="Income"
                        fill={`url(#monthIncGrad-${isModal ? 'modal' : 'normal'})`}
                        radius={[6, 6, 0, 0]}
                        barSize={isModal ? 30 : 20}
                    />
                    <Bar
                        dataKey="expense"
                        name="Expense"
                        fill={`url(#monthExpGrad-${isModal ? 'modal' : 'normal'})`}
                        radius={[6, 6, 0, 0]}
                        barSize={isModal ? 30 : 20}
                    />
                </BarChart>
            </ResponsiveContainer>
        )
    }

    return (
        <>
            <Card className="border border-border bg-card shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center justify-between w-full sm:w-auto">
                        <div className="flex items-center space-x-2">
                            <CardTitle className="text-xl font-bold text-custom-gradient">
                                Monthly Summary Comparison
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
                </CardHeader>
                <CardContent className="h-[300px]">
                    {isPieView ? renderPieChartContent(false) : renderBarChartContent(false)}
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
                                <CardTitle className="text-custom-gradient text-xl">
                                    Monthly Summary Comparison (Fullscreen)
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Month-over-month total expenses vs incomes
                                </CardDescription>
                            </div>
                        </div>
                        
                        <div className="flex-1 min-h-0 pt-6">
                            {isPieView ? renderPieChartContent(true) : renderBarChartContent(true)}
                        </div>
                    </Card>
                </div>
            )}
        </>
    )
}
