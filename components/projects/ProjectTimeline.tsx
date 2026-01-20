'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useEffect, useState, useCallback, memo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Plus, Loader2, Calendar, CheckCircle, MoreVertical, MoreHorizontal, Sparkles, Trash2, CheckCircle2, Clock, Edit } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
    createMilestone,
    updateMilestone,
    deleteMilestone,
    deleteMilestones,
    updateMilestoneStatus,
    updateMilestonesStatusBulk
} from "@/app/dashboard/projects/actions"
import { format, differenceInDays } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ProjectTimelineProps {
    project: any
}

// Memoized Milestone Item Component
const MilestoneItem = memo(({
    m,
    i,
    isNext,
    isSelected,
    onToggleSelect,
    onStatusToggle,
    onEdit,
    onDelete
}: {
    m: any,
    i: number,
    isNext: boolean,
    isSelected: boolean,
    onToggleSelect: (id: string) => void,
    onStatusToggle: (id: string, status: string) => void,
    onEdit: (m: any) => void,
    onDelete: (id: string) => void
}) => {
    const isCompleted = m.status === 'completed'
    const isPast = new Date(m.end_date) < new Date() && !isCompleted
    const duration = differenceInDays(new Date(m.end_date), new Date(m.start_date)) + 1

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.2 }}
            className="relative pl-8 pb-8 last:pb-2 group"
        >
            {/* Timeline Connector */}
            <div className={`absolute -left-[29px] top-6 h-4 w-4 rounded-full border-4 ${isCompleted ? 'bg-blue-500 border-zinc-950' : isNext ? 'bg-yellow-400 animate-pulse border-zinc-950' : 'bg-zinc-800 border-zinc-950 ring-1 ring-zinc-800'}`} />

            <div className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 ${isCompleted ? 'bg-zinc-900/30 border-zinc-800' : isNext ? 'bg-blue-500/5 border-blue-500/20' : 'bg-card border-zinc-800 hover:border-zinc-700'}`}>
                {/* Row Checkbox */}
                <div className="mt-1">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelect(m.id)}
                    />
                </div>

                <div className="flex-1 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                        <div
                            className={`mt-1 cursor-pointer transition-colors p-1 rounded-full hover:bg-zinc-800 ${isCompleted ? 'text-emerald-500' : 'text-zinc-500'}`}
                            onClick={() => onStatusToggle(m.id, m.status)}
                        >
                            <CheckCircle className={`h-5 w-5 ${isCompleted ? 'fill-emerald-500/20' : ''}`} />
                        </div>
                        <div className="space-y-1 w-full">
                            <div className="flex items-center justify-between w-full">
                                <h4 className={`font-semibold text-base ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{m.title}</h4>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity border border-transparent hover:border-white">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem className="cursor-pointer border border-transparent hover:border-white transition-all" onClick={() => onStatusToggle(m.id, m.status)}>
                                            Mark as {isCompleted ? 'Pending' : 'Completed'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer border border-transparent hover:border-white transition-all" onClick={() => onEdit(m)}>
                                            Edit Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600 focus:text-white focus:bg-red-600 cursor-pointer border border-transparent hover:border-white transition-all" onClick={() => onDelete(m.id)}>
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{format(new Date(m.start_date), 'MMM d')} - {format(new Date(m.end_date), 'MMM d')}</span>
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/50 border border-border/50">
                                    {duration} days
                                </span>
                                {isPast && <Badge variant="destructive" className="h-5 text-[10px] px-1.5">Overdue</Badge>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
})
MilestoneItem.displayName = 'MilestoneItem'

export function ProjectTimeline({ project }: ProjectTimelineProps) {
    const supabase = createClient()
    const [milestones, setMilestones] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    // Unified Delete State
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showBulkDelete, setShowBulkDelete] = useState(false)

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        start: '',
        end: ''
    })

    const fetchMilestones = useCallback(async () => {
        const { data: m } = await supabase
            .from('project_milestones')
            .select('*')
            .eq('project_id', project.id)
            .order('end_date', { ascending: true })

        setMilestones(m || [])
        setLoading(false)
    }, [project.id, supabase])

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
    }, [project.id, fetchMilestones, supabase])

    // Handlers
    const openCreate = () => {
        setEditingId(null)
        setFormData({ title: '', start: '', end: '' })
        setOpen(true)
    }

    const openEdit = useCallback((m: any) => {
        setEditingId(m.id)
        setFormData({
            title: m.title,
            start: m.start_date,
            end: m.end_date
        })
        setOpen(true)
    }, [])

    const handleSave = async () => {
        if (!formData.title || !formData.start || !formData.end) {
            toast.error('Please fill all fields')
            return
        }

        setSubmitting(true)
        try {
            let res
            if (editingId) {
                res = await updateMilestone(editingId, formData.title, formData.start, formData.end)
            } else {
                res = await createMilestone(project.id, formData.title, formData.start, formData.end)
            }

            if (res.message === 'Success') {
                toast.success(editingId ? 'Milestone updated' : 'Milestone added')
                setOpen(false)
                fetchMilestones()
            } else {
                toast.error(res.message || 'Operation failed')
            }
        } catch (e) {
            console.error(e)
            toast.error('Error saving milestone')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = useCallback((id: string) => {
        setDeleteTargetId(id)
    }, [])

    const handleStatusToggle = useCallback(async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
        // Optimistic Update
        setMilestones(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m))
        await updateMilestoneStatus(id, newStatus)
    }, [])

    // Bulk Actions
    const toggleSelectAll = () => {
        if (selectedIds.length === milestones.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(milestones.map(m => m.id))
        }
    }

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }, [])

    const handleBulkDelete = () => {
        setShowBulkDelete(true)
    }

    const executeDelete = async () => {
        setIsDeleting(true)
        try {
            if (deleteTargetId) {
                // Single Delete
                await deleteMilestone(deleteTargetId)
                toast.success('Milestone deleted')
            } else if (showBulkDelete) {
                // Bulk Delete
                await deleteMilestones(selectedIds)
                toast.success(`${selectedIds.length} milestones deleted`)
                setSelectedIds([])
            }
            fetchMilestones()
        } catch (e) {
            toast.error('Failed to delete')
        } finally {
            setIsDeleting(false)
            setDeleteTargetId(null)
            setShowBulkDelete(false)
        }
    }

    const handleBulkStatus = async (status: 'completed' | 'pending') => {
        await updateMilestonesStatusBulk(selectedIds, status)
        toast.success(`${selectedIds.length} milestones updated`)
        setSelectedIds([])
        fetchMilestones()
    }

    // AI Stub
    const handleAISuggest = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/generate-milestones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectType: project.name, // Simple heuristic for now
                    description: project.description || ''
                })
            })

            const data = await response.json()

            if (!response.ok) {
                toast.error(data.error || "Failed to generate milestones")
                return
            }

            if (data.milestones) {
                // Auto-add milestones for now
                // In a real app we might show a review dialog
                for (const m of data.milestones) {
                    // Calculate dates relative to project start or today
                    const startDate = new Date()
                    startDate.setDate(startDate.getDate() + m.offsetStart)
                    const endDate = new Date(startDate)
                    endDate.setDate(startDate.getDate() + m.duration)

                    await createMilestone(
                        project.id,
                        m.title,
                        startDate.toISOString().split('T')[0],
                        endDate.toISOString().split('T')[0]
                    )
                }
                toast.success(`Generated ${data.milestones.length} milestones!`)
                fetchMilestones()
            }
        } catch (e) {
            console.error(e)
            toast.error("Failed to generate milestones")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="min-h-[500px] flex flex-col bg-sidebar/50 backdrop-blur-sm border-sidebar-border relative">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                    <CardTitle>Project Milestones</CardTitle>
                    <CardDescription>Interactive timeline. Click to toggle status.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="gap-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20" onClick={handleAISuggest}>
                        <Sparkles className="h-3 w-3" /> AI Suggest
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={openCreate}>
                        <Plus className="h-4 w-4" /> Add Milestone
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="flex-1">
                {/* Bulk Actions Manager */}
                <AnimatePresence>
                    {selectedIds.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto', marginBottom: 16 }}
                            exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
                            className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 px-4 flex items-center justify-between overflow-hidden"
                        >
                            <span className="text-sm font-medium text-blue-400">{selectedIds.length} selected</span>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-xs text-zinc-300 hover:bg-blue-500/10 hover:text-blue-400 border border-transparent hover:border-blue-500/20 transition-all font-medium gap-1.5"
                                    onClick={() => handleBulkStatus('completed')}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark Complete
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-xs text-zinc-300 hover:bg-blue-500/10 hover:text-blue-400 border border-transparent hover:border-blue-500/20 transition-all font-medium gap-1.5"
                                    onClick={() => handleBulkStatus('pending')}
                                >
                                    <Clock className="h-3.5 w-3.5" /> Mark Pending
                                </Button>
                                <div className="h-4 w-px bg-zinc-700 mx-1 self-center" />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-xs text-zinc-300 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all font-medium gap-1.5"
                                    onClick={handleBulkDelete}
                                >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header Row with Checkbox */}
                {milestones.length > 0 && (
                    <div className="pl-2 pb-2 mb-2 flex items-center border-b border-sidebar-border/50">
                        <Checkbox
                            checked={selectedIds.length === milestones.length && milestones.length > 0}
                            onCheckedChange={toggleSelectAll}
                            className="mr-2"
                        />
                        <span className="text-xs text-muted-foreground font-medium ml-2">Select All</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex h-64 items-center justify-center text-muted-foreground gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading timeline...
                    </div>
                ) : milestones.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground border border-dashed rounded-lg">
                        <Calendar className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">No milestones yet.</p>
                        <Button variant="link" onClick={openCreate}>Create one now</Button>
                    </div>
                ) : (
                    <div className="relative space-y-0 pl-6 border-l border-zinc-800 ml-6 py-4">
                        {milestones.map((m, i) => {
                            const isNext = m.status !== 'completed' && (i === 0 || milestones[i - 1]?.status === 'completed') && (new Date(m.end_date) >= new Date() || true)

                            return (
                                <MilestoneItem
                                    key={m.id}
                                    m={m}
                                    i={i}
                                    isNext={!!isNext}
                                    isSelected={selectedIds.includes(m.id)}
                                    onToggleSelect={toggleSelect}
                                    onStatusToggle={handleStatusToggle}
                                    onEdit={openEdit}
                                    onDelete={handleDelete}
                                />
                            )
                        })}
                    </div>
                )}
            </CardContent>

            {/* Create/Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Milestone' : 'Add New Milestone'}</DialogTitle>
                        <DialogDescription>{editingId ? 'Update milestone details.' : 'Create a key event or phase for this project.'}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Foundation Pour"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="start">Start Date</Label>
                                <Input
                                    id="start"
                                    type="date"
                                    value={formData.start}
                                    onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end">End Date</Label>
                                <Input
                                    id="end"
                                    type="date"
                                    value={formData.end}
                                    onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingId ? 'Save Changes' : 'Add Milestone'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog (Unified) */}
            <AlertDialog open={showBulkDelete || !!deleteTargetId} onOpenChange={(open) => {
                if (!open) {
                    setShowBulkDelete(false)
                    setDeleteTargetId(null)
                }
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {deleteTargetId ? 'Delete Milestone?' : `Delete ${selectedIds.length} milestones?`}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. {deleteTargetId ? 'This milestone' : 'These milestones'} will be permanently removed from the project timeline.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}
