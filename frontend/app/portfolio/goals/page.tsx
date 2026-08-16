'use client'

import { useState, useEffect } from 'react'
import { 
    Target, 
    Plus, 
    Calendar, 
    CheckCircle2, 
    Clock, 
    TrendingUp, 
    Edit, 
    Trash2, 
    AlertTriangle,
    ShieldCheck
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PortfolioNav } from '@/components/portfolio/portfolio-nav'
import { AddGoalDialog } from '@/components/portfolio/add-goal-dialog'
import { api } from '@/services/api'
import { useCurrency } from '@/hooks/use-currency'
import { cn } from '@/lib/utils'

import { PortfolioEmptyState } from '@/components/portfolio/portfolio-empty-state'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'

export default function WealthGoalsPage() {
    const { format } = useCurrency()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [goals, setGoals] = useState<any[]>([])

    // Dialog State
    const [isAddGoalOpen, setIsAddGoalOpen] = useState(false)
    const [selectedGoal, setSelectedGoal] = useState<any>(null)

    const fetchGoals = async () => {
        try {
            setLoading(true)
            setError('')
            const res = await api.get('/portfolio/goals')
            setGoals(res.data || [])
        } catch (err: any) {
            console.error('Failed to fetch wealth goals:', err)
            setError(err.response?.data?.error || 'Failed to load wealth goals')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchGoals()
    }, [])

    // Delete Modal State
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; id?: string; name?: string }>({ isOpen: false })
    const [deleting, setDeleting] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const confirmDeleteGoal = async () => {
        if (!deleteModalState.id) return
        const targetId = deleteModalState.id
        try {
            setDeleting(true)
            setDeletingId(targetId)
            setDeleteModalState({ isOpen: false })

            // Wait 300ms for smooth exit animation
            await new Promise(r => setTimeout(r, 300))

            await api.delete(`/portfolio/goals/${targetId}`)
            await fetchGoals()
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete goal')
        } finally {
            setDeleting(false)
            setDeletingId(null)
        }
    }

    const handleQuickAddProgress = async (goal: any, amountToAdd: number) => {
        try {
            const updatedProgress = (goal.currentProgress || 0) + amountToAdd
            await api.put(`/portfolio/goals/${goal._id}`, {
                name: goal.name,
                targetAmount: goal.targetAmount,
                currentProgress: updatedProgress,
                deadline: goal.deadline
            })
            fetchGoals()
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to update progress')
        }
    }

    const totalTarget = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0)
    const totalAchieved = goals.reduce((sum, g) => sum + (g.currentProgress || 0), 0)
    const totalPercentage = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0

    return (
        <div className="container mx-auto p-4 sm:p-6 space-y-6">
            <PortfolioNav
                onOpenAddGoal={() => { setSelectedGoal(null); setIsAddGoalOpen(true); }}
            />

            {/* Overall Wealth Target Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border border-border/80 bg-gradient-to-br from-card to-muted/40 shadow-sm rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Combined Wealth Target
                        </CardDescription>
                        <CardTitle className="text-2xl font-black text-foreground">
                            {loading ? '...' : format(totalTarget)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        Across <span className="font-bold text-foreground">{goals.length} Goals</span>
                    </CardContent>
                </Card>

                <Card className="border border-border/80 bg-gradient-to-br from-card to-muted/40 shadow-sm rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Total Capital Achieved
                        </CardDescription>
                        <CardTitle className="text-2xl font-black text-emerald-500">
                            {loading ? '...' : format(totalAchieved)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        Overall Completion: <span className="font-bold text-emerald-500">{totalPercentage.toFixed(1)}%</span>
                    </CardContent>
                </Card>

                <Card className="border border-border/80 bg-gradient-to-br from-card to-muted/40 shadow-sm rounded-2xl">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Remaining Shortfall
                        </CardDescription>
                        <CardTitle className="text-2xl font-black text-indigo-500">
                            {loading ? '...' : format(Math.max(0, totalTarget - totalAchieved))}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                        Keep investing consistently
                    </CardContent>
                </Card>
            </div>

            {/* Goals Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-extrabold text-foreground">Wealth & Financial Milestones</h2>
                        <p className="text-xs text-muted-foreground">Track target targets, deadlines & goal completion status</p>
                    </div>
                    <Button size="sm" onClick={() => { setSelectedGoal(null); setIsAddGoalOpen(true); }} className="rounded-xl text-xs gap-1.5 bg-custom-btn-gradient text-white">
                        <Plus className="h-3.5 w-3.5" /> Create Goal
                    </Button>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">
                        Loading financial goals...
                    </div>
                ) : goals.length === 0 ? (
                    <Card className="border border-border/80 rounded-2xl p-6 text-center">
                        <PortfolioEmptyState
                            imageSrc="/portfolio/goals-empty.svg"
                            title="No Wealth Milestones Set Yet"
                            description="Set up targets for your retirement corpus, emergency fund, or dream home."
                            actionLabel="Create Wealth Goal"
                            onAction={() => { setSelectedGoal(null); setIsAddGoalOpen(true); }}
                        />
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {goals.map((goal) => {
                            const percent = goal.targetAmount > 0 ? Math.min(100, (goal.currentProgress / goal.targetAmount) * 100) : 0
                            const isCompleted = percent >= 100
                            const isDeleting = deletingId === goal._id
                            
                            const deadlineDate = new Date(goal.deadline)
                            const now = new Date()
                            const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 3600 * 24))

                            return (
                                <Card
                                    key={goal._id}
                                    className={cn(
                                        "border border-border/80 rounded-2xl shadow-sm transition-all duration-300 ease-out flex flex-col justify-between",
                                        isDeleting
                                            ? "opacity-0 scale-95 -translate-y-4 bg-rose-500/10 border-rose-500/30 pointer-events-none"
                                            : "hover:shadow-md"
                                    )}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <CardTitle className="text-base font-extrabold text-foreground">
                                                    {goal.name}
                                                </CardTitle>
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase",
                                                    isCompleted 
                                                        ? "bg-emerald-500/10 text-emerald-500" 
                                                        : diffDays < 0 
                                                            ? "bg-rose-500/10 text-rose-500"
                                                            : "bg-indigo-500/10 text-indigo-500"
                                                )}>
                                                    {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                                    {isCompleted ? 'Goal Achieved' : diffDays < 0 ? 'Overdue' : `${diffDays} Days Left`}
                                                </span>
                                            </div>

                                            <div className="flex items-center space-x-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => { setSelectedGoal(goal); setIsAddGoalOpen(true); }}
                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                </Button>
                                                 <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setDeleteModalState({ isOpen: true, id: goal._id, name: goal.name })}
                                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500 rounded-lg hover:scale-110 active:scale-95 transition-all"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <div className="flex items-baseline justify-between text-xs">
                                            <span className="text-muted-foreground font-semibold">Progress</span>
                                            <span className="font-mono font-extrabold text-foreground">
                                                {format(goal.currentProgress)} / {format(goal.targetAmount)}
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-1">
                                            <div className="w-full h-3 bg-muted/60 rounded-full overflow-hidden p-0.5 border border-border/40">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-500",
                                                        isCompleted ? "bg-emerald-500" : "bg-custom-btn-gradient"
                                                    )}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                                                <span>{percent.toFixed(1)}% Achieved</span>
                                                <span>Target: {deadlineDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                                            </div>
                                        </div>

                                        {/* Quick Savings Contribution Buttons */}
                                        <div className="pt-2 border-t border-border/60">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Quick Add Savings:</p>
                                            <div className="grid grid-cols-3 gap-1.5">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleQuickAddProgress(goal, 1000)}
                                                    className="h-7 text-[10px] px-2 rounded-lg font-bold flex-1"
                                                >
                                                    +₹1,000
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleQuickAddProgress(goal, 5000)}
                                                    className="h-7 text-[10px] px-2 rounded-lg font-bold flex-1"
                                                >
                                                    +₹5,000
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleQuickAddProgress(goal, 10000)}
                                                    className="h-7 text-[10px] px-2 rounded-lg font-bold flex-1"
                                                >
                                                    +₹10,000
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ isOpen: false })}
                onConfirm={confirmDeleteGoal}
                title="Delete Wealth Goal"
                description="Are you sure you want to delete this financial milestone? Progress and milestone data will be permanently removed."
                itemName={deleteModalState.name}
                loading={deleting}
            />

            <AddGoalDialog
                isOpen={isAddGoalOpen}
                onClose={() => { setIsAddGoalOpen(false); setSelectedGoal(null); }}
                onSuccess={fetchGoals}
                initialData={selectedGoal}
            />
        </div>
    )
}
