import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia' as any,
})

export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
        return NextResponse.json({ url: '#' }, { status: 200 }) // Mock for dev
    }

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: 'price_H5ggYwtDq5opkd', // Replace with real price ID
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account`,
            customer_email: user.email,
            metadata: {
                userId: user.id
            }
        })

        return NextResponse.json({ url: session.url })
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 })
    }
}
