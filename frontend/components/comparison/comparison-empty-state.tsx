'use client'

import { Button } from '@/components/ui/button'

interface ComparisonEmptyStateProps {
    onAction?: () => void;
}

export function ComparisonEmptyState({ onAction }: ComparisonEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 py-16 text-center animate-in fade-in duration-300">
            {/* Side-by-side sheets and flow arrow SVG */}
            <div className="mb-6 relative opacity-0 animate-[empty-state-in_0.5s_ease-out_forwards]">
                <svg
                    className="mx-auto h-36 w-36"
                    viewBox="0 0 200 200"
                    fill="none"
                    role="img"
                    aria-hidden="true"
                >
                    {/* Background blueprint grid lines */}
                    <g className="stroke-muted-foreground/15">
                        <line x1="24" y1="55" x2="176" y2="55" strokeWidth="1" strokeDasharray="3 5" />
                        <line x1="24" y1="100" x2="176" y2="100" strokeWidth="1" strokeDasharray="3 5" />
                        <line x1="24" y1="145" x2="176" y2="145" strokeWidth="1" strokeDasharray="3 5" />
                    </g>

                    {/* Background pulsing glow */}
                    <circle cx="100" cy="100" r="50" fill="url(#glow-grad-comp)" opacity="0.08" className="animate-pulse" />

                    {/* Left Document (Angled -5deg) */}
                    <g transform="rotate(-5 60 90)">
                        <rect
                            x="35" y="55" width="50" height="78" rx="8"
                            className="fill-card stroke-border"
                            strokeWidth="2"
                        />
                        <line x1="45" y1="70" x2="75" y2="70" className="stroke-muted-foreground/25" strokeWidth="2.5" strokeLinecap="round" />
                        <rect x="45" y="82" width="15" height="15" rx="3" className="fill-rose-500/10 stroke-rose-500/20" strokeWidth="1" />
                        <rect x="45" y="103" width="30" height="12" rx="3" className="fill-muted-foreground/15" />
                    </g>

                    {/* Right Document (Angled 5deg) */}
                    <g transform="rotate(5 140 90)">
                        <rect
                            x="115" y="55" width="50" height="78" rx="8"
                            className="fill-card stroke-border"
                            strokeWidth="2"
                        />
                        <line x1="125" y1="70" x2="155" y2="70" className="stroke-muted-foreground/25" strokeWidth="2.5" strokeLinecap="round" />
                        <rect x="125" y="82" width="15" height="15" rx="3" className="fill-emerald-500/10 stroke-emerald-500/20" strokeWidth="1" />
                        <rect x="125" y="103" width="30" height="12" rx="3" className="fill-muted-foreground/15" />
                    </g>

                    {/* Center Comparison Connector / Flow Arrow */}
                    <g className="arrow-pulse">
                        {/* Horizontal connection line */}
                        <line x1="91" y1="94" x2="109" y2="94" className="stroke-[var(--btn-gradient-start,#14b8a6)]" strokeWidth="2.5" strokeLinecap="round" />
                        {/* Left arrow head */}
                        <path d="M96 89l-5 5 5 5" className="stroke-[var(--btn-gradient-start,#14b8a6)]" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Right arrow head */}
                        <path d="M104 89l5 5-5 5" className="stroke-[var(--btn-gradient-start,#14b8a6)]" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </g>

                    {/* Floating checkmarks / sparkles in between */}
                    <path d="M100 62l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#f59e0b" opacity="0.6" className="animate-pulse" />

                    <defs>
                        <linearGradient id="glow-grad-comp" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="var(--btn-gradient-start, #14b8a6)" />
                            <stop offset="100%" stopColor="var(--btn-gradient-end, #0f766e)" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            <h3 className="text-xl font-bold text-foreground opacity-0 animate-[empty-state-in_0.4s_ease-out_0.15s_forwards]">
                No Accounts for Comparison
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed opacity-0 animate-[empty-state-in_0.4s_ease-out_0.25s_forwards]">
                You need at least one bank account workspace and transaction records to begin comparison insights. Please add an account or upload a statement.
            </p>
            {onAction && (
                <Button
                    onClick={onAction}
                    className="mt-6 bg-custom-btn-gradient text-white shadow-sm hover:shadow-md transition-shadow duration-200 opacity-0 animate-[empty-state-in_0.4s_ease-out_0.35s_forwards]"
                >
                    <span>Add Bank Account</span>
                </Button>
            )}

            <style jsx>{`
                @keyframes empty-state-in {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes arrow-bounce-x {
                    0%, 100% { transform: scaleX(1); }
                    50% { transform: scaleX(1.15); }
                }
                
                .arrow-pulse {
                    transform-origin: center;
                    animation: arrow-bounce-x 2s ease-in-out infinite;
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
