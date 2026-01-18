'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Plus, FileText, Calendar, Clock, ArrowLeft, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import Link from 'next/link'
import { ProjectTimeline } from '@/components/projects/ProjectTimeline'
import { ProjectNotes } from '@/components/projects/ProjectNotes'
import { BudgetManager } from '@/components/projects/BudgetManager'
import { DocumentTable } from '@/components/documents/DocumentTable'
import { ImportDocumentDialog } from '@/components/documents/ImportDocumentDialog'
import { formatDistanceToNow, differenceInDays } from 'date-fns'
import { createClient } from '@/lib/supabase/client'

interface ProjectDetailsClientProps {
    project: any
    documents: any[]
    latestDocs: any[]
    userId: string
    initialTab?: string
}

export function ProjectDetailsClient({ project, documents, latestDocs, userId, initialTab = 'overview' }: ProjectDetailsClientProps) {
    const [activeTab, setActiveTab] = useState(initialTab)
    const [data, setData] = useState({
        milestones: [] as any[],
        expenses: [] as any[],
        budget: project.budget || 0,
        health: 'On Track',
        completion: 0,
        budgetUsed: 0,
        nextMilestone: null as any
    })
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            // Fetch Milestones
            const { data: milestones } = await supabase
                .from('project_milestones')
                .select('*')
                .eq('project_id', project.id)
                .order('end_date', { ascending: true })

            // Fetch Expenses (Safely - try/catch in case table doesn't exist yet)
            let expenses: any[] = []
            try {
                const { data: exp } = await supabase
                    .from('project_expenses') // This table might not exist yet
                    .select('*')
                    .eq('project_id', project.id)
                if (exp) expenses = exp
            } catch (e) {
                console.warn("Expenses table not found or error fetching")
            }

            // Calculations
            const totalMilestones = milestones?.length || 0
            const completedMilestones = milestones?.filter(m => m.status === 'completed').length || 0
            const completion = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0 // Start at 0 if no milestones

            const totalExpenses = expenses.reduce((sum, item) => sum + (item.amount || 0), 0)
            const budgetUsed = data.budget > 0 ? (totalExpenses / data.budget) * 100 : 0

            // Health Logic
            let health = 'On Track'
            if (budgetUsed > 90) health = 'At Risk'
            if (project.due_date && new Date(project.due_date) < new Date() && completion < 100) health = 'Delayed'

            // Next Milestone (Find closest deadline)
            const pendingMilestones = milestones?.filter(m => m.status === 'pending') || []
            const nextMilestone = pendingMilestones.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())[0] || null

            setData({
                milestones: milestones || [],
                expenses,
                budget: project.budget || 0,
                health,
                completion,
                budgetUsed,
                nextMilestone
            })
        }

        fetchData()

        // Subscribe to changes (Optional refinement: Realtime)
        const channel = supabase.channel('project_updates')
            .on('postgres_changes', { event: '*', schema: 'public', filter: `project_id=eq.${project.id}` }, () => {
                fetchData()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }

    }, [project, supabase])

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
                        {['overview', 'timeline', 'documents', 'budget', 'notes'].map((tab) => (
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
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Project Health</CardTitle>
                                        <TrendingUp className={`h-4 w-4 ${data.health === 'On Track' ? 'text-emerald-500' : 'text-red-500'}`} />
                                    </CardHeader>
                                    <CardContent>
                                        <div className={`text-2xl font-bold ${data.health === 'On Track' ? 'text-emerald-500' : 'text-red-500'}`}>{data.health}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Based on schedule & budget
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{documents?.length || 0}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Manage permits, bids, contracts
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
                                            days since creation
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                                <Card className="col-span-4 h-full">
                                    <CardHeader>
                                        <CardTitle>Overview</CardTitle>
                                        <CardDescription>
                                            Project status and key metrics.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pl-6">
                                        <div className="space-y-8">
                                            {project.description && (
                                                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                                                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                                                    <p className="text-sm text-zinc-300 leading-relaxed break-all whitespace-pre-wrap">{project.description}</p>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-muted-foreground">Completion Status</p>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-12 w-12 relative flex items-center justify-center">
                                                            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                                                                {/* Background Circle */}
                                                                <path className="text-blue-500/20" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                                                {/* Progress Circle */}
                                                                <path className="text-blue-500 transition-all duration-1000 ease-out" strokeDasharray={`${data.completion}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                                            </svg>
                                                            <span className="absolute text-[10px] font-bold">{data.completion.toFixed(0)}%</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-2xl font-bold">{data.completion.toFixed(0)}%</span>
                                                            <p className="text-xs text-muted-foreground">Milestones Completed</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href="#" onClick={() => setActiveTab('timeline')}>View Timeline</a>
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span>Overall Progress</span>
                                                    <span className="text-muted-foreground">{data.milestones.filter(m => m.status === 'completed').length}/{data.milestones.length} Milestones</span>
                                                </div>
                                                <Progress value={data.completion} className="h-2 bg-secondary" indicatorClassName="bg-gradient-to-r from-blue-500 to-blue-400" />
                                            </div>

                                            {data.nextMilestone ? (
                                                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-4">
                                                    <div className="p-2 bg-blue-500/10 rounded-full">
                                                        <Calendar className="h-5 w-5 text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-blue-500">Next Milestone</p>
                                                        <h4 className="font-bold text-lg">{data.nextMilestone.title}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            Due in {differenceInDays(new Date(data.nextMilestone.end_date), new Date().setHours(0, 0, 0, 0))} days
                                                            <span className="mx-2">•</span>
                                                            {new Date(data.nextMilestone.end_date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-center">
                                                    <p className="text-zinc-500 text-sm">{data.milestones.length > 0 ? "All milestones completed!" : "No upcoming milestones."}</p>
                                                    <Button variant="link" onClick={() => setActiveTab('timeline')} className="text-blue-500 h-auto p-0">Manage milestones</Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="col-span-3 h-full flex flex-col">
                                    <CardHeader>
                                        <CardTitle>Latest Documents</CardTitle>
                                        <CardDescription>
                                            Recent generated files
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col">
                                        <div className="flex-1 flex flex-col">
                                            {latestDocs.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center flex-1 text-center text-muted-foreground min-h-[200px]">
                                                    <FileText className="h-8 w-8 mb-2 opacity-50" />
                                                    <p className="text-sm">No documents generated yet.</p>
                                                    <Button variant="link" onClick={() => setActiveTab('documents')} className="text-blue-500 h-auto p-0 mt-2">
                                                        Create your first permit or bid
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col justify-between">
                                                    <div className="space-y-4">
                                                        {latestDocs.map((doc) => (
                                                            <div key={doc.id} className="flex items-start">
                                                                <FileText className="mr-2 h-4 w-4 text-blue-500 mt-1 uppercase" />
                                                                <div className="ml-2 space-y-1 w-full min-w-0">
                                                                    <p className="text-sm font-medium leading-none truncate">{doc.title}</p>
                                                                    <p className="text-xs text-muted-foreground capitalize">{doc.type}</p>
                                                                </div>
                                                                <div className="ml-auto font-medium text-xs text-muted-foreground whitespace-nowrap pl-2">
                                                                    {formatDistanceToNow(new Date(doc.created_at))} ago
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="pt-4 mt-auto text-right border-t border-white/5">
                                                        <Button
                                                            variant="link"
                                                            className="text-sm text-blue-500 hover:text-blue-400 p-0 h-auto"
                                                            onClick={() => setActiveTab('documents')}
                                                        >
                                                            View all &rarr;
                                                        </Button>
                                                    </div>
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

                    {activeTab === 'budget' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <BudgetManager
                                projectId={project.id}
                                initialBudget={data.budget}
                                initialExpenses={data.expenses}
                            />
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
