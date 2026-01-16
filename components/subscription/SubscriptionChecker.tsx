"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function SubscriptionChecker() {
    const supabase = createClient()

    useEffect(() => {
        const checkSubscription = async () => {
            try {
                const res = await fetch('/api/subscription-status')
                if (!res.ok) return

                const data = await res.json()
                if (!data.daysUntilExpiration) return

                const { daysUntilExpiration, status, currentPeriodEnd, cancelAtPeriodEnd } = data

                // Only warn if auto-renew is off (canceled) OR status is past_due? 
                // Requests logic: "7 days before ... get notification". 
                // Usually even if auto-renew is ON, sending a reminder "Renews in 7 days" is good practice?
                // User asked: "if the subscription expires add notification to upgrade again"
                // Usually "expires" implies cancel_at_period_end is true or payment failed.
                // Assuming we warn regardless, or maybe only if cancelling? 
                // "7 days before the subscription is over" -> implies it will end.
                // I will assume simple logic: strict date checking.

                // Logic for 7 days
                if (daysUntilExpiration <= 7 && daysUntilExpiration > 1) {
                    await checkAndSendNotification('Subscription Expiring Soon', 7)
                }

                // Logic for 1 day
                if (daysUntilExpiration <= 1 && daysUntilExpiration >= 0) {
                    await checkAndSendNotification('Subscription Expiring Tomorrow', 1)
                }

                // If expired (negative days?) -> handled by webhook 'deleted' usually. 
            } catch (error) {
                console.error('Subscription check failed', error)
            }
        }

        const checkAndSendNotification = async (titleType: string, days: number) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Check if we already sent a notification about this RECENTLY (e.g. in the last `days` buffer)
            // or just check if a notification with this title exists created after 'current_period_end - 30 days'?
            // To be simple: Check if "Subscription Expiring Soon" exists created in the last 7 days.

            const since = new Date()
            since.setDate(since.getDate() - (days + 1))

            const { data: existing } = await supabase
                .from('notifications')
                .select('id')
                .eq('user_id', user.id)
                .eq('title', titleType)
                .gte('created_at', since.toISOString())
                .limit(1)

            if (!existing || existing.length === 0) {
                await supabase.from('notifications').insert({
                    user_id: user.id,
                    type: 'system',
                    title: titleType,
                    message: `Your subscription is ending in ${days} day${days > 1 ? 's' : ''}. Please renew to avoid looking access to Pro features.`,
                    link: '/dashboard/account?tab=billing'
                })
            }
        }

        checkSubscription()
    }, [])

    return null
}
