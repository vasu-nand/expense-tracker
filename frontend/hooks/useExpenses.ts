import { useState, useEffect } from 'react'
import { api } from '@/services/api'

interface UseExpensesParams {
    page?: number
    limit?: number
    category?: string
    month?: string
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    minAmount?: number
    maxAmount?: number
    minDay?: number
    maxDay?: number
}

export function useExpenses({ 
    page = 1, 
    limit = 20, 
    category, 
    month, 
    search, 
    sortBy = 'day', 
    sortOrder = 'desc',
    minAmount,
    maxAmount,
    minDay,
    maxDay
}: UseExpensesParams) {
    const [expenses, setExpenses] = useState<any[]>([])
    const [total, setTotal] = useState(0)
    const [categories, setCategories] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchData = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
                ...(category && { category }),
                ...(month && { month }),
                ...(search && { search }),
                sortBy,
                sortOrder,
                ...(minAmount !== undefined && { minAmount: String(minAmount) }),
                ...(maxAmount !== undefined && { maxAmount: String(maxAmount) }),
                ...(minDay !== undefined && { minDay: String(minDay) }),
                ...(maxDay !== undefined && { maxDay: String(maxDay) })
            })

            const [expensesRes, categoriesRes] = await Promise.all([
                api.get(`/expenses?${params}`),
                api.get(`/categories?month=${month || ''}`)
            ])

            setExpenses(expensesRes.data.expenses)
            setTotal(expensesRes.data.total)
            setCategories(categoriesRes.data)
            setError('')
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load expenses')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()

        const handleExpenseAdded = () => {
            fetchData()
        }

        window.addEventListener('expense-added', handleExpenseAdded)
        return () => {
            window.removeEventListener('expense-added', handleExpenseAdded)
        }
    }, [page, limit, category, month, search, sortBy, sortOrder, minAmount, maxAmount, minDay, maxDay])

    return { expenses, total, categories, loading, error, refetch: fetchData }
}