import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useCurrency } from '@/hooks/use-currency'

interface ExpenseHeatmapProps {
    data: Array<{
        day: number;
        total: number;
    }>;
    month?: string;
    onDayClick?: (day: number) => void;
}

export function ExpenseHeatmap({ data, month, onDayClick }: ExpenseHeatmapProps) {
    const { convert, symbol, format } = useCurrency()

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

    const daysCount = getDaysCount();
    const days = Array.from({ length: daysCount }, (_, i) => i + 1);

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const [year, monthNum] = month
        ? month.split('-').map(Number)
        : [new Date().getFullYear(), new Date().getMonth() + 1];

    const firstDayWeekday = new Date(year, monthNum - 1, 1).getDay();
    const spacers = Array.from({ length: firstDayWeekday }, (_, i) => i);

    // Color scaling function based on total spending relative to max spending
    const getHeatmapColorClass = (total: number) => {
        if (!total || total === 0) {
            return 'bg-muted/30 dark:bg-muted/10 text-muted-foreground border border-transparent hover:bg-muted/40 dark:hover:bg-muted/20';
        }
        
        const ratio = total / maxSpend;
        if (ratio <= 0.25) {
            return 'bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/10';
        }
        if (ratio <= 0.5) {
            return 'bg-emerald-500/30 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 dark:border-emerald-500/20';
        }
        if (ratio <= 0.75) {
            return 'bg-emerald-500/60 dark:bg-emerald-500/45 text-white border border-emerald-500/70';
        }
        return 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/10 border border-emerald-600/20';
    };

    return (
        <Card className="border border-border bg-card shadow-md hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
                <CardTitle className="text-xl font-bold text-custom-gradient">
                    Monthly Expense Heatmap
                </CardTitle>
                <CardDescription>Daily spending intensity graph (Click any day to see details)</CardDescription>
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
                                const total = dailySpendMap.get(day) || 0;
                                const colorClass = getHeatmapColorClass(total);
                                
                                return (
                                    <div
                                        key={day}
                                        onClick={() => onDayClick && onDayClick(day)}
                                        className={`relative group flex flex-col items-center justify-center h-12 rounded-lg transition-all duration-300 ease-out hover:scale-110 hover:-translate-y-0.5 hover:shadow-md hover:ring-2 hover:ring-teal-500/30 cursor-pointer ${colorClass}`}
                                    >
                                        <span className="text-xs font-bold font-mono">{day}</span>
                                        {total > 0 && (
                                            <span className="text-[9px] opacity-90 font-mono mt-0.5 font-bold">{symbol}{Math.round(convert(total))}</span>
                                        )}
                                        
                                        {/* Premium Tooltip */}
                                        <div className="absolute bottom-full mb-2.5 hidden group-hover:flex flex-col items-center pointer-events-none z-30 transition-all duration-300 transform translate-y-1">
                                            <div className="bg-zinc-950/95 dark:bg-zinc-50/95 text-zinc-50 dark:text-zinc-950 text-[10px] font-bold rounded-lg py-1 px-2.5 shadow-xl border border-zinc-800/10 dark:border-zinc-200/10 whitespace-nowrap flex flex-col items-center font-mono">
                                                <p className="opacity-75">Day {day}</p>
                                                <p className="text-teal-400 dark:text-teal-600 font-extrabold text-xs">{format(total)}</p>
                                            </div>
                                            <div className="w-1.5 h-1.5 -mt-1 rotate-45 bg-zinc-950/95 dark:bg-zinc-50/95 border-r border-b border-zinc-800/10 dark:border-zinc-200/10"></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Heatmap Legend */}
                    <div className="flex items-center justify-end space-x-2 text-[10px] text-muted-foreground pt-3 border-t border-border/40 mt-2 font-medium">
                        <span>Less</span>
                        <div className="w-3.5 h-3.5 rounded-sm bg-muted/30 dark:bg-muted/10 border border-border/40"></div>
                        <div className="w-3.5 h-3.5 rounded-sm bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 dark:border-emerald-500/10"></div>
                        <div className="w-3.5 h-3.5 rounded-sm bg-emerald-500/30 dark:bg-emerald-500/15 border border-emerald-500/40 dark:border-emerald-500/20"></div>
                        <div className="w-3.5 h-3.5 rounded-sm bg-emerald-500/60 dark:bg-emerald-500/40 border border-emerald-500/70"></div>
                        <div className="w-3.5 h-3.5 rounded-sm bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 border border-emerald-600/20"></div>
                        <span>More</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
