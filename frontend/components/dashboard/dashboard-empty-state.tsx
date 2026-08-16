'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Plus, TrendingUp, Sparkles } from 'lucide-react'

interface DashboardEmptyStateProps {
    onAction?: () => void
}

export function DashboardEmptyState({ onAction }: DashboardEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 py-16 text-center animate-in fade-in duration-500 max-w-lg mx-auto">
            {/* Custom Animated Financial Dashboard SVG */}
            <div className="mb-6 relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
                {/* Background Ambient Glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/20 via-teal-500/20 to-purple-500/20 blur-3xl animate-pulse" />

                <svg
                    className="w-full h-full relative z-10 drop-shadow-xl overflow-visible"
                    viewBox="0 0 240 240"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        {/* Gradients */}
                        <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--card, #ffffff)" />
                            <stop offset="100%" stopColor="var(--muted, #f1f5f9)" stopOpacity="0.8" />
                        </linearGradient>

                        <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="50%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>

                        <linearGradient id="bar1Grad" x1="0%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
                        </linearGradient>

                        <linearGradient id="bar2Grad" x1="0%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
                        </linearGradient>

                        <linearGradient id="bar3Grad" x1="0%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
                        </linearGradient>

                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="10" stdDeviation="12" floodOpacity="0.12" />
                        </filter>
                    </defs>

                    {/* Faint Background Grid Lines */}
                    <g opacity="0.25" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3">
                        <line x1="30" y1="70" x2="210" y2="70" />
                        <line x1="30" y1="115" x2="210" y2="115" />
                        <line x1="30" y1="160" x2="210" y2="160" />
                    </g>

                    {/* Main Floating Glassmorphic Dashboard Window */}
                    <g filter="url(#shadow)">
                        <rect
                            x="30" y="45" width="180" height="135" rx="20"
                            className="fill-card stroke-border/80"
                            strokeWidth="2"
                        />

                        {/* Top Window Bar Controls */}
                        <circle cx="50" cy="63" r="4" fill="#ef4444" opacity="0.8" />
                        <circle cx="64" cy="63" r="4" fill="#f59e0b" opacity="0.8" />
                        <circle cx="78" cy="63" r="4" fill="#10b981" opacity="0.8" />
                        <line x1="100" y1="63" x2="190" y2="63" stroke="currentColor" className="text-muted-foreground/30" strokeWidth="3" strokeLinecap="round" />
                    </g>

                    {/* Animated Growing Chart Bars */}
                    <rect x="55" y="115" width="16" height="45" rx="4" fill="url(#bar1Grad)" className="dash-bar dash-bar-1" />
                    <rect x="80" y="95" width="16" height="65" rx="4" fill="url(#bar2Grad)" className="dash-bar dash-bar-2" />
                    <rect x="105" y="125" width="16" height="35" rx="4" fill="url(#bar1Grad)" className="dash-bar dash-bar-3" />
                    <rect x="130" y="85" width="16" height="75" rx="4" fill="url(#bar3Grad)" className="dash-bar dash-bar-4" />

                    {/* Glowing Animated Trend Path */}
                    <path
                        d="M55 125 L88 100 L113 130 L138 90 L170 105 L190 75"
                        fill="none"
                        stroke="url(#primaryGrad)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="trend-line"
                    />

                    {/* Pulse Node Points */}
                    <circle cx="88" cy="100" r="4" fill="#06b6d4" className="pulse-node" />
                    <circle cx="138" cy="90" r="4" fill="#10b981" className="pulse-node" />
                    <circle cx="190" cy="75" r="5" fill="#10b981" className="pulse-node-active" />

                    {/* Floating Currency Coin Badge */}
                    <g className="floating-badge-1">
                        <circle cx="195" cy="50" r="18" fill="url(#primaryGrad)" />
                        <text x="195" y="55" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="sans-serif">₹</text>
                    </g>

                    {/* Floating Sparkle Icon Badge */}
                    <g className="floating-badge-2">
                        <circle cx="40" cy="160" r="15" className="fill-card stroke-border" strokeWidth="2" />
                        <path d="M40 152 L42 158 L48 160 L42 162 L40 168 L38 162 L32 160 L38 158 Z" fill="#6366f1" />
                    </g>
                </svg>
            </div>

            {/* Typography */}
            <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                No Financial Data Available
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
                Log your expenses, income credits, or trade statements to auto-generate real-time financial tracking charts.
            </p>

            {/* Action Trigger Button */}
            {onAction && (
                <Button
                    onClick={onAction}
                    className="mt-6 rounded-xl text-xs font-bold gap-2 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                >
                    <Plus className="h-4 w-4" /> Create First Transaction
                </Button>
            )}

            {/* CSS Animation Keyframes */}
            <style jsx>{`
                @keyframes bar-grow {
                    0% { transform: scaleY(0); transform-origin: bottom; }
                    100% { transform: scaleY(1); transform-origin: bottom; }
                }

                @keyframes draw-path {
                    0% { stroke-dashoffset: 300; }
                    100% { stroke-dashoffset: 0; }
                }

                @keyframes float-1 {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-8px) rotate(5deg); }
                }

                @keyframes float-2 {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(6px) scale(1.05); }
                }

                .dash-bar-1 { animation: bar-grow 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s forwards; }
                .dash-bar-2 { animation: bar-grow 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards; }
                .dash-bar-3 { animation: bar-grow 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards; }
                .dash-bar-4 { animation: bar-grow 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s forwards; }

                .trend-line {
                    stroke-dasharray: 300;
                    stroke-dashoffset: 300;
                    animation: draw-path 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.5s forwards;
                }

                .floating-badge-1 {
                    animation: float-1 4s ease-in-out infinite;
                }

                .floating-badge-2 {
                    animation: float-2 3.5s ease-in-out infinite;
                }

                @media (prefers-reduced-motion: reduce) {
                    .dash-bar, .trend-line, .floating-badge-1, .floating-badge-2 {
                        animation: none !important;
                        stroke-dashoffset: 0 !important;
                        transform: none !important;
                    }
                }
            `}</style>
        </div>
    )
}
