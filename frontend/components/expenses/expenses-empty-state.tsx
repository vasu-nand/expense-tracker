'use client'

import { Button } from '@/components/ui/button'

interface ExpensesEmptyStateProps {
    onAddClick?: () => void;
}

export function ExpensesEmptyState({ onAddClick }: ExpensesEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 py-16 text-center animate-in fade-in duration-300">
            {/* Clipboard / Ledger sheet base with checkmark drawings */}
            <div className="mb-6 relative opacity-0 animate-[empty-state-in_0.5s_ease-out_forwards]">
                <svg
                    className="mx-auto h-36 w-36"
                    viewBox="0 0 200 200"
                    fill="none"
                    role="img"
                    aria-hidden="true"
                >
                    {/* Blueprint grid lines */}
                    <g className="stroke-muted-foreground/15">
                        <line x1="24" y1="55" x2="176" y2="55" strokeWidth="1" strokeDasharray="3 5" />
                        <line x1="24" y1="100" x2="176" y2="100" strokeWidth="1" strokeDasharray="3 5" />
                        <line x1="24" y1="145" x2="176" y2="145" strokeWidth="1" strokeDasharray="3 5" />
                    </g>

                    {/* Background glowing circle */}
                    <circle cx="100" cy="100" r="52" fill="url(#glow-grad-exp)" opacity="0.08" className="animate-pulse" />

                    {/* Clipboard / Ledger sheet base */}
                    <rect
                        x="50" y="45" width="100" height="110" rx="12"
                        className="fill-card stroke-border"
                        strokeWidth="2.5"
                    />

                    {/* Top metal binder clip of clipboard */}
                    <rect x="85" y="38" width="30" height="12" rx="3.5" className="fill-muted-foreground/35" />
                    <path d="M94 38c0-4 12-4 12 0" className="stroke-muted-foreground/35" strokeWidth="1.5" fill="none" />

                    {/* Checkbox item 1 */}
                    <circle cx="70" cy="74" r="6" className="stroke-muted-foreground/30" strokeWidth="1.5" fill="none" />
                    <path
                        d="M67 74l2.2 2.2 4.4-4.4"
                        className="stroke-[var(--btn-gradient-start,#14b8a6)]"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        pathLength="1"
                        style={{
                            strokeDasharray: 1,
                            strokeDashoffset: 1,
                            animation: 'empty-state-draw 0.4s 0.4s ease-out forwards'
                        }}
                    />
                    <line x1="88" y1="74" x2="135" y2="74" className="stroke-muted-foreground/25" strokeWidth="3" strokeLinecap="round" />

                    {/* Checkbox item 2 */}
                    <circle cx="70" cy="98" r="6" className="stroke-muted-foreground/30" strokeWidth="1.5" fill="none" />
                    <path
                        d="M67 98l2.2 2.2 4.4-4.4"
                        className="stroke-[var(--btn-gradient-start,#14b8a6)]"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        pathLength="1"
                        style={{
                            strokeDasharray: 1,
                            strokeDashoffset: 1,
                            animation: 'empty-state-draw 0.4s 0.75s ease-out forwards'
                        }}
                    />
                    <line x1="88" y1="98" x2="125" y2="98" className="stroke-muted-foreground/25" strokeWidth="3" strokeLinecap="round" />

                    {/* Checkbox item 3 */}
                    <circle cx="70" cy="122" r="6" className="stroke-muted-foreground/30" strokeWidth="1.5" fill="none" />
                    <line x1="88" y1="122" x2="130" y2="122" className="stroke-muted-foreground/25" strokeWidth="3" strokeLinecap="round" />

                    {/* Golden coin hovering/bouncing outside ledger */}
                    <g className="animate-bounce" style={{ animationDuration: '3.2s' }}>
                        <circle cx="148" cy="124" r="14" fill="url(#coin-gold)" stroke="#d97706" strokeWidth="1.5" />
                        <text x="148" y="128.5" fontSize="13" fontWeight="black" fill="#b45309" textAnchor="middle" fontFamily="sans-serif">₹</text>
                    </g>

                    <defs>
                        <linearGradient id="glow-grad-exp" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="var(--btn-gradient-start, #14b8a6)" />
                            <stop offset="100%" stopColor="var(--btn-gradient-end, #0f766e)" />
                        </linearGradient>
                        <linearGradient id="coin-gold" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#fef08a" />
                            <stop offset="100%" stopColor="#f59e0b" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            <h3 className="text-xl font-bold text-foreground opacity-0 animate-[empty-state-in_0.4s_ease-out_0.15s_forwards]">
                No Transactions Found
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed opacity-0 animate-[empty-state-in_0.4s_ease-out_0.25s_forwards]">
                There are no transactions logged for this view. Start tracking your spending by creating your first entry!
            </p>
            {onAddClick && (
                <Button
                    onClick={onAddClick}
                    className="mt-6 bg-custom-btn-gradient text-white shadow-sm hover:shadow-md transition-shadow duration-200 opacity-0 animate-[empty-state-in_0.4s_ease-out_0.35s_forwards]"
                >
                    <span>Create your first expense</span>
                </Button>
            )}

            <style jsx>{`
                @keyframes empty-state-in {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes empty-state-draw {
                    to { stroke-dashoffset: 0; }
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
