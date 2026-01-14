import { createClient } from '@/lib/supabase/server'
import { DocumentsClient } from '@/components/documents/DocumentsClient'

export default async function DocumentsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch documents with project names
    const { data: documents } = await supabase
        .from('documents')
        .select(`
            *,
            projects ( name )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    // Fetch list of projects for the Import Dialog
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name')

    // Fetch Plan
    const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single()

    const plan = profile?.subscription_tier || 'free'

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Permits & Documents</h1>
                <p className="text-muted-foreground">Manage all your generated permits, contracts, and bids.</p>
            </div>

            <DocumentsClient
                initialDocuments={documents || []}
                projects={projects || []}
                userId={user.id}
                plan={plan}
            />
        </div>
    )
}
