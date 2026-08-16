'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api'

export default function MaintenancePage() {
    const router = useRouter()
    const [checking, setChecking] = useState(false)

    const checkStatus = async () => {
        try {
            setChecking(true)
            const res = await api.get('/health')
            if (res.data && res.data.status === 'ok') {
                router.push('/dashboard')
            }
        } catch (err) {
            console.log('System still under maintenance or offline.')
        } finally {
            setChecking(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[75vh] text-center p-4 sm:p-6 animate-in fade-in duration-500">
            <div className="relative w-full max-w-sm h-64 mb-6 flex items-center justify-center">
                <Image 
                    src="/common/maintenance.svg" 
                    alt="System Under Maintenance" 
                    width={360} 
                    height={270}
                    priority
                    className="w-auto h-full max-h-64 drop-shadow-xl"
                />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-custom-gradient tracking-tight mb-2">
                System Under Maintenance
            </h1>
            <p className="text-muted-foreground max-w-md mb-8 text-xs sm:text-sm leading-relaxed">
                We are currently performing database synchronization, migration, or core upgrades. Please check back shortly.
            </p>

            <Button 
                onClick={checkStatus}
                disabled={checking}
                className="flex items-center gap-2 rounded-xl text-xs font-bold bg-custom-btn-gradient hover:scale-105 transition-all text-white shadow-md px-6 py-2.5 h-10"
            >
                <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} /> 
                {checking ? 'Checking Status...' : 'Check If Online'}
            </Button>
        </div>
    )
}
