'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useThemeCustomizer, predefinedThemes, CustomTheme, predefinedCategoryPalettes } from '@/components/theme-customizer-provider'
import { useCurrency, CurrencyType } from '@/hooks/use-currency'
import { FileUpload } from '@/components/upload/file-upload'
import { api } from '@/services/api'
import { BottomSelect } from '@/components/ui/bottom-select'
import { useTheme } from 'next-themes'
import { getLocalMonth } from '@/lib/utils'
import { useAccount } from '@/components/account-context'
import { MonthPicker } from '@/components/ui/month-picker'
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
    Calendar, 
    Filter, 
    Loader2, 
    Eye,
    Sun,
    Moon,
    Monitor,
    AlertOctagon,
    AlertTriangle,
    Trash2,
    Tag,
    Plus
} from 'lucide-react'

// PDF generation interfaces
interface Transaction {
    _id: string
    day: number
    amount: number
    reason: string
    category: string
    month: string
}

interface AnalyticsData {
    month: string
    totalExpense: number
    totalDays: number
    averageDailyExpense: number
    highestExpenseDay: number
    categoryBreakdown: Record<string, number>
    insights: string[]
    totalEntries?: number
    weekdayWeekend?: {
        weekdayTotal: number;
        weekendTotal: number;
        weekdayCount: number;
        weekendCount: number;
        weekdayAverage: number;
        weekendAverage: number;
    }
    weeklySpend?: Array<{ name: string; amount: number }>
    transactionSizes?: { low: number; medium: number; high: number }
}

export default function SettingsPage() {
    const { theme: mode, setTheme: setMode } = useTheme()
    const { selectedAccount } = useAccount()
    const [activeTab, setActiveTab] = useState<'appearance' | 'currency' | 'data' | 'categories'>('appearance')
    const [designerMode, setDesignerMode] = useState<'light' | 'dark'>('light')
    
    // Add Category Form States
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryColor, setNewCategoryColor] = useState('#6366f1')
    const [newCategoryKeywords, setNewCategoryKeywords] = useState('')
    const [catFormError, setCatFormError] = useState('')
    const [catFormSuccess, setCatFormSuccess] = useState('')

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
    const { currency, setCurrency, format, symbol: currencySymbol } = useCurrency()

    // Data Management state
    const [uploadStatus, setUploadStatus] = useState<string>('')
    const [uploadMonth, setUploadMonth] = useState(getLocalMonth())
    const [showResetConfirmation, setShowResetConfirmation] = useState(false)
    const [resetPassword, setResetPassword] = useState('')
    const [resettingDb, setResettingDb] = useState(false)
    const [resetError, setResetError] = useState('')

    const handleClearAllData = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!resetPassword.trim()) return

        try {
            setResettingDb(true)
            setResetError('')
            await api.delete('/expenses', {
                headers: { 'x-delete-password': resetPassword }
            })
            setUploadStatus('Database successfully reset. All transactions and summaries deleted.')
            setShowResetConfirmation(false)
            setResetPassword('')
            setTransactions([])
            setAnalytics(null)
            window.dispatchEvent(new CustomEvent('expense-added'))
        } catch (err: any) {
            setResetError(err.response?.data?.error || 'Failed to wipe database. Invalid password.')
        } finally {
            setResettingDb(false)
        }
    }
    
    // Export state
    const [exportMonth, setExportMonth] = useState(getLocalMonth())
    const [exportCategory, setExportCategory] = useState('all')
    const [categories, setCategories] = useState<string[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loadingExportData, setLoadingExportData] = useState(false)
    const [exportingPdf, setExportingPdf] = useState(false)
    const [exportError, setExportError] = useState('')
    const [showPreview, setShowPreview] = useState(false)
    
    const reportRef = useRef<HTMLDivElement>(null)

    // Load Export Categories & Transactions for PDF Generation
    const loadExportData = async () => {
        try {
            setLoadingExportData(true)
            setExportError('')
            
            // Get category list first
            const categoriesRes = await api.get(`/categories/active?month=${exportMonth}`)
            setCategories(categoriesRes.data)
            
            // Fetch matching expenses
            const params = new URLSearchParams({
                page: '1',
                limit: '1000',
                month: exportMonth,
                ...(exportCategory !== 'all' && { category: exportCategory })
            })
            
            const [expensesRes, analyticsRes] = await Promise.all([
                api.get(`/expenses?${params}`),
                api.get(`/analytics?month=${exportMonth}`)
            ])
            
            setTransactions(expensesRes.data.expenses || [])
            setAnalytics(analyticsRes.data)
        } catch (err: any) {
            setExportError('Failed to fetch export preview data.')
            console.error(err)
        } finally {
            setLoadingExportData(false)
        }
    }

    useEffect(() => {
        if (activeTab === 'data') {
            loadExportData()
        }
    }, [exportMonth, exportCategory, activeTab, selectedAccount?._id])

    // Reset status fields when the active account switches
    useEffect(() => {
        setCatFormError('')
        setCatFormSuccess('')
        setUploadStatus('')
        setResetError('')
    }, [selectedAccount?._id])

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return
        
        try {
            setExportingPdf(true)
            
            const { jsPDF } = await import('jspdf')
            const html2canvas = (await import('html2canvas')).default
            
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pages = reportRef.current.querySelectorAll('.pdf-page')
            
            for (let index = 0; index < pages.length; index++) {
                const pageEl = pages[index] as HTMLElement
                
                const canvas = await html2canvas(pageEl, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false
                })
                
                const imgData = canvas.toDataURL('image/jpeg', 0.95)
                const imgWidth = 210
                const imgHeight = 297
                
                if (index > 0) {
                    pdf.addPage()
                }
                
                pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight)
            }
            
            pdf.save(`Expense_Report_${exportMonth}_${exportCategory}.pdf`)
        } catch (err) {
            console.error('PDF export error:', err)
            alert('Failed to generate PDF statement.')
        } finally {
            setExportingPdf(false)
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

    // Partition transactions for PDF layout (max 15 per page)
    const chunkedTransactions = useMemo(() => {
        const chunks = []
        if (transactions && transactions.length > 0) {
            for (let i = 0; i < transactions.length; i += 15) {
                chunks.push(transactions.slice(i, i + 15))
            }
        }
        return chunks
    }, [transactions])

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="pb-4 border-b border-border/40">
                <h1 className="text-3xl font-bold text-custom-gradient">Settings</h1>
                <p className="text-sm text-muted-foreground mt-1 font-medium">Configure currencies, custom backgrounds, gradients, themes, and manage statement imports/exports.</p>
            </div>

            {/* Tab Row Navigation */}
            <div className="flex border-b border-border/40 gap-1 overflow-x-auto pb-px">
                <button
                    type="button"
                    onClick={() => setActiveTab('appearance')}
                    className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
                        activeTab === 'appearance'
                            ? 'border-primary text-primary font-bold bg-accent/30'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10'
                    }`}
                >
                    <Palette className="h-4 w-4" /> Appearance & Theme
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('currency')}
                    className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
                        activeTab === 'currency'
                            ? 'border-primary text-primary font-bold bg-accent/30'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10'
                    }`}
                >
                    <Coins className="h-4 w-4" /> Currencies
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('data')}
                    className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
                        activeTab === 'data'
                            ? 'border-primary text-primary font-bold bg-accent/30'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10'
                    }`}
                >
                    <Database className="h-4 w-4" /> Data Management
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('categories')}
                    className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
                        activeTab === 'categories'
                            ? 'border-primary text-primary font-bold bg-accent/30'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10'
                    }`}
                >
                    <Tag className="h-4 w-4" /> Category Settings
                </button>
            </div>

            {/* Main Content Area */}
            <div className="space-y-6">
                {/* TAB 1: APPEARANCE & CUSTOM THEME */}
                {activeTab === 'appearance' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Theme Mode Selector */}
                        <Card className="bg-card/50 backdrop-blur border-border/80 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Sun className="h-5 w-5 text-custom-gradient shrink-0" />
                                    Interface Theme Mode
                                </CardTitle>
                                <CardDescription>Select whether to display the app in Light or Dark mode. Custom colors auto-adapt accordingly.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setMode('light')}
                                        className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                                            mode === 'light'
                                                ? 'border-foreground bg-accent shadow-sm scale-[1.02]'
                                                : 'border-border/80 bg-background/55 hover:bg-muted/50 text-muted-foreground'
                                        }`}
                                    >
                                        <Sun className="h-5 w-5 text-amber-500" />
                                        <span className="text-xs font-bold">Light Mode</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode('dark')}
                                        className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                                            mode === 'dark'
                                                ? 'border-foreground bg-accent shadow-sm scale-[1.02]'
                                                : 'border-border/80 bg-background/55 hover:bg-muted/50 text-muted-foreground'
                                        }`}
                                    >
                                        <Moon className="h-5 w-5 text-indigo-500" />
                                        <span className="text-xs font-bold">Dark Mode</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode('system')}
                                        className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                                            mode === 'system'
                                                ? 'border-foreground bg-accent shadow-sm scale-[1.02]'
                                                : 'border-border/80 bg-background/55 hover:bg-muted/50 text-muted-foreground'
                                        }`}
                                    >
                                        <Monitor className="h-5 w-5 text-teal-500" />
                                        <span className="text-xs font-bold">System Sync</span>
                                    </button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Predefined Themes */}
                        <Card className="bg-card/50 backdrop-blur border-border/80 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-custom-gradient shrink-0" />
                                    Predefined Theme Palettes
                                </CardTitle>
                                <CardDescription>Select one of our curated design templates as your base.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {predefinedThemes.map((t) => {
                                        const isSelected = currentTheme.name === t.name;
                                        return (
                                            <button
                                                key={t.name}
                                                onClick={() => setTheme(t)}
                                                className={`p-3 rounded-xl border text-left flex flex-col justify-between h-24 transition-all duration-300 ${
                                                    isSelected
                                                        ? 'border-foreground bg-accent shadow-sm scale-[1.02]'
                                                        : 'border-border/80 bg-background/55 hover:bg-muted/50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="text-xs font-bold text-foreground">{t.name}</span>
                                                    {isSelected && <Check className="h-3 w-3 text-foreground" />}
                                                </div>
                                                <div className="flex gap-1.5 mt-2">
                                                    <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: t.background }} title="Background" />
                                                    <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: t.primary }} title="Primary" />
                                                    <span className="w-6 h-4 rounded border border-black/10" style={{ backgroundImage: `linear-gradient(to right, ${t.btnGradientStart}, ${t.btnGradientEnd})` }} title="Gradient" />
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Appearance Customizer */}
                        <Card className="bg-card/50 backdrop-blur border-border/80 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Palette className="h-5 w-5 text-custom-gradient shrink-0" />
                                    Custom Appearance Designer
                                </CardTitle>
                                <CardDescription>Customize colors and gradients as you wish. These choices auto-generate custom dark themes when toggled.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Tab switch for Light vs Dark design settings */}
                                <div className="flex border-b border-border/40 gap-1 pb-px">
                                    <button
                                        type="button"
                                        onClick={() => setDesignerMode('light')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 border-b-2 font-semibold text-xs transition-all duration-200 ${
                                            designerMode === 'light'
                                                ? 'border-primary text-primary font-bold bg-accent/30'
                                                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10'
                                        }`}
                                    >
                                        <Sun className="h-4 w-4 text-amber-500" /> Light Theme Customizer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDesignerMode('dark')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 border-b-2 font-semibold text-xs transition-all duration-200 ${
                                            designerMode === 'dark'
                                                ? 'border-primary text-primary font-bold bg-accent/30'
                                                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10'
                                        }`}
                                    >
                                        <Moon className="h-4 w-4 text-indigo-500" /> Dark Theme Customizer
                                    </button>
                                </div>

                                {/* Color Pickers Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Background Color</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={activeConfig.background}
                                                onChange={(e) => handleThemeColorChange('background', e.target.value)}
                                                className="w-10 h-10 border rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={activeConfig.background}
                                                onChange={(e) => handleThemeColorChange('background', e.target.value)}
                                                className="flex-1 px-3 py-2 border rounded-md text-xs font-mono bg-background"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Card Background</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={activeConfig.card}
                                                onChange={(e) => handleThemeColorChange('card', e.target.value)}
                                                className="w-10 h-10 border rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={activeConfig.card}
                                                onChange={(e) => handleThemeColorChange('card', e.target.value)}
                                                className="flex-1 px-3 py-2 border rounded-md text-xs font-mono bg-background"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Primary / Border Accent</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={activeConfig.primary}
                                                onChange={(e) => handleThemeColorChange('primary', e.target.value)}
                                                className="w-10 h-10 border rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={activeConfig.primary}
                                                onChange={(e) => handleThemeColorChange('primary', e.target.value)}
                                                className="flex-1 px-3 py-2 border rounded-md text-xs font-mono bg-background"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Border Outline Color</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="color"
                                                value={activeConfig.border}
                                                onChange={(e) => handleThemeColorChange('border', e.target.value)}
                                                className="w-10 h-10 border rounded cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={activeConfig.border}
                                                onChange={(e) => handleThemeColorChange('border', e.target.value)}
                                                className="flex-1 px-3 py-2 border rounded-md text-xs font-mono bg-background"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Gradients Customizer */}
                                <div className="border-t border-border/40 pt-6 space-y-4">
                                    <h3 className="text-sm font-bold text-foreground">Gradient Settings</h3>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {/* Button Gradient */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Primary Button Gradient</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={activeConfig.btnGradientStart}
                                                    onChange={(e) => handleThemeColorChange('btnGradientStart', e.target.value)}
                                                    className="w-8 h-8 border rounded cursor-pointer"
                                                    title="Gradient Start"
                                                />
                                                <input
                                                    type="color"
                                                    value={activeConfig.btnGradientEnd}
                                                    onChange={(e) => handleThemeColorChange('btnGradientEnd', e.target.value)}
                                                    className="w-8 h-8 border rounded cursor-pointer"
                                                    title="Gradient End"
                                                />
                                                <div 
                                                    className="flex-1 h-8 rounded-md border border-black/10 flex items-center justify-center text-[10px] text-white font-bold"
                                                    style={{ backgroundImage: `linear-gradient(to right, ${activeConfig.btnGradientStart}, ${activeConfig.btnGradientEnd})` }}
                                                >
                                                    Button Preview
                                                </div>
                                            </div>
                                        </div>

                                        {/* Text Gradient */}
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Heading Text Gradient</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={activeConfig.textGradientStart}
                                                    onChange={(e) => handleThemeColorChange('textGradientStart', e.target.value)}
                                                    className="w-8 h-8 border rounded cursor-pointer"
                                                    title="Gradient Start"
                                                />
                                                <input
                                                    type="color"
                                                    value={activeConfig.textGradientEnd}
                                                    onChange={(e) => handleThemeColorChange('textGradientEnd', e.target.value)}
                                                    className="w-8 h-8 border rounded cursor-pointer"
                                                    title="Gradient End"
                                                />
                                                <div className="flex-1 h-8 flex items-center justify-center font-black text-xs">
                                                    <span 
                                                        style={{ backgroundImage: `linear-gradient(to right, ${activeConfig.textGradientStart}, ${activeConfig.textGradientEnd})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                                                    >
                                                        Text Preview
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Corner Roundness Settings */}
                                <div className="border-t border-border/40 pt-6 space-y-4">
                                    <h3 className="text-sm font-bold text-foreground">Corner Roundness</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                        {[
                                            { name: 'Sharp', val: '0rem' },
                                            { name: 'Sleek', val: '0.25rem' },
                                            { name: 'Default', val: '0.5rem' },
                                            { name: 'Bubbled', val: '0.75rem' },
                                            { name: 'Round', val: '1.0rem' }
                                        ].map((r) => {
                                            const isSelected = (currentTheme.radius || '0.5rem') === r.val;
                                            return (
                                                <button
                                                    type="button"
                                                    key={r.val}
                                                    onClick={() => updateThemeColor('radius', r.val)}
                                                    className={`py-2.5 px-3 text-xs font-medium rounded border transition-all duration-300 ${
                                                        isSelected
                                                            ? 'border-foreground bg-accent font-bold scale-[1.02] shadow-sm'
                                                            : 'border-border/80 bg-background/55 hover:bg-muted/50 text-muted-foreground'
                                                    }`}
                                                    style={{ borderRadius: r.val }}
                                                >
                                                    {r.name} ({r.val})
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3 border-t border-border/40 pt-4">
                                    <Button variant="outline" onClick={resetTheme} className="flex items-center gap-2">
                                        <RefreshCw className="h-4 w-4" /> Reset Default
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* TAB 2: CURRENCIES */}
                {activeTab === 'currency' && (
                    <Card className="bg-card/50 backdrop-blur border-border/80 shadow-md animate-in fade-in duration-300">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Coins className="h-5 w-5 text-custom-gradient shrink-0" />
                                Currency Settings & Exchange Conversions
                            </CardTitle>
                            <CardDescription>Configure display currency. All existing summaries and charts will convert automatically dynamically.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {(['INR', 'USD', 'CAD', 'EUR'] as CurrencyType[]).map((cur) => {
                                    const isSelected = currency === cur;
                                    const labels = {
                                        INR: 'Indian Rupee (₹)',
                                        USD: 'American Dollar ($)',
                                        CAD: 'Canadian Dollar (CA$)',
                                        EUR: 'Euro (€)'
                                    }
                                    return (
                                        <button
                                            key={cur}
                                            onClick={() => setCurrency(cur)}
                                            className={`p-4 rounded-xl border text-left flex flex-col justify-between h-28 transition-all duration-300 ${
                                                isSelected
                                                    ? 'border-foreground bg-accent shadow-sm scale-[1.02]'
                                                    : 'border-border/80 bg-background/55 hover:bg-muted/50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span className="text-2xl font-black">{cur === 'INR' ? '₹' : cur === 'USD' ? '$' : cur === 'CAD' ? 'CA$' : '€'}</span>
                                                {isSelected && <Check className="h-4 w-4 text-foreground" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground capitalize mt-2">{labels[cur]}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Locale format active</p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>

                            <div className="p-4 bg-muted/60 border border-border/80 rounded-xl space-y-3">
                                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-custom-gradient shrink-0" /> Conversion Example Demonstration
                                </h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    The application uses fixed conversion ratios to keep performance optimal and data consistent. When you change currency settings, all transactions stored in <strong>Indian Rupees (INR)</strong> convert in real time.
                                </p>
                                <div className="grid grid-cols-2 gap-4 mt-2 max-w-md bg-background/60 p-3 rounded-lg border text-xs font-mono">
                                    <div>
                                        <span className="text-muted-foreground block text-[10px]">Original Expense (INR)</span>
                                        <span className="font-bold text-foreground">₹12,000.00</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-[10px]">Converted display ({currency})</span>
                                        <span className="font-bold text-teal-600 dark:text-teal-400">{format(12000)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* TAB 3: DATA MANAGEMENT (IMPORT & EXPORT) */}
                {activeTab === 'data' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Upload Section */}
                        <Card className="bg-card/50 backdrop-blur border-border/80 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <UploadIcon className="h-5 w-5 text-custom-gradient shrink-0" />
                                    Upload Statement
                                </CardTitle>
                                <CardDescription>Upload CSV or Excel statements to import transactions and update database summaries.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40 mb-2">
                                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4" /> Statement Month:
                                    </span>
                                    <div className="w-40 shrink-0">
                                        <MonthPicker
                                            value={uploadMonth}
                                            onChange={setUploadMonth}
                                            placeholder="Select Month"
                                        />
                                    </div>
                                </div>
                                <FileUpload onUploadStatus={setUploadStatus} month={uploadMonth} />
                                {uploadStatus && (
                                    <div className="mt-4 p-3 bg-muted rounded-md text-xs font-mono border">
                                        {uploadStatus}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Export Section */}
                        <Card className="bg-card/50 backdrop-blur border-border/80 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Download className="h-5 w-5 text-custom-gradient shrink-0" />
                                    Export PDF Statement
                                </CardTitle>
                                <CardDescription>Configure filters and export dynamic statements with security watermarks.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                                            <Calendar className="h-3.5 w-3.5 text-teal-500" /> Statement Period
                                        </label>
                                        <MonthPicker
                                            value={exportMonth}
                                            onChange={setExportMonth}
                                            placeholder="Select Month"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                                            <Filter className="h-3.5 w-3.5 text-teal-500" /> Category Filter
                                        </label>
                                        <BottomSelect
                                            value={exportCategory}
                                            onChange={(val) => setExportCategory(val)}
                                            options={[
                                                { value: 'all', label: 'All Categories' },
                                                ...categories.map((cat) => ({
                                                    value: cat,
                                                    label: cat,
                                                    color: categoryColors[cat] || undefined
                                                }))
                                            ]}
                                            label="Select Category"
                                            className="w-full"
                                            triggerClassName="w-full border rounded-md px-3 py-2 bg-background/50 border-border/80 text-foreground capitalize focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-xs h-10"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center border-t border-border/40 pt-4 gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowPreview(!showPreview)}
                                        disabled={loadingExportData || transactions.length === 0}
                                        className="flex items-center gap-2 text-xs font-bold"
                                    >
                                        <Eye className="h-4 w-4" /> {showPreview ? 'Hide Print Preview' : 'Show Print Preview'}
                                    </Button>

                                    <Button
                                        onClick={handleDownloadPDF}
                                        disabled={loadingExportData || exportingPdf || transactions.length === 0}
                                        className="bg-custom-btn-gradient text-white font-bold text-xs"
                                    >
                                        {exportingPdf ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                                Generating Report...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="h-4 w-4 mr-1" />
                                                Export PDF Statement
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {loadingExportData && (
                                    <div className="flex items-center justify-center py-6 text-xs text-muted-foreground animate-pulse">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2 text-teal-500" /> Loading statement records...
                                    </div>
                                )}

                                {exportError && (
                                    <div className="text-xs text-destructive bg-destructive/10 p-3 rounded-md text-center border border-destructive/20 mt-2">
                                        {exportError}
                                    </div>
                                )}

                                {!loadingExportData && !exportError && transactions.length === 0 && (
                                    <div className="text-xs text-muted-foreground italic bg-muted/30 p-4 rounded-md text-center border border-dashed mt-2">
                                        No transaction records match the filters for {exportMonth}.
                                    </div>
                                )}

                                {/* Statement Print Preview Container */}
                                {showPreview && !loadingExportData && transactions.length > 0 && (
                                    <div className="border border-border/80 rounded-xl overflow-hidden mt-4 bg-zinc-950 p-4">
                                        <div className="text-xs text-zinc-400 font-mono mb-2">Statement Print Preview ({chunkedTransactions.length + 2} Pages)</div>
                                        <div className="w-full overflow-x-auto py-4 rounded-lg bg-zinc-900 border border-zinc-800 shadow-inner select-none">
                                            <div className="flex min-w-max justify-start md:justify-center px-4">
                                                <div ref={reportRef} className="flex flex-col gap-10 bg-zinc-900 text-zinc-950 p-2">
                                                    
                                                    {/* PAGE 1: COVER PAGE */}
                                                    <div className="pdf-page relative w-[210mm] h-[297mm] bg-white border shadow-2xl p-[20mm] flex flex-col justify-between overflow-hidden select-none flex-shrink-0">
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.18] z-0">
                                                            <img src="/Logo_BG_Rmv.png" alt="Watermark" className="w-[380px] h-[380px] object-contain select-none" />
                                                        </div>
                                                        <div className="z-10 border-b-2 border-teal-600 pb-4">
                                                            <div className="flex justify-between items-end">
                                                                <div>
                                                                    <h1 className="text-3xl font-extrabold text-teal-800 tracking-tight">EXPENSE STATEMENT</h1>
                                                                    <p className="text-xs text-zinc-500 font-mono tracking-wider mt-1 uppercase">EXECUTIVE SUMMARY REPORT</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="font-bold text-lg text-teal-900">ExpenseTracker</span>
                                                                    <p className="text-[10px] text-zinc-400 font-mono">FINANCIAL INTELLIGENCE</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="z-10 grid grid-cols-2 gap-6 my-6 text-xs bg-teal-50/50 border border-teal-100 rounded-lg p-4 font-sans">
                                                            <div>
                                                                <p className="text-zinc-500 font-semibold text-xs uppercase">Statement Period</p>
                                                                <p className="font-bold text-teal-900 text-base">{exportMonth}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-zinc-500 font-semibold text-xs uppercase">Category Filter</p>
                                                                <p className="font-bold text-teal-900 text-base capitalize">{exportCategory}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-zinc-500 font-semibold text-xs uppercase">Generated On</p>
                                                                <p className="font-medium text-zinc-700">{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-zinc-500 font-semibold text-xs uppercase">Total Records</p>
                                                                <p className="font-bold text-teal-900">{transactions.length} Transactions</p>
                                                            </div>
                                                        </div>

                                                        <div className="z-10 grid grid-cols-2 gap-4 my-4">
                                                            <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50">
                                                                <p className="text-xs text-zinc-500 font-semibold uppercase">Total Spending</p>
                                                                <p className="text-2xl font-black text-teal-800 mt-1">
                                                                    {format(transactions.reduce((sum, tx) => sum + tx.amount, 0))}
                                                                </p>
                                                                <p className="text-[10px] text-zinc-400 mt-1">Sum of filtered expenses</p>
                                                            </div>
                                                            <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50">
                                                                <p className="text-xs text-zinc-500 font-semibold uppercase">Daily Average</p>
                                                                <p className="text-2xl font-black text-teal-800 mt-1">
                                                                    {format(analytics?.averageDailyExpense || 0)}
                                                                </p>
                                                                <p className="text-[10px] text-zinc-400 mt-1">Active daily spend rate</p>
                                                            </div>
                                                        </div>

                                                        <div className="z-10 flex-grow mt-4">
                                                            <h2 className="text-sm font-bold text-teal-900 border-b border-zinc-200 pb-1 flex items-center gap-1">
                                                                <Sparkles className="h-4 w-4 text-teal-600" /> SMART INSIGHTS OBSERVED
                                                            </h2>
                                                            <div className="mt-3 space-y-2.5">
                                                                {analytics?.insights && analytics.insights.length > 0 ? (
                                                                    analytics.insights.slice(0, 4).map((insight, idx) => (
                                                                        <div key={idx} className="flex gap-2 p-2.5 bg-zinc-50/70 border border-zinc-100 rounded-md text-xs leading-relaxed text-zinc-700">
                                                                            <span className="text-teal-600 font-bold">•</span>
                                                                            <p>{insight}</p>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <p className="text-xs text-zinc-400 italic">No automated insights computed for this month.</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="z-10 border-t border-zinc-200 pt-4 flex justify-between text-[9px] text-zinc-400 font-mono">
                                                            <span>CONFIDENTIAL - FOR PERSONAL USE ONLY</span>
                                                            <span>Page 1 of {chunkedTransactions.length + 2}</span>
                                                        </div>
                                                    </div>

                                                    {/* PAGE 2: METRICS & BREAKDOWN */}
                                                    <div className="pdf-page relative w-[210mm] h-[297mm] bg-white border shadow-2xl p-[20mm] flex flex-col justify-between overflow-hidden select-none flex-shrink-0">
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.18] z-0">
                                                            <img src="/Logo_BG_Rmv.png" alt="Watermark" className="w-[380px] h-[380px] object-contain select-none" />
                                                        </div>
                                                        <div className="z-10">
                                                            <div className="border-b border-zinc-200 pb-3 mb-6">
                                                                <h2 className="text-xl font-bold text-teal-800">CATEGORY BREAKDOWN & PROFILE</h2>
                                                                <p className="text-[10px] text-zinc-400 font-mono uppercase">FINANCIAL STATEMENTS PROFILE</p>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <h3 className="text-xs font-bold text-teal-900 border-b border-zinc-200 pb-1 mb-2">CATEGORY DISTRIBUTION</h3>
                                                                {analytics?.categoryBreakdown && Object.keys(analytics.categoryBreakdown).length > 0 ? (
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        {Object.entries(analytics.categoryBreakdown)
                                                                            .sort((a, b) => b[1] - a[1])
                                                                            .map(([catName, amount], index) => {
                                                                                const pct = (amount / (analytics.totalExpense || 1)) * 100
                                                                                return (
                                                                                    <div key={catName} className="border border-zinc-200 rounded p-2.5 bg-zinc-50/50">
                                                                                        <div className="flex justify-between items-center text-xs">
                                                                                            <span className="font-bold text-zinc-800 capitalize">{index + 1}. {catName}</span>
                                                                                            <span className="font-semibold text-teal-700">{pct.toFixed(1)}%</span>
                                                                                        </div>
                                                                                        <p className="text-xs font-black text-zinc-900 mt-1">{format(amount)}</p>
                                                                                        <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                                                                            <div className="bg-teal-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                                                                                        </div>
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-xs text-zinc-400 italic">No category data compiled.</p>
                                                                )}
                                                            </div>

                                                            {analytics?.weekdayWeekend && (
                                                                <div className="mt-8 space-y-3">
                                                                    <h3 className="text-xs font-bold text-teal-900 border-b border-zinc-200 pb-1 mb-2">WEEKDAY VS. WEEKEND SPLIT</h3>
                                                                    <div className="grid grid-cols-2 gap-6 bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                                                                        <div>
                                                                            <span className="text-[10px] font-semibold text-zinc-400 uppercase font-mono">Workday Purchases (Mon-Fri)</span>
                                                                            <p className="text-lg font-black text-teal-900 mt-0.5">{format(analytics.weekdayWeekend.weekdayTotal)}</p>
                                                                            <p className="text-[10px] text-zinc-500 mt-1">{analytics.weekdayWeekend.weekdayCount} transactions (avg {format(analytics.weekdayWeekend.weekdayAverage)}/tx)</p>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-[10px] font-semibold text-zinc-400 uppercase font-mono">Weekend Spending (Sat-Sun)</span>
                                                                            <p className="text-lg font-black text-teal-900 mt-0.5">{format(analytics.weekdayWeekend.weekendTotal)}</p>
                                                                            <p className="text-[10px] text-zinc-500 mt-1">{analytics.weekdayWeekend.weekendCount} transactions (avg {format(analytics.weekdayWeekend.weekendAverage)}/tx)</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="z-10 border-t border-zinc-200 pt-4 flex justify-between text-[9px] text-zinc-400 font-mono font-bold">
                                                            <span>STATISTICS ANALYSIS REPORT</span>
                                                            <span>Page 2 of {chunkedTransactions.length + 2}</span>
                                                        </div>
                                                    </div>

                                                    {/* PAGES 3+: LINE ITEMS */}
                                                    {chunkedTransactions.map((chunk, pageIndex) => (
                                                        <div key={pageIndex} className="pdf-page relative w-[210mm] h-[297mm] bg-white border shadow-2xl p-[20mm] flex flex-col justify-between overflow-hidden select-none flex-shrink-0">
                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.18] z-0">
                                                                <img src="/Logo_BG_Rmv.png" alt="Watermark" className="w-[380px] h-[380px] object-contain select-none" />
                                                            </div>
                                                            <div className="z-10">
                                                                <div className="border-b border-zinc-200 pb-3 mb-6">
                                                                    <div className="flex justify-between items-end">
                                                                        <div>
                                                                            <h2 className="text-xl font-bold text-teal-800">TRANSACTION LEDGER</h2>
                                                                            <p className="text-[10px] text-zinc-400 font-mono uppercase">LINE ITEM PURCHASE LISTINGS</p>
                                                                        </div>
                                                                        <span className="text-[10px] font-bold text-zinc-500 font-mono">PART {pageIndex + 1} OF {chunkedTransactions.length}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="border border-zinc-300 rounded-lg overflow-hidden">
                                                                    <table className="w-full text-left border-collapse text-xs">
                                                                        <thead>
                                                                            <tr className="bg-teal-700 text-white font-bold uppercase text-[10px]">
                                                                                <th className="py-2.5 px-3 border-b border-zinc-300">Date</th>
                                                                                <th className="py-2.5 px-3 border-b border-zinc-300">Category</th>
                                                                                <th className="py-2.5 px-3 border-b border-zinc-300">Description</th>
                                                                                <th className="py-2.5 px-3 border-b border-zinc-300 text-right">Amount</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-zinc-200 text-zinc-700">
                                                                            {chunk.map((tx) => (
                                                                                <tr key={tx._id} className="hover:bg-zinc-50/50">
                                                                                    <td className="py-2 px-3 border-b font-mono">{tx.month}-{String(tx.day).padStart(2, '0')}</td>
                                                                                    <td className="py-2 px-3 border-b capitalize font-semibold text-teal-800">{tx.category}</td>
                                                                                    <td className="py-2 px-3 border-b max-w-[200px] truncate">{tx.reason}</td>
                                                                                    <td className="py-2 px-3 border-b text-right font-bold font-mono">{format(tx.amount)}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                            <div className="z-10 border-t border-zinc-200 pt-4 flex justify-between text-[9px] text-zinc-400 font-mono">
                                                                <span>RECORD LISTINGS STATEMENTS</span>
                                                                <span>Page {pageIndex + 3} of {chunkedTransactions.length + 2}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Database Reset */}
                        <Card className="bg-destructive/5 dark:bg-destructive/2 border-destructive/20 shadow-md mt-6">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-destructive flex items-center gap-2">
                                    <AlertOctagon className="h-5 w-5 shrink-0" />
                                    Zone of Danger: Clear All Data
                                </CardTitle>
                                <CardDescription>Permanently wipe all logged transactions and monthly summaries from the database. This operation is irreversible.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {showResetConfirmation ? (
                                    <form onSubmit={handleClearAllData} className="space-y-3 max-w-md bg-destructive/10 p-4 border border-destructive/20 rounded-xl">
                                        <p className="text-xs text-destructive font-bold flex items-center gap-1.5">
                                            <AlertTriangle className="h-4 w-4 shrink-0" /> Confirm with Delete Password:
                                        </p>
                                        <input
                                            type="password"
                                            placeholder="Enter delete password"
                                            value={resetPassword}
                                            onChange={(e) => setResetPassword(e.target.value)}
                                            className="border border-destructive/30 rounded-md px-3 py-2 bg-background text-foreground text-xs w-full focus:outline-none focus:ring-2 focus:ring-destructive/30"
                                            required
                                        />
                                        {resetError && (
                                            <p className="text-xs text-rose-500 font-semibold">{resetError}</p>
                                        )}
                                        <div className="flex gap-2">
                                            <Button
                                                type="submit"
                                                disabled={resettingDb}
                                                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
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
                                                className="text-xs"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <Button
                                        variant="destructive"
                                        onClick={() => setShowResetConfirmation(true)}
                                        className="text-xs font-bold flex items-center gap-1.5"
                                    >
                                        <Trash2 className="h-4 w-4" /> Reset Database & Transactions
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* TAB: CATEGORY SETTINGS */}
                {activeTab === 'categories' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Predefined Palettes Card */}
                        <Card className="bg-card/50 backdrop-blur border-border/80 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-custom-gradient shrink-0" />
                                    Predefined Category Color Palettes
                                </CardTitle>
                                <CardDescription>Quickly switch between curated category color schemes styled to match our design themes.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {predefinedCategoryPalettes.map((palette) => {
                                        // Check if active colors match this palette
                                        const isActive = Object.keys(palette.colors).every(
                                            (k) => categoryColors[k] === palette.colors[k]
                                        )
                                        return (
                                            <button
                                                key={palette.name}
                                                type="button"
                                                onClick={() => setCategoryColors(palette.colors)}
                                                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all duration-300 ${
                                                    isActive
                                                        ? 'border-primary bg-accent shadow-sm scale-[1.01]'
                                                        : 'border-border/80 bg-background/55 hover:bg-muted/50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between w-full mb-3">
                                                    <span className="text-xs font-bold text-foreground">{palette.name}</span>
                                                    {isActive && <Check className="h-4 w-4 text-primary" />}
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {Object.values(palette.colors).map((c, i) => (
                                                        <span
                                                            key={i}
                                                            className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                                                            style={{ backgroundColor: c }}
                                                        />
                                                    ))}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Add Custom Category Card */}
                        <Card className="bg-card/50 backdrop-blur border-border/80 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Plus className="h-5 w-5 text-custom-gradient shrink-0" />
                                    Add Custom Category
                                </CardTitle>
                                <CardDescription>Introduce a new transaction category with custom color schemes and auto-detection keywords.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAddCategorySubmit} className="space-y-4">
                                    {catFormError && (
                                        <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-md font-semibold">
                                            {catFormError}
                                        </div>
                                    )}
                                    {catFormSuccess && (
                                        <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md font-semibold">
                                            {catFormSuccess}
                                        </div>
                                    )}
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex flex-col space-y-1.5">
                                            <label className="text-xs font-semibold text-muted-foreground">Category Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Health"
                                                required
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                className="border border-border/80 rounded-xl px-3 py-2 bg-background/55 text-foreground text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                                            />
                                        </div>

                                        <div className="flex flex-col space-y-1.5">
                                            <label className="text-xs font-semibold text-muted-foreground">Category Color</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={newCategoryColor}
                                                    onChange={(e) => setNewCategoryColor(e.target.value)}
                                                    className="w-9 h-9 border border-border/60 rounded cursor-pointer shrink-0"
                                                />
                                                <input
                                                    type="text"
                                                    value={newCategoryColor}
                                                    onChange={(e) => setNewCategoryColor(e.target.value)}
                                                    className="w-full border border-border/80 rounded-xl px-3 py-2 bg-background/55 text-foreground font-mono text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col space-y-1.5">
                                            <label className="text-xs font-semibold text-muted-foreground">Auto-Detect Keywords (comma-separated)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. doctor, medicine, hospital"
                                                value={newCategoryKeywords}
                                                onChange={(e) => setNewCategoryKeywords(e.target.value)}
                                                className="border border-border/80 rounded-xl px-3 py-2 bg-background/55 text-foreground text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <Button type="submit" className="bg-custom-btn-gradient text-white flex items-center gap-2">
                                            <Plus className="h-4 w-4" /> Create Category
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Custom Category Color Editor Card */}
                        <Card className="bg-card/50 backdrop-blur border-border/80 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Palette className="h-5 w-5 text-custom-gradient shrink-0" />
                                    Custom Category Designer
                                </CardTitle>
                                <CardDescription>Customize colors and manually edit keywords for each category. Changes apply in real time.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {Object.keys(categoryColors).map((catName) => {
                                        const currentColor = categoryColors[catName]
                                        const isPredefined = ['Breakfast', 'Lunch', 'Dinner', 'Groceries', 'Food', 'Drinks', 'Transport', 'Shopping', 'Rent', 'Bills', 'Salary', 'Freelance', 'Investments', 'Gifts', 'Others'].includes(catName)
                                        return (
                                            <div key={catName} className="p-4 rounded-xl border border-border/60 bg-background/40 space-y-3.5 shadow-sm hover:border-border transition-colors flex flex-col justify-between">
                                                <div className="space-y-3.5">
                                                    <div className="flex justify-between items-center gap-2 min-w-0">
                                                        <span className="text-xs font-black text-foreground capitalize truncate">{catName}</span>
                                                        <span 
                                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold capitalize border flex-shrink-0"
                                                            style={{
                                                                backgroundColor: `${currentColor}12`,
                                                                color: currentColor,
                                                                borderColor: `${currentColor}25`
                                                            }}
                                                        >
                                                            Preview
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Color Picker */}
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            value={currentColor}
                                                            onChange={(e) => updateCategoryColor(catName, e.target.value)}
                                                            className="w-8 h-8 border border-border/60 rounded cursor-pointer shrink-0"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={currentColor}
                                                            onChange={(e) => updateCategoryColor(catName, e.target.value)}
                                                            className="w-full px-2.5 py-1.5 border rounded-md text-[10px] font-mono bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                                                        />
                                                    </div>

                                                    {/* Keyword Editor */}
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Auto-detect Keywords</label>
                                                        <input
                                                            type="text"
                                                            value={(categoryKeywords[catName] || []).join(', ')}
                                                            onChange={(e) => updateCategoryKeywords(catName, e.target.value.split(',').map(s => s.trim()))}
                                                            className="w-full px-2.5 py-1.5 border rounded-md text-[10px] bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                                                            placeholder="comma-separated keywords"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Delete Helper for custom categories */}
                                                {!isPredefined && (
                                                    <div className="pt-2 flex justify-end border-t border-border/20 mt-2">
                                                         <button
                                                             type="button"
                                                             onClick={async () => {
                                                                 const password = prompt(`Enter admin delete password to delete "${catName}" category:`)
                                                                 if (password === null) return
                                                                 if (!password.trim()) {
                                                                     alert('Password is required')
                                                                     return
                                                                 }
                                                                 try {
                                                                     await deleteCustomCategory(catName, password)
                                                                     alert(`Successfully deleted "${catName}" category`)
                                                                 } catch (err: any) {
                                                                     alert(err.message)
                                                                 }
                                                             }}
                                                             className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                                                         >
                                                             <Trash2 className="h-3.5 w-3.5" /> Delete Category
                                                         </button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="flex justify-end gap-3 border-t border-border/40 pt-4 mt-6">
                                    <Button 
                                        variant="outline" 
                                        onClick={async () => {
                                            if (confirm('Are you sure you want to reset all categories back to default settings?')) {
                                                await resetCategorySettings()
                                            }
                                        }} 
                                        className="flex items-center gap-2"
                                    >
                                        <RefreshCw className="h-4 w-4" /> Reset Default Colors & Keywords
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
