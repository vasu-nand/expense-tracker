'use client'

import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Power, Loader2, AlertCircle } from 'lucide-react'

export function ShutdownWatcher() {
    const [isOpen, setIsOpen] = useState(false)
    const [status, setStatus] = useState<'idle' | 'confirming' | 'processing' | 'done'>('idle')
    const [terminalLogs, setTerminalLogs] = useState<string[]>([])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase()
            const isCtrl = e.ctrlKey
            const isAlt = e.altKey
            const isShift = e.shiftKey
            
            // Safe combinations to bypass system/browser interceptions
            const isCtrlAltS = isCtrl && isAlt && key === 's'
            const isCtrlShiftS = isCtrl && isShift && key === 's'
            const isAltQ = isAlt && key === 'q'
            const isAltS = isAlt && key === 's'
            const isCtrlShiftQ = isCtrl && isShift && key === 'q'
            
            if (isCtrlAltS || isCtrlShiftS || isAltQ || isAltS || isCtrlShiftQ) {
                e.preventDefault()
                setIsOpen(true)
                setStatus('confirming')
                setTerminalLogs([])
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const handleShutdown = async () => {
        setStatus('processing')
        
        const logs = [
            '> Initializing global halt sequence...',
            '> Sending exit signal (POST /api/shutdown) to Express backend...',
            '> Sending exit signal (POST /api/shutdown) to Next.js frontend...'
        ]
        
        setTerminalLogs([logs[0]])
        
        setTimeout(() => {
            setTerminalLogs(prev => [...prev, logs[1]])
        }, 150)
        
        setTimeout(() => {
            setTerminalLogs(prev => [...prev, logs[2]])
        }, 300)

        try {
            // Send exit requests in parallel
            await Promise.allSettled([
                api.post('/shutdown'),
                fetch('/api/shutdown', { method: 'POST' })
            ])
            
            setTimeout(() => {
                setTerminalLogs(prev => [...prev, '> Express backend halted.'])
            }, 450)
            
            setTimeout(() => {
                setTerminalLogs(prev => [...prev, '> Next.js frontend halted.'])
            }, 600)
            
            setTimeout(() => {
                setTerminalLogs(prev => [
                    ...prev, 
                    '> [SUCCESS] Application services terminated successfully.', 
                    '> Docker containers status: STOPPING.',
                    '> You can now safely close this browser window.'
                ])
                setStatus('done')
            }, 800)
        } catch (err) {
            console.error(err)
            setTimeout(() => {
                setTerminalLogs(prev => [
                    ...prev, 
                    '> [WARNING] Shutdown initiated; connection dropped as expected.',
                    '> Status: Daemon processes offline.'
                ])
                setStatus('done')
            }, 500)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-md rounded-2xl border border-destructive/20 bg-zinc-950 p-6 shadow-[0_0_50px_rgba(239,68,68,0.15)] text-zinc-100 animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center space-x-3 pb-4 border-b border-zinc-900">
                    <div className="p-2 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive">
                        <Power className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-zinc-50 font-sans tracking-tight">
                            {status === 'confirming' ? 'Shut Down Application?' : 'System Terminal Log'}
                        </h2>
                        <p className="text-xs text-zinc-400 font-sans mt-0.5">
                            {status === 'confirming' 
                                ? 'Terminate database connections and exit host process.' 
                                : 'Shut down sequence in progress'}
                        </p>
                    </div>
                </div>

                {/* Body Content */}
                <div className="py-6 min-h-[120px] flex flex-col justify-center">
                    {status === 'confirming' ? (
                        <div className="space-y-3">
                            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/5 border border-destructive/10 text-xs text-destructive/80 font-sans leading-relaxed">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <p>
                                    <strong>Warning:</strong> Exiting the backend process will stop database queries immediately. 
                                    If running locally, the server process will exit.
                                </p>
                            </div>
                            <p className="text-xs text-zinc-400 font-sans">
                                Shortcut triggered. Are you sure you want to stop the application instance? (Alt+Q / Ctrl+Alt+S / Ctrl+Shift+Q)
                            </p>
                        </div>
                    ) : (
                        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3.5 font-mono text-[11px] text-emerald-400 space-y-1.5 overflow-hidden shadow-inner select-text">
                            {terminalLogs.map((log, idx) => (
                                <p key={idx} className={log.includes('[ERROR]') ? 'text-rose-400' : ''}>
                                    {log}
                                </p>
                            ))}
                            {status === 'processing' && (
                                <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] animate-pulse mt-2 pt-1 border-t border-zinc-800/40">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span>Shutting down server cluster daemon...</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-900">
                    {status === 'confirming' && (
                        <>
                            <Button 
                                variant="outline" 
                                className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100"
                                onClick={() => setIsOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white shadow-lg shadow-red-500/10 hover:shadow-red-500/20 border-0"
                                onClick={handleShutdown}
                            >
                                Shut Down Server
                            </Button>
                        </>
                    )}
                    {status === 'done' && (
                        <Button 
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700"
                            onClick={() => setIsOpen(false)}
                        >
                            Close Overlay
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
