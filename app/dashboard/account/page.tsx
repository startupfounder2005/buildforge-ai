import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileTab } from "@/components/account/ProfileTab"
import { BillingTab } from "@/components/account/BillingTab"
import { UsageTab } from "@/components/account/UsageTab"
import { SecurityTab } from "@/components/account/SecurityTab"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AccountPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
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
    const docsUsed = profile?.usage_docs_this_month || 0
    const docsLimit = isPro ? 100 : 5

    // Mocking storage for now as it's not in DB yet
    const storageUsed = 0.5
    const storageLimit = isPro ? 10 : 1

    const usageStats = {
        docsUsed,
        docsLimit,
        storageUsed,
        storageLimit,
        plan: userData.plan
    }

    return (
        <div className="container max-w-6xl space-y-8 pb-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                <p className="text-muted-foreground">Manage your profile updates, subscription plan, usage limits, and security preferences.</p>
            </div>

            <Tabs defaultValue="profile" className="w-full space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-[500px] h-11 bg-muted/50 p-1">
                    <TabsTrigger value="profile" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Profile</TabsTrigger>
                    <TabsTrigger value="billing" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Billing</TabsTrigger>
                    <TabsTrigger value="usage" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Usage</TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Security</TabsTrigger>
                </TabsList>

                {/* PROFILE TAB */}
                <TabsContent value="profile" className="outline-none animate-in fade-in-50 duration-300">
                    <ProfileTab user={userData} />
                </TabsContent>

                {/* BILLING TAB */}
                <TabsContent value="billing" className="outline-none animate-in fade-in-50 duration-300">
                    <BillingTab plan={userData.plan} />
                </TabsContent>

                {/* USAGE TAB */}
                <TabsContent value="usage" className="outline-none animate-in fade-in-50 duration-300">
                    <UsageTab usage={usageStats} />
                </TabsContent>

                {/* SECURITY TAB */}
                <TabsContent value="security" className="outline-none animate-in fade-in-50 duration-300">
                    <SecurityTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
