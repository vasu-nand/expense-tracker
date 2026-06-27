'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Upload, Table, BarChart3, Moon, Sun, Menu, X, Download, Search, Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'
import { useCurrency } from '@/hooks/use-currency'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/upload', label: 'Upload', icon: Upload },
    { href: '/expenses', label: 'Expenses', icon: Table },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/export', label: 'Export', icon: Download },
    { href: '/settings', label: 'Settings', icon: Settings },
]

export function Navigation() {
    const pathname = usePathname()
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const { format } = useCurrency()

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

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (!target.closest('.search-container')) {
                setShowSuggestions(false)
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
            setIsOpen(false) // Close mobile menu if open
        }
    }

    const handleSuggestionClick = (id: string) => {
        setSearchQuery('')
        setSuggestions([])
        setShowSuggestions(false)
        setIsOpen(false)
        router.push(`/expenses/${id}`)
    }

    return (
        <nav className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <Link href="/dashboard" className="font-bold text-xl text-custom-gradient">
                            ExpenseTracker
                        </Link>
                        {/* Desktop Menu */}
                        <div className="hidden md:flex space-x-4">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                            pathname === item.href
                                                ? "bg-custom-btn-gradient text-white shadow-sm"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    {/* Desktop Search Bar */}
                    <div className="hidden md:block flex-1 max-w-xs mx-4 relative search-container">
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
                                className="w-full pl-9 pr-4 py-1.5 bg-muted/50 border border-border/80 focus:border-primary rounded-full text-xs transition-all duration-200 outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-muted-foreground" />
                        </form>
                        
                        {/* Suggestions Dropdown */}
                        {showSuggestions && (searchQuery.trim().length > 1) && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/80 rounded-xl shadow-lg z-50 overflow-hidden text-xs max-h-60 overflow-y-auto">
                                {loadingSuggestions ? (
                                    <div className="p-3 text-center text-muted-foreground animate-pulse">Loading suggestions...</div>
                                ) : suggestions.length === 0 ? (
                                    <div className="p-3 text-center text-muted-foreground italic">No matches found</div>
                                ) : (
                                    <div className="py-1.5 divide-y divide-border/40">
                                        {suggestions.map((s) => (
                                            <button
                                                key={s._id}
                                                onClick={() => handleSuggestionClick(s._id)}
                                                className="w-full text-left px-4 py-2.5 hover:bg-muted/70 flex justify-between items-center transition-colors"
                                            >
                                                <div className="truncate pr-2">
                                                    <p className="font-semibold text-foreground truncate">{s.reason}</p>
                                                    <p className="text-[10px] text-muted-foreground font-mono">Day {s.day} • {s.category}</p>
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
                            className="md:hidden"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </div>
                </div>
            </div>
            {/* Mobile Drawer (Jetpack Compose Material UI Navigation Drawer Style) */}
            {isOpen && mounted && typeof document !== 'undefined' && createPortal(
                <>
                    {/* Backdrop Overlay */}
                    <div 
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
                    />

                    {/* Side Drawer Sheet */}
                    <div className="fixed inset-y-0 left-0 z-[101] w-[80%] max-w-[320px] bg-card border-r border-border/80 shadow-2xl flex flex-col justify-between rounded-r-[24px] md:hidden animate-in slide-in-from-left duration-300 search-container overflow-hidden">
                        
                        {/* Drawer Header & Content */}
                        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
                            {/* App Header & Close Button */}
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

                            {/* Search bar inside drawer */}
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
                                
                                {/* Mobile Suggestions */}
                                {showSuggestions && (searchQuery.trim().length > 1) && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/80 rounded-xl shadow-lg z-50 overflow-hidden text-[10px] max-h-40 overflow-y-auto">
                                        {loadingSuggestions ? (
                                            <div className="p-2 text-center text-muted-foreground animate-pulse">Loading...</div>
                                        ) : suggestions.length === 0 ? (
                                            <div className="p-2 text-center text-muted-foreground italic">No matches</div>
                                        ) : (
                                            <div className="py-1 divide-y divide-border/40">
                                                {suggestions.map((s) => (
                                                    <button
                                                        key={s._id}
                                                        onClick={() => handleSuggestionClick(s._id)}
                                                        className="w-full text-left px-3 py-2 hover:bg-muted/70 flex justify-between items-center transition-colors"
                                                    >
                                                        <div className="truncate pr-1">
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
                            </form>

                            {/* Nav Items - styled as Jetpack Compose / M3 pills */}
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
                                                "flex items-center space-x-3 px-4 py-3 rounded-full text-sm font-bold transition-all duration-200",
                                                isActive
                                                    ? "bg-custom-btn-gradient text-white shadow-md"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            <Icon className="h-4.5 w-4.5 shrink-0" />
                                            <span>{item.label}</span>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Drawer Bottom Actions */}
                        <div className="p-5 border-t border-border/40 bg-muted/20 flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground font-mono font-semibold uppercase">v1.2.0 Stable</span>
                            
                            {/* Mobile Theme Toggle in Drawer Footer */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="h-8 rounded-lg flex items-center gap-1 text-xs border-border/60 hover:bg-muted font-bold text-muted-foreground hover:text-foreground"
                            >
                                {theme === 'dark' ? (
                                    <>
                                        <Sun className="h-3.5 w-3.5 text-amber-500" />
                                        <span>Light Mode</span>
                                    </>
                                ) : (
                                    <>
                                        <Moon className="h-3.5 w-3.5 text-indigo-400" />
                                        <span>Dark Mode</span>
                                    </>
                                )}
                            </Button>
                        </div>

                    </div>
                </>
                , document.body
            )}
        </nav>
    )
}