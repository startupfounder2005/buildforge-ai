"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/server"
import { headers } from "next/headers"

export async function createCheckoutSession(priceId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    // Get Profile to check for existing customer ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id, email, full_name')
        .eq('id', user.id)
        .single()

    let customerId = profile?.stripe_customer_id

    // 1. Create/Retrieve Stripe Customer
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email || undefined,
            name: profile?.full_name || undefined,
            metadata: {
                userId: user.id
            }
        })
        customerId = customer.id

        // Save to profile
        await supabase
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', user.id)
    }

    // 2. Create Checkout Session
    const origin = (await headers()).get('origin') as string

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: `${origin}/dashboard/account?success=true`,
        cancel_url: `${origin}/dashboard/account?canceled=true`,
        metadata: {
            userId: user.id,
        },
    })

    if (!session.url) {
        throw new Error("Failed to create checkout session")
    }

    redirect(session.url)
}

export async function createCustomerPortal() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    // Get Customer ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()

    if (!profile?.stripe_customer_id) {
        // Fallback if no customer ID (shouldn't happen for paid users)
        // Maybe redirect to checkout?
        throw new Error("No billing account found. Please upgrade first.")
    }

    const origin = (await headers()).get('origin') as string

    const session = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${origin}/dashboard/account`,
    })

    redirect(session.url)
}
