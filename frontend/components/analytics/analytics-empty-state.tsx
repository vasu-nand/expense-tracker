'use client'

import { Button } from '@/components/ui/button'

interface AnalyticsEmptyStateProps {
    onAction?: () => void;
}

export function AnalyticsEmptyState({ onAction }: AnalyticsEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 py-16 text-center animate-in fade-in duration-300">
            {/* Magnifying Glass & Charts SVG */}
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
                    <circle cx="100" cy="100" r="50" fill="url(#glow-grad-ana)" opacity="0.08" className="animate-pulse" />

                    {/* Ledger / Report Sheet */}
                    <rect
                        x="55" y="45" width="90" height="110" rx="12"
                        className="fill-card stroke-border"
                        strokeWidth="2.5"
                    />

                    {/* Ledger Content placeholders */}
                    <rect x="70" y="65" width="60" height="12" rx="3" className="fill-muted-foreground/15" />
                    <rect x="70" y="85" width="45" height="8" rx="2" className="fill-muted-foreground/10" />
                    <circle cx="75" cy="115" r="8" className="stroke-muted-foreground/20" strokeWidth="1.5" fill="none" />
                    <line x1="90" y1="115" x2="130" y2="115" className="stroke-muted-foreground/20" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Magnifying Glass that floats around the ledger */}
                    <g className="magnifier-group">
                        {/* Glass Rim */}
                        <circle cx="110" cy="100" r="18" className="stroke-[var(--btn-gradient-start,#14b8a6)] fill-card/65" strokeWidth="3" />
                        {/* Glass Handle */}
                        <line x1="123" y1="113" x2="142" y2="132" className="stroke-[var(--btn-gradient-start,#14b8a6)]" strokeWidth="4.5" strokeLinecap="round" />
                        {/* Sparkle inside Glass */}
                        <path d="M107 94l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z" fill="#f59e0b" className="animate-pulse" />
                    </g>

                    {/* Sparkles around */}
                    <path d="M35 80l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z" fill="#3b82f6" opacity="0.5" className="animate-pulse" />

                    <defs>
                        <linearGradient id="glow-grad-ana" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="var(--btn-gradient-start, #14b8a6)" />
                            <stop offset="100%" stopColor="var(--btn-gradient-end, #0f766e)" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            <h3 className="text-xl font-bold text-foreground opacity-0 animate-[empty-state-in_0.4s_ease-out_0.15s_forwards]">
                No Analytics Data Available
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed opacity-0 animate-[empty-state-in_0.4s_ease-out_0.25s_forwards]">
                We couldn't find any financial records for the selected period. Add your transactions or upload a statement to unlock advanced analytics and spending predictions.
            </p>
            {onAction && (
                <Button
                    onClick={onAction}
                    className="mt-6 bg-custom-btn-gradient text-white shadow-sm hover:shadow-md transition-shadow duration-200 opacity-0 animate-[empty-state-in_0.4s_ease-out_0.35s_forwards]"
                >
                    <span>Add your first transaction</span>
                </Button>
            )}

            <style jsx>{`
                @keyframes empty-state-in {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes magnifier-float {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    50% { transform: translate(6px, -8px) rotate(4deg); }
                }
                
                .magnifier-group {
                    animation: magnifier-float 4s ease-in-out infinite;
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
