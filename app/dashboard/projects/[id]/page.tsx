import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProjectDetailsClient } from '@/components/projects/ProjectDetailsClient'

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ tab?: string }> }) {
    const { id } = await params
    const { tab } = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return notFound()

    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

    if (!project) notFound()

    // Fetch documents on server
    const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false })

    const latestDocs = documents?.slice(0, 3) || []

    return (
        <ProjectDetailsClient
            project={project}
            documents={documents || []}
            latestDocs={latestDocs}
            userId={user.id}
            initialTab={tab}
        />
    )
}
