'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
    useThemeCustomizer, 
    predefinedThemes, 
    predefinedCategoryPalettes 
} from '@/components/theme-customizer-provider'
import { useCurrency, CurrencyType } from '@/hooks/use-currency'
import { useTheme } from 'next-themes'
import { useAccount } from '@/components/account-context'
import { cn } from '@/lib/utils'
import { api } from '@/services/api'
import {
    Settings,
    Palette,
    Coins,
    Database,
    Download,
    Upload as UploadIcon,
    RefreshCw,
    Check,
    Sparkles,
    Sun,
    Moon,
    Monitor,
    AlertOctagon,
    AlertTriangle,
    Trash2,
    Tag,
    Plus,
    ChevronLeft,
    ChevronRight,
    Sliders,
    Save
} from 'lucide-react'

type SettingsTab = 'appearance' | 'currency' | 'data' | 'categories'

interface TabItem {
    id: SettingsTab
    label: string
    icon: React.ElementType
}

const SETTINGS_TABS: TabItem[] = [
    { id: 'appearance', label: 'Appearance & Theme', icon: Palette },
    { id: 'currency', label: 'Currencies', icon: Coins },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'categories', label: 'Category Settings', icon: Tag },
]

export default function SettingsPage() {
    const { theme: mode, setTheme: setMode } = useTheme()
    const [mounted, setMounted] = useState(false)
    const { selectedAccount } = useAccount()

    useEffect(() => {
        setMounted(true)
    }, [])

    const [activeTab, setActiveTab] = useState<SettingsTab>('appearance')
    const [designerMode, setDesignerMode] = useState<'light' | 'dark'>('light')
    const [portfolioBannerEnabled, setPortfolioBannerEnabled] = useState<boolean>(true)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hidden = localStorage.getItem('hide-empty-portfolio-banner') === 'true'
            setPortfolioBannerEnabled(!hidden)
        }
    }, [])

    // Tab Scroll & Navigation state
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const activeTabRef = useRef<HTMLButtonElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    const checkScrollState = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
            setCanScrollLeft(scrollLeft > 4)
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4)
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTabRef.current && scrollContainerRef.current) {
                activeTabRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                })
            }
            checkScrollState()
        }, 100)

        window.addEventListener('resize', checkScrollState)
        return () => {
            clearTimeout(timer)
            window.removeEventListener('resize', checkScrollState)
        }
    }, [activeTab])

    const handleScrollClick = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const amount = direction === 'left' ? -150 : 150
            scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' })
        }
    }

    // Category Settings Form States
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryColor, setNewCategoryColor] = useState('#6366f1')
    const [newCategoryKeywords, setNewCategoryKeywords] = useState('')
    const [catFormError, setCatFormError] = useState('')
    const [catFormSuccess, setCatFormSuccess] = useState('')
    const [editingKeywords, setEditingKeywords] = useState<Record<string, string>>({})

    // Theme Customizer Context
    const {
        theme: currentTheme,
        setTheme,
        updateThemeColor,
        updateDarkThemeColor,
        resetTheme,
        categoryColors,
        updateCategoryColor,
        setCategoryColors,
        categoryKeywords,
        updateCategoryKeywords,
        addCustomCategory,
        deleteCustomCategory,
        resetCategorySettings
    } = useThemeCustomizer()

    // Initialize editing keywords state from context
    useEffect(() => {
        if (categoryKeywords) {
            const map: Record<string, string> = {}
            for (const [cat, kwArray] of Object.entries(categoryKeywords)) {
                map[cat] = (kwArray || []).join(', ')
            }
            setEditingKeywords(map)
        }
    }, [categoryKeywords])

    const defaultDarkTheme = {
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

    const activeConfig = designerMode === 'light'
        ? currentTheme
        : (currentTheme.dark || defaultDarkTheme)

    const handleThemeColorChange = (key: string, val: string) => {
        if (designerMode === 'light') {
            updateThemeColor(key as any, val)
        } else {
            updateDarkThemeColor(key, val)
        }
    }

    // Currency Context
    const { currency, setCurrency, format } = useCurrency()

    // Data Management state
    const [showResetConfirmation, setShowResetConfirmation] = useState(false)
    const [resetPassword, setResetPassword] = useState('')
    const [resettingDb, setResettingDb] = useState(false)
    const [resetError, setResetError] = useState('')
    const [resetSuccess, setResetSuccess] = useState('')

    const handleClearAllData = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!resetPassword.trim()) return

        try {
            setResettingDb(true)
            setResetError('')
            await api.delete('/expenses', {
                headers: { 'x-delete-password': resetPassword }
            })
            setResetSuccess('Database successfully reset. All transactions and summaries deleted.')
            setShowResetConfirmation(false)
            setResetPassword('')
            window.dispatchEvent(new CustomEvent('expense-added'))
        } catch (err: any) {
            setResetError(err.response?.data?.error || 'Failed to wipe database. Invalid password.')
        } finally {
            setResettingDb(false)
        }
    }

    const handleAddCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setCatFormError('')
        setCatFormSuccess('')

        const name = newCategoryName.trim()
        if (!name) {
            setCatFormError('Category name is required')
            return
        }

        const formattedName = name.charAt(0).toUpperCase() + name.slice(1)

        if (categoryColors[formattedName]) {
            setCatFormError(`Category "${formattedName}" already exists`)
            return
        }

        const keywordsList = newCategoryKeywords
            .split(',')
            .map((k) => k.trim().toLowerCase())
            .filter(Boolean)

        if (keywordsList.length === 0) {
            keywordsList.push(formattedName.toLowerCase())
        }

        try {
            await addCustomCategory(formattedName, newCategoryColor, keywordsList)
            setNewCategoryName('')
            setNewCategoryColor('#6366f1')
            setNewCategoryKeywords('')
            setCatFormSuccess(`Successfully registered "${formattedName}" category!`)
            setTimeout(() => setCatFormSuccess(''), 3000)
        } catch (err: any) {
            setCatFormError(err.message || 'Failed to register category')
        }
    }

    const handleSaveCategoryKeywords = async (catName: string) => {
        const rawKw = editingKeywords[catName] || ''
        const kwArray = rawKw.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
        await updateCategoryKeywords(catName, kwArray)
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="pb-4 border-b border-border/40 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                    <h1 className="text-3xl font-extrabold text-custom-gradient flex items-center gap-2.5">
                        <Settings className="h-7 w-7 text-indigo-500" /> Settings & Preferences
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Customize interface themes, currency exchange rules, data backups, and custom categories.
                    </p>
                </div>
            </div>

            {/* Animated Tab Switcher Container (No Horizontal Scrollbar) */}
            <div className="relative flex items-center bg-muted/40 p-1.5 rounded-2xl border border-border/40">
                {/* Left Scroll Arrow Button */}
                {canScrollLeft && (
                    <button
                        type="button"
                        onClick={() => handleScrollClick('left')}
                        className="absolute left-1.5 z-10 flex items-center justify-center h-8 w-8 rounded-full bg-card/90 backdrop-blur border border-border/80 shadow-md text-foreground transition-all hover:scale-110 active:scale-95"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                )}

                {/* Sub-nav Tab Links (Hidden Scrollbar) */}
                <div
                    ref={scrollContainerRef}
                    onScroll={checkScrollState}
                    className="flex items-center space-x-1.5 overflow-x-auto [::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full scroll-smooth select-none px-0.5"
                >
                    {SETTINGS_TABS.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                ref={isActive ? activeTabRef : null}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 select-none",
                                    isActive
                                        ? "bg-card text-foreground shadow-md border border-border/80 scale-[1.02]"
                                        : "text-muted-foreground hover:bg-card/40 hover:text-foreground"
                                )}
                            >
                                <Icon className={cn("h-4 w-4 transition-transform", isActive ? "text-indigo-500 scale-110" : "text-muted-foreground")} />
                                <span>{tab.label}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Right Scroll Arrow Button */}
                {canScrollRight && (
                    <button
                        type="button"
                        onClick={() => handleScrollClick('right')}
                        className="absolute right-1.5 z-10 flex items-center justify-center h-8 w-8 rounded-full bg-card/90 backdrop-blur border border-border/80 shadow-md text-foreground transition-all hover:scale-110 active:scale-95"
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Tab Contents */}
            <div className="space-y-6">
                {/* TAB 1: APPEARANCE & CUSTOM THEME */}
                {activeTab === 'appearance' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Theme Mode Selector */}
                        <Card className="bg-card shadow-sm border-border/60 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                    <Sun className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                                    Interface Theme Mode
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Toggle between Light Mode, Dark Mode, or Automatic System Synchronization.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setMode('light')}
                                        className={cn(
                                            "p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all text-xs font-bold",
                                            mounted && mode === 'light'
                                                ? "border-amber-500/50 bg-amber-500/10 text-amber-500 shadow-sm scale-[1.02]"
                                                : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                        )}
                                    >
                                        <Sun className="h-5 w-5" />
                                        <span>Light Mode</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setMode('dark')}
                                        className={cn(
                                            "p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all text-xs font-bold",
                                            mounted && mode === 'dark'
                                                ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-500 shadow-sm scale-[1.02]"
                                                : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                        )}
                                    >
                                        <Moon className="h-5 w-5" />
                                        <span>Dark Mode</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setMode('system')}
                                        className={cn(
                                            "p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all text-xs font-bold",
                                            mounted && mode === 'system'
                                                ? "border-teal-500/50 bg-teal-500/10 text-teal-500 shadow-sm scale-[1.02]"
                                                : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                        )}
                                    >
                                        <Monitor className="h-5 w-5" />
                                        <span>System Sync</span>
                                    </button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Predefined Themes */}
                        <Card className="bg-card shadow-sm border-border/60 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                    <Sparkles className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                                    Predefined Theme Palettes ({predefinedThemes.length})
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Select a curated design theme preset.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {predefinedThemes.map((t) => {
                                        const isSelected = currentTheme.name === t.name
                                        return (
                                            <button
                                                key={t.name}
                                                onClick={() => setTheme(t)}
                                                className={cn(
                                                    "p-3 rounded-xl border text-left flex flex-col justify-between h-24 transition-all",
                                                    isSelected
                                                        ? "border-indigo-500 bg-indigo-500/10 shadow-sm scale-[1.02]"
                                                        : "border-border/60 bg-muted/20 hover:bg-muted/40"
                                                )}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="text-xs font-bold text-foreground truncate">{t.name}</span>
                                                    {isSelected && <Check className="h-3.5 w-3.5 text-indigo-500 shrink-0" />}
                                                </div>
                                                <div className="flex gap-1.5 mt-2">
                                                    <span className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: t.background }} />
                                                    <span className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: t.primary }} />
                                                    <span className="w-6 h-4 rounded border border-black/10 shrink-0" style={{ backgroundImage: `linear-gradient(to right, ${t.btnGradientStart}, ${t.btnGradientEnd})` }} />
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Appearance Customizer */}
                        <Card className="bg-card shadow-sm border-border/60 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                    <Sliders className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                                    Custom Appearance Designer
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Customize background colors, gradients, and border radius tokens.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex border-b border-border/40 gap-1 pb-px">
                                    <button
                                        type="button"
                                        onClick={() => setDesignerMode('light')}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-2.5 border-b-2 font-bold text-xs transition-all",
                                            designerMode === 'light'
                                                ? "border-amber-500 text-amber-500"
                                                : "border-transparent text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Sun className="h-4 w-4 text-amber-500" /> Light Palette
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDesignerMode('dark')}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-2.5 border-b-2 font-bold text-xs transition-all",
                                            designerMode === 'dark'
                                                ? "border-indigo-500 text-indigo-500"
                                                : "border-transparent text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Moon className="h-4 w-4 text-indigo-500" /> Dark Palette
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Background Color</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={activeConfig.background}
                                                onChange={(e) => handleThemeColorChange('background', e.target.value)}
                                                className="w-10 h-10 border rounded-xl cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={activeConfig.background}
                                                onChange={(e) => handleThemeColorChange('background', e.target.value)}
                                                className="flex-1 px-3 py-2 border rounded-xl text-xs font-mono bg-background"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Card Background</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={activeConfig.card}
                                                onChange={(e) => handleThemeColorChange('card', e.target.value)}
                                                className="w-10 h-10 border rounded-xl cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={activeConfig.card}
                                                onChange={(e) => handleThemeColorChange('card', e.target.value)}
                                                className="flex-1 px-3 py-2 border rounded-xl text-xs font-mono bg-background"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Primary Accent Color</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={activeConfig.primary}
                                                onChange={(e) => handleThemeColorChange('primary', e.target.value)}
                                                className="w-10 h-10 border rounded-xl cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={activeConfig.primary}
                                                onChange={(e) => handleThemeColorChange('primary', e.target.value)}
                                                className="flex-1 px-3 py-2 border rounded-xl text-xs font-mono bg-background"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Gradients Customizer */}
                                <div className="border-t border-border/40 pt-6 space-y-4">
                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Gradient Customizer</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {/* Button Gradient */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase">Primary Button Gradient</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={activeConfig.btnGradientStart}
                                                    onChange={(e) => handleThemeColorChange('btnGradientStart', e.target.value)}
                                                    className="w-8 h-8 border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="color"
                                                    value={activeConfig.btnGradientEnd}
                                                    onChange={(e) => handleThemeColorChange('btnGradientEnd', e.target.value)}
                                                    className="w-8 h-8 border rounded-lg cursor-pointer"
                                                />
                                                <div
                                                    className="flex-1 h-9 rounded-xl border border-black/10 flex items-center justify-center text-[10px] text-white font-bold shadow-xs"
                                                    style={{ backgroundImage: `linear-gradient(to right, ${activeConfig.btnGradientStart}, ${activeConfig.btnGradientEnd})` }}
                                                >
                                                    Button Preview
                                                </div>
                                            </div>
                                        </div>

                                        {/* Text Gradient */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase">Heading Text Gradient</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={activeConfig.textGradientStart}
                                                    onChange={(e) => handleThemeColorChange('textGradientStart', e.target.value)}
                                                    className="w-8 h-8 border rounded-lg cursor-pointer"
                                                />
                                                <input
                                                    type="color"
                                                    value={activeConfig.textGradientEnd}
                                                    onChange={(e) => handleThemeColorChange('textGradientEnd', e.target.value)}
                                                    className="w-8 h-8 border rounded-lg cursor-pointer"
                                                />
                                                <div className="flex-1 h-9 flex items-center justify-center font-black text-xs">
                                                    <span
                                                        style={{ backgroundImage: `linear-gradient(to right, ${activeConfig.textGradientStart}, ${activeConfig.textGradientEnd})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                                                    >
                                                        Text Gradient Preview
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Corner Roundness Settings */}
                                <div className="border-t border-border/40 pt-6 space-y-4">
                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Corner Radius Tokens</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                        {[
                                            { name: 'Sharp', val: '0rem' },
                                            { name: 'Sleek', val: '0.25rem' },
                                            { name: 'Default', val: '0.5rem' },
                                            { name: 'Bubbled', val: '0.75rem' },
                                            { name: 'Round', val: '1.0rem' }
                                        ].map((r) => {
                                            const isSelected = (currentTheme.radius || '0.5rem') === r.val
                                            return (
                                                <button
                                                    type="button"
                                                    key={r.val}
                                                    onClick={() => updateThemeColor('radius', r.val)}
                                                    className={cn(
                                                        "py-2.5 px-3 text-xs font-bold rounded-xl border transition-all",
                                                        isSelected
                                                            ? "border-indigo-500 bg-indigo-500/10 text-indigo-500 shadow-xs"
                                                            : "border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground"
                                                    )}
                                                    style={{ borderRadius: r.val }}
                                                >
                                                    {r.name} ({r.val})
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 border-t border-border/40 pt-4">
                                    <Button variant="outline" onClick={resetTheme} className="flex items-center gap-2 rounded-xl text-xs font-bold">
                                        <RefreshCw className="h-4 w-4" /> Reset Default Theme
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Dashboard & Portfolio Preferences Card */}
                        <Card className="bg-card shadow-sm border-border/60 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                    <Sliders className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                                    Dashboard & Portfolio Preferences
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Configure widget visibility and empty portfolio onboarding banners.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/60 gap-4">
                                    <div>
                                        <h4 className="text-xs font-extrabold text-foreground">Empty Portfolio Onboarding Banner</h4>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">Show "Build & Track Your Investment Portfolio" banner on dashboard when portfolio has 0 active assets.</p>
                                    </div>
                                    <Button
                                        variant={portfolioBannerEnabled ? "default" : "outline"}
                                        onClick={() => {
                                            const nextState = !portfolioBannerEnabled
                                            setPortfolioBannerEnabled(nextState)
                                            if (typeof window !== 'undefined') {
                                                localStorage.setItem('hide-empty-portfolio-banner', (!nextState).toString())
                                            }
                                        }}
                                        className={cn("rounded-xl text-xs font-bold shrink-0", portfolioBannerEnabled ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "border-border")}
                                    >
                                        {portfolioBannerEnabled ? 'Banner Enabled' : 'Banner Hidden'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* TAB 2: CURRENCIES */}
                {activeTab === 'currency' && (
                    <Card className="bg-card shadow-sm border-border/60 rounded-2xl animate-in fade-in duration-300">
                        <CardHeader>
                            <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                <Coins className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                                Currency Settings & Exchange Rates
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Choose active currency. Exchange rates update automatically every 24 hours.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {(['INR', 'USD', 'CAD', 'EUR'] as CurrencyType[]).map((cur) => {
                                    const isSelected = currency === cur
                                    const labels = {
                                        INR: 'Indian Rupee (₹)',
                                        USD: 'US Dollar ($)',
                                        CAD: 'Canadian Dollar (CA$)',
                                        EUR: 'Euro (€)'
                                    }
                                    return (
                                        <button
                                            key={cur}
                                            onClick={() => setCurrency(cur)}
                                            className={cn(
                                                "p-4 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all",
                                                isSelected
                                                    ? "border-amber-500 bg-amber-500/10 shadow-sm scale-[1.02]"
                                                    : "border-border/60 bg-muted/20 hover:bg-muted/40"
                                            )}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span className="text-2xl font-black">{cur === 'INR' ? '₹' : cur === 'USD' ? '$' : cur === 'CAD' ? 'CA$' : '€'}</span>
                                                {isSelected && <Check className="h-4 w-4 text-amber-500" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground capitalize mt-2">{labels[cur]}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Active display format</p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="p-4 bg-muted/30 border border-border/40 rounded-2xl space-y-2">
                                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-amber-500" /> Currency Conversion Preview
                                </h4>
                                <div className="grid grid-cols-2 gap-4 max-w-md bg-background p-3 rounded-xl border text-xs font-mono">
                                    <div>
                                        <span className="text-muted-foreground block text-[10px]">Stored Base Value (INR)</span>
                                        <span className="font-bold text-foreground">₹12,000.00</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-[10px]">Converted ({currency})</span>
                                        <span className="font-bold text-emerald-500">{format(12000)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* TAB 3: DATA MANAGEMENT */}
                {activeTab === 'data' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Quick Access Action Hub */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Card 1: Import Data */}
                            <Card className="bg-card border-border/60 shadow-sm hover:border-indigo-500/40 transition-all rounded-2xl">
                                <CardHeader className="pb-2">
                                    <div className="p-2.5 w-fit rounded-xl bg-indigo-500/10 text-indigo-500 mb-2">
                                        <UploadIcon className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-base font-extrabold text-foreground">Import Data</CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground">
                                        Bulk upload expense statements, trade orders, dividends, bank accounts, or master assets.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    <Link href="/upload">
                                        <Button className="w-full rounded-xl text-xs font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
                                            <UploadIcon className="h-4 w-4" /> Open Import Center
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            {/* Card 2: Export Data */}
                            <Card className="bg-card border-border/60 shadow-sm hover:border-teal-500/40 transition-all rounded-2xl">
                                <CardHeader className="pb-2">
                                    <div className="p-2.5 w-fit rounded-xl bg-teal-500/10 text-teal-500 mb-2">
                                        <Download className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-base font-extrabold text-foreground">Export Statements</CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground">
                                        Generate executive PDF statements or download 1-click raw CSV ledgers for any table.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    <Link href="/export">
                                        <Button className="w-full rounded-xl text-xs font-bold gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-xs">
                                            <Download className="h-4 w-4" /> Open Export Center
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            {/* Card 3: Full JSON Backup */}
                            <Card className="bg-card border-border/60 shadow-sm hover:border-purple-500/40 transition-all rounded-2xl">
                                <CardHeader className="pb-2">
                                    <div className="p-2.5 w-fit rounded-xl bg-purple-500/10 text-purple-500 mb-2">
                                        <Database className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-base font-extrabold text-foreground">Database JSON Backup</CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground">
                                        Download a complete system database snapshot containing all transactions, assets, and settings.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    <Button
                                        onClick={async () => {
                                            try {
                                                const response = await api.get('/export/backup', { responseType: 'blob' })
                                                const blobData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)
                                                const blob = new Blob([blobData], { type: 'application/json' })
                                                const url = window.URL.createObjectURL(blob)
                                                const a = document.createElement('a')
                                                a.href = url
                                                a.download = `expense_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`
                                                document.body.appendChild(a)
                                                a.click()
                                                window.URL.revokeObjectURL(url)
                                                document.body.removeChild(a)
                                            } catch (err) {
                                                console.error('Backup download error:', err)
                                                alert('Failed to download JSON backup. Please check server connection.')
                                            }
                                        }}
                                        className="w-full rounded-xl text-xs font-bold gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs"
                                    >
                                        <Database className="h-4 w-4" /> Download JSON Backup
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Database Reset Danger Zone */}
                        <Card className="bg-destructive/5 dark:bg-destructive/10 border-destructive/20 shadow-sm rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-base font-extrabold text-destructive flex items-center gap-2">
                                    <AlertOctagon className="h-5 w-5 shrink-0" />
                                    Danger Zone: Clear Database
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Permanently wipe all logged transactions and monthly summaries from the database. This operation is irreversible.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {showResetConfirmation ? (
                                    <form onSubmit={handleClearAllData} className="space-y-3 max-w-md bg-destructive/10 p-4 border border-destructive/20 rounded-2xl">
                                        <p className="text-xs text-destructive font-bold flex items-center gap-1.5">
                                            <AlertTriangle className="h-4 w-4 shrink-0" /> Confirm with Delete Password:
                                        </p>
                                        <input
                                            type="password"
                                            placeholder="Enter delete password"
                                            value={resetPassword}
                                            onChange={(e) => setResetPassword(e.target.value)}
                                            className="border border-destructive/30 rounded-xl px-3 py-2 bg-background text-foreground text-xs w-full focus:outline-none focus:ring-2 focus:ring-destructive/30"
                                            required
                                        />
                                        {resetError && (
                                            <p className="text-xs text-rose-500 font-semibold">{resetError}</p>
                                        )}
                                        <div className="flex gap-2">
                                            <Button
                                                type="submit"
                                                disabled={resettingDb}
                                                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
                                            >
                                                {resettingDb ? 'Wiping Database...' : 'Confirm Permanent Wipe'}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setShowResetConfirmation(false)
                                                    setResetPassword('')
                                                    setResetError('')
                                                }}
                                                className="text-xs rounded-xl"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <Button
                                        variant="destructive"
                                        onClick={() => setShowResetConfirmation(true)}
                                        className="text-xs font-bold flex items-center gap-1.5 rounded-xl"
                                    >
                                        <Trash2 className="h-4 w-4" /> Reset Database & Transactions
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* TAB 4: CATEGORY SETTINGS */}
                {activeTab === 'categories' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Predefined Category Color Palettes */}
                        <Card className="bg-card shadow-sm border-border/60 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                    <Sparkles className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                                    Predefined Category Color Palettes ({predefinedCategoryPalettes.length})
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Apply a curated color scheme across all expense and income categories.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    {predefinedCategoryPalettes.map((palette) => (
                                        <div
                                            key={palette.name}
                                            className="p-4 rounded-2xl border border-border/60 bg-muted/20 flex flex-col justify-between space-y-3"
                                        >
                                            <div>
                                                <h4 className="text-xs font-bold text-foreground">{palette.name}</h4>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {Object.values(palette.colors).slice(0, 8).map((c, i) => (
                                                        <span key={i} className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: c }} />
                                                    ))}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setCategoryColors(palette.colors)}
                                                className="w-full text-[11px] font-bold rounded-xl h-8"
                                            >
                                                Apply Palette
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Register Custom Category Form */}
                        <Card className="bg-card shadow-sm border-border/60 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                    <Plus className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                                    Register Custom Category
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Add new custom expense categories with dedicated colors and auto-detector keywords.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAddCategorySubmit} className="space-y-4 max-w-xl">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground">Category Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Subscriptions"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-border/60 bg-muted/20 text-xs font-semibold"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground">Color Badge</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={newCategoryColor}
                                                    onChange={(e) => setNewCategoryColor(e.target.value)}
                                                    className="w-9 h-9 rounded-xl border cursor-pointer shrink-0"
                                                />
                                                <input
                                                    type="text"
                                                    value={newCategoryColor}
                                                    onChange={(e) => setNewCategoryColor(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border border-border/60 bg-muted/20 text-xs font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground">Auto-Detector Keywords (Comma Separated)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. netflix, spotify, youtube, hotstar"
                                            value={newCategoryKeywords}
                                            onChange={(e) => setNewCategoryKeywords(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-border/60 bg-muted/20 text-xs font-semibold"
                                        />
                                    </div>

                                    {catFormError && (
                                        <p className="text-xs text-rose-500 font-bold">{catFormError}</p>
                                    )}
                                    {catFormSuccess && (
                                        <p className="text-xs text-emerald-500 font-bold">{catFormSuccess}</p>
                                    )}

                                    <Button type="submit" className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                                        <Plus className="h-4 w-4" /> Save Category
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Existing Registered Categories & Auto-Detector Editor */}
                        <Card className="bg-card shadow-sm border-border/60 rounded-2xl">
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                        <Tag className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                                        Active Registered Categories ({Object.keys(categoryColors).length})
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-0.5">
                                        Edit category colors, keywords, or reset to factory defaults.
                                    </CardDescription>
                                </div>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={resetCategorySettings}
                                    className="text-[11px] font-bold rounded-xl gap-1.5"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" /> Reset Defaults
                                </Button>
                            </CardHeader>

                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(categoryColors).map(([catName, color]) => (
                                        <div
                                            key={catName}
                                            className="p-4 rounded-2xl border border-border/60 bg-muted/20 space-y-3"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <input
                                                        type="color"
                                                        value={color}
                                                        onChange={(e) => updateCategoryColor(catName, e.target.value)}
                                                        className="w-6 h-6 rounded-full border border-black/10 cursor-pointer shrink-0"
                                                        title="Click to edit category color"
                                                    />
                                                    <span className="text-xs font-extrabold text-foreground truncate capitalize">{catName}</span>
                                                </div>

                                                <button
                                                    onClick={() => deleteCustomCategory(catName)}
                                                    className="text-muted-foreground hover:text-rose-500 transition-colors p-1"
                                                    title="Delete Custom Category"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase text-muted-foreground">Auto-Detector Keywords</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={editingKeywords[catName] !== undefined ? editingKeywords[catName] : (categoryKeywords[catName] || []).join(', ')}
                                                        onChange={(e) => setEditingKeywords({ ...editingKeywords, [catName]: e.target.value })}
                                                        placeholder="comma, separated, keywords"
                                                        className="flex-1 px-3 py-1.5 rounded-xl border border-border/60 bg-background text-[11px] font-mono"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleSaveCategoryKeywords(catName)}
                                                        className="h-8 px-2.5 text-indigo-500 hover:bg-indigo-500/10 font-bold text-[11px] rounded-lg"
                                                    >
                                                        <Save className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
