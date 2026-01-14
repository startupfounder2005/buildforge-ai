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
                stripe_customer_id: session.customer as string // Ensure customer ID is synced
            }).eq('id', userId)

            if (error) {
                console.error('[Stripe Webhook] Database Update Failed:', error)
                return new NextResponse('Database Error', { status: 500 })
            }
        } else {
            console.error('[Stripe Webhook] Missing userId in session metadata')
        }
    }

    return NextResponse.json({ received: true })
}
