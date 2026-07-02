'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an analytics or reporting service
        console.error('Unhandled dashboard crash:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4 animate-in fade-in duration-500">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-rose-500/10 rounded-full blur-2xl animate-pulse" />
                <div className="relative h-24 w-24 rounded-2xl bg-card border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-xl">
                    <AlertTriangle className="h-12 w-12" />
                </div>
            </div>

            <h1 className="text-4xl font-extrabold text-custom-gradient tracking-tight mb-2">Something Went Wrong</h1>
            <p className="text-muted-foreground max-w-md mb-8 text-sm">
                An unexpected crash occurred while processing the financial dashboard state. You can try reloading or return home.
            </p>

            <div className="flex items-center gap-3 justify-center">
                <Button 
                    onClick={() => reset()}
                    className="flex items-center gap-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground transition-all px-5 py-2.5 h-10 border border-border/80"
                >
                    <RefreshCcw className="h-4 w-4" /> Try Again
                </Button>
                
                <Link href="/dashboard">
                    <Button className="flex items-center gap-2 rounded-xl text-xs font-bold bg-custom-btn-gradient hover:scale-105 transition-all text-white shadow-md px-5 py-2.5 h-10">
                        <Home className="h-4 w-4" /> Go to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    )
}
