'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // Type-safe data extraction
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        // Pass the actual message ("Invalid login credentials", "Email not confirmed", etc.)
        redirect('/auth/login?error=' + error.message)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const companyName = formData.get('companyName') as string

    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-project') || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        redirect('/auth/signup?error=Missing Supabase Configuration. Please check .env.local')
    }

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                company_name: companyName,
            }
        }
    })

    if (error) {
        redirect('/auth/signup?error=' + error.message)
    }

    revalidatePath('/', 'layout')
    revalidatePath('/', 'layout')
    redirect(`/auth/verify?email=${encodeURIComponent(email)}`)
}

export async function verifyOtp(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const token = formData.get('token') as string

    const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
    })

    if (error) {
        redirect(`/auth/verify?email=${encodeURIComponent(email)}&error=${error.message}`)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/auth/login')
}

export async function requestPasswordReset(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback?next=/auth/reset-password`,
    })

    if (error) {
        redirect('/auth/login?error=' + encodeURIComponent(error.message))
    }

    redirect('/auth/login?message=' + encodeURIComponent('Password reset link sent to your email.'))
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard?message=' + encodeURIComponent('Password updated successfully.'))
}
