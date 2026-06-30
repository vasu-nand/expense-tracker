import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, DollarSign, Calendar, List, ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react'
import { useCurrency } from '@/hooks/use-currency'

interface DashboardStatsProps {
    data: {
        totalExpense: number
        totalIncome?: number
        netSavings?: number
        averageDailyExpense: number
        highestExpenseDay: number
        totalEntries: number
    }
}

export function DashboardStats({ data }: DashboardStatsProps) {
    const { format } = useCurrency()

    const stats = [
        {
            title: 'Total Income',
            value: format(data.totalIncome || 0),
            icon: ArrowUpRight,
            description: 'Cumulative earnings for the month',
            color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            barColor: 'from-emerald-400 to-emerald-600'
        },
        {
            title: 'Total Expense',
            value: format(data.totalExpense || 0),
            icon: ArrowDownRight,
            description: 'Cumulative spending for the month',
            color: 'from-rose-500/10 to-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/20',
            barColor: 'from-rose-400 to-rose-600'
        },
        {
            title: 'Net Savings',
            value: format(data.netSavings || 0),
            icon: Wallet,
            description: 'Remaining balance after expenses',
            color: (data.netSavings || 0) >= 0
                ? 'from-sky-500/10 to-sky-500/5 text-sky-600 dark:text-sky-400 border-sky-500/20'
                : 'from-amber-500/10 to-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20',
            barColor: (data.netSavings || 0) >= 0 ? 'from-sky-400 to-sky-600' : 'from-amber-400 to-amber-600'
        },
        {
            title: 'Average Daily',
            value: format(data.averageDailyExpense || 0),
            icon: TrendingUp,
            description: 'Per day average spending rate',
            color: 'from-indigo-500/10 to-indigo-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
            barColor: 'from-indigo-400 to-indigo-600'
        },
        {
            title: 'Peak Spending Day',
            value: `Day ${data.highestExpenseDay || 0}`,
            icon: Calendar,
            description: 'Day with the highest spending total',
            color: 'from-amber-500/10 to-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20',
            barColor: 'from-amber-400 to-amber-600'
        },
        {
            title: 'Total Transactions',
            value: String(data.totalEntries || 0),
            icon: List,
            description: 'Count of transactions registered',
            color: 'from-teal-500/10 to-teal-500/5 text-teal-600 dark:text-teal-400 border-teal-500/20',
            barColor: 'from-teal-400 to-teal-600'
        }
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
            {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                    <Card key={index} className="overflow-hidden border border-border/80 bg-card/60 backdrop-blur transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 group">
                        <div className={`h-1 bg-gradient-to-r ${stat.barColor}`} />
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                                <Icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="text-2xl font-black font-mono tracking-tight text-foreground">{stat.value}</div>
                            <p className="text-[10px] text-muted-foreground mt-1 font-medium">{stat.description}</p>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}