import { NextResponse } from 'next/server'

export async function POST() {
    console.log('Frontend Next.js server shutdown request received. Exiting process in 1 second...')
    setTimeout(() => {
        process.exit(0)
    }, 1000)
    return NextResponse.json({ message: 'Frontend Next.js server shutting down...' })
}
