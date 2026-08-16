'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { RefreshCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Unhandled dashboard crash:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[75vh] text-center p-4 sm:p-6 animate-in fade-in duration-500">
            <div className="relative w-full max-w-sm h-64 mb-6 flex items-center justify-center">
                <Image 
                    src="/common/error.svg" 
                    alt="500 App Error" 
                    width={360} 
                    height={270}
                    priority
                    className="w-auto h-full max-h-64 drop-shadow-xl"
                />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-custom-gradient tracking-tight mb-2">
                Something Went Wrong
            </h1>
            <p className="text-muted-foreground max-w-md mb-8 text-xs sm:text-sm leading-relaxed">
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
