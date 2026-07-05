import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useCurrency } from '@/hooks/use-currency'
import { cn } from '@/lib/utils'
import { Eye, X } from 'lucide-react'


interface ExpenseHeatmapProps {
    data: Array<{
        day: number;
        month?: string;
        date?: string;
        expense?: number;
        income?: number;
        total?: number;
    }>;
    month?: string;
    onDayClick?: (day: number) => void;
}

export function ExpenseHeatmap({ data, month, onDayClick }: ExpenseHeatmapProps) {
    const { convert, symbol, format } = useCurrency()
    const [activeTab, setActiveTab] = useState<'expense' | 'income' | 'net'>('expense')
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

    // Find max expense, max income, max net, min net
    let maxExpense = 0;
    let maxIncome = 0;
    let maxNet = 0;
    let minNet = 0;

    const dailyExpenseMap = new Map<number, number>();
    const dailyIncomeMap = new Map<number, number>();
    const dailyNetMap = new Map<number, number>();

    if (data && data.length > 0) {
        // Filter by the displayed month to prevent collision/aggregation from other months in range
        const filteredData = data.filter(item => !item.month || item.month === month);
        filteredData.forEach(item => {
            const exp = item.expense !== undefined ? item.expense : item.total || 0;
            const inc = item.income || 0;
            const net = inc - exp;

            dailyExpenseMap.set(item.day, exp);
            dailyIncomeMap.set(item.day, inc);
            dailyNetMap.set(item.day, net);

            if (exp > maxExpense) maxExpense = exp;
            if (inc > maxIncome) maxIncome = inc;
            if (net > maxNet) maxNet = net;
            if (net < minNet) minNet = net;
        });
    }

    const currentMap = activeTab === 'expense' ? dailyExpenseMap : activeTab === 'income' ? dailyIncomeMap : dailyNetMap;
    const currentMax = activeTab === 'expense' ? maxExpense : activeTab === 'income' ? maxIncome : Math.max(Math.abs(maxNet), Math.abs(minNet));

    // Generate days of the actual selected month (1 to 28-31)
    const getDaysCount = () => {
        if (!month) return 31;
        const [year, monthNum] = month.split('-').map(Number);
        if (!year || !monthNum) return 31;
        return new Date(year, monthNum, 0).getDate();
    };

    const daysCount = getDaysCount();
    const days = Array.from({ length: daysCount }, (_, i) => i + 1);

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const [year, monthNum] = month
        ? month.split('-').map(Number)
        : [new Date().getFullYear(), new Date().getMonth() + 1];

    const firstDayWeekday = new Date(year, monthNum - 1, 1).getDay();
    const spacers = Array.from({ length: firstDayWeekday }, (_, i) => i);

    // Color scaling function based on selected view
    const getHeatmapColorClass = (val: number) => {
        if (!val || val === 0) {
            return 'bg-muted/30 dark:bg-muted/10 text-muted-foreground border border-transparent hover:bg-muted/40 dark:hover:bg-muted/20';
        }
        
        if (activeTab === 'expense' || activeTab === 'income') {
            const ratio = val / (currentMax || 1);
            if (ratio <= 0.25) return 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15';
            if (ratio <= 0.5) return 'bg-primary/35 text-primary border border-primary/40 hover:bg-primary/45';
            if (ratio <= 0.75) return 'bg-primary/65 text-primary-foreground border border-primary/70 hover:bg-primary/75';
            return 'bg-primary text-primary-foreground shadow-md border border-primary/20 hover:bg-primary/90';
        } else {
            // Net balance: shown together -> keep green (emerald) and red (rose)
            if (val > 0) {
                const ratio = val / (currentMax || 1);
                if (ratio <= 0.5) return 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25 hover:bg-emerald-500/20';
                return 'bg-emerald-500/50 text-emerald-950 dark:text-emerald-50 border border-emerald-500/60 hover:bg-emerald-500/55';
            } else {
                const ratio = Math.abs(val) / (currentMax || 1);
                if (ratio <= 0.5) return 'bg-rose-500/15 text-rose-600 border border-rose-500/25 hover:bg-rose-500/20';
                return 'bg-rose-500/50 text-rose-950 dark:text-rose-50 border border-rose-500/60 hover:bg-rose-500/55';
            }
        }
    };

    const getFormattedValue = (val: number) => {
        if (activeTab === 'net') {
            return `${val >= 0 ? '+' : '-'}${symbol}${Math.round(convert(Math.abs(val)))}`;
        }
        return `${symbol}${Math.round(convert(val))}`;
    };

    const renderHeatmapGrid = (isModal: boolean = false) => {
        return (
            <div className="flex flex-col space-y-4 h-full">
                {/* Heatmap Grid */}
                <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/35 transition-colors flex-1 min-h-0">
                    <div className="grid grid-cols-7 gap-2 md:gap-3 p-1 min-w-[340px] md:min-w-0">
                        {/* Weekdays header row */}
                        {weekdays.map(wd => (
                            <div key={wd} className={cn("font-bold text-muted-foreground uppercase text-center py-1 font-mono tracking-wider", isModal ? "text-xs" : "text-[10px]")}>
                                {wd}
                            </div>
                        ))}

                        {/* Spacers for month weekday offset */}
                        {spacers.map(spacer => (
                            <div key={`spacer-${spacer}`} className={cn("bg-transparent pointer-events-none rounded-md", isModal ? "h-20" : "h-12")} />
                        ))}

                        {/* Day squares */}
                        {days.map(day => {
                            const total = currentMap.get(day) || 0;
                            const colorClass = getHeatmapColorClass(total);
                            
                            return (
                                <div
                                    key={day}
                                    onClick={() => {
                                        if (onDayClick) {
                                            onDayClick(day);
                                            if (isModal) setIsFullScreen(false);
                                        }
                                    }}
                                    className={cn(
                                        `relative group flex flex-col items-center justify-center rounded-lg transition-all duration-300 ease-out hover:scale-110 hover:-translate-y-0.5 hover:shadow-md hover:ring-2 hover:ring-primary/30 cursor-pointer ${colorClass}`,
                                        isModal ? "h-20" : "h-12"
                                    )}
                                >
                                    <span className={cn("font-bold font-mono", isModal ? "text-sm" : "text-xs")}>{day}</span>
                                    {total !== 0 && (
                                        <span className={cn("opacity-90 font-mono mt-0.5 font-bold", isModal ? "text-xs" : "text-[9px]")}>{getFormattedValue(total)}</span>
                                    )}
                                    
                                    {/* Premium Tooltip */}
                                    <div className="absolute bottom-full mb-2.5 hidden group-hover:flex flex-col items-center pointer-events-none z-30 transition-all duration-300 transform translate-y-1">
                                        <div className="bg-zinc-950/95 dark:bg-zinc-50/95 text-zinc-50 dark:text-zinc-950 text-[10px] font-bold rounded-lg py-1 px-2.5 shadow-xl border border-zinc-800/10 dark:border-zinc-200/10 whitespace-nowrap flex flex-col items-center font-mono">
                                            <p className="opacity-75">Day {day}</p>
                                            <p className="text-primary font-extrabold text-xs">
                                                {activeTab === 'net' ? (total >= 0 ? '+' : '-') : ''}{format(Math.abs(total))}
                                            </p>
                                        </div>
                                        <div className="w-1.5 h-1.5 -mt-1 rotate-45 bg-zinc-950/95 dark:bg-zinc-50/95 border-r border-b border-zinc-800/10 dark:border-zinc-200/10"></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Heatmap Legend */}
                {activeTab === 'net' ? (
                    <div className="flex items-center justify-end space-x-2 text-[10px] text-muted-foreground pt-3 border-t border-border/40 mt-2 font-medium">
                        <span>Deficit (Net Spent)</span>
                        <div className="w-3.5 h-3.5 rounded-sm bg-rose-500/50 border border-rose-500/60"></div>
                        <div className="w-3.5 h-3.5 rounded-sm bg-rose-500/15 border border-rose-500/25"></div>
                        <div className="w-3.5 h-3.5 rounded-sm bg-muted/30 dark:bg-muted/10 border border-border/40"></div>
                        <div className="w-3.5 h-3.5 rounded-sm bg-emerald-500/15 border border-emerald-500/25"></div>
                        <div className="w-3.5 h-3.5 rounded-sm bg-emerald-500/50 border border-emerald-500/60"></div>
                        <span>Surplus (Net Saved)</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-end space-x-2 text-[10px] text-muted-foreground pt-3 border-t border-border/40 mt-2 font-medium">
                        <span>Less</span>
                        <div className="w-3.5 h-3.5 rounded-sm bg-muted/30 dark:bg-muted/10 border border-border/40"></div>
                        <div className="w-3.5 h-3.5 rounded-sm border bg-primary/10 border-primary/20"></div>
                        <div className="w-3.5 h-3.5 rounded-sm border bg-primary/35 border-primary/40"></div>
                        <div className="w-3.5 h-3.5 rounded-sm border bg-primary/65 border-primary/70"></div>
                        <div className="w-3.5 h-3.5 rounded-sm border bg-primary border-primary/20"></div>
                        <span>More</span>
                    </div>
                )}
            </div>
        )
    }

    return (
        <>
            <Card className="border border-border bg-card shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center justify-between w-full sm:w-auto">
                        <div className="flex items-center space-x-2">
                            <CardTitle className="text-xl font-bold text-custom-gradient">
                                {activeTab === 'expense' ? 'Monthly Expense Heatmap' : activeTab === 'income' ? 'Monthly Income Heatmap' : 'Monthly Cash Flow Heatmap'}
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
                    {/* Toggle tab switch */}
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
                        <button
                            type="button"
                            onClick={() => setActiveTab('net')}
                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                activeTab === 'net'
                                    ? 'bg-card text-primary shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Net Flow
                        </button>
                    </div>
                </CardHeader>
                <CardContent>
                    {renderHeatmapGrid(false)}
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
                                    {activeTab === 'expense' ? 'Monthly Expense Heatmap' : activeTab === 'income' ? 'Monthly Income Heatmap' : 'Monthly Cash Flow Heatmap'} (Fullscreen)
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {activeTab === 'expense' 
                                        ? 'Daily spending intensity graph' 
                                        : activeTab === 'income' 
                                        ? 'Daily earnings intensity graph' 
                                        : 'Daily net surplus or deficit visual grid'} (Click any day to see details)
                                </CardDescription>
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
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('net')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                        activeTab === 'net'
                                            ? 'bg-card text-primary shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Net Flow
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 min-h-0 pt-6">
                            {renderHeatmapGrid(true)}
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
}
