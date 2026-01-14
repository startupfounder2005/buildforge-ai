'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileTab } from "@/components/account/ProfileTab"
import { BillingTab } from "@/components/account/BillingTab"
import { UsageTab } from "@/components/account/UsageTab"
import { SecurityTab } from "@/components/account/SecurityTab"
import { useRouter, useSearchParams } from 'next/navigation'

interface AccountClientProps {
    userData: any
    usageStats: any
    initialTab?: string
}

export function AccountClient({ userData, usageStats, initialTab = 'profile' }: AccountClientProps) {
    const [activeTab, setActiveTab] = useState(initialTab)
    const router = useRouter()

    // Sync state with prop if it changes (e.g. redirect from UpgradeDialog)
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab)
        }
    }, [initialTab])

    const handleTabChange = (value: string) => {
        setActiveTab(value)
        // Optional: Update URL without full refresh to keep bookmarkable state
        // router.push(`/dashboard/account?tab=${value}`, { scroll: false })
    }

    const tabs = ['profile', 'billing', 'usage', 'security']

    return (
        <div className="container max-w-6xl space-y-8 pb-10 pt-4">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                <p className="text-muted-foreground">Manage your profile updates, subscription plan, usage limits, and preferences.</p>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <div className="relative border-b border-zinc-800">
                    <TabsList className="bg-transparent w-full justify-start rounded-none p-0 h-auto">
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab}
                                className="relative rounded-none border-b-2 border-transparent px-6 py-3 font-medium bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-blue-500 transition-none"
                            >
                                <span className={`capitalize text-sm ${activeTab === tab ? "text-blue-500 font-semibold" : "text-zinc-400 hover:text-zinc-200"}`}>
                                    {tab}
                                </span>
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTabAccount"
                                        className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-blue-500"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* PROFILE TAB */}
                {activeTab === 'profile' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <TabsContent value="profile" className="mt-0 outline-none">
                            <ProfileTab user={userData} key={userData.avatar_url} />
                        </TabsContent>
                    </motion.div>
                )}

                {/* BILLING TAB */}
                {activeTab === 'billing' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <TabsContent value="billing" className="mt-0 outline-none">
                            <BillingTab plan={userData.plan} />
                        </TabsContent>
                    </motion.div>
                )}

                {/* USAGE TAB */}
                {activeTab === 'usage' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <TabsContent value="usage" className="mt-0 outline-none">
                            <UsageTab usage={usageStats} />
                        </TabsContent>
                    </motion.div>
                )}

                {/* SECURITY TAB */}
                {activeTab === 'security' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <TabsContent value="security" className="mt-0 outline-none">
                            <SecurityTab />
                        </TabsContent>
                    </motion.div>
                )}
            </Tabs>
        </div>
    )
}
