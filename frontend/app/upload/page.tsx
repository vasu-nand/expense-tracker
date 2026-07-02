'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/upload/file-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Info, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAccount } from '@/components/account-context'
import { DynamicIcon } from '@/components/navigation'
import { getLocalMonth } from '@/lib/utils'
import { MonthPicker } from '@/components/ui/month-picker'

export default function UploadPage() {
    const { selectedAccount } = useAccount()
    const [uploadStatus, setUploadStatus] = useState<string>('')
    const [selectedMonth, setSelectedMonth] = useState(getLocalMonth())

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Clean Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border/40">
                <div>
                    <h1 className="text-3xl font-extrabold text-custom-gradient">
                        Upload Transactions
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Upload CSV or Excel statements to bulk-import expenses and income, then update database summaries automatically.
                    </p>
                </div>
                <Link href="/dashboard">
                    <Button variant="outline" className="flex items-center gap-2 rounded-xl text-xs font-bold">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
                {/* Bank Account Workspace Info Card */}
                {selectedAccount && (
                    <Card className="border border-border/60 bg-muted/20">
                        <CardContent className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div className="flex items-center space-x-3.5">
                                <div 
                                    className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
                                    style={{ backgroundColor: selectedAccount.color }}
                                >
                                    <DynamicIcon name={selectedAccount.icon} className="h-5.5 w-5.5" />
                                </div>
                                <div className="truncate">
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Target Workspace</p>
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
                            
                            {/* Month Selector for Upload */}
                            <div className="flex items-center space-x-2 shrink-0 w-40">
                                <MonthPicker
                                    value={selectedMonth}
                                    onChange={setSelectedMonth}
                                    placeholder="Select Month"
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Upload statement card */}
                <Card className="border-border/60 bg-card/50">
                    <CardHeader>
                        <CardTitle className="text-base font-extrabold text-foreground">Upload Statement File</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FileUpload onUploadStatus={setUploadStatus} month={selectedMonth} />
                        {uploadStatus && (
                            <div className="mt-4 p-3 bg-muted border border-border/40 rounded-xl">
                                <p className="text-xs font-bold text-foreground">{uploadStatus}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Guide Section */}
                <Card className="border-border/60">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base font-extrabold">
                            <Info className="h-4.5 w-4.5 text-teal-500 shrink-0" /> File Format Guide
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-xs">
                        <p className="text-muted-foreground">
                            Upload Excel (.xlsx, .xls) or CSV files. The parser auto-detects column headers. Supported columns:
                        </p>

                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">Required Columns</p>
                            <div className="bg-muted p-3 rounded-xl border border-border/20 font-mono flex gap-4 text-zinc-300">
                                <span className="text-teal-400 font-bold">Day</span>
                                <span className="text-zinc-600">|</span>
                                <span className="text-teal-400 font-bold">Expense / Amount</span>
                                <span className="text-zinc-600">|</span>
                                <span className="text-teal-400 font-bold">Reason / Description</span>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">Optional Columns</p>
                            <div className="bg-muted p-3 rounded-xl border border-border/20 font-mono flex gap-4 text-zinc-300">
                                <span className="text-indigo-400 font-bold">Type</span>
                                <span className="text-zinc-600">— values: <code>expense</code> (default) or <code>income</code></span>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">Mixed Income + Expense Example</p>
                            <div className="bg-muted/40 border border-border/30 rounded-xl overflow-hidden font-mono">
                                <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-muted text-muted-foreground font-bold">
                                    <span>Day</span><span>Amount</span><span>Reason</span><span>Type</span>
                                </div>
                                <div className="divide-y divide-border/20">
                                    <div className="grid grid-cols-4 gap-4 px-4 py-2 text-foreground/80"><span>1</span><span>50000</span><span>Monthly salary credit</span><span className="text-emerald-500 font-bold">income</span></div>
                                    <div className="grid grid-cols-4 gap-4 px-4 py-2 text-foreground/80"><span>1</span><span>70</span><span>Breakfast</span><span className="text-rose-400">expense</span></div>
                                    <div className="grid grid-cols-4 gap-4 px-4 py-2 text-foreground/80"><span>5</span><span>5000</span><span>Freelance project payout</span><span className="text-emerald-500 font-bold">income</span></div>
                                    <div className="grid grid-cols-4 gap-4 px-4 py-2 text-foreground/80"><span>7</span><span>15000</span><span>Monthly rent payment</span><span className="text-rose-400">expense</span></div>
                                </div>
                            </div>
                        </div>

                        <p className="text-[10px] text-muted-foreground">
                            <span className="font-semibold text-foreground">Note:</span> Categories are auto-detected from the <code className="bg-muted px-1 rounded">Reason</code> column using keyword matching. Income categories like Salary, Freelance, Investments, and Gifts are automatically recognized.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}