'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const projectSchema = z.object({
    name: z.string().min(1, "Name is required"),
    location: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(), // Added status
    notes: z.string().optional(), // Added notes
    due_date: z.string().optional().nullable(), // Added due_date as optional string
})

export async function createProject(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const rawData = {
        name: formData.get('name'),
        location: formData.get('location'),
        description: formData.get('description'),
        status: formData.get('status'),
        notes: formData.get('notes'),
        due_date: formData.get('due_date'),
    }

    const validatedFields = projectSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Project.',
        }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { message: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('projects')
        .insert({
            user_id: user.id,
            name: validatedFields.data.name,
            location: validatedFields.data.location,
            description: validatedFields.data.description,
            status: validatedFields.data.status || 'planning',
            notes: validatedFields.data.notes,
            due_date: validatedFields.data.due_date ? validatedFields.data.due_date : null
        })

    if (error) {
        return { message: 'Database Error: Failed to Create Project.' }
    }

    revalidatePath('/dashboard/projects')
    return { message: 'Success' }
}

export async function updateProject(id: string, prevState: any, formData: FormData) {
    const supabase = await createClient()

    const rawData = {
        name: formData.get('name'),
        location: formData.get('location'),
        description: formData.get('description'),
        status: formData.get('status'),
        notes: formData.get('notes'),
        due_date: formData.get('due_date'),
    }

    const validatedFields = projectSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Project.',
        }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { message: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('projects')
        .update({
            name: validatedFields.data.name,
            location: validatedFields.data.location,
            description: validatedFields.data.description,
            status: validatedFields.data.status,
            notes: validatedFields.data.notes,
            due_date: validatedFields.data.due_date ? validatedFields.data.due_date : null
        })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        return { message: 'Database Error: Failed to Update Project.' }
    }

    revalidatePath('/dashboard/projects')
    revalidatePath(`/dashboard/projects/${id}`)
    return { message: 'Success' }
}

export async function getProjects() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching projects:', error)
        return []
    }

    return data
}

export async function getProject(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (error) return null
    return data
}

export async function deleteProject(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { message: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        return { message: 'Database Error: Failed to Delete Project.' }
    }

    revalidatePath('/dashboard/projects')
    return { message: 'Success' }
}

export async function deleteDocument(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Unauthorized' }

    const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { message: 'Database Error' }

    revalidatePath('/dashboard/projects/[id]', 'page')
    return { message: 'Success' }
}

export async function createMilestone(projectId: string, title: string, start: string, end: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Unauthorized' }

    const { error } = await supabase.from('project_milestones').insert({
        project_id: projectId,
        title,
        start_date: start,
        end_date: end,
        status: 'pending'
    })

    if (error) return { message: 'Database Error', error }

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { message: 'Success' }
}
