import { useState, useEffect } from 'react'
import { api } from '@/services/api'

interface UseExpensesParams {
    page?: number
    limit?: number
    category?: string
    month?: string
}

export function useExpenses({ page = 1, limit = 20, category, month }: UseExpensesParams) {
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
                ...(month && { month })
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
    }, [page, category, month])

    return { expenses, total, categories, loading, error, refetch: fetchData }
}