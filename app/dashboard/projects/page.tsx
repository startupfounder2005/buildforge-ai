import { getProjects } from './actions'
import { ProjectsClientWrapper } from '@/components/projects/ProjectsClientWrapper'

import { createClient } from '@/lib/supabase/server'

export default async function ProjectsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const projects = await getProjects()

    // Fetch Plan
    const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user?.id)
        .single()

    const plan = profile?.subscription_tier || 'free'

    return (
        <div className="p-4 md:p-8">
            <ProjectsClientWrapper initialProjects={projects} plan={plan} />
        </div>
    )
}
