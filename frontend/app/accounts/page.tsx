'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAccount, BankAccount } from '@/components/account-context'
import { DynamicIcon } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'
import { useCurrency } from '@/hooks/use-currency'
import { 
    Landmark, 
    Plus, 
    Trash2, 
    Edit2, 
    Palette, 
    Share2, 
    Calendar, 
    Clock, 
    Activity, 
    BadgeCheck, 
    X, 
    ShieldAlert, 
    Check,
    CreditCard,
    Wallet,
    PiggyBank,
    Coins,
    Sparkles,
    ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function AccountsPage() {
    const { accounts, selectedAccount, switchAccount, deleteAccount, updateAccount, refetchAccounts } = useAccount()
    const { format } = useCurrency()

    // Dialog state
    const [editAccount, setEditAccount] = useState<BankAccount | null>(null)
    const [renameName, setRenameName] = useState('')
    const [renameColor, setRenameColor] = useState('#0d9488')
    const [renameIcon, setRenameIcon] = useState('Wallet')
    const [editError, setEditError] = useState('')
    const [saving, setSaving] = useState(false)

    // Deletion password challenge states
    const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null)
    const [delPass, setDelPass] = useState('')
    const [delError, setDelError] = useState('')
    const [deleting, setDeleting] = useState(false)

    // Update account numbers or trigger refreshes
    useEffect(() => {
        refetchAccounts()
    }, [])

    const handleSwitch = (id: string) => {
        switchAccount(id)
    }

    const handleRenameSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editAccount) return
        setEditError('')

        if (!renameName.trim()) {
            setEditError('Workspace name cannot be empty')
            return
        }

        try {
            setSaving(true)
            await updateAccount(editAccount._id, {
                name: renameName.trim(),
                color: renameColor,
                icon: renameIcon
            })
            setEditAccount(null)
        } catch (err: any) {
            setEditError(err.message || 'Failed to update account')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!deleteTarget) return
        setDelError('')

        if (!delPass) {
            setDelError('Password is required to delete this account')
            return
        }

        try {
            setDeleting(true)
            await deleteAccount(deleteTarget._id, delPass)
            setDeleteTarget(null)
            setDelPass('')
        } catch (err: any) {
            setDelError(err.message || 'Incorrect password')
        } finally {
            setDeleting(false)
        }
    }

    const handleExportBackup = async (acc: BankAccount) => {
        try {
            const res = await api.get('/expenses?limit=5000', {
                headers: { 'x-bank-account-id': acc._id }
            })
            const expenses = res.data.expenses || []
            
            const fileData = {
                accountName: acc.name,
                bankName: acc.bankName,
                accountNumber: acc.accountNumber,
                exportDate: new Date().toISOString(),
                transactions: expenses
            }

            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(fileData, null, 2))}`
            const downloadAnchor = document.createElement('a')
            downloadAnchor.setAttribute('href', jsonString)
            downloadAnchor.setAttribute('download', `${acc.name.replace(/\s+/g, '_')}_Ledger_Backup.json`)
            document.body.appendChild(downloadAnchor)
            downloadAnchor.click()
            downloadAnchor.remove()
        } catch (err) {
            alert('Failed to export account data statement.')
        }
    }

    const openEditModal = (acc: BankAccount) => {
        setEditAccount(acc)
        setRenameName(acc.name)
        setRenameColor(acc.color)
        setRenameIcon(acc.icon)
        setEditError('')
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border/40">
                <div>
                    <h1 className="text-3xl font-extrabold text-custom-gradient">
                        Bank Account Workspaces
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your isolated financial accounts. Switch, customize, backup or delete account spaces.
                    </p>
                </div>
                <Link href="/dashboard">
                    <Button variant="outline" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>
            </div>

            {/* Account Workspace Grid */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map((acc) => {
                    const isActive = selectedAccount?._id === acc._id
                    return (
                        <div 
                            key={acc._id}
                            className={`relative rounded-2xl border bg-card/40 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300 flex flex-col justify-between group hover:shadow-xl ${
                                isActive 
                                    ? 'border-primary/50 shadow-[0_0_20px_rgba(13,148,136,0.15)] ring-2 ring-primary/20 scale-[1.02]' 
                                    : 'border-border/60 hover:border-border'
                            }`}
                        >
                            {/* Card Color Strip */}
                            <div className="h-1.5 w-full" style={{ backgroundColor: acc.color }} />

                            <div className="p-5 space-y-4 flex-1">
                                {/* Account Title Icon & Info */}
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex items-center space-x-3 truncate">
                                        <div 
                                            className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md transition-transform duration-300 group-hover:scale-110"
                                            style={{ backgroundColor: acc.color }}
                                        >
                                            <DynamicIcon name={acc.icon} className="h-5.5 w-5.5" />
                                        </div>
                                        <div className="truncate">
                                            <h3 className="font-extrabold text-sm text-foreground truncate flex items-center gap-1.5">
                                                {acc.name}
                                                {acc.isPrimary && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/10">
                                                        Primary
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-xs text-muted-foreground truncate">{acc.bankName}</p>
                                        </div>
                                    </div>
                                    
                                    {isActive && (
                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/20 font-black uppercase tracking-wider">
                                            Active
                                        </span>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="border-t border-border/10 my-1" />

                                {/* Detailed Account Statistics */}
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="bg-background/40 p-2.5 rounded-xl border border-border/10 space-y-0.5">
                                        <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Total Expenses</span>
                                        <span className="font-extrabold text-rose-500 font-mono text-sm">{format(acc.totalExpenses || 0)}</span>
                                    </div>
                                    <div className="bg-background/40 p-2.5 rounded-xl border border-border/10 space-y-0.5">
                                        <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Transactions</span>
                                        <span className="font-bold text-foreground font-mono text-sm">{acc.expenseCount || 0} entries</span>
                                    </div>
                                </div>

                                {/* Date detail */}
                                <div className="space-y-1.5 text-[10px] text-muted-foreground font-medium pt-1">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-3 w-3 text-zinc-400 shrink-0" />
                                        <span>Last Uploaded: <strong className="text-foreground">{new Date(acc.lastUpload || acc.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3 w-3 text-zinc-400 shrink-0" />
                                        <span>Workspace Created: <strong className="text-foreground">{new Date(acc.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Activity className="h-3 w-3 text-zinc-400 shrink-0" />
                                        <span>Account Number: <strong className="text-foreground">{acc.accountNumber}</strong></span>
                                    </div>
                                </div>
                            </div>

                            {/* Workspace Card Bottom Action Controls */}
                            <div className="px-5 py-3.5 bg-muted/20 border-t border-border/10 flex items-center justify-between gap-2">
                                <div className="flex space-x-1 shrink-0">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => openEditModal(acc)}
                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                        title="Rename & Customize accent/icon"
                                    >
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </Button>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleExportBackup(acc)}
                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                        title="Export statements backup (JSON)"
                                    >
                                        <Share2 className="h-3.5 w-3.5" />
                                    </Button>

                                    {!acc.isPrimary && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => setDeleteTarget(acc)}
                                            className="h-8 w-8 rounded-lg text-rose-400 hover:text-rose-500 hover:bg-rose-500/10"
                                            title="Permanently Delete Workspace"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>

                                {!isActive ? (
                                    <Button
                                        onClick={() => handleSwitch(acc._id)}
                                        className="text-xs font-bold rounded-xl px-3 py-1.5 h-8 bg-primary/20 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm"
                                    >
                                        Switch
                                    </Button>
                                ) : (
                                    <span className="text-[10px] text-teal-400 font-bold bg-teal-500/10 border border-teal-500/25 px-2.5 py-1 rounded-full">
                                        Current Workspace
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Account Workspace List - Mobile */}
            <div className="space-y-3 block md:hidden">
                {accounts.map((acc) => {
                    const isActive = selectedAccount?._id === acc._id
                    return (
                        <div 
                            key={acc._id}
                            className={cn(
                                "rounded-2xl border p-4 bg-card/60 backdrop-blur-md flex items-center justify-between gap-3 transition-all",
                                isActive 
                                    ? "border-primary/50 shadow-md ring-1 ring-primary/20" 
                                    : "border-border/60"
                            )}
                        >
                            <div className="flex items-center space-x-3 truncate">
                                <div 
                                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                                    style={{ backgroundColor: acc.color }}
                                >
                                    <DynamicIcon name={acc.icon} className="h-5 w-5" />
                                </div>
                                <div className="truncate">
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="font-extrabold text-xs text-foreground truncate">{acc.name}</h3>
                                        {acc.isPrimary && (
                                            <span className="text-[8px] px-1 rounded-sm bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/10">Pri</span>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-muted-foreground truncate">{acc.bankName} • {acc.accountNumber}</p>
                                    <p className="text-[10px] font-bold text-rose-500 font-mono mt-0.5">{format(acc.totalExpenses || 0)} spend</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => openEditModal(acc)}
                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted"
                                >
                                    <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                {!isActive ? (
                                    <Button
                                        onClick={() => handleSwitch(acc._id)}
                                        className="text-xs font-bold rounded-xl px-2.5 py-1 h-8 bg-primary/20 text-primary border border-primary/20 hover:bg-primary hover:text-white"
                                    >
                                        Switch
                                    </Button>
                                ) : (
                                    <span className="text-[9px] text-teal-400 font-bold bg-teal-500/10 border border-teal-500/20 px-2 py-1 rounded-lg">
                                        Active
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Customization & Rename Modal Dialog */}
            {editAccount && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div 
                        onClick={() => setEditAccount(null)}
                        className="fixed inset-0 bg-black/85 backdrop-blur-sm animate-in fade-in duration-300"
                    />

                    <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start border-b border-border/40 pb-3 mb-4">
                            <div>
                                <h3 className="text-base font-bold text-custom-gradient">Customize Workspace</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Rename and update appearance details.</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditAccount(null)}
                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {editError && (
                            <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                                {editError}
                            </div>
                        )}

                        <form onSubmit={handleRenameSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground font-semibold">Workspace Name</label>
                                <input
                                    type="text"
                                    value={renameName}
                                    onChange={e => setRenameName(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 bg-background/50 border-border/80 focus:border-primary text-xs outline-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-muted-foreground font-semibold">Accent Color</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="color"
                                            value={renameColor}
                                            onChange={e => setRenameColor(e.target.value)}
                                            className="w-8 h-8 rounded border border-border cursor-pointer p-0 bg-transparent block"
                                        />
                                        <span className="text-[10px] text-muted-foreground font-mono">{renameColor}</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs text-muted-foreground font-semibold">Bank Brand Name</label>
                                    <p className="text-xs font-bold text-foreground py-1 px-2.5 rounded bg-muted/40 border">{editAccount.bankName}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-muted-foreground font-semibold block font-sans">Select Icon</label>
                                <div className="flex justify-around bg-muted/40 p-2.5 rounded-xl border">
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
                                                onClick={() => setRenameIcon(item.name)}
                                                className={cn(
                                                    "p-2 rounded-lg border transition-all flex flex-col items-center gap-1",
                                                    renameIcon === item.name
                                                        ? "bg-primary border-primary text-white shadow-md scale-105"
                                                        : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                                                )}
                                            >
                                                <ItemIcon className="h-4 w-4" />
                                                <span className="text-[9px] font-bold">{item.name}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditAccount(null)}
                                    className="rounded-xl font-bold text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-xl bg-custom-btn-gradient text-white font-bold text-xs"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
                , document.body
            )}

            {/* Password-Protected Secure Deletion Modal Dialog */}
            {deleteTarget && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div 
                        onClick={() => { setDeleteTarget(null); setDelPass(''); setDelError(''); }}
                        className="fixed inset-0 bg-black/85 backdrop-blur-sm animate-in fade-in duration-300"
                    />

                    <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start border-b border-border/40 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0" />
                                <h3 className="text-base font-bold text-rose-500">Security Clearance</h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setDeleteTarget(null); setDelPass(''); setDelError(''); }}
                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {delError && (
                            <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                                {delError}
                            </div>
                        )}

                        <form onSubmit={handleDeleteSubmit} className="space-y-4">
                            <div className="space-y-1.5 bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
                                <p className="text-xs text-rose-500 font-bold">WARNING: PERMANENT DATA PURGE</p>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    You are about to delete workspace <strong>{deleteTarget.name}</strong>. 
                                    This will wipe all expenses, transaction logs, uploaded statements, 
                                    analytics summaries, and categories linked to this account. <strong>This action cannot be undone.</strong>
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground font-semibold">Enter Workspace Deletion Password</label>
                                <input
                                    type="password"
                                    value={delPass}
                                    onChange={e => setDelPass(e.target.value)}
                                    placeholder="Password challenge"
                                    className="w-full border rounded-lg px-3 py-2 bg-background/50 border-border/80 focus:border-rose-500 text-xs outline-none font-bold"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => { setDeleteTarget(null); setDelPass(''); setDelError(''); }}
                                    className="rounded-xl font-bold text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={deleting}
                                    className="rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 border border-rose-600 shadow"
                                >
                                    {deleting ? 'Deleting...' : 'Verify & Delete Account'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
                , document.body
            )}
        </div>
    )
}
