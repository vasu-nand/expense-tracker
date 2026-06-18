'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/upload/file-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function UploadPage() {
    const [uploadStatus, setUploadStatus] = useState<string>('')

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Upload Expenses
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Upload CSV or Excel statements to import transactions and update database summaries.</p>
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
                        <CardTitle>File Format Guide</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Upload Excel (.xlsx, .xls) or CSV files with the following columns:
                            </p>
                            <div className="bg-muted p-3 rounded-md font-mono text-sm">
                                Day | Expense | Reason
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                Example: <br />
                                1 | 70 | Breakfast (3 doodh + coffee)<br />
                                1 | 100 | Lunch<br />
                                2 | 78 | Breakfast (2 doodh + coffee + eggs)
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}