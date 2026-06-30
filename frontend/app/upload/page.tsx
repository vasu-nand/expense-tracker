'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/upload/file-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Info } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function UploadPage() {
    const [uploadStatus, setUploadStatus] = useState<string>('')

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
                <div>
                    <h1 className="text-3xl font-bold text-custom-gradient">
                        Upload Transactions
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Upload CSV or Excel statements to bulk-import expenses and income, then update database summaries automatically.</p>
                </div>
                <Link href="/dashboard">
                    <Button variant="outline" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Upload File</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FileUpload onUploadStatus={setUploadStatus} />
                        {uploadStatus && (
                            <div className="mt-4 p-3 bg-muted rounded-md">
                                <p className="text-sm">{uploadStatus}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-teal-500" /> File Format Guide
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Upload Excel (.xlsx, .xls) or CSV files. The parser auto-detects column headers. Supported columns:
                        </p>

                        {/* Required columns */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Required Columns</p>
                            <div className="bg-muted p-3 rounded-md font-mono text-sm flex gap-4">
                                <span className="text-teal-500 font-bold">Day</span>
                                <span className="text-zinc-400">|</span>
                                <span className="text-teal-500 font-bold">Expense / Amount</span>
                                <span className="text-zinc-400">|</span>
                                <span className="text-teal-500 font-bold">Reason / Description</span>
                            </div>
                        </div>

                        {/* Optional columns */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Optional Columns</p>
                            <div className="bg-muted p-3 rounded-md font-mono text-sm flex gap-4">
                                <span className="text-indigo-400 font-bold">Type</span>
                                <span className="text-zinc-400">— values: <code>expense</code> (default) or <code>income</code></span>
                            </div>
                        </div>

                        {/* Expense-only example */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Expense-only Example</p>
                            <div className="bg-muted/60 border border-border/60 rounded-md overflow-hidden text-xs font-mono">
                                <div className="grid grid-cols-3 gap-4 px-4 py-2 bg-muted text-muted-foreground font-bold">
                                    <span>Day</span><span>Expense</span><span>Reason</span>
                                </div>
                                <div className="divide-y divide-border/30">
                                    <div className="grid grid-cols-3 gap-4 px-4 py-1.5 text-foreground/80"><span>1</span><span>70</span><span>Breakfast (3 doodh + coffee)</span></div>
                                    <div className="grid grid-cols-3 gap-4 px-4 py-1.5 text-foreground/80"><span>1</span><span>100</span><span>Lunch</span></div>
                                    <div className="grid grid-cols-3 gap-4 px-4 py-1.5 text-foreground/80"><span>2</span><span>78</span><span>Breakfast (2 doodh + eggs)</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Mixed income + expense example */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Mixed Income + Expense Example</p>
                            <div className="bg-muted/60 border border-border/60 rounded-md overflow-hidden text-xs font-mono">
                                <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-muted text-muted-foreground font-bold">
                                    <span>Day</span><span>Amount</span><span>Reason</span><span>Type</span>
                                </div>
                                <div className="divide-y divide-border/30">
                                    <div className="grid grid-cols-4 gap-4 px-4 py-1.5 text-foreground/80"><span>1</span><span>50000</span><span>Monthly salary credit</span><span className="text-emerald-500 font-bold">income</span></div>
                                    <div className="grid grid-cols-4 gap-4 px-4 py-1.5 text-foreground/80"><span>1</span><span>70</span><span>Breakfast</span><span className="text-rose-400">expense</span></div>
                                    <div className="grid grid-cols-4 gap-4 px-4 py-1.5 text-foreground/80"><span>5</span><span>5000</span><span>Freelance project payout</span><span className="text-emerald-500 font-bold">income</span></div>
                                    <div className="grid grid-cols-4 gap-4 px-4 py-1.5 text-foreground/80"><span>7</span><span>15000</span><span>Monthly rent payment</span><span className="text-rose-400">expense</span></div>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">Note:</span> Categories are auto-detected from the <code className="bg-muted px-1 rounded">Reason</code> column using keyword matching. Income categories like Salary, Freelance, Investments, and Gifts are automatically recognized.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}