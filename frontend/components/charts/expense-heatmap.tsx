import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useCurrency } from '@/hooks/use-currency'
import { cn } from '@/lib/utils'

interface ExpenseHeatmapProps {
    data: Array<{
        day: number;
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

    // Find max expense, max income, max net, min net
    let maxExpense = 0;
    let maxIncome = 0;
    let maxNet = 0;
    let minNet = 0;

    const dailyExpenseMap = new Map<number, number>();
    const dailyIncomeMap = new Map<number, number>();
    const dailyNetMap = new Map<number, number>();

    if (data && data.length > 0) {
        data.forEach(item => {
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
        
        if (activeTab === 'expense') {
            const ratio = val / (currentMax || 1);
            if (ratio <= 0.25) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/15';
            if (ratio <= 0.5) return 'bg-rose-500/35 text-rose-700 dark:text-rose-300 border border-rose-500/40 hover:bg-rose-500/40';
            if (ratio <= 0.75) return 'bg-rose-500/65 text-white border border-rose-500/70 hover:bg-rose-500/70';
            return 'bg-rose-600 text-white shadow-md border border-rose-700/20 hover:bg-rose-600/90';
        } else if (activeTab === 'income') {
            const ratio = val / (currentMax || 1);
            if (ratio <= 0.25) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15';
            if (ratio <= 0.5) return 'bg-emerald-500/35 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/40';
            if (ratio <= 0.75) return 'bg-emerald-500/65 text-white border border-emerald-500/70 hover:bg-emerald-500/70';
            return 'bg-emerald-600 text-white shadow-md border border-emerald-700/20 hover:bg-emerald-600/90';
        } else {
            // Net balance
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

    return (
        <Card className="border border-border bg-card shadow-md hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <CardTitle className="text-xl font-bold text-custom-gradient">
                        {activeTab === 'expense' ? 'Monthly Expense Heatmap' : activeTab === 'income' ? 'Monthly Income Heatmap' : 'Monthly Cash Flow Heatmap'}
                    </CardTitle>
                    <CardDescription>
                        {activeTab === 'expense' 
                            ? 'Daily spending intensity graph' 
                            : activeTab === 'income' 
                            ? 'Daily earnings intensity graph' 
                            : 'Daily net surplus or deficit visual grid'} (Click any day to see details)
                    </CardDescription>
                </div>
                {/* Toggle tab switch */}
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
                        Spending
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
                    <button
                        type="button"
                        onClick={() => setActiveTab('net')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                            activeTab === 'net'
                                ? 'bg-card text-sky-500 shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Net Flow
                    </button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col space-y-4">
                    {/* Heatmap Grid */}
                    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/35 transition-colors">
                        <div className="grid grid-cols-7 gap-2 md:gap-3 p-1 min-w-[340px] md:min-w-0">
                            {/* Weekdays header row */}
                            {weekdays.map(wd => (
                                <div key={wd} className="text-[10px] font-bold text-muted-foreground uppercase text-center py-1 font-mono tracking-wider">
                                    {wd}
                                </div>
                            ))}

                            {/* Spacers for month weekday offset */}
                            {spacers.map(spacer => (
                                <div key={`spacer-${spacer}`} className="h-12 bg-transparent pointer-events-none rounded-md" />
                            ))}

                            {/* Day squares */}
                            {days.map(day => {
                                const total = currentMap.get(day) || 0;
                                const colorClass = getHeatmapColorClass(total);
                                
                                return (
                                    <div
                                        key={day}
                                        onClick={() => onDayClick && onDayClick(day)}
                                        className={`relative group flex flex-col items-center justify-center h-12 rounded-lg transition-all duration-300 ease-out hover:scale-110 hover:-translate-y-0.5 hover:shadow-md hover:ring-2 hover:ring-primary/30 cursor-pointer ${colorClass}`}
                                    >
                                        <span className="text-xs font-bold font-mono">{day}</span>
                                        {total !== 0 && (
                                            <span className="text-[9px] opacity-90 font-mono mt-0.5 font-bold">{getFormattedValue(total)}</span>
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
                            <div className={cn("w-3.5 h-3.5 rounded-sm border", activeTab === 'expense' ? "bg-rose-500/10 border-rose-500/20" : "bg-emerald-500/10 border-emerald-500/20")}></div>
                            <div className={cn("w-3.5 h-3.5 rounded-sm border", activeTab === 'expense' ? "bg-rose-500/35 border-rose-500/40" : "bg-emerald-500/35 border-emerald-500/40")}></div>
                            <div className={cn("w-3.5 h-3.5 rounded-sm border", activeTab === 'expense' ? "bg-rose-500/65 border-rose-500/70" : "bg-emerald-500/65 border-emerald-500/70")}></div>
                            <div className={cn("w-3.5 h-3.5 rounded-sm border", activeTab === 'expense' ? "bg-rose-600 border-rose-700/20" : "bg-emerald-600 border-emerald-700/20")}></div>
                            <span>More</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
