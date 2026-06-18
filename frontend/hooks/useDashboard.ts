import { useState, useEffect } from 'react'
import { api } from '@/services/api'

export function useDashboard(month?: string) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true)
                const params = month ? `?month=${month}` : ''
                const response = await api.get(`/dashboard${params}`)
                setData(response.data)
                setError('')
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to load dashboard')
            } finally {
                setLoading(false)
            }
        }

        fetchDashboard()

        const handleExpenseAdded = () => {
            fetchDashboard()
        }

        window.addEventListener('expense-added', handleExpenseAdded)
        return () => {
            window.removeEventListener('expense-added', handleExpenseAdded)
        }
    }, [month])

    return { data, loading, error }
}