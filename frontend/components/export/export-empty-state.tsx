'use client'

import { Button } from '@/components/ui/button'

interface ExportEmptyStateProps {
    onAction?: () => void;
}

export function ExportEmptyState({ onAction }: ExportEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 py-16 text-center animate-in fade-in duration-300">
            {/* Export / Download Report SVG */}
            <div className="mb-6 relative opacity-0 animate-[empty-state-in_0.5s_ease-out_forwards]">
                <svg
                    className="mx-auto h-36 w-36"
                    viewBox="0 0 200 200"
                    fill="none"
                    role="img"
                    aria-hidden="true"
                >
                    {/* Background grid */}
                    <g className="stroke-muted-foreground/15">
                        <line x1="24" y1="55" x2="176" y2="55" strokeWidth="1" strokeDasharray="3 5" />
                        <line x1="24" y1="100" x2="176" y2="100" strokeWidth="1" strokeDasharray="3 5" />
                        <line x1="24" y1="145" x2="176" y2="145" strokeWidth="1" strokeDasharray="3 5" />
                    </g>

                    {/* Background pulsing glow */}
                    <circle cx="100" cy="100" r="50" fill="url(#glow-grad-exp-empty)" opacity="0.08" className="animate-pulse" />

                    {/* PDF/Report Document Sheet */}
                    <rect
                        x="55" y="45" width="90" height="110" rx="12"
                        className="fill-card stroke-border"
                        strokeWidth="2.5"
                    />

                    {/* Decorative document lines */}
                    <line x1="75" y1="70" x2="125" y2="70" className="stroke-muted-foreground/20" strokeWidth="3.5" strokeLinecap="round" />
                    <line x1="75" y1="88" x2="115" y2="88" className="stroke-muted-foreground/20" strokeWidth="3" strokeLinecap="round" />

                    {/* Downward bouncing download arrow */}
                    <g className="download-arrow-group">
                        <line x1="100" y1="90" x2="100" y2="125" className="stroke-[var(--btn-gradient-start,#14b8a6)]" strokeWidth="4.5" strokeLinecap="round" />
                        <path d="M91 116l9 9 9-9" className="stroke-[var(--btn-gradient-start,#14b8a6)]" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    </g>

                    {/* Recipient box at the bottom inside sheet */}
                    <path d="M75 136h50" className="stroke-muted-foreground/35" strokeWidth="3.5" strokeLinecap="round" />

                    <defs>
                        <linearGradient id="glow-grad-exp-empty" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="var(--btn-gradient-start, #14b8a6)" />
                            <stop offset="100%" stopColor="var(--btn-gradient-end, #0f766e)" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            <h3 className="text-xl font-bold text-foreground opacity-0 animate-[empty-state-in_0.4s_ease-out_0.15s_forwards]">
                No Data Available for Export
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed opacity-0 animate-[empty-state-in_0.4s_ease-out_0.25s_forwards]">
                There are no transaction records matching the selected configuration. Upload a bank statement or add transactions to enable exporting.
            </p>
            {onAction && (
                <Button
                    onClick={onAction}
                    className="mt-6 bg-custom-btn-gradient text-white shadow-sm hover:shadow-md transition-shadow duration-200 opacity-0 animate-[empty-state-in_0.4s_ease-out_0.35s_forwards]"
                >
                    <span>Add Transaction</span>
                </Button>
            )}

            <style jsx>{`
                @keyframes empty-state-in {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes download-bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(5px); }
                }
                
                .download-arrow-group {
                    animation: download-bounce 2s ease-in-out infinite;
                }

                @media (prefers-reduced-motion: reduce) {
                    svg *, div, h3, p, button {
                        animation: none !important;
                        opacity: 1 !important;
                        transform: none !important;
                    }
                }
            `}</style>
        </div>
    )
}
