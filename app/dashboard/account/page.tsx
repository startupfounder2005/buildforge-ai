import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AccountClient } from "@/components/account/AccountClient"

export const dynamic = 'force-dynamic'

export default async function AccountPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string; success?: string; canceled?: string }>
}) {
    // Await params/searchParams in Next.js 15+ if needed, though type implies it might be a Promise or standard object depending on version. 
    // The previous file had it as `{ tab?: string }`, but to be safe and consistent with previous project file which used Promise, I will check.
    // Actually, looking at the previous file content provided in Step 5216, it was:
    // export default async function AccountPage({ searchParams }: { searchParams: { tab?: string } }) 
    // BUT in project page Step 5215:
    // export default async function ProjectPage({ searchParams }: { searchParams: Promise<{ tab?: string }> })
    // It seems the user might be on a version were searchParams is a Promise (Next 15).
    // I will stick to the existing signature if possible or upgrade it if I see errors. 
    // Given 'app/dashboard/projects/[id]/page.tsx' uses Promise, it is safer to treat it as awaitable or just access properties if they are already resolved.
    // However, for this replace, I'll stick to what works or standard pattern. Using "await searchParams" is the modern way.

    const params = await searchParams
    const activeTab = params?.tab || "profile"

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Manual Sync on Success Return (Handling missing webhooks in dev)
    if (params?.success === 'true') {
        // Fetch fresh profile to get customer ID and current status
        const { data: p } = await supabase
            .from('profiles')
            .select('stripe_customer_id, subscription_tier')
            .eq('id', user.id)
            .single()

        if (p?.stripe_customer_id) {
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
            try {
                const subscriptions = await stripe.subscriptions.list({
                    customer: p.stripe_customer_id,
                    status: 'active',
                    limit: 1
                })

                // Only update and notify if not already Pro (prevents duplicate notifs on refresh)
                if (subscriptions.data.length > 0 && p.subscription_tier !== 'pro') {
                    await supabase.from('profiles').update({ subscription_tier: 'pro' }).eq('id', user.id)

                    await supabase.from('notifications').insert({
                        user_id: user.id,
                        type: 'system',
                        title: 'Welcome to Pro! 🚀',
                        message: 'Your subscription has been successfully upgraded. Enjoy unlimited access.',
                        link: '/dashboard/account'
                    })
                }
            } catch (e) {
                console.error('Failed to sync subscription:', e)
            }
        }
    }

    // Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Combined User Object
    const userData = {
        ...profile,
        email: user.email,
        // Fallback defaults if null
        fullName: profile?.full_name || '',
        company: profile?.company_name || '',
        role: profile?.role || '',
        phone: profile?.phone || '',
        avatar_url: profile?.avatar_url || '',
        plan: profile?.subscription_tier || 'free'
    }

    // Usage Calculations
    const isPro = userData.plan === 'pro'

    // Dynamic Count (Same as API)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: docsCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())

    const docsUsed = docsCount || 0
    // If Pro, we say limit is -1 to indicate Unlimited in UI
    const docsLimit = isPro ? -1 : 5

    // Projects Statistics
    const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

    const projectsUsed = projectsCount || 0
    const projectsLimit = isPro ? -1 : 1

    // --- Storage Calculations ---
    const { data: allStorageDocs } = await supabase
        .from('documents')
        .select('file_size')
        .eq('user_id', user.id)

    const totalBytes = allStorageDocs?.reduce((acc, doc) => acc + (doc.file_size || 0), 0) || 0
    const storageUsed = totalBytes / (1024 * 1024 * 1024) // Convert Bytes to GB

    const storageLimit = isPro ? 100 : 1 // 100GB for Pro, 1GB for Free

    // --- Historical Data Generation ---
    // Since Supabase doesn't support complex GROUP BY / date_trunc via JS client easily without views/functions,
    // we will fetch all docs from last 6 months and aggregate in JS.

    // 6 months ago
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5) // Current + 5 previous
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const { data: allDocs } = await supabase
        .from('documents')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', sixMonthsAgo.toISOString())

    // Aggregate by Month-Year keys
    const historyMap = new Map<string, number>()

    // Initialize last 6 months with 0
    for (let i = 0; i < 6; i++) {
        const d = new Date()
        d.setMonth(d.getMonth() - (5 - i))
        const key = d.toLocaleString('default', { month: 'short' }) // Jan, Feb
        historyMap.set(key, 0)
    }

    if (allDocs) {
        allDocs.forEach(doc => {
            const date = new Date(doc.created_at)
            const key = date.toLocaleString('default', { month: 'short' })
            if (historyMap.has(key)) {
                historyMap.set(key, (historyMap.get(key) || 0) + 1)
            }
        })
    }

    const monthlyHistory = Array.from(historyMap.entries()).map(([month, count]) => ({ month, count }))


    const usageStats = {
        docsUsed,
        docsLimit,
        projectsUsed,
        projectsLimit,
        storageUsed,
        storageLimit,
        plan: userData.plan,
        monthlyHistory
    }

    return (
        <AccountClient
            userData={userData}
            usageStats={usageStats}
            initialTab={activeTab}
        />
    )
}
