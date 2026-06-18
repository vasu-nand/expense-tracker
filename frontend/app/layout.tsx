import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Navigation } from '@/components/navigation'
import { ShutdownWatcher } from '@/components/shutdown-watcher'
import { DesktopFab } from '@/components/desktop-fab'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Expense Analytics Dashboard',
    description: 'Track and analyze your daily expenses',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <div className="min-h-screen bg-background">
                        <Navigation />
                        <main className="container mx-auto px-4 py-8">
                            {children}
                        </main>
                        <DesktopFab />
                        <ShutdownWatcher />
                    </div>
                </ThemeProvider>
            </body>
        </html>
    )
}