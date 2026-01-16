'use client'

import { useEffect } from 'react'
import { checkMilestoneDeadlines } from '@/app/dashboard/actions'

export function MilestoneChecker({ userId }: { userId: string }) {
    useEffect(() => {
        // Run the check on mount
        const runCheck = async () => {
            try {
                await checkMilestoneDeadlines(userId)
            } catch (error) {
                console.error('Failed to check milestones:', error)
            }
        }
        runCheck()
    }, [userId])

    return null // This component renders nothing
}
