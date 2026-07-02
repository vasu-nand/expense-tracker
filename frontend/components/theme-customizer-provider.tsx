'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { api } from '@/services/api'

export interface CustomTheme {
    name: string
    background: string
    card: string
    foreground: string
    border: string
    primary: string
    btnGradientStart: string
    btnGradientEnd: string
    textGradientStart: string
    textGradientEnd: string
    radius: string
    dark?: {
        background: string
        card: string
        foreground: string
        border: string
        primary: string
        btnGradientStart: string
        btnGradientEnd: string
        textGradientStart: string
        textGradientEnd: string
    }
}

export const predefinedThemes: CustomTheme[] = [
    {
        name: 'Teal Harmony',
        background: '#f0fdfa', // teal-50
        card: '#ffffff',
        foreground: '#0f172a',
        border: '#e2e8f0',
        primary: '#0d9488', // teal-600
        btnGradientStart: '#14b8a6', // teal-500
        btnGradientEnd: '#0f766e', // teal-700
        textGradientStart: '#0f766e',
        textGradientEnd: '#115e59',
        radius: '0.5rem'
    },
    {
        name: 'Royal Amethyst',
        background: '#faf5ff', // purple-50
        card: '#ffffff',
        foreground: '#0f172a',
        border: '#e9d5ff',
        primary: '#7c3aed', // violet-600
        btnGradientStart: '#a855f7', // purple-500
        btnGradientEnd: '#7c3aed', // violet-600
        textGradientStart: '#7c3aed',
        textGradientEnd: '#5b21b6',
        radius: '0.5rem',
        dark: {
            background: '#120e2e',
            card: '#1e1b4b',
            foreground: '#f5f3ff',
            border: '#3730a3',
            primary: '#a78bfa',
            btnGradientStart: '#c084fc',
            btnGradientEnd: '#7c3aed',
            textGradientStart: '#a78bfa',
            textGradientEnd: '#7c3aed'
        }
    },
    {
        name: 'Sunset Glow',
        background: '#fff7ed', // orange-50
        card: '#ffffff',
        foreground: '#0f172a',
        border: '#fed7aa',
        primary: '#ea580c',
        btnGradientStart: '#f97316',
        btnGradientEnd: '#ea580c',
        textGradientStart: '#ea580c',
        textGradientEnd: '#9a3412',
        radius: '0.5rem',
        dark: {
            background: '#2c1205',
            card: '#1c0d02',
            foreground: '#ffedd5',
            border: '#431407',
            primary: '#fb923c',
            btnGradientStart: '#f97316',
            btnGradientEnd: '#ea580c',
            textGradientStart: '#fb923c',
            textGradientEnd: '#ea580c'
        }
    },
    {
        name: 'Ocean Breeze',
        background: '#f0f9ff', // sky-50
        card: '#ffffff',
        foreground: '#0f172a',
        border: '#bae6fd',
        primary: '#0284c7',
        btnGradientStart: '#38bdf8',
        btnGradientEnd: '#0284c7',
        textGradientStart: '#0284c7',
        textGradientEnd: '#075985',
        radius: '0.5rem',
        dark: {
            background: '#082f49',
            card: '#0c1d29',
            foreground: '#e0f2fe',
            border: '#0c4a6e',
            primary: '#38bdf8',
            btnGradientStart: '#38bdf8',
            btnGradientEnd: '#0284c7',
            textGradientStart: '#38bdf8',
            textGradientEnd: '#0284c7'
        }
    },
    {
        name: 'Forest Emerald',
        background: '#f0fdf4', // green-50
        card: '#ffffff',
        foreground: '#0f172a',
        border: '#bbf7d0',
        primary: '#16a34a',
        btnGradientStart: '#4ade80',
        btnGradientEnd: '#16a34a',
        textGradientStart: '#16a34a',
        textGradientEnd: '#166534',
        radius: '0.5rem',
        dark: {
            background: '#022c22',
            card: '#061c16',
            foreground: '#d1fae5',
            border: '#064e3b',
            primary: '#34d399',
            btnGradientStart: '#4ade80',
            btnGradientEnd: '#16a34a',
            textGradientStart: '#34d399',
            textGradientEnd: '#16a34a'
        }
    },
    {
        name: 'Sakura Blossom',
        background: '#fff1f2', // rose-50
        card: '#ffffff',
        foreground: '#0f172a',
        border: '#ffe4e6', // rose-100
        primary: '#db2777', // pink-600
        btnGradientStart: '#f43f5e', // rose-500
        btnGradientEnd: '#be185d', // pink-700
        textGradientStart: '#db2777',
        textGradientEnd: '#9d174d',
        radius: '0.5rem',
        dark: {
            background: '#31041b',
            card: '#1f0210',
            foreground: '#ffe4e6',
            border: '#4c052e',
            primary: '#f472b6',
            btnGradientStart: '#f43f5e',
            btnGradientEnd: '#be185d',
            textGradientStart: '#f472b6',
            textGradientEnd: '#be185d'
        }
    },
    {
        name: 'Cyberpunk Neon',
        background: '#faf5ff', // purple-50
        card: '#ffffff',
        foreground: '#0f172a',
        border: '#f3e8ff',
        primary: '#ec4899', // pink-500
        btnGradientStart: '#ec4899', // pink-500
        btnGradientEnd: '#06b6d4', // cyan-500
        textGradientStart: '#db2777',
        textGradientEnd: '#0891b2',
        radius: '0.5rem',
        dark: {
            background: '#0c0612',
            card: '#160a22',
            foreground: '#fdf4ff',
            border: '#3b0764',
            primary: '#f472b6',
            btnGradientStart: '#ec4899',
            btnGradientEnd: '#06b6d4',
            textGradientStart: '#ec4899',
            textGradientEnd: '#06b6d4'
        }
    },
    {
        name: 'Nordic Frost',
        background: '#f8fafc', // slate-50
        card: '#ffffff',
        foreground: '#0f172a',
        border: '#e2e8f0',
        primary: '#0369a1', // sky-700
        btnGradientStart: '#38bdf8', // sky-400
        btnGradientEnd: '#0d9488', // teal-600
        textGradientStart: '#0369a1',
        textGradientEnd: '#0f766e',
        radius: '0.5rem',
        dark: {
            background: '#0b0f19',
            card: '#111827',
            foreground: '#f1f5f9',
            border: '#1f2937',
            primary: '#38bdf8',
            btnGradientStart: '#38bdf8',
            btnGradientEnd: '#0d9488',
            textGradientStart: '#38bdf8',
            textGradientEnd: '#0d9488'
        }
    },
    {
        name: 'Honeycomb Gold',
        background: '#fffbeb', // amber-50
        card: '#ffffff',
        foreground: '#0f172a',
        border: '#fef3c7',
        primary: '#d97706', // amber-600
        btnGradientStart: '#fbbf24', // amber-400
        btnGradientEnd: '#b45309', // amber-700
        textGradientStart: '#d97706',
        textGradientEnd: '#78350f',
        radius: '0.5rem',
        dark: {
            background: '#1c1202',
            card: '#2a1b04',
            foreground: '#fef3c7',
            border: '#451a03',
            primary: '#fbbf24',
            btnGradientStart: '#fbbf24',
            btnGradientEnd: '#b45309',
            textGradientStart: '#fbbf24',
            textGradientEnd: '#b45309'
        }
    },
    {
        name: 'Charcoal Elegance',
        background: '#f1f5f9', // slate-100
        card: '#ffffff',
        foreground: '#0f172a',
        border: '#cbd5e1', // slate-300
        primary: '#334155', // slate-700
        btnGradientStart: '#475569', // slate-600
        btnGradientEnd: '#0f172a', // slate-900
        textGradientStart: '#334155',
        textGradientEnd: '#0f172a',
        radius: '0.5rem',
        dark: {
            background: '#090d16',
            card: '#111726',
            foreground: '#f8fafc',
            border: '#1e293b',
            primary: '#94a3b8',
            btnGradientStart: '#94a3b8',
            btnGradientEnd: '#475569',
            textGradientStart: '#94a3b8',
            textGradientEnd: '#475569'
        }
    }
]

export const predefinedCategoryPalettes: { name: string; colors: Record<string, string> }[] = [
    {
        name: 'Teal Harmony Palette',
        colors: {
            Breakfast: '#fbbf24', // Amber
            Lunch: '#f97316', // Orange
            Dinner: '#6366f1', // Indigo
            Groceries: '#14b8a6', // Teal
            Food: '#f43f5e', // Rose
            Drinks: '#0ea5e9', // Sky
            Transport: '#10b981', // Emerald
            Shopping: '#a855f7', // Purple
            Rent: '#ec4899', // Pink
            Bills: '#ef4444', // Red
            Salary: '#10b981', // Emerald
            Freelance: '#06b6d4', // Cyan
            Investments: '#3b82f6', // Blue
            Gifts: '#ec4899', // Pink
            Others: '#71717a' // Zinc
        }
    },
    {
        name: 'Midnight Neon Palette',
        colors: {
            Breakfast: '#fb7185', // Rose-400
            Lunch: '#f43f5e', // Rose-500
            Dinner: '#c084fc', // Purple-400
            Groceries: '#2dd4bf', // Teal-400
            Food: '#f472b6', // Pink-400
            Drinks: '#38bdf8', // Sky-400
            Transport: '#34d399', // Emerald-400
            Shopping: '#a78bfa', // Violet-400
            Rent: '#f472b6', // Pink-400
            Bills: '#fb7185', // Rose-400
            Salary: '#34d399', // Emerald-400
            Freelance: '#2dd4bf', // Teal-400
            Investments: '#38bdf8', // Sky-400
            Gifts: '#f472b6', // Pink-400
            Others: '#94a3b8' // Slate-400
        }
    },
    {
        name: 'Warm Autumn Palette',
        colors: {
            Breakfast: '#fbbf24', // Amber-400
            Lunch: '#f97316', // Orange-500
            Dinner: '#c2410c', // Orange-700
            Groceries: '#854d0e', // Yellow-800
            Food: '#9a3412', // Orange-800
            Drinks: '#b45309', // Amber-700
            Transport: '#15803d', // Green-700
            Shopping: '#6b21a8', // Purple-800
            Rent: '#be185d', // Pink-700
            Bills: '#991b1b', // Red-800
            Salary: '#15803d', // Green-700
            Freelance: '#0d9488', // Teal-700
            Investments: '#1d4ed8', // Blue-700
            Gifts: '#be185d', // Pink-700
            Others: '#52525b' // Zinc-600
        }
    },
    {
        name: 'Ocean Calm Palette',
        colors: {
            Breakfast: '#7dd3fc', // Sky-300
            Lunch: '#0284c7', // Sky-600
            Dinner: '#1e3a8a', // Blue-900
            Groceries: '#0f766e', // Teal-700
            Food: '#0369a1', // Sky-700
            Drinks: '#0284c7', // Sky-600
            Transport: '#0f766e', // Teal-700
            Shopping: '#1e293b', // Slate-800
            Rent: '#0f172a', // Slate-900
            Bills: '#3b82f6', // Blue-500
            Salary: '#059669', // Emerald-600
            Freelance: '#0d9488', // Teal-700
            Investments: '#2563eb', // Blue-600
            Gifts: '#db2777', // Pink-600
            Others: '#64748b' // Slate-500
        }
    }
]

const defaultCategoryKeywords: Record<string, string[]> = {
    Breakfast: ['breakfast', 'doodh', 'milk', 'coffee', 'eggs', 'omlet', 'bread', 'butter', 'jam'],
    Lunch: ['lunch', 'thali', 'meal', 'curry', 'roti', 'rice'],
    Dinner: ['dinner', 'night', 'supper'],
    Groceries: ['blinkit', 'grocery', 'vegetable', 'fruits', 'groceries', 'provision', 'milk delivery', 'tiffin'],
    Food: ['paratha', 'sweet', 'chutney', 'snack', 'samosa', 'pizza', 'burger', 'sandwich', 'cake', 'biscuit'],
    Drinks: ['juice', 'frooti', 'nimbu pani', 'lemon', 'soda', 'water', 'cold drink', 'milkshake', 'smoothie'],
    Transport: ['auto', 'taxi', 'bus', 'train', 'petrol', 'diesel', 'uber', 'ola', 'rickshaw', 'rapido'],
    Shopping: ['shopping', 'clothes', 'shoes', 'electronics', 'amazon', 'flipkart'],
    Rent: ['rent', 'room rent', 'house rent', 'flat rent', 'hostel rent', 'hostel fee', 'pg rent'],
    Bills: ['electricity', 'power bill', 'light bill', 'bill', 'recharge', 'wifi', 'internet', 'broadband', 'water bill', 'maintenance'],
    Salary: ['salary', 'paycheck', 'payout', 'wage', 'stipend', 'income'],
    Freelance: ['freelance', 'client', 'gig', 'consulting', 'upwork', 'fiverr'],
    Investments: ['investment', 'dividend', 'interest', 'stock', 'mutual fund', 'crypto'],
    Gifts: ['gift', 'cashback', 'reward', 'refund', 'birthday'],
    Others: []
}

interface ThemeCustomizerContextType {
    theme: CustomTheme
    setTheme: (theme: CustomTheme) => void
    resetTheme: () => void
    updateThemeColor: (key: keyof Omit<CustomTheme, 'name'>, value: string) => void
    updateDarkThemeColor: (key: string, value: string) => void
    categoryColors: Record<string, string>
    updateCategoryColor: (category: string, color: string) => void
    setCategoryColors: (colors: Record<string, string>) => void
    categoryKeywords: Record<string, string[]>
    updateCategoryKeywords: (category: string, keywords: string[]) => void
    addCustomCategory: (category: string, color: string, keywords: string[]) => void
    deleteCustomCategory: (category: string, deletePassword?: string) => Promise<boolean>
    resetCategorySettings: () => Promise<void>
}

const ThemeCustomizerContext = createContext<ThemeCustomizerContextType | undefined>(undefined)

// Helper: Convert Hex to HSL values
function hexToHsl(hex: string) {
    hex = hex.replace(/^#/, '')
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    }
}

import { useAccount } from './account-context'

export function ThemeCustomizerProvider({ children }: { children: React.ReactNode }) {
    const { theme: mode, setTheme: setMode, resolvedTheme } = useTheme()
    const { selectedAccount } = useAccount()
    const [customTheme, setCustomThemeState] = useState<CustomTheme>(predefinedThemes[0])
    const [categoryColors, setCategoryColorsState] = useState<Record<string, string>>(predefinedCategoryPalettes[0].colors)
    const [categoryKeywords, setCategoryKeywordsState] = useState<Record<string, string[]>>(defaultCategoryKeywords)
    const [mounted, setMounted] = useState(false)
    const isInitialLoad = useRef(true)

    const syncCategoriesWithBackend = async () => {
        try {
            const response = await api.get('/categories')
            if (response.data && response.data.categories) {
                const colors: Record<string, string> = {}
                const keywords: Record<string, string[]> = {}
                for (const cat of response.data.categories) {
                    colors[cat.name] = cat.color
                    keywords[cat.name] = cat.keywords || []
                }
                setCategoryColorsState(colors)
                setCategoryKeywordsState(keywords)
                localStorage.setItem('custom-category-colors', JSON.stringify(colors))
                localStorage.setItem('custom-category-keywords', JSON.stringify(keywords))
            }
        } catch (error) {
            console.error('Failed to sync categories with backend database:', error)
        }
    }

    const init = async () => {
        if (!selectedAccount) return

        const storedColors = localStorage.getItem('custom-category-colors')
        if (storedColors) {
            try {
                setCategoryColorsState(JSON.parse(storedColors))
            } catch (e) {
                console.error('Error parsing stored category colors:', e)
            }
        }

        const storedKeywords = localStorage.getItem('custom-category-keywords')
        if (storedKeywords) {
            try {
                setCategoryKeywordsState(JSON.parse(storedKeywords))
            } catch (e) {
                console.error('Error parsing stored category keywords:', e)
            }
        }

        await syncCategoriesWithBackend()

        try {
            const response = await api.get('/settings')
            if (response.data && response.data.settings) {
                const { themeMode, themeConfig } = response.data.settings
                if (themeConfig) {
                    setCustomThemeState(themeConfig)
                    localStorage.setItem('custom-theme-config', JSON.stringify(themeConfig))
                }
                if (themeMode) {
                    setMode(themeMode)
                }
            }
        } catch (error) {
            console.error('Failed to load settings from database:', error)
        } finally {
            isInitialLoad.current = false
            setMounted(true)
        }
    }

    // Trigger re-initialization whenever active bank account changes
    useEffect(() => {
        if (selectedAccount?._id) {
            init()
        }
    }, [selectedAccount?._id])

    useEffect(() => {
        if (!mounted || isInitialLoad.current || !selectedAccount?._id) return

        const delayDebounceFn = setTimeout(async () => {
            try {
                await api.put('/settings', {
                    themeMode: mode,
                    themeConfig: customTheme
                })
                console.log('Settings successfully saved to database.')
            } catch (error) {
                console.error('Failed to save settings to database:', error)
            }
        }, 1000)

        return () => clearTimeout(delayDebounceFn)
    }, [customTheme, mode, mounted, selectedAccount?._id])

    const applyTheme = (theme: CustomTheme, isDark: boolean) => {
        if (typeof window === 'undefined') return
        const root = document.documentElement

        // Compute base colors in HSL
        const bgHsl = hexToHsl(theme.background)
        const cardHsl = hexToHsl(theme.card)
        const fgHsl = hexToHsl(theme.foreground)
        const borderHsl = hexToHsl(theme.border)
        const primaryHsl = hexToHsl(theme.primary)

        if (isDark) {
            if (theme.dark) {
                // Apply handcrafted theme dark override colors
                const dbgHsl = hexToHsl(theme.dark.background)
                const dcardHsl = hexToHsl(theme.dark.card)
                const dfgHsl = hexToHsl(theme.dark.foreground)
                const dborderHsl = hexToHsl(theme.dark.border)
                const dprimaryHsl = hexToHsl(theme.dark.primary)

                root.style.setProperty('--background', `${dbgHsl.h} ${dbgHsl.s}% ${dbgHsl.l}%`)
                root.style.setProperty('--card', `${dcardHsl.h} ${dcardHsl.s}% ${dcardHsl.l}%`)
                root.style.setProperty('--popover', `${dcardHsl.h} ${dcardHsl.s}% ${dcardHsl.l}%`)
                
                root.style.setProperty('--foreground', `${dfgHsl.h} ${dfgHsl.s}% ${dfgHsl.l}%`)
                root.style.setProperty('--card-foreground', `${dfgHsl.h} ${dfgHsl.s}% ${dfgHsl.l}%`)
                root.style.setProperty('--popover-foreground', `${dfgHsl.h} ${dfgHsl.s}% ${dfgHsl.l}%`)
                
                root.style.setProperty('--border', `${dborderHsl.h} ${dborderHsl.s}% ${dborderHsl.l}%`)
                root.style.setProperty('--input', `${dborderHsl.h} ${dborderHsl.s}% ${dborderHsl.l}%`)
                
                root.style.setProperty('--primary', `${dprimaryHsl.h} ${dprimaryHsl.s}% ${dprimaryHsl.l}%`)
                root.style.setProperty('--primary-foreground', `${dprimaryHsl.h} ${dprimaryHsl.s}% 10%`)
                root.style.setProperty('--ring', `${dprimaryHsl.h} ${dprimaryHsl.s}% ${dprimaryHsl.l}%`)

                root.style.setProperty('--btn-gradient-start', theme.dark.btnGradientStart)
                root.style.setProperty('--btn-gradient-end', theme.dark.btnGradientEnd)
                root.style.setProperty('--text-gradient-start', theme.dark.textGradientStart)
                root.style.setProperty('--text-gradient-end', theme.dark.textGradientEnd)
            } else {
                // Smart dark theme complement: Keep hue and saturation, but shift lightness
                // Background lightness: 4%, Saturation: capped at 25% for subtlety
                const bgS = Math.min(bgHsl.s, 25)
                root.style.setProperty('--background', `${bgHsl.h} ${bgS}% 4%`)
                
                // Card lightness: 8%
                const cardS = Math.min(cardHsl.s, 20)
                root.style.setProperty('--card', `${cardHsl.h} ${cardS}% 8%`)
                root.style.setProperty('--popover', `${cardHsl.h} ${cardS}% 8%`)
                
                // Text/Foreground: 95% lightness, low saturation for legibility
                root.style.setProperty('--foreground', `${fgHsl.h} 10% 95%`)
                root.style.setProperty('--card-foreground', `${fgHsl.h} 10% 95%`)
                root.style.setProperty('--popover-foreground', `${fgHsl.h} 10% 95%`)
                
                // Borders: 14% lightness
                const borderS = Math.min(borderHsl.s, 15)
                root.style.setProperty('--border', `${borderHsl.h} ${borderS}% 14%`)
                root.style.setProperty('--input', `${borderHsl.h} ${borderS}% 14%`)
                
                // Primary: boost lightness slightly in dark mode if too dark
                const primaryL = Math.max(primaryHsl.l, 50)
                root.style.setProperty('--primary', `${primaryHsl.h} ${primaryHsl.s}% ${primaryL}%`)
                root.style.setProperty('--primary-foreground', `${primaryHsl.h} ${primaryHsl.s}% 10%`)
                
                root.style.setProperty('--ring', `${primaryHsl.h} ${primaryHsl.s}% ${primaryL}%`)

                // Apply custom gradient variables directly (Hex)
                root.style.setProperty('--btn-gradient-start', theme.btnGradientStart)
                root.style.setProperty('--btn-gradient-end', theme.btnGradientEnd)
                root.style.setProperty('--text-gradient-start', theme.textGradientStart)
                root.style.setProperty('--text-gradient-end', theme.textGradientEnd)
            }
        } else {
            // Light Mode: Apply custom light colors as HSL variables
            root.style.setProperty('--background', `${bgHsl.h} ${bgHsl.s}% ${bgHsl.l}%`)
            root.style.setProperty('--card', `${cardHsl.h} ${cardHsl.s}% ${cardHsl.l}%`)
            root.style.setProperty('--popover', `${cardHsl.h} ${cardHsl.s}% ${cardHsl.l}%`)
            
            root.style.setProperty('--foreground', `${fgHsl.h} ${fgHsl.s}% ${fgHsl.l}%`)
            root.style.setProperty('--card-foreground', `${fgHsl.h} ${fgHsl.s}% ${fgHsl.l}%`)
            root.style.setProperty('--popover-foreground', `${fgHsl.h} ${fgHsl.s}% ${fgHsl.l}%`)
            
            root.style.setProperty('--border', `${borderHsl.h} ${borderHsl.s}% ${borderHsl.l}%`)
            root.style.setProperty('--input', `${borderHsl.h} ${borderHsl.s}% ${borderHsl.l}%`)
            
            root.style.setProperty('--primary', `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`)
            root.style.setProperty('--primary-foreground', `${primaryHsl.h} ${primaryHsl.s}% 98%`)
            
            root.style.setProperty('--ring', `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`)

            // Apply custom gradient variables directly (Hex)
            root.style.setProperty('--btn-gradient-start', theme.btnGradientStart)
            root.style.setProperty('--btn-gradient-end', theme.btnGradientEnd)
            root.style.setProperty('--text-gradient-start', theme.textGradientStart)
            root.style.setProperty('--text-gradient-end', theme.textGradientEnd)
        }
        root.style.setProperty('--radius', theme.radius || '0.5rem')
    }

    // Apply the theme variables on mount or customTheme/resolvedTheme change
    useEffect(() => {
        if (!mounted) return
        const isDark = resolvedTheme === 'dark'
        applyTheme(customTheme, isDark)
    }, [customTheme, resolvedTheme, mounted])

    const setTheme = (theme: CustomTheme) => {
        setCustomThemeState(theme)
        localStorage.setItem('custom-theme-config', JSON.stringify(theme))
    }

    const resetTheme = () => {
        setTheme(predefinedThemes[0])
    }

    const updateThemeColor = (key: keyof Omit<CustomTheme, 'name'>, value: string) => {
        const updated = {
            ...customTheme,
            name: 'Custom',
            [key]: value
        }
        setTheme(updated)
    }

    const updateDarkThemeColor = (key: string, value: string) => {
        const currentDark = customTheme.dark || {
            background: '#090d16',
            card: '#111726',
            foreground: '#f8fafc',
            border: '#1e293b',
            primary: '#94a3b8',
            btnGradientStart: '#94a3b8',
            btnGradientEnd: '#475569',
            textGradientStart: '#94a3b8',
            textGradientEnd: '#475569'
        }
        const updated = {
            ...customTheme,
            name: 'Custom',
            dark: {
                ...currentDark,
                [key]: value
            }
        }
        setTheme(updated)
    }

    const setCategoryColors = async (colors: Record<string, string>) => {
        // Merge theme color changes with current custom category colors to prevent them disappearing
        const updated = {
            ...categoryColors,
            ...colors
        }
        setCategoryColorsState(updated)
        localStorage.setItem('custom-category-colors', JSON.stringify(updated))
        try {
            for (const [name, color] of Object.entries(colors)) {
                await api.put(`/categories/${encodeURIComponent(name)}`, { color })
            }
            await syncCategoriesWithBackend()
        } catch (e) {
            console.error('Error syncing colors to backend:', e)
        }
    }

    const updateCategoryColor = async (category: string, color: string) => {
        const updated = {
            ...categoryColors,
            [category]: color
        }
        setCategoryColorsState(updated)
        localStorage.setItem('custom-category-colors', JSON.stringify(updated))
        try {
            await api.put(`/categories/${encodeURIComponent(category)}`, { color })
            await syncCategoriesWithBackend()
        } catch (e) {
            console.error('Error updating category color on backend:', e)
        }
    }

    const updateCategoryKeywords = async (category: string, keywords: string[]) => {
        const updated = {
            ...categoryKeywords,
            [category]: keywords
        }
        setCategoryKeywordsState(updated)
        localStorage.setItem('custom-category-keywords', JSON.stringify(updated))
        try {
            await api.put(`/categories/${encodeURIComponent(category)}`, { keywords })
            await syncCategoriesWithBackend()
        } catch (e) {
            console.error('Error updating category keywords on backend:', e)
        }
    }

    const addCustomCategory = async (category: string, color: string, keywords: string[]) => {
        const name = category.trim()
        if (!name) return
        try {
            await api.post('/categories', { name, color, keywords })
            const updatedColors = { ...categoryColors, [name]: color }
            const updatedKeywords = { ...categoryKeywords, [name]: keywords }
            setCategoryColorsState(updatedColors)
            setCategoryKeywordsState(updatedKeywords)
            localStorage.setItem('custom-category-colors', JSON.stringify(updatedColors))
            localStorage.setItem('custom-category-keywords', JSON.stringify(updatedKeywords))
            await syncCategoriesWithBackend()
        } catch (e: any) {
            console.error('Error creating custom category on backend:', e)
            throw new Error(e.response?.data?.error || 'Failed to create category')
        }
    }

    const deleteCustomCategory = async (category: string, deletePassword?: string) => {
        try {
            await api.delete(`/categories/${encodeURIComponent(category)}`, {
                headers: { 'x-delete-password': deletePassword || '' }
            })
            const updatedColors = { ...categoryColors }
            delete updatedColors[category]
            const updatedKeywords = { ...categoryKeywords }
            delete updatedKeywords[category]
            setCategoryColorsState(updatedColors)
            setCategoryKeywordsState(updatedKeywords)
            localStorage.setItem('custom-category-colors', JSON.stringify(updatedColors))
            localStorage.setItem('custom-category-keywords', JSON.stringify(updatedKeywords))
            await syncCategoriesWithBackend()
            return true
        } catch (e: any) {
            console.error('Error deleting category from backend:', e)
            throw new Error(e.response?.data?.error || 'Failed to delete category')
        }
    }

    const resetCategorySettings = async () => {
        try {
            await api.post('/categories/reset')
            await syncCategoriesWithBackend()
        } catch (e) {
            console.error('Error resetting categories to default on backend:', e)
        }
    }

    const value = {
        theme: customTheme,
        setTheme,
        resetTheme,
        updateThemeColor,
        updateDarkThemeColor,
        categoryColors,
        updateCategoryColor,
        setCategoryColors,
        categoryKeywords,
        updateCategoryKeywords,
        addCustomCategory,
        deleteCustomCategory,
        resetCategorySettings
    }

    return (
        <ThemeCustomizerContext.Provider value={value}>
            {children}
        </ThemeCustomizerContext.Provider>
    )
}

export function useThemeCustomizer() {
    const context = useContext(ThemeCustomizerContext)
    if (!context) {
        throw new Error('useThemeCustomizer must be used within a ThemeCustomizerProvider')
    }
    return context
}
