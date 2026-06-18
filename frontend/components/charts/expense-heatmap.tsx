'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface ExpenseHeatmapProps {
    data: Array<{
        day: number;
        total: number;
    }>;
    month?: string;
    onDayClick?: (day: number) => void;
}

export function ExpenseHeatmap({ data, month, onDayClick }: ExpenseHeatmapProps) {
    // We want to map day numbers (1-31)
    const dailySpendMap = new Map<number, number>();
    let maxSpend = 0;

    if (data && data.length > 0) {
        data.forEach(item => {
            dailySpendMap.set(item.day, item.total);
            if (item.total > maxSpend) {
                maxSpend = item.total;
            }
        });
    }

    // Generate days of the actual selected month (1 to 28-31)
    const getDaysCount = () => {
        if (!month) return 31;
        const [year, monthNum] = month.split('-').map(Number);
        if (!year || !monthNum) return 31;
        return new Date(year, monthNum, 0).getDate();
    };

    const days = Array.from({ length: getDaysCount() }, (_, i) => i + 1);

    // Color scaling function based on total spending relative to max spending
    const getHeatmapColorClass = (total: number) => {
        if (!total || total === 0) return 'bg-muted/30 dark:bg-muted/10 text-muted-foreground';
        
        const ratio = total / maxSpend;
        if (ratio <= 0.25) return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/30';
        if (ratio <= 0.5) return 'bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300/50 dark:border-emerald-800/30';
        if (ratio <= 0.75) return 'bg-emerald-400 dark:bg-emerald-700 text-white dark:text-emerald-100 border border-emerald-500/50';
        return 'bg-emerald-600 dark:bg-emerald-500 text-white border border-emerald-700/50';
    };

    return (
        <Card className="border border-border bg-card shadow-md transition-shadow hover:shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Monthly Expense Heatmap
                </CardTitle>
                <CardDescription>Daily spending intensity graph (Click any day to see details)</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col space-y-4">
                    {/* Heatmap Grid */}
                    {/* Heatmap Grid */}
                    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/35 transition-colors">
                        <div className="grid grid-cols-7 gap-2 md:gap-3 p-1 min-w-[480px] md:min-w-0">
                            {days.map(day => {
                                const total = dailySpendMap.get(day) || 0;
                                const colorClass = getHeatmapColorClass(total);
                                
                                return (
                                    <div
                                        key={day}
                                        onClick={() => onDayClick && onDayClick(day)}
                                        className={`relative group flex flex-col items-center justify-center h-12 rounded-md transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/20 ${colorClass}`}
                                    >
                                        <span className="text-xs font-semibold">{day}</span>
                                        {total > 0 && (
                                            <span className="text-[9px] opacity-80 font-mono">₹{Math.round(total)}</span>
                                        )}
                                        
                                        {/* Tooltip on Hover */}
                                        {day <= 7 ? (
                                            <div className="absolute top-full mt-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                                                <div className="w-2 h-2 -mb-1 rotate-45 bg-popover border-l border-t border-border z-40"></div>
                                                <div className="bg-popover border border-border text-popover-foreground text-xs rounded-md py-1.5 px-2.5 shadow-md whitespace-nowrap">
                                                    <p className="font-semibold">Day {day}</p>
                                                    <p className="text-muted-foreground">Spend: ₹{total.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                                                <div className="bg-popover border border-border text-popover-foreground text-xs rounded-md py-1.5 px-2.5 shadow-md whitespace-nowrap">
                                                    <p className="font-semibold">Day {day}</p>
                                                    <p className="text-muted-foreground">Spend: ₹{total.toFixed(2)}</p>
                                                </div>
                                                <div className="w-2 h-2 -mt-1 rotate-45 bg-popover border-r border-b border-border"></div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Heatmap Legend */}
                    <div className="flex items-center justify-end space-x-2 text-xs text-muted-foreground pt-2 border-t">
                        <span>Less</span>
                        <div className="w-3 h-3 rounded bg-muted/30 dark:bg-muted/10"></div>
                        <div className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-950/40"></div>
                        <div className="w-3 h-3 rounded bg-emerald-200 dark:bg-emerald-900/60"></div>
                        <div className="w-3 h-3 rounded bg-emerald-400 dark:bg-emerald-700"></div>
                        <div className="w-3 h-3 rounded bg-emerald-600 dark:bg-emerald-500"></div>
                        <span>More</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
