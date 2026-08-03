'use client'

import { Button } from '@/components/ui/button'

interface DashboardEmptyStateProps {
    onAction?: () => void;
}

export function DashboardEmptyState({ onAction }: DashboardEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 py-16 text-center animate-in fade-in duration-300">
            {/* Dashboard Analytics Empty State SVG */}
            <div className="mb-6 relative opacity-0 animate-[empty-state-in_0.5s_ease-out_forwards]">
                <svg
                    className="mx-auto h-36 w-36"
                    viewBox="0 0 200 200"
                    fill="none"
                    role="img"
                    aria-hidden="true"
                >
                    {/* Faint background grid for depth */}
                    <g className="stroke-muted-foreground/15">
                        <line x1="24" y1="55" x2="176" y2="55" strokeWidth="1" strokeDasharray="3 5" />
                        <line x1="24" y1="100" x2="176" y2="100" strokeWidth="1" strokeDasharray="3 5" />
                        <line x1="24" y1="145" x2="176" y2="145" strokeWidth="1" strokeDasharray="3 5" />
                    </g>

                    {/* Background pulsing glow */}
                    <circle cx="100" cy="100" r="50" fill="url(#glow-grad-dash)" opacity="0.08" className="animate-pulse" />

                    {/* Dashboard card frame */}
                    <rect
                        x="45" y="55" width="110" height="90" rx="14"
                        className="fill-card stroke-border"
                        strokeWidth="2"
                    />

                    {/* Card header indicators */}
                    <line x1="60" y1="72" x2="90" y2="72" className="stroke-muted-foreground/30" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="140" cy="72" r="4" className="stroke-muted-foreground/30" strokeWidth="2" fill="none" />

                    {/* Bar graphs raising up from bottom */}
                    <rect x="60" y="98" width="8" height="27" rx="2" fill="hsl(var(--muted-foreground) / 0.15)" className="dash-bar-1" />
                    <rect x="74" y="88" width="8" height="37" rx="2" fill="hsl(var(--muted-foreground) / 0.15)" className="dash-bar-2" />
                    <rect x="88" y="106" width="8" height="19" rx="2" fill="hsl(var(--muted-foreground) / 0.15)" className="dash-bar-3" />

                    {/* Signature line chart drawing itself */}
                    <path
                        d="M60 128 L82 108 L102 118 L124 90 L146 100"
                        className="stroke-[var(--btn-gradient-start,#14b8a6)]"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        pathLength="1"
                        style={{
                            strokeDasharray: 1,
                            strokeDashoffset: 1,
                            animation: 'empty-state-draw 1.1s 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                        }}
                    />

                    {/* Endpoint marker settling as drawing ends */}
                    <circle
                        cx="146" cy="100" r="5"
                        className="fill-[var(--btn-gradient-start,#14b8a6)] stroke-card opacity-0"
                        strokeWidth="1.5"
                        style={{ animation: 'empty-state-dot 0.4s 1.3s ease-out forwards' }}
                    />

                    <defs>
                        <linearGradient id="glow-grad-dash" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="var(--btn-gradient-start, #14b8a6)" />
                            <stop offset="100%" stopColor="var(--btn-gradient-end, #0f766e)" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            <h3 className="text-xl font-bold text-foreground opacity-0 animate-[empty-state-in_0.4s_ease-out_0.15s_forwards]">
                No Dashboard Insights Available
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed opacity-0 animate-[empty-state-in_0.4s_ease-out_0.25s_forwards]">
                There is no transaction history logged for the selected period. Add some expenses or income to unlock real-time financial tracking graphs.
            </p>
            {onAction && (
                <Button
                    onClick={onAction}
                    className="mt-6 bg-custom-btn-gradient text-white shadow-sm hover:shadow-md transition-shadow duration-200 opacity-0 animate-[empty-state-in_0.4s_ease-out_0.35s_forwards]"
                >
                    <span>Create your first transaction</span>
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
                @keyframes empty-state-dot {
                    from { opacity: 0; transform: scale(0.4); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes bar-grow-1 {
                    from { height: 0; y: 125; }
                    to { height: 27; y: 98; }
                }
                @keyframes bar-grow-2 {
                    from { height: 0; y: 125; }
                    to { height: 37; y: 88; }
                }
                @keyframes bar-grow-3 {
                    from { height: 0; y: 125; }
                    to { height: 19; y: 106; }
                }
                
                .dash-bar-1 {
                    animation: bar-grow-1 0.7s 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards;
                    height: 0;
                }
                .dash-bar-2 {
                    animation: bar-grow-2 0.7s 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards;
                    height: 0;
                }
                .dash-bar-3 {
                    animation: bar-grow-3 0.7s 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards;
                    height: 0;
                }

                @media (prefers-reduced-motion: reduce) {
                    svg *, div, h3, p, button {
                        animation: none !important;
                        opacity: 1 !important;
                        transform: none !important;
                        height: auto !important;
                    }
                }
            `}</style>
        </div>
    )
}
