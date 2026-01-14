'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Hammer, FileText, CreditCard, ArrowUpRight } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

interface OverviewStatsProps {
    projectsCount: number
    documentsCount: number
    subscriptionTier: string
    docsChangePercentage?: number
    isNewUser?: boolean
}

export function OverviewStats({ projectsCount, documentsCount, subscriptionTier, docsChangePercentage = 0, isNewUser = false }: OverviewStatsProps) {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
            <motion.div variants={item}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Projects
                        </CardTitle>
                        <Hammer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{projectsCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Ongoing construction sites
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={item}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Documents Generated
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{documentsCount}</div>
                        <p className="text-xs text-muted-foreground">
                            {isNewUser
                                ? "No previous month data"
                                : `${docsChangePercentage > 0 ? '+' : ''}${docsChangePercentage}% from last month`
                            }
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={item}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Current Plan
                        </CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">{subscriptionTier}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {subscriptionTier === 'free' ? (
                                <Link href="/dashboard/account?tab=billing" className="flex items-center gap-1 hover:underline group">
                                    Upgrade to Pro
                                    <ArrowUpRight className="h-3 w-3 text-primary group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            ) : (
                                'Active Subscription'
                            )}
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
            {/* Placeholder for Revenue or AI Usage if needed, keeping 3 for now as requested or stretching layout */}
        </motion.div>
    )
}
