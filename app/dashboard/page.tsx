import { createClient } from "@/lib/supabase/server"
import { OverviewStats } from "@/components/dashboard/OverviewStats"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines"
import { InsightsChart } from "@/components/dashboard/InsightsChart"
import { QuickActions } from "@/components/dashboard/QuickActions"

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // 1. Fetch Profile for Subscription
    const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, usage_docs_this_month')
        .eq('id', user.id)
        .single()

    // 2. Fetch Projects (Active & All for stats)
    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    // 3. Fetch Documents
    const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10) // Fetch strictly 10 recent documents for feed

    const allProjects = projects || []
    const allDocs = documents || []

    // Stats Calculation
    const activeProjectsCount = allProjects.filter(p => p.status === 'active').length
    const totalDocsCount = allDocs.length // Total lifetime docs

    // Monthly Calculation for "Documents Generated" change
    const currentDate = new Date()
    const thisMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0, 23, 59, 59, 999)

    const thisMonthDocs = allDocs.filter(d => new Date(d.created_at) >= thisMonthStart).length
    const lastMonthDocs = allDocs.filter(d => {
        const dDate = new Date(d.created_at)
        return dDate >= lastMonthStart && dDate <= lastMonthEnd
    }).length

    let docsChangePercentage = 0
    let isNewUser = false

    if (lastMonthDocs > 0) {
        docsChangePercentage = Math.round(((thisMonthDocs - lastMonthDocs) / lastMonthDocs) * 100)
    } else if (thisMonthDocs > 0) {
        // First month with activity
        isNewUser = true
    }

    // Activity Feed Construction
    // Combine projects and docs, sort by date, take top 5
    const activityFeed = [
        ...allProjects.map(p => ({
            id: p.id,
            type: 'project' as const,
            title: p.name,
            subtitle: `Status: ${p.status}`,
            timestamp: p.created_at
        })),
        ...allDocs.map(d => ({
            id: d.id,
            type: 'document' as const,
            title: d.title,
            subtitle: `Type: ${d.type}`,
            timestamp: d.created_at
        }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5)

    // Upcoming Deadlines
    // Filter projects with future due_date
    const now = new Date() // Keeping this 'now' as it is used below, and 'currentDate' is used above
    const upcomingDeadlines = allProjects
        .filter(p => p.due_date && new Date(p.due_date) > now && p.status !== 'completed')
        .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
        .slice(0, 5)
        .map(p => ({
            id: p.id,
            title: p.name,
            dueDate: p.due_date,
            status: p.status
        }))

    // Chart Data Calculation
    const projectDistribution = {
        planning: allProjects.filter(p => p.status === 'planning').length,
        active: allProjects.filter(p => p.status === 'active').length,
        completed: allProjects.filter(p => p.status === 'completed').length,
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-0">
            {/* 1. Hero Stats Section */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back, {user.email}
                </p>
            </div>

            <OverviewStats
                projectsCount={activeProjectsCount}
                documentsCount={thisMonthDocs}
                subscriptionTier={profile?.subscription_tier || 'free'}
                docsChangePercentage={docsChangePercentage}
                isNewUser={isNewUser}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* 2. Main Content Area (Charts & Quick Actions) */}
                <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
                    <InsightsChart distribution={projectDistribution} />
                    <QuickActions projects={allProjects} userId={user.id} />
                </div>

                {/* 3. Sidebar Widgets (Activity & Deadlines) */}
                <div className="col-span-1 lg:col-span-3 flex flex-col gap-6">
                    <UpcomingDeadlines deadlines={upcomingDeadlines} />
                    <RecentActivity activities={activityFeed} />
                </div>
            </div>
        </div>
    )
}
