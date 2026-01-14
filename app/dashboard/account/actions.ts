'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const profileSchema = z.object({
    fullName: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address").optional(),
    company: z.string().nullable().optional(),
    role: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
})

export async function updateProfile(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { message: 'Unauthorized' }
    }

    const rawData = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        company: formData.get('company') === '' ? null : formData.get('company'),
        role: formData.get('role') === '' ? null : formData.get('role'),
        phone: formData.get('phone') === '' ? null : formData.get('phone'),
        bio: formData.get('bio') === '' ? null : formData.get('bio'),
    }

    const validatedFields = profileSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to update profile. Please check fields.',
        }
    }

    // 1. Update Public Profile Data
    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: validatedFields.data.fullName,
            email: validatedFields.data.email, // Allow updating display email
            company_name: validatedFields.data.company,
            role: validatedFields.data.role,
            phone: validatedFields.data.phone,
            bio: validatedFields.data.bio,
        })
        .eq('id', user.id)

    if (error) {
        return { message: 'Database Error: Failed to Update Profile.' }
    }

    // 2. Handle Auth Email Change if different
    if (validatedFields.data.email && validatedFields.data.email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({
            email: validatedFields.data.email
        })
        if (authError) {
            // We don't rollback profile update, but we warn user
            return { message: 'Profile saved, but failed to initiate email change: ' + authError.message }
        }
    }

    revalidatePath('/dashboard/account')
    return { message: 'Success' }
}

// ... (previous imports)

// --- Phone Verification ---

export async function initiatePhoneVerification(phone: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Unauthorized' }

    // Init phone change - this sends the SMS to the new number
    console.log("SERVER: initiatePhoneVerification called for", phone)
    const { error } = await supabase.auth.updateUser({ phone })

    if (error) {
        console.error("SERVER: Failed to send SMS:", error)
        return { message: 'Failed to send SMS: ' + error.message }
    }

    console.log("SERVER: SMS sent successfully")
    return { message: 'Success' }
}

export async function verifyPhoneAction(phone: string, token: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Unauthorized' }

    // Verify the phone change. 
    // Important: For phone updates, the type is 'phone_change'.
    const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'phone_change'
    })

    if (error) {
        return { message: 'Verification failed: ' + error.message }
    }

    // Update profile verified status explicitly just to be safe, 
    // although supabase auth hook might handle it depending on config.
    // We'll update our public profiles table to match.
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            phone,
            phone_verified: true
        })
        .eq('id', user.id)

    if (profileError) {
        return { message: 'Profile update failed' }
    }

    revalidatePath('/dashboard/account')
    return { message: 'Success' }
}

// --- Email Change ---

export async function initiateEmailChange(newEmail: string) {
    const supabase = await createClient()
    console.log("[Action] Initiating email change to:", newEmail)

    // Supabase sends a confirmation link to the new email
    const { data, error } = await supabase.auth.updateUser({ email: newEmail })

    if (error) {
        console.error("[Action] Email change error:", error)
        return { message: 'Failed to initiate email change: ' + error.message }
    }

    console.log("[Action] Email change initiated via Supabase Auth:", data)
    return { message: 'Success' }
}

export async function verifyEmailChangeAction(email: string, token: string) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email_change'
    })

    if (error) {
        return { message: 'Verification failed: ' + error.message }
    }

    revalidatePath('/dashboard/account')
    return { message: 'Success' }
}

// --- Avatar ---

export async function uploadAvatar(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { message: 'Unauthorized' }

    const file = formData.get('avatar') as File
    if (!file) return { message: 'No file provided' }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    // 1. Upload to Storage
    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

    if (uploadError) {
        return { message: 'Upload failed: ' + uploadError.message }
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

    // 3. Update Profile using Admin Client (Bypass RLS)
    const supabaseAdmin = createAdminClient()
    const { error: dbError } = await supabaseAdmin
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

    if (dbError) {
        return { message: 'Database Update Failed: ' + dbError.message }
    }

    revalidatePath('/dashboard/account')
    revalidatePath('/', 'layout')
    return { message: 'Success', avatarUrl: publicUrl }
}
