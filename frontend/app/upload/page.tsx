'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
    ArrowLeft, 
    Info, 
    Calendar, 
    Download, 
    Upload, 
    Receipt, 
    TrendingUp, 
    Coins, 
    Building2, 
    PieChart, 
    Database, 
    FileSpreadsheet, 
    CheckCircle2, 
    AlertCircle,
    RefreshCw,
    ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAccount } from '@/components/account-context'
import { DynamicIcon } from '@/components/navigation'
import { getLocalMonth, cn } from '@/lib/utils'
import { MonthPicker } from '@/components/ui/month-picker'
import { api } from '@/services/api'

type ImportType = 'expenses' | 'transactions' | 'dividends' | 'bank_accounts' | 'assets' | 'backup'

interface TabConfig {
    id: ImportType
    title: string
    icon: React.ElementType
    description: string
    supportedFormats: string
    endpoint: string
    columns: { name: string; required: boolean; type: string; sample: string; description: string }[]
    sampleCSV: string
}

const TAB_CONFIGS: Record<ImportType, TabConfig> = {
    expenses: {
        id: 'expenses',
        title: 'Expenses & Income',
        icon: Receipt,
        description: 'Bulk import daily expenses, bills, and income transactions.',
        supportedFormats: 'CSV, Excel (.xlsx, .xls), JSON',
        endpoint: '/import/expenses',
        columns: [
            { name: 'day', required: true, type: 'Number (1-31)', sample: '15', description: 'Day of the month' },
            { name: 'amount', required: true, type: 'Number', sample: '450.00', description: 'Transaction amount' },
            { name: 'reason', required: true, type: 'String', sample: 'Grocery Shopping', description: 'Description or reason' },
            { name: 'category', required: false, type: 'String', sample: 'Food', description: 'Category (auto-detected if blank)' },
            { name: 'type', required: false, type: 'String', sample: 'expense', description: 'expense or income' },
            { name: 'month', required: false, type: 'YYYY-MM', sample: '2026-08', description: 'Target month string' }
        ],
        sampleCSV: 'day,amount,reason,category,type,month\n1,50000,Monthly Salary Credit,Salary,income,2026-08\n2,450,Supermarket Grocery,Food,expense,2026-08\n5,1200,Internet Broadband Bill,Utilities,expense,2026-08'
    },
    transactions: {
        id: 'transactions',
        title: 'Investment Trades',
        icon: TrendingUp,
        description: 'Import stock, ETF, mutual fund, crypto trade buy/sell orders.',
        supportedFormats: 'CSV, Excel (.xlsx, .xls), JSON',
        endpoint: '/import/transactions',
        columns: [
            { name: 'symbol', required: true, type: 'String', sample: 'RELIANCE.NS', description: 'Ticker / asset symbol' },
            { name: 'type', required: true, type: 'buy | sell', sample: 'buy', description: 'Trade order type' },
            { name: 'quantity', required: true, type: 'Number', sample: '10', description: 'Number of units / shares' },
            { name: 'price', required: true, type: 'Number', sample: '2450.50', description: 'Execution price per unit' },
            { name: 'fees', required: false, type: 'Number', sample: '15.00', description: 'Brokerage & transaction fees' },
            { name: 'tax', required: false, type: 'Number', sample: '5.00', description: 'STT or transaction tax' },
            { name: 'date', required: false, type: 'YYYY-MM-DD', sample: '2026-08-10', description: 'Trade execution date' }
        ],
        sampleCSV: 'symbol,type,quantity,price,fees,tax,date\nRELIANCE.NS,buy,10,2450.50,15.00,5.00,2026-08-10\nAAPL,buy,5,185.20,0.00,0.00,2026-08-12\nINFY.NS,sell,4,1420.00,10.00,2.00,2026-08-14'
    },
    dividends: {
        id: 'dividends',
        title: 'Dividends Ledger',
        icon: Coins,
        description: 'Import dividend payout receipts and passive income history.',
        supportedFormats: 'CSV, Excel (.xlsx, .xls), JSON',
        endpoint: '/import/dividends',
        columns: [
            { name: 'symbol', required: true, type: 'String', sample: 'TCS.NS', description: 'Asset ticker symbol' },
            { name: 'amount', required: true, type: 'Number', sample: '350.00', description: 'Total dividend payout received' },
            { name: 'tax', required: false, type: 'Number', sample: '35.00', description: 'TDS or dividend withholding tax' },
            { name: 'date', required: false, type: 'YYYY-MM-DD', sample: '2026-08-15', description: 'Payout date' }
        ],
        sampleCSV: 'symbol,amount,tax,date\nTCS.NS,350.00,35.00,2026-08-15\nMSFT,45.00,0.00,2026-08-10\nNIFTYBEES.NS,120.00,12.00,2026-08-05'
    },
    bank_accounts: {
        id: 'bank_accounts',
        title: 'Bank Accounts',
        icon: Building2,
        description: 'Import savings, checking, credit card, and investment bank workspaces.',
        supportedFormats: 'CSV, Excel (.xlsx, .xls), JSON',
        endpoint: '/import/bank-accounts',
        columns: [
            { name: 'name', required: true, type: 'String', sample: 'HDFC Savings', description: 'Workspace account name' },
            { name: 'bankName', required: false, type: 'String', sample: 'HDFC Bank', description: 'Bank institution name' },
            { name: 'accountNumber', required: false, type: 'String', sample: '9876', description: 'Account digits / mask' },
            { name: 'color', required: false, type: 'Hex Color', sample: '#6366f1', description: 'Account theme color' },
            { name: 'icon', required: false, type: 'Lucide Icon', sample: 'Landmark', description: 'Account display icon' }
        ],
        sampleCSV: 'name,bankName,accountNumber,color,icon\nHDFC Primary,HDFC Bank,9876,#6366f1,Landmark\nICICI Credit Card,ICICI Bank,1234,#ef4444,CreditCard\nZerodha Trading,Zerodha Broking,5544,#10b981,Wallet'
    },
    assets: {
        id: 'assets',
        title: 'Master Assets',
        icon: PieChart,
        description: 'Import master stock tickers, mutual funds, gold, and crypto assets.',
        supportedFormats: 'CSV, Excel (.xlsx, .xls), JSON',
        endpoint: '/import/assets',
        columns: [
            { name: 'symbol', required: true, type: 'String', sample: 'TATAMOTORS.NS', description: 'Ticker symbol' },
            { name: 'name', required: false, type: 'String', sample: 'Tata Motors Ltd', description: 'Full asset name' },
            { name: 'assetType', required: false, type: 'stock | mutual_fund', sample: 'stock', description: 'Asset classification' },
            { name: 'exchange', required: false, type: 'NSE | BSE | US', sample: 'NSE', description: 'Primary exchange' },
            { name: 'currency', required: false, type: 'INR | USD', sample: 'INR', description: 'Quote currency' }
        ],
        sampleCSV: 'symbol,name,assetType,exchange,currency\nTATAMOTORS.NS,Tata Motors Ltd,stock,NSE,INR\nNIFTYBEES.NS,Nippon India Nifty 50 ETF,etf,NSE,INR\nBTC,Bitcoin,crypto,US,USD'
    },
    backup: {
        id: 'backup',
        title: 'Full System Backup',
        icon: Database,
        description: 'Restore entire application database snapshot from a JSON backup file.',
        supportedFormats: 'JSON (.json)',
        endpoint: '/import/backup',
        columns: [
            { name: 'exportDate', required: true, type: 'ISO String', sample: '2026-08-16T12:00:00Z', description: 'Backup timestamp' },
            { name: 'expenses', required: true, type: 'Array', sample: '[{...}]', description: 'Expense records array' },
            { name: 'bankAccounts', required: true, type: 'Array', sample: '[{...}]', description: 'Bank accounts array' },
            { name: 'transactions', required: true, type: 'Array', sample: '[{...}]', description: 'Investment transactions array' },
            { name: 'dividends', required: true, type: 'Array', sample: '[{...}]', description: 'Dividends array' }
        ],
        sampleCSV: '{"exportDate":"2026-08-16","expenses":[],"bankAccounts":[],"transactions":[],"dividends":[]}'
    }
}

export default function UploadPage() {
    const { selectedAccount } = useAccount()
    const [activeTab, setActiveTab] = useState<ImportType>('expenses')
    const [selectedMonth, setSelectedMonth] = useState(getLocalMonth())
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const currentTabConfig = TAB_CONFIGS[activeTab]
    const ActiveTabIcon = currentTabConfig.icon

    // Download Sample CSV Template
    const handleDownloadTemplate = () => {
        const blob = new Blob([currentTabConfig.sampleCSV], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sample_${activeTab}_template.csv`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    // Execute File Import
    const handleFileSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedFile) return

        setIsUploading(true)
        setStatusMessage(null)

        try {
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('month', selectedMonth)

            const response = await api.post(currentTabConfig.endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            setStatusMessage({
                type: 'success',
                text: response.data?.message || 'Data imported successfully!'
            })
            setSelectedFile(null)
        } catch (err: any) {
            setStatusMessage({
                type: 'error',
                text: err.response?.data?.error || err.message || 'Import failed. Please check file format.'
            })
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border/40">
                <div>
                    <h1 className="text-3xl font-extrabold text-custom-gradient flex items-center gap-2.5">
                        <Upload className="h-7 w-7 text-indigo-500" /> Data Import Center
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Bulk import expense statements, trade orders, dividends, bank accounts, master assets, or full JSON backups.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Link href="/export">
                        <Button variant="outline" className="flex items-center gap-2 rounded-xl text-xs font-bold border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10">
                            <Download className="h-4 w-4" /> Go to Export Center
                        </Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button variant="outline" className="flex items-center gap-2 rounded-xl text-xs font-bold">
                            <ArrowLeft className="h-4 w-4" /> Dashboard
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Target Workspace Bank Account Indicator */}
            {selectedAccount && (
                <Card className="border border-border/60 bg-gradient-to-r from-card via-card to-muted/20 shadow-xs rounded-2xl">
                    <CardContent className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="flex items-center space-x-3.5 min-w-0">
                            <div 
                                className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
                                style={{ backgroundColor: selectedAccount.color }}
                            >
                                <DynamicIcon name={selectedAccount.icon} className="h-5.5 w-5.5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Target Account Workspace</p>
                                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 mt-0.5">
                                    {selectedAccount.name}
                                    {selectedAccount.isPrimary && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/10">
                                            Primary
                                        </span>
                                    )}
                                </h3>
                                <p className="text-xs text-muted-foreground truncate">{selectedAccount.bankName} • {selectedAccount.accountNumber}</p>
                            </div>
                        </div>

                        {activeTab === 'expenses' && (
                            <div className="flex items-center space-x-2 shrink-0 w-40">
                                <MonthPicker
                                    value={selectedMonth}
                                    onChange={setSelectedMonth}
                                    placeholder="Select Month"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Entity Import Tab Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-muted/40 p-1.5 rounded-2xl border border-border/40">
                {(Object.keys(TAB_CONFIGS) as ImportType[]).map((tabKey) => {
                    const cfg = TAB_CONFIGS[tabKey]
                    const Icon = cfg.icon
                    const isActive = activeTab === tabKey
                    return (
                        <button
                            key={tabKey}
                            onClick={() => {
                                setActiveTab(tabKey)
                                setSelectedFile(null)
                                setStatusMessage(null)
                            }}
                            className={cn(
                                "flex flex-col items-center justify-center py-3 px-2 rounded-xl text-xs font-bold transition-all gap-1.5 select-none",
                                isActive 
                                    ? "bg-card text-foreground shadow-md border border-border/80" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                            )}
                        >
                            <Icon className={cn("h-4.5 w-4.5 transition-transform", isActive ? "text-indigo-500 scale-110" : "text-muted-foreground")} />
                            <span>{cfg.title}</span>
                        </button>
                    )
                })}
            </div>

            {/* Import Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Upload Dropzone Card */}
                <div className="lg:col-span-5 space-y-4">
                    <Card className="border-border/60 bg-card shadow-sm rounded-2xl">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                                        <ActiveTabIcon className="h-4 w-4" />
                                    </div>
                                    <CardTitle className="text-base font-extrabold text-foreground">
                                        Import {currentTabConfig.title}
                                    </CardTitle>
                                </div>
                                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border/40">
                                    {currentTabConfig.supportedFormats}
                                </span>
                            </div>
                            <CardDescription className="text-xs text-muted-foreground mt-1">
                                {currentTabConfig.description}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <form onSubmit={handleFileSubmit} className="space-y-4">
                                <div className="border-2 border-dashed border-border/80 hover:border-indigo-500/60 rounded-2xl p-6 text-center transition-colors bg-muted/20 flex flex-col items-center justify-center gap-2 cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept={activeTab === 'backup' ? '.json' : '.csv,.xlsx,.xls,.json'}
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />

                                    <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-500">
                                        <FileSpreadsheet className="h-6 w-6" />
                                    </div>

                                    {selectedFile ? (
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-foreground font-mono">{selectedFile.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB • Ready to import</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-foreground">Click to browse or drop file here</p>
                                            <p className="text-[10px] text-muted-foreground">Supports CSV, Excel (.xlsx) & JSON</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        disabled={!selectedFile || isUploading}
                                        className="flex-1 rounded-xl text-xs font-bold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                                    >
                                        {isUploading ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin" /> Importing Data...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-4 w-4" /> Start {currentTabConfig.title} Import
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleDownloadTemplate}
                                        className="rounded-xl text-xs font-bold gap-1.5 shrink-0"
                                        title="Download Sample CSV Template"
                                    >
                                        <Download className="h-3.5 w-3.5 text-emerald-500" /> Template
                                    </Button>
                                </div>
                            </form>

                            {/* Status Notification */}
                            {statusMessage && (
                                <div className={cn(
                                    "p-3 rounded-xl border flex items-start gap-2.5 text-xs font-medium animate-in fade-in duration-200",
                                    statusMessage.type === 'success' 
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                                        : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                )}>
                                    {statusMessage.type === 'success' ? (
                                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                                    )}
                                    <span>{statusMessage.text}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Schema & Table Format Specification */}
                <div className="lg:col-span-7 space-y-4">
                    <Card className="border-border/60 bg-card shadow-sm rounded-2xl">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-extrabold flex items-center gap-2">
                                    <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0" /> Expected File Schema & Headers
                                </CardTitle>
                                <Button size="sm" variant="ghost" onClick={handleDownloadTemplate} className="text-[11px] font-bold text-indigo-500 gap-1 hover:bg-indigo-500/10">
                                    <Download className="h-3 w-3" /> Sample CSV
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="overflow-x-auto border border-border/60 rounded-xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/60 text-muted-foreground uppercase text-[9px] font-black tracking-wider border-b border-border/60">
                                        <tr>
                                            <th className="px-3 py-2">Column Header</th>
                                            <th className="px-3 py-2">Required</th>
                                            <th className="px-3 py-2">Data Type</th>
                                            <th className="px-3 py-2">Sample Value</th>
                                            <th className="px-3 py-2">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                                        {currentTabConfig.columns.map((col) => (
                                            <tr key={col.name} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-3 py-2 font-bold text-foreground">{col.name}</td>
                                                <td className="px-3 py-2">
                                                    {col.required ? (
                                                        <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 font-bold text-[9px]">REQUIRED</span>
                                                    ) : (
                                                        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold text-[9px]">OPTIONAL</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-indigo-400 font-semibold">{col.type}</td>
                                                <td className="px-3 py-2 text-emerald-400">{col.sample}</td>
                                                <td className="px-3 py-2 text-muted-foreground font-sans text-[11px]">{col.description}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Raw Sample CSV Snippet */}
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                                    Raw CSV Example Snippet
                                </span>
                                <pre className="p-3 bg-muted/60 border border-border/40 rounded-xl font-mono text-[11px] text-foreground/80 overflow-x-auto">
                                    {currentTabConfig.sampleCSV}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}