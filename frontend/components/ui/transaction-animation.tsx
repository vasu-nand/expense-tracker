'use client'

import { useEffect, useRef } from 'react'

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
    scale: number;
    opacity: number;
    emoji: string;
    swaySpeed: number;
    swayAmount: number;
    swayOffset: number;
    gravity: number;
    friction: number;
    targetX?: number;
    targetY?: number;
}

export function TransactionAnimation() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const particlesRef = useRef<Particle[]>([])
    const animationFrameRef = useRef<number | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        resizeCanvas()
        window.addEventListener('resize', resizeCanvas)

        const draw = () => {
            if (!ctx || !canvas) return

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const particles = particlesRef.current
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i]

                // Apply physics
                p.vy += p.gravity
                p.vx *= p.friction
                p.vy *= p.friction

                p.x += p.vx
                p.y += p.vy

                // If this is an income particle flowing in, check distance to target
                if (p.targetX !== undefined && p.targetY !== undefined) {
                    const dx = p.targetX - p.x
                    const dy = p.targetY - p.y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < 12) {
                        particles.splice(i, 1)
                        continue
                    }
                }

                // Sway for bills (fluttering effect)
                if (p.emoji !== '🪙') {
                    p.x += Math.sin((Date.now() / 1000) * p.swaySpeed + p.swayOffset) * p.swayAmount
                }

                p.rotation += p.rotationSpeed
                p.opacity -= 0.024 // Faster decay rate for tighter local effect

                // Render particle
                if (p.opacity <= 0 || p.y > canvas.height + 50 || p.x < -50 || p.x > canvas.width + 50) {
                    particles.splice(i, 1)
                    continue
                }

                ctx.save()
                ctx.globalAlpha = p.opacity
                ctx.translate(p.x, p.y)
                ctx.rotate(p.rotation)
                
                // Draw smaller, crisp emoji text
                const fontSize = Math.round(18 * p.scale)
                ctx.font = `${fontSize}px Arial`
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(p.emoji, 0, 0)
                
                ctx.restore()
            }

            if (particles.length > 0) {
                animationFrameRef.current = requestAnimationFrame(draw)
            } else {
                animationFrameRef.current = null
            }
        }

        const triggerAnimation = (e: Event) => {
            const customEvent = e as CustomEvent<{ type: 'expense' | 'income' | 'delete'; x?: number; y?: number }>
            const { type, x, y } = customEvent.detail

            // Default to center if no coordinates provided
            const startX = x !== undefined ? x : window.innerWidth / 2
            const startY = y !== undefined ? y : window.innerHeight / 2

            const newParticles: Particle[] = []

            if (type === 'expense') {
                // Explode outwards (fly out) around the button only
                const count = 20
                const emojis = ['💵', '💸', '🪙', '🪙', '💰']

                for (let i = 0; i < count; i++) {
                    const emoji = emojis[Math.floor(Math.random() * emojis.length)]
                    const angle = Math.random() * Math.PI * 2 // Explode in all 360 directions
                    const speed = 2.5 + Math.random() * 4.5  // Lower speed to stay close
                    const isCoin = emoji === '🪙'

                    newParticles.push({
                        x: startX,
                        y: startY,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        rotation: Math.random() * Math.PI * 2,
                        rotationSpeed: (Math.random() - 0.5) * 0.12,
                        scale: 0.4 + Math.random() * 0.4, // Small and cute
                        opacity: 1,
                        emoji,
                        swaySpeed: 2 + Math.random() * 3,
                        swayAmount: isCoin ? 0 : 0.3 + Math.random() * 0.4,
                        swayOffset: Math.random() * Math.PI,
                        gravity: 0.08,
                        friction: 0.94 // High friction so they settle rapidly
                    })
                }
            } else if (type === 'income') {
                // Flow in (implode towards the button center)
                const count = 22
                const emojis = ['💵', '💸', '🪙', '🪙', '💰']

                for (let i = 0; i < count; i++) {
                    const emoji = emojis[Math.floor(Math.random() * emojis.length)]
                    const isCoin = emoji === '🪙'

                    // Spawn in a circle around the button
                    const angle = Math.random() * Math.PI * 2
                    const distance = 55 + Math.random() * 35 // Confined 55-90px from button
                    const spawnX = startX + Math.cos(angle) * distance
                    const spawnY = startY + Math.sin(angle) * distance

                    // Flow speed
                    const speed = 1.8 + Math.random() * 2.2

                    newParticles.push({
                        x: spawnX,
                        y: spawnY,
                        vx: -Math.cos(angle) * speed, // Point directly at target
                        vy: -Math.sin(angle) * speed,
                        rotation: Math.random() * Math.PI * 2,
                        rotationSpeed: (Math.random() - 0.5) * 0.08,
                        scale: 0.4 + Math.random() * 0.4,
                        opacity: 1,
                        emoji,
                        swaySpeed: 1.5 + Math.random() * 2,
                        swayAmount: isCoin ? 0 : 0.15 + Math.random() * 0.25,
                        swayOffset: Math.random() * Math.PI,
                        gravity: 0,
                        friction: 0.985,
                        targetX: startX,
                        targetY: startY
                    })
                }
            } else if (type === 'delete') {
                // High-velocity explosion outwards, decelerating rapidly and dropping straight down like debris
                const count = 35 // More particles for impact
                const emojis = ['💥', '🔥', '💨', '❌', '🗑️', '🪓', '💨']

                for (let i = 0; i < count; i++) {
                    const emoji = emojis[Math.floor(Math.random() * emojis.length)]
                    const angle = Math.random() * Math.PI * 2
                    const speed = 4.5 + Math.random() * 6.5 // High initial velocity explosion

                    newParticles.push({
                        x: startX,
                        y: startY,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 2.5, // Violent upward burst initially
                        rotation: Math.random() * Math.PI * 2,
                        rotationSpeed: (Math.random() - 0.5) * 0.25, // Spin chaotic/fast
                        scale: 0.5 + Math.random() * 0.5,
                        opacity: 1,
                        emoji,
                        swaySpeed: 4 + Math.random() * 4,
                        swayAmount: 0.5 + Math.random() * 0.6,
                        swayOffset: Math.random() * Math.PI,
                        gravity: 0.32, // Heavy positive gravity (falling downward debris)
                        friction: 0.925 // Decelerates initial horizontal blast quickly
                    })
                }
            }

            particlesRef.current = [...particlesRef.current, ...newParticles]

            if (!animationFrameRef.current) {
                animationFrameRef.current = requestAnimationFrame(draw)
            }
        }

        window.addEventListener('trigger-transaction-animation' as any, triggerAnimation)

        return () => {
            window.removeEventListener('resize', resizeCanvas)
            window.removeEventListener('trigger-transaction-animation' as any, triggerAnimation)
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[99999]"
            style={{ mixBlendMode: 'normal' }}
        />
    )
}
