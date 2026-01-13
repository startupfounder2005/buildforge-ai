'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const profileSchema = z.object({
    fullName: z.string().min(1, "Name is required"),
    company: z.string().optional(),
    role: z.string().optional(),
    phone: z.string().optional(),
})

export async function updateProfile(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { message: 'Unauthorized' }
    }

    const rawData = {
        fullName: formData.get('fullName'),
        company: formData.get('company'),
        role: formData.get('role'),
        phone: formData.get('phone'),
    }

    const validatedFields = profileSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to update profile. Please checks fields.',
        }
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: validatedFields.data.fullName,
            company_name: validatedFields.data.company,
            role: validatedFields.data.role,
            phone: validatedFields.data.phone
        })
        .eq('id', user.id)

    if (error) {
        return { message: 'Database Error: Failed to Update Profile.' }
    }

    revalidatePath('/dashboard/account')
    return { message: 'Success' }
}

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

    // 3. Update Profile
    const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

    if (dbError) {
        return { message: 'Database Update Failed' }
    }

    revalidatePath('/dashboard/account')
    return { message: 'Success', avatarUrl: publicUrl }
}
