'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FilePlus, Zap } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { GenerateDocumentGlobalDialog } from "@/components/documents/GenerateDocumentGlobalDialog"

interface QuickActionsProps {
    projects: { id: string, name: string }[]
    userId: string
}

export function QuickActions({ projects, userId }: QuickActionsProps) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                    Fast track your workflow
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link href="/dashboard/projects">
                        <Button className="w-full justify-start h-12 group hover:bg-[#7C3AED] hover:text-white transition-colors" variant="outline">
                            <Plus className="mr-2 h-4 w-4 text-blue-500 group-hover:text-white transition-colors" />
                            Create New Project
                        </Button>
                    </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <GenerateDocumentGlobalDialog
                        projects={projects}
                        userId={userId}
                        customTrigger={
                            <Button className="w-full justify-start h-12 group hover:bg-[#7C3AED] hover:text-white transition-colors" variant="outline">
                                <FilePlus className="mr-2 h-4 w-4 text-blue-500 group-hover:text-white transition-colors" />
                                Generate Document
                            </Button>
                        }
                    />
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link href="/dashboard/predictions">
                        <Button className="w-full justify-start h-12 group hover:bg-[#7C3AED] hover:text-white transition-colors" variant="outline">
                            <Zap className="mr-2 h-4 w-4 text-yellow-600 group-hover:text-white transition-colors" />
                            Run AI Prediction
                        </Button>
                    </Link>
                </motion.div>
            </CardContent>
        </Card>
    )
}
