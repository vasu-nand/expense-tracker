'use client'

import { useState } from 'react'
import { Hammer, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'
import { useRouter } from 'next/navigation'

export default function MaintenancePage() {
    const router = useRouter()
    const [checking, setChecking] = useState(false)

    const checkStatus = async () => {
        try {
            setChecking(true)
            // Call a health endpoint on the backend
            const res = await api.get('/health')
            if (res.data && res.data.status === 'ok') {
                // System is back online! Redirect to dashboard
                router.push('/dashboard')
            }
        } catch (err) {
            console.log('System still under maintenance or offline.')
        } finally {
            setChecking(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4 animate-in fade-in duration-500">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-2xl animate-pulse" />
                <div className="relative h-24 w-24 rounded-2xl bg-card border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-xl">
                    <Hammer className="h-12 w-12 animate-bounce" />
                </div>
            </div>

            <h1 className="text-4xl font-extrabold text-custom-gradient tracking-tight mb-2">System Under Maintenance</h1>
            <p className="text-muted-foreground max-w-md mb-8 text-sm">
                We are currently performing database synchronization, migration, or core upgrades. Please check back shortly.
            </p>

            <Button 
                onClick={checkStatus}
                disabled={checking}
                className="flex items-center gap-2 rounded-xl text-xs font-bold bg-custom-btn-gradient hover:scale-105 transition-all text-white shadow-md px-5 py-2.5 h-10"
            >
                <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} /> 
                {checking ? 'Checking Status...' : 'Check If Online'}
            </Button>
        </div>
    )
}
