'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
    LayoutDashboard, 
    Upload, 
    Table, 
    BarChart3, 
    Moon, 
    Sun, 
    Menu, 
    X, 
    Download, 
    Search, 
    Settings,
    ChevronDown,
    Plus,
    Check,
    Landmark,
    Wallet,
    CreditCard,
    PiggyBank,
    Coins,
    GitCompare,
    ShieldAlert
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'
import { useCurrency } from '@/hooks/use-currency'
import { useAccount, BankAccount } from '@/components/account-context'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/expenses', label: 'Expenses', icon: Table },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/comparison', label: 'Comparison', icon: GitCompare },
    { href: '/settings', label: 'Settings', icon: Settings },
]

export function DynamicIcon({ name, className }: { name: string; className?: string }) {
    const IconComponent = (LucideIcons as any)[name] || Landmark
    return <IconComponent className={className} />
}

export function Navigation() {
    const pathname = usePathname()
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const { format } = useCurrency()
    
    // Account Workspace Context
    const { selectedAccount, accounts, switchAccount, createAccount } = useAccount()
    const [switcherOpen, setSwitcherOpen] = useState(false)
    const switcherRef = useRef<HTMLDivElement>(null)
    const [dataHovered, setDataHovered] = useState(false)
    
    // Create Account Dialog State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [accName, setAccName] = useState('')
    const [bankNameInput, setBankNameInput] = useState('')
    const [accNum, setAccNum] = useState('')
    const [accColor, setAccColor] = useState('#0d9488')
    const [accIcon, setAccIcon] = useState('Wallet')
    const [delPass, setDelPass] = useState('')
    const [confPass, setConfPass] = useState('')
    const [createError, setCreateError] = useState('')
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const [searchQuery, setSearchQuery] = useState('')
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [loadingSuggestions, setLoadingSuggestions] = useState(false)

    // Debounce suggestions fetch
    useEffect(() => {
        if (searchQuery.trim().length <= 1) {
            setSuggestions([])
            return
        }

        const delayDebounceFn = setTimeout(async () => {
            try {
                setLoadingSuggestions(true)
                const res = await api.get(`/expenses?limit=5&search=${encodeURIComponent(searchQuery)}`)
                setSuggestions(res.data.expenses || [])
            } catch (err) {
                console.error('Failed to fetch suggestions:', err)
            } finally {
                setLoadingSuggestions(false)
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [searchQuery])

    // Close suggestions and switcher dropdown on clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (!target.closest('.search-container')) {
                setShowSuggestions(false)
            }
            if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
                setSwitcherOpen(false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/expenses?search=${encodeURIComponent(searchQuery.trim())}`)
            setShowSuggestions(false)
            setIsOpen(false)
        }
    }

    const handleSuggestionClick = (id: string) => {
        setSearchQuery('')
        setSuggestions([])
        setShowSuggestions(false)
        setIsOpen(false)
        router.push(`/expenses/${id}`)
    }

    const handleCreateAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreateError('')
        
        if (!accName.trim() || !bankNameInput.trim() || !accNum.trim()) {
            setCreateError('Please fill out all required fields')
            return
        }

        if (!delPass) {
            setCreateError('Deletion password is required')
            return
        }

        if (delPass.length < 6) {
            setCreateError('Password must be at least 6 characters long')
            return
        }

        if (delPass !== confPass) {
            setCreateError('Passwords do not match')
            return
        }

        try {
            setCreating(true)
            await createAccount({
                name: accName.trim(),
                bankName: bankNameInput.trim(),
                accountNumber: accNum.trim(),
                color: accColor,
                icon: accIcon,
                deletePassword: delPass,
                confirmPassword: confPass
            })
            
            // Reset form
            setAccName('')
            setBankNameInput('')
            setAccNum('')
            setAccColor('#0d9488')
            setAccIcon('Wallet')
            setDelPass('')
            setConfPass('')
            setIsCreateOpen(false)
        } catch (err: any) {
            setCreateError(err.message || 'Failed to create account')
        } finally {
            setCreating(false)
        }
    }

    return (
        <nav className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-6">
                        <Link href="/dashboard" className="font-extrabold text-lg text-custom-gradient tracking-tight shrink-0">
                            ExpenseTracker
                        </Link>
                        
                        {/* Premium Account Switcher Dropdown */}
                        {mounted && (
                            <div className="relative" ref={switcherRef}>
                                {/* Mobile Icon Button */}
                                <button
                                    onClick={() => setSwitcherOpen(!switcherOpen)}
                                    className="flex items-center justify-center h-9 w-9 rounded-full border border-border bg-muted/30 hover:bg-muted/60 transition-all shrink-0 md:hidden text-foreground"
                                    style={{ borderColor: selectedAccount?.color ? `${selectedAccount.color}45` : undefined }}
                                    title="Switch Workspace Account"
                                >
                                    <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        viewBox="0 0 520 457" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="24" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        className="h-5 w-5"
                                    >
                                        {/* Top Left Person */}
                                        <ellipse cx="131" cy="68" rx="34" ry="40"></ellipse>
                                        <path d="M60 173 L94 160 L117 166 L131 188 L145 166 L168 160 L202 173 Q220 179 220 198 L220 225 Q220 245 200 245 L62 245 Q42 245 42 225 L42 198 Q42 179 60 173"></path>
                                        {/* Bottom Right Person */}
                                        <ellipse cx="332" cy="270" rx="34" ry="40"></ellipse>
                                        <path d="M261 375 L295 362 L318 368 L332 390 L346 368 L369 362 L403 375 Q421 381 421 400 L421 427 Q421 447 401 447 L263 447 Q243 447 243 427 L243 400 Q243 381 261 375"></path>
                                        {/* Upper Arrow */}
                                        <path d="M269 58 H300 Q333 58 333 91 V170"></path>
                                        <path d="M311 149 L333 170 L355 149"></path>
                                        {/* Lower Arrow */}
                                        <path d="M231 379 H195 Q145 379 145 329 V247"></path>
                                        <path d="M123 268 L145 247 L167 268"></path>
                                    </svg>
                                </button>

                                {/* Desktop Full Button */}
                                <button
                                    onClick={() => setSwitcherOpen(!switcherOpen)}
                                    className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full border border-border/80 bg-muted/30 text-xs font-bold hover:bg-muted/60 transition-all select-none max-w-[190px]"
                                    style={{ borderColor: selectedAccount?.color ? `${selectedAccount.color}30` : undefined }}
                                >
                                    <div 
                                        className="h-4 w-4 rounded-full flex items-center justify-center text-[10px] text-white flex-shrink-0"
                                        style={{ backgroundColor: selectedAccount?.color || '#0d9488' }}
                                    >
                                        {selectedAccount && <DynamicIcon name={selectedAccount.icon} className="h-2.5 w-2.5" />}
                                    </div>
                                    <span className="truncate text-foreground max-w-[110px]">{selectedAccount?.name || 'Loading Account...'}</span>
                                    <ChevronDown className={cn("h-3 w-3 text-muted-foreground shrink-0 transition-transform duration-200", switcherOpen && "rotate-180")} />
                                </button>

                                {switcherOpen && (
                                    <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-border/95 shadow-[0_15px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.5)] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-3 py-1.5 text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest border-b border-border/40 mb-1">
                                            Switch Workspace
                                        </div>
                                        <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                                            {accounts.map((acc) => (
                                                <button
                                                    key={acc._id}
                                                    onClick={() => { switchAccount(acc._id); setSwitcherOpen(false); }}
                                                    className={cn(
                                                        "w-full flex items-center justify-between p-2 rounded-xl text-left transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/80 group",
                                                        selectedAccount?._id === acc._id && "bg-zinc-100 dark:bg-zinc-800/80 font-semibold"
                                                    )}
                                                >
                                                    <div className="flex items-center space-x-2.5 truncate">
                                                        <div 
                                                            className="h-7 w-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                                                            style={{ backgroundColor: acc.color }}
                                                        >
                                                            <DynamicIcon name={acc.icon} className="h-4 w-4" />
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="text-xs text-foreground font-bold truncate flex items-center gap-1">
                                                                {acc.name}
                                                                {acc.isPrimary && (
                                                                    <span className="text-[9px] px-1 rounded-sm bg-primary/20 text-primary font-bold">Primary</span>
                                                                )}
                                                            </p>
                                                            <p className="text-[9px] text-muted-foreground truncate">{acc.bankName} • {acc.accountNumber}</p>
                                                        </div>
                                                    </div>
                                                    {selectedAccount?._id === acc._id && (
                                                        <Check className="h-4 w-4 text-primary shrink-0 ml-1.5" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        <div className="border-t border-border/40 mt-1 pt-1.5 space-y-1">
                                            <button
                                                onClick={() => { setIsCreateOpen(true); setSwitcherOpen(false); }}
                                                className="w-full flex items-center space-x-2 p-2 rounded-xl text-xs font-bold text-teal-500 hover:bg-teal-500/10 transition-colors"
                                            >
                                                <Plus className="h-4 w-4 shrink-0" />
                                                <span>Create New Account</span>
                                            </button>
                                            
                                            <button
                                                onClick={() => { router.push('/accounts'); setSwitcherOpen(false); }}
                                                className="w-full flex items-center space-x-2 p-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
                                            >
                                                <Settings className="h-4 w-4 shrink-0" />
                                                <span>Manage Workspaces</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Desktop Menu Links */}
                        <div className="hidden lg:flex items-center space-x-1">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200",
                                            pathname === item.href
                                                ? "bg-custom-btn-gradient text-white shadow-sm"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        <span>{item.label}</span>
                                    </Link>
                                )
                            })}

                            {/* Hoverable "Data" Dropdown Menu */}
                            <div 
                                className="relative group py-1.5"
                                onMouseEnter={() => setDataHovered(true)}
                                onMouseLeave={() => setDataHovered(false)}
                            >
                                <button
                                    className={cn(
                                        "flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200",
                                        (pathname === '/upload' || pathname === '/export')
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <LucideIcons.Database className="h-3.5 w-3.5" />
                                    <span>Data</span>
                                    <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform duration-200", dataHovered && "rotate-180")} />
                                </button>

                                {dataHovered && (
                                    <div className="absolute left-0 mt-2 w-32 rounded-xl bg-white dark:bg-zinc-900 border border-border/95 shadow-[0_15px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.5)] p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                        <Link
                                            href="/upload"
                                            className={cn(
                                                "flex items-center space-x-2 p-2 rounded-lg text-xs font-semibold transition-all w-full",
                                                pathname === '/upload'
                                                    ? "bg-custom-btn-gradient text-white shadow-sm"
                                                    : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-foreground"
                                            )}
                                        >
                                            <Upload className="h-3.5 w-3.5" />
                                            <span>Upload</span>
                                        </Link>
                                        <Link
                                            href="/export"
                                            className={cn(
                                                "flex items-center space-x-2 p-2 rounded-lg text-xs font-semibold transition-all w-full mt-0.5",
                                                pathname === '/export'
                                                    ? "bg-custom-btn-gradient text-white shadow-sm"
                                                    : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-foreground"
                                            )}
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            <span>Export</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Desktop Search Bar */}
                    <div className="hidden md:block flex-1 max-w-[200px] mx-2 relative search-container">
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <input
                                type="text"
                                placeholder="Search expenses..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setShowSuggestions(true)
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                className="w-full pl-8 pr-4 py-1 bg-muted/50 border border-border/80 focus:border-primary rounded-full text-[11px] transition-all duration-200 outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <Search className="absolute left-2.5 top-1.5 h-3 w-3 text-muted-foreground" />
                        </form>
                        
                        {/* Suggestions Dropdown */}
                        {showSuggestions && (searchQuery.trim().length > 1) && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-border/95 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden text-[10px] max-h-60 overflow-y-auto">
                                {loadingSuggestions ? (
                                    <div className="p-3 text-center text-muted-foreground animate-pulse">Loading suggestions...</div>
                                ) : suggestions.length === 0 ? (
                                    <div className="p-3 text-center text-muted-foreground italic">No matches found</div>
                                ) : (
                                    <div className="py-1 divide-y divide-border/40">
                                        {suggestions.map((s) => (
                                            <button
                                                key={s._id}
                                                onClick={() => handleSuggestionClick(s._id)}
                                                className="w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex justify-between items-center transition-colors"
                                            >
                                                <div className="truncate pr-2">
                                                    <p className="font-semibold text-foreground truncate">{s.reason}</p>
                                                    <p className="text-[9px] text-muted-foreground font-mono">Day {s.day} • {s.category}</p>
                                                </div>
                                                <span className="font-mono font-bold text-primary shrink-0">{format(s.amount)}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="rounded-full"
                        >
                            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>

                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Drawer */}
            {isOpen && mounted && typeof document !== 'undefined' && createPortal(
                <>
                    <div 
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-300"
                    />

                    <div className="fixed inset-y-0 left-0 z-[101] w-[80%] max-w-[320px] bg-card border-r border-border/80 shadow-2xl flex flex-col justify-between rounded-r-[24px] lg:hidden animate-in slide-in-from-left duration-300 search-container overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                            <div className="flex justify-between items-center pb-2 border-b border-border/40">
                                <div>
                                    <h2 className="text-xl font-bold text-custom-gradient tracking-tight">ExpenseTracker</h2>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Financial Intelligence</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4.5 w-4.5" />
                                </Button>
                            </div>

                            {/* Switcher in Mobile Drawer */}
                            <div className="bg-muted/40 p-3 rounded-2xl border border-border/40 space-y-2">
                                <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest block">Active Workspace</span>
                                <div className="flex flex-col gap-1.5">
                                    {accounts.map((acc) => (
                                        <button
                                            key={acc._id}
                                            onClick={() => { switchAccount(acc._id); setIsOpen(false); }}
                                            className={cn(
                                                "w-full flex items-center justify-between p-2 rounded-xl text-left transition-all hover:bg-muted/70",
                                                selectedAccount?._id === acc._id && "bg-background/80 shadow-sm border border-border/20 font-bold"
                                            )}
                                        >
                                            <div className="flex items-center space-x-2 truncate">
                                                <div 
                                                    className="h-6 w-6 rounded-md flex items-center justify-center text-white shrink-0"
                                                    style={{ backgroundColor: acc.color }}
                                                >
                                                    <DynamicIcon name={acc.icon} className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-xs text-foreground truncate">{acc.name}</p>
                                                </div>
                                            </div>
                                            {selectedAccount?._id === acc._id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                                        </button>
                                    ))}
                                    
                                    <div className="flex gap-2 pt-2 border-t border-border/40 mt-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { setIsCreateOpen(true); setIsOpen(false); }}
                                            className="flex-1 rounded-full text-[10px] font-bold h-8 border-border text-teal-500 hover:bg-teal-500/10 gap-1"
                                        >
                                            <Plus className="h-3 w-3" /> New
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { router.push('/accounts'); setIsOpen(false); }}
                                            className="flex-1 rounded-full text-[10px] font-bold h-8 border-border gap-1"
                                        >
                                            <Settings className="h-3 w-3" /> Manage
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Search bar inside mobile drawer */}
                            <div className="relative search-container">
                                <form onSubmit={handleSearchSubmit} className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search transactions..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value)
                                            setShowSuggestions(true)
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        className="w-full pl-9 pr-4 py-2 bg-muted/60 border border-border/80 focus:border-primary rounded-xl text-xs outline-none"
                                    />
                                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                </form>

                                {/* Suggestions Dropdown in mobile view */}
                                {showSuggestions && (searchQuery.trim().length > 1) && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-border/95 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.5)] z-[150] overflow-hidden text-[10px] max-h-60 overflow-y-auto">
                                        {loadingSuggestions ? (
                                            <div className="p-3 text-center text-muted-foreground animate-pulse">Loading suggestions...</div>
                                        ) : suggestions.length === 0 ? (
                                            <div className="p-3 text-center text-muted-foreground italic">No matches found</div>
                                        ) : (
                                            <div className="py-1 divide-y divide-border/40">
                                                {suggestions.map((s) => (
                                                    <button
                                                        key={s._id}
                                                        onClick={() => handleSuggestionClick(s._id)}
                                                        className="w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex justify-between items-center transition-colors"
                                                    >
                                                        <div className="truncate pr-2">
                                                            <p className="font-semibold text-foreground truncate">{s.reason}</p>
                                                            <p className="text-[9px] text-muted-foreground font-mono">Day {s.day} • {s.category}</p>
                                                        </div>
                                                        <span className="font-mono font-bold text-primary shrink-0">{format(s.amount)}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Nav Items */}
                            <div className="space-y-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon
                                    const isActive = pathname === item.href
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "flex items-center space-x-3 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200",
                                                isActive
                                                    ? "bg-custom-btn-gradient text-white shadow-md"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            <Icon className="h-4 w-4 shrink-0" />
                                            <span>{item.label}</span>
                                        </Link>
                                    )
                                })}

                                {/* Mobile Data Section */}
                                <div className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest px-4 pt-3 pb-1 border-t border-border/20 mt-2">
                                    Data Tools
                                </div>
                                <Link
                                    href="/upload"
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex items-center space-x-3 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200",
                                        pathname === '/upload'
                                            ? "bg-custom-btn-gradient text-white shadow-md"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <Upload className="h-4 w-4 shrink-0" />
                                    <span>Upload Statement</span>
                                </Link>
                                <Link
                                    href="/export"
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex items-center space-x-3 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200",
                                        pathname === '/export'
                                            ? "bg-custom-btn-gradient text-white shadow-md"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <Download className="h-4 w-4 shrink-0" />
                                    <span>Export Statement</span>
                                </Link>
                            </div>
                        </div>

                        <div className="p-5 border-t border-border/40 bg-muted/20 flex items-center justify-between">
                            <span className="text-[9px] text-muted-foreground font-mono font-semibold uppercase">Workspace Mode</span>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="h-8 rounded-lg flex items-center gap-1 text-[10px] border-border/60 hover:bg-muted font-bold text-muted-foreground hover:text-foreground"
                            >
                                {theme === 'dark' ? (
                                    <>
                                        <Sun className="h-3 w-3 text-amber-500" />
                                        <span>Light Mode</span>
                                    </>
                                ) : (
                                    <>
                                        <Moon className="h-3 w-3 text-indigo-400" />
                                        <span>Dark Mode</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </>
                , document.body
            )}

            {/* Create Bank Account Modal Dialog Panel */}
            {isCreateOpen && mounted && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        onClick={() => setIsCreateOpen(false)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
                    />

                    {/* Dialog Container */}
                    <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200 select-none">
                        <div className="flex justify-between items-start border-b border-border/40 pb-3 mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-custom-gradient">Create Workspace</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Initialize a new isolated bank account workspace.</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsCreateOpen(false)}
                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {createError && (
                            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 shrink-0" />
                                <span>{createError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateAccountSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-muted-foreground font-semibold">Account Name *</label>
                                    <input
                                        type="text"
                                        value={accName}
                                        onChange={e => setAccName(e.target.value)}
                                        placeholder="e.g. Salary Account"
                                        className="w-full border rounded-lg px-3 py-2 bg-background/50 border-border/80 focus:border-primary text-xs outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-muted-foreground font-semibold">Bank Name *</label>
                                    <input
                                        type="text"
                                        value={bankNameInput}
                                        onChange={e => setBankNameInput(e.target.value)}
                                        placeholder="e.g. HDFC Bank"
                                        className="w-full border rounded-lg px-3 py-2 bg-background/50 border-border/80 focus:border-primary text-xs outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-xs text-muted-foreground font-semibold">Masked Account Number *</label>
                                    <input
                                        type="text"
                                        value={accNum}
                                        onChange={e => setAccNum(e.target.value)}
                                        placeholder="e.g. XXXX-4829"
                                        className="w-full border rounded-lg px-3 py-2 bg-background/50 border-border/80 focus:border-primary text-xs outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-muted-foreground font-semibold">Accent Color</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="color"
                                            value={accColor}
                                            onChange={e => setAccColor(e.target.value)}
                                            className="w-8 h-8 rounded border border-border cursor-pointer p-0 bg-transparent block"
                                        />
                                        <span className="text-[10px] text-muted-foreground font-mono">{accColor}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground font-semibold block">Select Account Icon</label>
                                <div className="flex justify-around bg-muted/40 p-2 rounded-xl border border-border/30">
                                    {[
                                        { name: 'Wallet', icon: Wallet },
                                        { name: 'CreditCard', icon: CreditCard },
                                        { name: 'Landmark', icon: Landmark },
                                        { name: 'PiggyBank', icon: PiggyBank },
                                        { name: 'Coins', icon: Coins }
                                    ].map((item) => {
                                        const ItemIcon = item.icon
                                        return (
                                            <button
                                                key={item.name}
                                                type="button"
                                                onClick={() => setAccIcon(item.name)}
                                                className={cn(
                                                    "p-2.5 rounded-lg border transition-all flex flex-col items-center gap-1",
                                                    accIcon === item.name
                                                        ? "bg-primary border-primary text-white shadow-md scale-105"
                                                        : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                                                )}
                                            >
                                                <ItemIcon className="h-4.5 w-4.5" />
                                                <span className="text-[9px] font-bold">{item.name}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-muted-foreground font-semibold">Deletion Password *</label>
                                    <input
                                        type="password"
                                        value={delPass}
                                        onChange={e => setDelPass(e.target.value)}
                                        placeholder="Min 6 characters"
                                        className="w-full border rounded-lg px-3 py-2 bg-background/50 border-border/80 focus:border-primary text-xs outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-muted-foreground font-semibold">Confirm Password *</label>
                                    <input
                                        type="password"
                                        value={confPass}
                                        onChange={e => setConfPass(e.target.value)}
                                        placeholder="Re-enter password"
                                        className="w-full border rounded-lg px-3 py-2 bg-background/50 border-border/80 focus:border-primary text-xs outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="rounded-xl font-bold text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={creating}
                                    className="rounded-xl bg-custom-btn-gradient text-white font-bold text-xs"
                                >
                                    {creating ? 'Creating...' : 'Create Account'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
                , document.body
            )}
        </nav>
    )
}