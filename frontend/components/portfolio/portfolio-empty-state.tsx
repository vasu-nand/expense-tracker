'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface PortfolioEmptyStateProps {
    title: string
    description: string
    imageSrc?: string
    actionLabel?: string
    onAction?: () => void
    secondaryActionLabel?: string
    onSecondaryAction?: () => void
}

export function PortfolioEmptyState({
    title,
    description,
    imageSrc = '/portfolio/portfolio-empty.svg',
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction
}: PortfolioEmptyStateProps) {
    return (
        <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
            <div className="relative w-48 h-44 sm:w-56 sm:h-48 drop-shadow-md">
                <Image
                    src={imageSrc}
                    alt="Empty state illustration"
                    fill
                    className="object-contain"
                    priority
                />
            </div>

            <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                    {title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {description}
                </p>
            </div>

            {(onAction || onSecondaryAction) && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    {secondaryActionLabel && onSecondaryAction && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onSecondaryAction}
                            className="rounded-xl text-xs"
                        >
                            {secondaryActionLabel}
                        </Button>
                    )}
                    {actionLabel && onAction && (
                        <Button
                            size="sm"
                            onClick={onAction}
                            className="rounded-xl text-xs gap-1.5 bg-custom-btn-gradient text-white shadow-sm"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>{actionLabel}</span>
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
