'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '@/services/api'

export interface BankAccount {
    _id: string
    name: string
    bankName: string
    accountNumber: string
    color: string
    icon: string
    isPrimary: boolean
    createdAt: string
    expenseCount?: number
    totalExpenses?: number
    lastUpload?: string
}

interface AccountContextType {
    selectedAccount: BankAccount | null
    accounts: BankAccount[]
    loading: boolean
    error: string
    switchAccount: (id: string) => void
    createAccount: (data: any) => Promise<BankAccount>
    deleteAccount: (id: string, password: string) => Promise<void>
    updateAccount: (id: string, updates: Partial<BankAccount>) => Promise<void>
    refetchAccounts: () => Promise<void>
}

const AccountContext = createContext<AccountContextType | undefined>(undefined)

export function AccountProvider({ children }: { children: React.ReactNode }) {
    const [accounts, setAccounts] = useState<BankAccount[]>([])
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchAccounts = async (syncSelection = true) => {
        try {
            setLoading(true)
            const response = await api.get('/accounts')
            const accList: BankAccount[] = response.data.accounts || []
            setAccounts(accList)
            
            if (syncSelection && accList.length > 0) {
                const storedId = localStorage.getItem('selectedBankAccountId')
                const matched = accList.find(a => a._id === storedId)
                const primary = accList.find(a => a.isPrimary) || accList[0]
                
                const active = matched || primary
                setSelectedAccount(active)
                localStorage.setItem('selectedBankAccountId', active._id)
            }
            setError('')
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch bank accounts')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAccounts(true)
    }, [])

    const switchAccount = (id: string) => {
        const matched = accounts.find(a => a._id === id)
        if (matched) {
            setSelectedAccount(matched)
            localStorage.setItem('selectedBankAccountId', matched._id)
            
            // Dispatch standard custom events so all page data-fetching is re-triggered
            window.dispatchEvent(new CustomEvent('expense-added'))
            window.dispatchEvent(new CustomEvent('account-changed', { detail: matched }))
        }
    }

    const createAccount = async (data: any): Promise<BankAccount> => {
        try {
            const response = await api.post('/accounts', data)
            const newAcc = response.data.account
            
            // Reload all accounts list and stats
            await fetchAccounts(false)
            
            // Automatically switch to the newly created account
            setSelectedAccount(newAcc)
            localStorage.setItem('selectedBankAccountId', newAcc._id)
            
            window.dispatchEvent(new CustomEvent('expense-added'))
            window.dispatchEvent(new CustomEvent('account-changed', { detail: newAcc }))
            return newAcc
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Failed to create bank account'
            throw new Error(msg)
        }
    }

    const deleteAccount = async (id: string, password: string): Promise<void> => {
        try {
            await api.delete(`/accounts/${id}`, {
                headers: { 'x-delete-password': password }
            })
            
            const currentSelectedId = localStorage.getItem('selectedBankAccountId')
            // Find another active account (prefer primary)
            const remainingAccounts = accounts.filter(a => a._id !== id)
            const nextActive = remainingAccounts.find(a => a.isPrimary) || remainingAccounts[0]
            
            await fetchAccounts(false)
            
            if (currentSelectedId === id && nextActive) {
                setSelectedAccount(nextActive)
                localStorage.setItem('selectedBankAccountId', nextActive._id)
                window.dispatchEvent(new CustomEvent('expense-added'))
                window.dispatchEvent(new CustomEvent('account-changed', { detail: nextActive }))
            }
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Failed to delete bank account'
            throw new Error(msg)
        }
    }

    const updateAccount = async (id: string, updates: Partial<BankAccount>): Promise<void> => {
        try {
            const response = await api.patch(`/accounts/${id}`, updates)
            const updated = response.data.account
            
            // Update in local state list
            setAccounts(prev => prev.map(a => a._id === id ? { ...a, ...updated } : a))
            
            if (selectedAccount?._id === id) {
                setSelectedAccount(prev => prev ? { ...prev, ...updated } : null)
            }
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Failed to update bank account'
            throw new Error(msg)
        }
    }

    return (
        <AccountContext.Provider value={{
            selectedAccount,
            accounts,
            loading,
            error,
            switchAccount,
            createAccount,
            deleteAccount,
            updateAccount,
            refetchAccounts: () => fetchAccounts(false)
        }}>
            {children}
        </AccountContext.Provider>
    )
}

export function useAccount() {
    const context = useContext(AccountContext)
    if (!context) {
        throw new Error('useAccount must be used within an AccountProvider')
    }
    return context
}
