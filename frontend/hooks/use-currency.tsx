'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type CurrencyType = 'INR' | 'USD' | 'CAD' | 'EUR'

interface CurrencyContextType {
    currency: CurrencyType
    setCurrency: (currency: CurrencyType) => void
    convert: (amount: number) => number
    convertToBase: (amount: number) => number
    format: (amount: number, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }) => string
    symbol: string
}

const rates: Record<CurrencyType, number> = {
    INR: 1.0,
    USD: 0.010598, // Matches 12,000 INR -> 127.176 USD
    CAD: 0.01452,
    EUR: 0.00984
}

const symbols: Record<CurrencyType, string> = {
    INR: '₹',
    USD: '$',
    CAD: 'CA$',
    EUR: '€'
}

const locales: Record<CurrencyType, string> = {
    INR: 'en-IN',
    USD: 'en-US',
    CAD: 'en-CA',
    EUR: 'de-DE'
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState<CurrencyType>('INR')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const stored = localStorage.getItem('display-currency') as CurrencyType
        if (stored && ['INR', 'USD', 'CAD', 'EUR'].includes(stored)) {
            setCurrencyState(stored)
        }
        setMounted(true)
    }, [])

    const setCurrency = (newCurrency: CurrencyType) => {
        setCurrencyState(newCurrency)
        localStorage.setItem('display-currency', newCurrency)
    }

    const convert = (amount: number): number => {
        const rate = rates[currency] || 1.0
        return (amount || 0) * rate
    }

    const convertToBase = (amount: number): number => {
        const rate = rates[currency] || 1.0
        return (amount || 0) / rate
    }

    const format = (amount: number, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }): string => {
        const converted = convert(amount)
        const symbolStr = symbols[currency]
        const localeStr = locales[currency]
        
        // If not mounted yet (SSR phase), render standard INR as fallback
        if (!mounted) {
            return `₹${(amount || 0).toLocaleString('en-IN', {
                minimumFractionDigits: options?.minimumFractionDigits ?? 2,
                maximumFractionDigits: options?.maximumFractionDigits ?? 2
            })}`
        }

        const formatted = converted.toLocaleString(localeStr, {
            minimumFractionDigits: options?.minimumFractionDigits ?? 2,
            maximumFractionDigits: options?.maximumFractionDigits ?? 2
        })

        return `${symbolStr}${formatted}`
    }

    const value = {
        currency,
        setCurrency,
        convert,
        convertToBase,
        format,
        symbol: symbols[currency]
    }

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    )
}

export function useCurrency() {
    const context = useContext(CurrencyContext)
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider')
    }
    return context
}
