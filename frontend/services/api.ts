import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add request interceptor to automatically attach active bank account header
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const activeAccountId = localStorage.getItem('selectedBankAccountId')
            if (activeAccountId) {
                config.headers['x-bank-account-id'] = activeAccountId
            }
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message)
        return Promise.reject(error)
    }
)