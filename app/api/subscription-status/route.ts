
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia' as any,
})

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id, subscription_tier')
        .eq('id', user.id)
        .single()

    if (!profile?.stripe_customer_id) {
        return NextResponse.json({ status: 'free', daysUntilExpiration: null })
    }

    try {
        const subscriptions = await stripe.subscriptions.list({
            customer: profile.stripe_customer_id,
            limit: 1,
            status: 'all', // active, trailing, past_due, etc.
        })

        if (subscriptions.data.length === 0) {
            return NextResponse.json({ status: 'free', daysUntilExpiration: null })
        }

        const sub = subscriptions.data[0]
        const periodEnd = new Date((sub as any).current_period_end * 1000)
        const now = new Date()
        const diffTime = periodEnd.getTime() - now.getTime()
        const daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        return NextResponse.json({
            status: sub.status,
            daysUntilExpiration,
            currentPeriodEnd: periodEnd.toISOString(),
            cancelAtPeriodEnd: sub.cancel_at_period_end
        })

    } catch (error) {
        console.error('Stripe Error:', error)
        return new NextResponse('Error fetching subscription', { status: 500 })
    }
}
