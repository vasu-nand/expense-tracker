'use client'

import Link from 'next/link'
import { FileQuestion, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4 animate-in fade-in duration-500">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
                <div className="relative h-24 w-24 rounded-2xl bg-card border border-border/80 flex items-center justify-center text-primary shadow-xl">
                    <FileQuestion className="h-12 w-12" />
                </div>
            </div>

            <h1 className="text-4xl font-extrabold text-custom-gradient tracking-tight mb-2">404 - Page Not Found</h1>
            <p className="text-muted-foreground max-w-md mb-8 text-sm">
                The financial page or transaction record you are looking for doesn't exist or has been relocated to another workspace.
            </p>

            <Link href="/dashboard">
                <Button className="flex items-center gap-2 rounded-xl text-xs font-bold bg-custom-btn-gradient hover:scale-105 transition-all text-white shadow-md px-5 py-2.5 h-10">
                    <Home className="h-4 w-4" /> Return to Dashboard
                </Button>
            </Link>
        </div>
    )
}
