'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Upload, Table, BarChart3, Moon, Sun, Menu, X, Download, Search } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/upload', label: 'Upload', icon: Upload },
    { href: '/expenses', label: 'Expenses', icon: Table },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/export', label: 'Export', icon: Download },
]

export function Navigation() {
    const pathname = usePathname()
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const [isOpen, setIsOpen] = useState(false)

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
                        <Link href="/dashboard" className="font-bold text-xl bg-gradient-to-r from-teal-500 to-teal-700 bg-clip-text text-transparent">
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
                                                ? "bg-gradient-to-r from-teal-400 to-teal-700 text-white shadow-sm"
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
                                className="w-full pl-9 pr-4 py-1.5 bg-muted/50 border border-border/80 focus:border-teal-500 rounded-full text-xs transition-all duration-200 outline-none focus:ring-2 focus:ring-teal-500/20"
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
                                                <span className="font-mono font-bold text-teal-600 shrink-0">₹{s.amount.toFixed(2)}</span>
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

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden border-t bg-background px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-200 search-container">
                    {/* Mobile Search */}
                    <form onSubmit={handleSearchSubmit} className="relative mb-3">
                        <input
                            type="text"
                            placeholder="Search expenses..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setShowSuggestions(true)
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border/80 focus:border-teal-500 rounded-full text-sm outline-none"
                        />
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </form>

                    {/* Mobile Suggestions */}
                    {showSuggestions && (searchQuery.trim().length > 1) && (
                        <div className="bg-card border border-border/80 rounded-xl shadow-lg z-50 overflow-hidden text-xs max-h-40 overflow-y-auto mb-3">
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
                                            className="w-full text-left px-4 py-2 hover:bg-muted/70 flex justify-between items-center transition-colors"
                                        >
                                            <div className="truncate pr-2">
                                                <p className="font-semibold text-foreground truncate">{s.reason}</p>
                                                <p className="text-[10px] text-muted-foreground">Day {s.day} • {s.category}</p>
                                            </div>
                                            <span className="font-mono font-bold text-teal-600 shrink-0">₹{s.amount.toFixed(2)}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {navItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center space-x-3 px-3 py-2.5 rounded-md text-base font-medium transition-all duration-200",
                                    pathname === item.href
                                        ? "bg-gradient-to-r from-teal-400 to-teal-700 text-white shadow-sm"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            )}
        </nav>
    )
}