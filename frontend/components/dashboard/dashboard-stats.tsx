import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, DollarSign, Calendar, List } from 'lucide-react'
import { useCurrency } from '@/hooks/use-currency'

interface DashboardStatsProps {
    data: {
        totalExpense: number
        averageDailyExpense: number
        highestExpenseDay: number
        totalEntries: number
    }
}

export function DashboardStats({ data }: DashboardStatsProps) {
    const { format } = useCurrency()

    const stats = [
        {
            title: 'Total Expense',
            value: format(data.totalExpense || 0),
            icon: DollarSign,
            description: 'Cumulative spending for the month',
            color: 'from-teal-500/10 to-teal-500/5 text-teal-600 dark:text-teal-400 border-teal-500/20'
        },
        {
            title: 'Average Daily',
            value: format(data.averageDailyExpense || 0),
            icon: TrendingUp,
            description: 'Per day average spending rate',
            color: 'from-indigo-500/10 to-indigo-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
        },
        {
            title: 'Peak Spending Day',
            value: `Day ${data.highestExpenseDay || 0}`,
            icon: Calendar,
            description: 'Day with the highest spending total',
            color: 'from-amber-500/10 to-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20'
        },
        {
            title: 'Total Transactions',
            value: String(data.totalEntries || 0),
            icon: List,
            description: 'Count of transactions registered',
            color: 'from-rose-500/10 to-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/20'
        }
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
            {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                    <Card key={index} className="overflow-hidden border border-border/80 bg-card/60 backdrop-blur transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/5 group">
                        <div className={`h-1 bg-gradient-to-r ${stat.color.includes('teal') ? 'from-teal-400 to-teal-600' : stat.color.includes('indigo') ? 'from-indigo-400 to-indigo-600' : stat.color.includes('amber') ? 'from-amber-400 to-amber-600' : 'from-rose-400 to-rose-600'}`} />
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