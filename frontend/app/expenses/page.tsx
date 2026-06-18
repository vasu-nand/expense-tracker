'use client'

import { useState, useEffect } from 'react'
import { ExpenseTable } from '@/components/expenses/expense-table'
import { ExpenseFilters } from '@/components/expenses/expense-filters'
import { useExpenses } from '@/hooks/useExpenses'
import { AddExpenseDialog } from '@/components/expenses/add-expense-dialog'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ExpensesPage() {
    const [page, setPage] = useState(1)
    const [category, setCategory] = useState('')
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
    const [isAddOpen, setIsAddOpen] = useState(false)

    const { expenses, total, loading, error, categories, refetch } = useExpenses({
        page,
        limit: 20,
        category: category || undefined,
        month
    })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Expenses</h1>
                <div className="flex space-x-2">
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        className="flex items-center space-x-1.5"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Expense</span>
                    </Button>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors text-sm font-medium"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            <ExpenseFilters
                categories={categories}
                selectedCategory={category}
                onCategoryChange={setCategory}
                month={month}
                onMonthChange={setMonth}
            />

            <ExpenseTable
                expenses={expenses}
                loading={loading}
                error={error}
                page={page}
                total={total}
                onPageChange={setPage}
                onDelete={refetch}
            />

            <AddExpenseDialog
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={refetch}
                defaultMonth={month}
            />
        </div>
    )
}