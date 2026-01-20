'use client'

import { useEffect, useRef } from 'react'
import { signout } from '@/app/auth/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Default timeout: 30 minutes (30 * 60 * 1000 ms)
const TIMEOUT_MS = 30 * 60 * 1000

export function InactivityListener() {
    const router = useRouter()
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const resetTimer = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(async () => {
            // Timeout reached
            toast.error('Session timed out due to inactivity.')
            await signout()
        }, TIMEOUT_MS)
    }

    useEffect(() => {
        // Initial timer
        resetTimer()

        // Events to listen for
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']

        const handleActivity = () => {
            resetTimer()
        }

        // Add listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity)
        })

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity)
            })
        }
    }, [])

    // Render nothing
    return null
}
