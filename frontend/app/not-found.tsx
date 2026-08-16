'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[75vh] text-center p-4 sm:p-6 animate-in fade-in duration-500">
            <div className="relative w-full max-w-sm h-64 mb-6 flex items-center justify-center">
                <Image 
                    src="/common/not-found.svg" 
                    alt="404 Page Not Found" 
                    width={360} 
                    height={270}
                    priority
                    className="w-auto h-full max-h-64 drop-shadow-xl"
                />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-custom-gradient tracking-tight mb-2">
                404 - Page Not Found
            </h1>
            <p className="text-muted-foreground max-w-md mb-8 text-xs sm:text-sm leading-relaxed">
                The financial page, portfolio record, or transaction log you are looking for doesn't exist or has been relocated to another workspace.
            </p>

            <Link href="/dashboard">
                <Button className="flex items-center gap-2 rounded-xl text-xs font-bold bg-custom-btn-gradient hover:scale-105 transition-all text-white shadow-md px-6 py-2.5 h-10">
                    <Home className="h-4 w-4" /> Return to Dashboard
                </Button>
            </Link>
        </div>
    )
}
