'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

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

interface ThemeCustomizerContextType {
    theme: CustomTheme
    setTheme: (theme: CustomTheme) => void
    resetTheme: () => void
    updateThemeColor: (key: keyof Omit<CustomTheme, 'name'>, value: string) => void
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

export function ThemeCustomizerProvider({ children }: { children: React.ReactNode }) {
    const { resolvedTheme } = useTheme()
    const [customTheme, setCustomThemeState] = useState<CustomTheme>(predefinedThemes[0])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const stored = localStorage.getItem('custom-theme-config')
        if (stored) {
            try {
                setCustomThemeState(JSON.parse(stored))
            } catch (e) {
                console.error('Error parsing stored custom theme:', e)
            }
        }
        setMounted(true)
    }, [])

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

    const value = {
        theme: customTheme,
        setTheme,
        resetTheme,
        updateThemeColor
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
