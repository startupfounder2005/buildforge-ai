'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const projectSchema = z.object({
    name: z.string().min(1, "Name is required"),
    location: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    status: z.string().optional().nullable(), // Added status
    notes: z.string().optional().nullable(), // Added notes
    due_date: z.string().optional().nullable(), // Added due_date as optional string
    budget: z.string().optional().nullable(), // Added budget
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
        budget: formData.get('budget'),
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

    // 1. Check Subscription Tier & Project Limit
    const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single()

    const isPro = profile?.subscription_tier === 'pro'

    if (!isPro) {
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const { count, error: countError } = await supabase
            .from('project_generations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', startOfMonth.toISOString())

        if (countError) {
            return { message: 'Database Error: Failed to check project limit.' }
        }

        if (count !== null && count >= 1) {
            return { message: 'Free plan limited to 1 new project per month. Upgrade to Pro for unlimited.' }
        }
    }

    const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
            user_id: user.id,
            name: validatedFields.data.name,
            location: validatedFields.data.location,
            description: validatedFields.data.description,
            status: validatedFields.data.status || 'planning',
            notes: validatedFields.data.notes,
            due_date: validatedFields.data.due_date ? validatedFields.data.due_date : null,
            budget: validatedFields.data.budget ? Number(validatedFields.data.budget) : 0
        })
        .select()
        .single()

    if (error) {
        return { message: 'Database Error: Failed to Create Project.' }
    }

    // Create initial note if provided
    if (validatedFields.data.notes) {
        await supabase.from('project_notes').insert({
            project_id: newProject.id,
            user_id: user.id,
            content: validatedFields.data.notes
        })
    }

    // Log Usage (Immutable)
    await supabase.from('project_generations').insert({
        user_id: user.id,
        project_id: newProject.id,
        project_name: newProject.name
    })

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

    // Add new note if provided during update
    if (validatedFields.data.notes && validatedFields.data.notes.trim().length > 0) {
        await supabase.from('project_notes').insert({
            project_id: id,
            user_id: user.id,
            content: validatedFields.data.notes
        })
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

export async function updateMilestone(id: string, title: string, start: string, end: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('project_milestones')
        .update({ title, start_date: start, end_date: end })
        .eq('id', id)

    if (error) return { message: error.message }
    revalidatePath('/dashboard/projects')
    return { message: 'Success' }
}

export async function deleteMilestone(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('project_milestones')
        .delete()
        .eq('id', id)

    if (error) return { message: error.message }
    revalidatePath('/dashboard/projects')
    return { message: 'Success' }
}

export async function deleteMilestones(ids: string[]) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('project_milestones')
        .delete()
        .in('id', ids)

    if (error) return { message: error.message }
    revalidatePath('/dashboard/projects')
    return { message: 'Success' }
}

export async function updateMilestoneStatus(id: string, status: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('project_milestones')
        .update({ status })
        .eq('id', id)

    if (error) return { message: error.message }
    revalidatePath('/dashboard/projects')
    return { message: 'Success' }
}

export async function updateMilestonesStatusBulk(ids: string[], status: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('project_milestones')
        .update({ status })
        .in('id', ids)

    if (error) return { message: error.message }
    revalidatePath('/dashboard/projects')
    return { message: 'Success' }
}

export async function updateProjectBudget(projectId: string, amount: number) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('projects')
        .update({ budget: amount })
        .eq('id', projectId)

    if (error) return { message: error.message }
    revalidatePath(`/dashboard/projects/${projectId}`)
    return { message: 'Success' }
}

export async function addExpense(projectId: string, expense: { description: string, amount: number, category: string, date: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Unauthorized' }

    const { data: insertedExpenseData, error } = await supabase
        .from('project_expenses')
        .insert([{
            project_id: projectId,
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            date: expense.date
        }])
        .select('id, amount') // Select id and amount to use later

    if (error) return { message: error.message }

    const newExpenseId = insertedExpenseData ? insertedExpenseData[0]?.id : null;
    const newExpenseAmount = insertedExpenseData ? Number(insertedExpenseData[0]?.amount) : 0;

    // --- Budget Calculation & Consistency Check ---
    try {
        const { data: projectData } = await supabase
            .from('projects')
            .select('budget')
            .eq('id', projectId)
            .single()

        const { data: expensesData } = await supabase
            .from('project_expenses')
            .select('id, amount')
            .eq('project_id', projectId)

        if (projectData && projectData.budget > 0) {
            const budget = Number(projectData.budget)
            const expenses = expensesData || []

            let total = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
            if (newExpenseId && !expenses.some(item => item.id === newExpenseId)) {
                total += newExpenseAmount
            }

            const currentUsage = (total / budget) * 100
            const previousTotal = total - newExpenseAmount
            const previousUsage = (previousTotal / budget) * 100

            // Check for threshold crossings (90, 95, 100)
            const thresholds = [90, 95, 100]
            const crossedThreshold = thresholds.find(t => previousUsage < t && currentUsage >= t)

            if (crossedThreshold) {
                let alertTitle = 'Budget Threshold Warning'
                if (crossedThreshold === 100) alertTitle = 'Budget Critical: Limit Exceeded'
                else if (crossedThreshold === 95) alertTitle = 'Budget Alert: 95% Used'

                await supabase.from('notifications').insert({
                    user_id: user.id,
                    type: 'budget',
                    title: alertTitle,
                    message: `Project budget usage has hit ${crossedThreshold}%. Spent: $${total.toLocaleString()} of $${budget.toLocaleString()}`,
                    link: `/dashboard/projects/${projectId}?tab=budget`,
                    is_read: false
                })
            }
        }
    } catch (e: any) {
        console.error("Budget Calc Error", e)
    }

    // --- 1. Expense Logged Notification (Sent LAST) ---
    try {
        await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'budget',
            title: 'Expense Logged',
            message: `$${expense.amount.toLocaleString()} for ${expense.description}`,
            link: `/dashboard/projects/${projectId}?tab=budget`,
            is_read: false
        })
    } catch (e: any) {
        console.error("Expense Notif Exception", e)
    }

    revalidatePath(`/dashboard/projects/${projectId}`)

    return { message: 'Success' }
}

export async function deleteExpense(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('project_expenses')
        .delete()
        .eq('id', id)

    if (error) return { message: error.message }
    revalidatePath('/dashboard/projects')
    return { message: 'Success' }
}

export async function updateExpense(id: string, expense: { description: string, amount: number, category: string, date: string }) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('project_expenses')
        .update({
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            date: expense.date
        })
        .eq('id', id)

    if (error) return { message: error.message }
    revalidatePath('/dashboard/projects')
    return { message: 'Success' }
}

export async function deleteExpenses(ids: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Unauthorized' }

    const { error } = await supabase
        .from('project_expenses')
        .delete()
        .in('id', ids)

    if (error) return { message: error.message }
    revalidatePath('/dashboard/projects')
    return { message: 'Success' }
}

export async function deleteDocuments(ids: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { message: 'Unauthorized' }

    const { error } = await supabase
        .from('documents')
        .delete()
        .in('id', ids)

    if (error) return { message: error.message }
    revalidatePath('/dashboard/projects')
    revalidatePath('/dashboard/documents')
    return { message: 'Success' }
}
