'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Calendar, Clock, ArrowLeft } from "lucide-react"
import Link from 'next/link'
import { ProjectTimeline } from '@/components/projects/ProjectTimeline'
import { ProjectNotes } from '@/components/projects/ProjectNotes'
import { DocumentTable } from '@/components/documents/DocumentTable'
import { ImportDocumentDialog } from '@/components/documents/ImportDocumentDialog'
import { formatDistanceToNow } from 'date-fns'

interface ProjectDetailsClientProps {
    project: any
    documents: any[]
    latestDocs: any[]
    userId: string
    initialTab?: string
}

export function ProjectDetailsClient({ project, documents, latestDocs, userId, initialTab = 'overview' }: ProjectDetailsClientProps) {
    const [activeTab, setActiveTab] = useState(initialTab)

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/projects">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-zinc-100 hover:bg-transparent transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
                        <p className="text-muted-foreground capitalize">{project.status} • {project.location}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ImportDocumentDialog projectId={project.id} userId={userId} />
                    <Link href={`/dashboard/projects/${project.id}/generate`}>
                        <Button variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" /> Generate Doc
                        </Button>
                    </Link>
                </div>
            </div>

            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="relative">
                    <TabsList className="bg-transparent border-b border-white/10 w-full justify-start rounded-none p-0 h-auto">
                        {['overview', 'timeline', 'documents', 'notes'].map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab}
                                className="relative rounded-none border-b-2 border-transparent px-4 py-2 font-medium bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-blue-500 transition-none"
                            >
                                <span className={`capitalize ${activeTab === tab ? "text-blue-500" : "text-muted-foreground hover:text-white"}`}>
                                    {tab}
                                </span>
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-blue-500"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <div className="pt-2">
                    {activeTab === 'overview' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{documents?.length || 0}</div>
                                        <p className="text-xs text-muted-foreground">
                                            +1 from last week
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Days Active</CardTitle>
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {Math.floor((new Date().getTime() - new Date(project.created_at).getTime()) / (1000 * 3600 * 24))}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            project duration
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                                <Card className="col-span-4">
                                    <CardHeader>
                                        <CardTitle>Overview</CardTitle>
                                        <CardDescription>
                                            Project status and health.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pl-6">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-muted-foreground">Project Health</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span className="text-xl font-bold">On Track</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <p className="text-sm font-medium text-muted-foreground">Completion Estimate</p>
                                                    <span className="text-xl font-bold">85%</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>Progress</span>
                                                    <span className="text-muted-foreground">Budget Usage: 72%</span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-secondary">
                                                    <div className="h-2 w-[85%] rounded-full bg-primary" />
                                                </div>
                                            </div>
                                            <div className="rounded-md bg-muted/50 p-4">
                                                <div className="flex items-start gap-4">
                                                    <Clock className="mt-1 h-5 w-5 text-blue-500" />
                                                    <div>
                                                        <p className="font-semibold text-sm">Next Milestone</p>
                                                        <p className="text-sm text-muted-foreground">Foundation Inspection - Due in 3 days</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="col-span-3">
                                    <CardHeader>
                                        <CardTitle>Latest Documents</CardTitle>
                                        <CardDescription>
                                            Recent generated files
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {latestDocs.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                                    <FileText className="h-8 w-8 mb-2 opacity-50" />
                                                    <p className="text-sm">No documents generated yet.</p>
                                                    <p className="text-xs">Create your first permit or bid below.</p>
                                                </div>
                                            ) : (
                                                latestDocs.map((doc) => (
                                                    <div key={doc.id} className="flex items-start">
                                                        <FileText className="mr-2 h-4 w-4 text-blue-500 mt-1" />
                                                        <div className="ml-2 space-y-1 w-full min-w-0">
                                                            <p className="text-sm font-medium leading-none truncate">{doc.title}</p>
                                                            <p className="text-xs text-muted-foreground capitalize">{doc.type}</p>
                                                            {doc.description && (
                                                                <p className="text-xs text-zinc-500 line-clamp-1">{doc.description.replace(/\[Date:.*?\]\n?/, '')}</p>
                                                            )}
                                                        </div>
                                                        <div className="ml-auto font-medium text-xs text-muted-foreground whitespace-nowrap pl-2">
                                                            {formatDistanceToNow(new Date(doc.created_at))} ago
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                            {latestDocs.length > 0 && (
                                                <div className="pt-2">
                                                    <Button
                                                        variant="link"
                                                        className="text-sm text-blue-500 hover:underline p-0 h-auto"
                                                        onClick={() => setActiveTab('documents')}
                                                    >
                                                        View all
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'timeline' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ProjectTimeline project={project} />
                        </motion.div>
                    )}

                    {activeTab === 'documents' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <DocumentTable documents={documents || []} />
                        </motion.div>
                    )}

                    {activeTab === 'notes' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="h-[calc(100vh-250px)]"
                        >
                            <ProjectNotes projectId={project.id} />
                        </motion.div>
                    )}
                </div>
            </Tabs>
        </div>
    )
}
