'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createNotification(userId: string, type: 'info' | 'success' | 'warning' | 'error', title: string, message: string, link?: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            type,
            title,
            message,
            link,
            is_read: false
        })

    if (error) {
        console.error('Error creating notification:', error)
        return { message: 'Failed to create notification' }
    }

    revalidatePath('/dashboard')
    return { message: 'Success' }
}

export async function checkMilestoneDeadlines(userId: string) {
    const supabase = await createClient()

    // 1. Get all projects for user
    const { data: projects } = await supabase.from('projects').select('id, name').eq('user_id', userId)
    if (!projects || projects.length === 0) return { message: 'No projects found' }

    const projectIds = projects.map(p => p.id)

    // 2. Get pending milestones
    const { data: milestones } = await supabase
        .from('project_milestones')
        .select('*')
        .in('project_id', projectIds)
        .eq('status', 'pending')

    if (!milestones || milestones.length === 0) return { message: 'No pending milestones' }

    let notificationsCreated = 0

    // 3. Check dates
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const milestone of milestones) {
        if (!milestone.end_date) continue

        const targetDate = new Date(milestone.end_date)
        targetDate.setHours(0, 0, 0, 0)

        const diffTime = targetDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        // Intervals: 1y(365), 6m(180), 3m(90), 1m(30), 7d, 1d, 0d (Today)
        const intervals = [365, 180, 90, 30, 7, 1, 0]

        if (intervals.includes(diffDays)) {
            // Find project name
            const project = projects.find(p => p.id === milestone.project_id)
            const projectName = project ? project.name : 'Unknown Project'

            let timeframe = ''
            if (diffDays === 365) timeframe = '1 Year'
            else if (diffDays === 180) timeframe = '6 Months'
            else if (diffDays === 90) timeframe = '3 Months'
            else if (diffDays === 30) timeframe = '1 Month'
            else if (diffDays === 7) timeframe = '1 Week'
            else if (diffDays === 1) timeframe = '1 Day'
            else if (diffDays === 0) timeframe = 'TODAY'

            const notificationTitle = `Milestone Due ${diffDays === 0 ? 'TODAY' : 'in ' + timeframe}`

            // Idempotency Check: Prevent duplicate alerts for the same milestone on the same day
            // We check Title + Link + Created Today.
            // This ensures if the alert status changes (Today -> 1 Week) due to a fix, it still sends.
            const { data: existing } = await supabase
                .from('notifications')
                .select('id')
                .eq('user_id', userId)
                .eq('link', `/dashboard/projects/${milestone.project_id}`)
                .eq('title', notificationTitle)
                .gte('created_at', today.toISOString()) // Created since start of today

            if (existing && existing.length > 0) continue

            await createNotification(
                userId,
                diffDays <= 7 ? 'warning' : 'info', // Warning for close deadlines
                notificationTitle,
                `"${milestone.title}" for ${projectName} is due ${diffDays === 0 ? 'TODAY' : 'on ' + targetDate.toLocaleDateString()}.`,
                `/dashboard/projects/${milestone.project_id}`
            )
            notificationsCreated++
        }
    }

    revalidatePath('/dashboard')

    if (notificationsCreated === 0) {
        return { message: 'No milestones due at tracking intervals (1y, 6m, 3m, 1m, 7d, 1d).' }
    }

    return { message: `Generated ${notificationsCreated} deadline alerts.` }
}

export async function simulateTeamInvite(userId: string) {
    // Mocking a team invite
    return await createNotification(
        userId,
        'info',
        'New Team Member',
        'Alex Chen has accepted your invitation to join "Skyline Tower".',
        '/dashboard/settings'
    )
}
