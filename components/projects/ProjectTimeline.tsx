'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Chart } from "react-google-charts"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createMilestone } from "@/app/dashboard/projects/actions"

interface ProjectTimelineProps {
    project: any
}

// Gantt Chart Columns
const columns = [
    { type: "string", label: "Task ID" },
    { type: "string", label: "Task Name" },
    { type: "string", label: "Resource" },
    { type: "date", label: "Start Date" },
    { type: "date", label: "End Date" },
    { type: "number", label: "Duration" },
    { type: "number", label: "Percent Complete" },
    { type: "string", label: "Dependencies" },
];

export function ProjectTimeline({ project }: ProjectTimelineProps) {
    const supabase = createClient()
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [creating, setCreating] = useState(false)

    // Form
    const [newMilestone, setNewMilestone] = useState({
        title: '',
        start: '',
        end: ''
    })

    const fetchMilestones = async () => {
        const { data: milestones } = await supabase
            .from('project_milestones')
            .select('*')
            .eq('project_id', project.id)
            .order('start_date', { ascending: true })

        const projectStart = new Date(project.created_at)
        const projectEnd = project.due_date ? new Date(project.due_date) : new Date(projectStart.getTime() + 30 * 24 * 60 * 60 * 1000)

        const rows = [
            [
                project.id,
                project.name,
                "Project",
                projectStart,
                projectEnd,
                null,
                project.status === 'completed' ? 100 : (project.status === 'active' ? 50 : 0),
                null
            ]
        ]

        if (milestones && milestones.length > 0) {
            milestones.forEach(m => {
                rows.push([
                    m.id,
                    m.title,
                    "Milestone",
                    new Date(m.start_date),
                    new Date(m.end_date),
                    null,
                    m.status === 'completed' ? 100 : 0,
                    null
                ])
            })
        }

        setData([columns, ...rows])
        setLoading(false)
    }

    useEffect(() => {
        fetchMilestones()

        const channel = supabase
            .channel('project_milestones_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'project_milestones', filter: `project_id=eq.${project.id}` }, () => {
                fetchMilestones()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [project])

    const handleCreate = async () => {
        if (!newMilestone.title || !newMilestone.start || !newMilestone.end) {
            toast.error('Please fill all fields')
            return
        }

        setCreating(true)
        try {
            const res = await createMilestone(project.id, newMilestone.title, newMilestone.start, newMilestone.end)
            if (res.message === 'Success') {
                toast.success('Milestone added')
                setOpen(false)
                setNewMilestone({ title: '', start: '', end: '' })
                fetchMilestones() // Refresh chart
            } else {
                toast.error(res.message || 'Failed to create')
            }
        } catch (e) {
            toast.error('Error creating milestone')
        } finally {
            setCreating(false)
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Project Timeline</CardTitle>
                    <CardDescription>Visual timeline of project lifecycle and key milestones.</CardDescription>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" /> Add Milestone
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Milestone</DialogTitle>
                            <DialogDescription>Create a key event or phase for this project.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={newMilestone.title}
                                    onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                                    placeholder="e.g. Foundation Pour"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start">Start Date</Label>
                                    <Input
                                        id="start"
                                        type="date"
                                        value={newMilestone.start}
                                        onChange={(e) => setNewMilestone({ ...newMilestone, start: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end">End Date</Label>
                                    <Input
                                        id="end"
                                        type="date"
                                        value={newMilestone.end}
                                        onChange={(e) => setNewMilestone({ ...newMilestone, end: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={creating}>
                                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Milestone
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex h-64 items-center justify-center text-muted-foreground">Loading chart...</div>
                ) : (
                    <div className="h-[400px] w-full overflow-hidden rounded-lg border">
                        <Chart
                            chartType="Gantt"
                            width="100%"
                            height="100%"
                            data={data}
                            options={{
                                height: 400,
                                gantt: {
                                    trackHeight: 30,
                                    barCornerRadius: 4,
                                    palette: [
                                        {
                                            "color": "#3b82f6", // Blue
                                            "dark": "#1d4ed8",
                                            "light": "#93c5fd"
                                        }
                                    ]
                                },
                            }}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
