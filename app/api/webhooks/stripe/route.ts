import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia' as any, // latest api version
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get('Stripe-Signature') as string

    let event: Stripe.Event

    try {
        if (!signature || !webhookSecret) return new NextResponse('Webhook error', { status: 400 })
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`)
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
    }

    // Use Admin Client to bypass RLS
    const supabase = createAdminClient()

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId

        if (userId) {
            console.log(`[Stripe Webhook] Upgrading user ${userId} to PRO`)
            const { error } = await supabase.from('profiles').update({
                subscription_tier: 'pro',
                stripe_customer_id: session.customer as string
            }).eq('id', userId)

            if (!error) {
                await supabase.from('notifications').insert({
                    user_id: userId,
                    type: 'system',
                    title: 'Welcome to Pro! 🚀',
                    message: 'Your subscription has been successfully upgraded. Enjoy unlimited access.',
                    link: '/dashboard/account'
                })
            } else {
                console.error('[Stripe Webhook] Database Update Failed:', error)
                return new NextResponse('Database Error', { status: 500 })
            }
        }
    }

    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: profile } = await supabase.from('profiles').select('id').eq('stripe_customer_id', customerId).single()

        if (profile) {
            await supabase.from('profiles').update({ subscription_tier: 'free' }).eq('id', profile.id)
            await supabase.from('notifications').insert({
                user_id: profile.id,
                type: 'system',
                title: 'Subscription Ended',
                message: 'Your Pro subscription has ended. You have been downgraded to the Free plan.',
                link: '/dashboard/account?tab=billing'
            })
        }
    }

    if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // If subscription is canceled or unpaid, treat as downgrade warning or actual downgrade depending on logic
        // But usually 'deleted' handles the final termination. 'updated' might be 'cancel_at_period_end'

        if (subscription.cancel_at_period_end) {
            const { data: profile } = await supabase.from('profiles').select('id').eq('stripe_customer_id', customerId).single()
            if (profile) {
                // Check if we already notified? hard to track without metadata, but we can verify if recent notification exists
                // For now, just logging or relying on the '7 days left' checker is better for expiration WARNINGS.
                // This event fires when they click "Cancel", so we can confirm usage.
                await supabase.from('notifications').insert({
                    user_id: profile.id,
                    type: 'system',
                    title: 'Subscription Canceled',
                    message: `Your subscription will end on ${new Date((subscription as any).current_period_end * 1000).toLocaleDateString()}.`,
                    link: '/dashboard/account?tab=billing'
                })
            }
        }
    }

    return NextResponse.json({ received: true })
}
