import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, DollarSign, Calendar, List } from 'lucide-react'

interface DashboardStatsProps {
    data: {
        totalExpense: number
        averageDailyExpense: number
        highestExpenseDay: number
        totalEntries: number
    }
}

export function DashboardStats({ data }: DashboardStatsProps) {
    const stats = [
        {
            title: 'Total Expense',
            value: `₹${data.totalExpense.toFixed(2)}`,
            icon: DollarSign,
            description: 'Total spending'
        },
        {
            title: 'Average Daily Expense',
            value: `₹${data.averageDailyExpense.toFixed(2)}`,
            icon: TrendingUp,
            description: 'Per day average'
        },
        {
            title: 'Highest Expense Day',
            value: `Day ${data.highestExpenseDay}`,
            icon: Calendar,
            description: 'Most expensive day'
        },
        {
            title: 'Total Entries',
            value: data.totalEntries,
            icon: List,
            description: 'Number of transactions'
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">{stat.description}</p>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}