'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createProject, updateProject } from '@/app/dashboard/projects/actions'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { getDaysInMonth } from 'date-fns'

interface ProjectDialogProps {
    project?: any
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children?: React.ReactNode
}

const MONTHS = [
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
]

export function ProjectDialog({ project, open: controlledOpen, onOpenChange: setControlledOpen, children }: ProjectDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<string>(project?.status || 'planning')

    // Date State
    const [month, setMonth] = useState<string>('')
    const [day, setDay] = useState<string>('')
    const [year, setYear] = useState<string>('')
    const [descLength, setDescLength] = useState(0)

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? setControlledOpen : setInternalOpen

    useEffect(() => {
        if (project) {
            setStatus(project.status || 'planning')
            if (project.due_date) {
                const d = new Date(project.due_date)
                setMonth(d.getMonth().toString())
                setDay(d.getDate().toString())
                setYear(d.getFullYear().toString())
            } else {
                setDay('')
                setYear('')
            }
            setDescLength(project.description?.length || 0)
        } else {
            // Reset logic handled generally by component state being distinct instances or manual reset if needed
            // but here we just rely on parent passing null.
        }
    }, [project, open])

    // Generate years (current year to current year + 12)
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 13 }, (_, i) => (currentYear + i).toString())

    // Generate days based on month/year
    const daysInMonth = (month !== '' && year !== '')
        ? getDaysInMonth(new Date(parseInt(year), parseInt(month)))
        : 31
    const days = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString())

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData(event.currentTarget)

        // Construct Date
        if (month && day && year) {
            const dateObj = new Date(parseInt(year), parseInt(month), parseInt(day))
            formData.set('due_date', dateObj.toISOString())
        }

        formData.set('status', status)

        let result
        if (project) {
            result = await updateProject(project.id, null, formData)
        } else {
            result = await createProject(null, formData)
        }

        setLoading(false)
        if (result?.message === 'Success') {
            setOpen && setOpen(false)
            toast.success(project ? "Project updated successfully" : "Project created successfully")
            if (!project) {
                // Reset form
                setStatus('planning')
                setMonth('')
                setDay('')
                setYear('')
            }
        } else {
            toast.error(result?.message || (project ? 'Failed to update project' : 'Failed to create project'))
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
                        <DialogDescription>
                            {project ? 'Update project details.' : 'Create a new construction project to manage permits and documents.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Name */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={project?.name}
                                placeholder="Skyline Tower"
                                className="col-span-3"
                                required
                            />
                        </div>

                        {/* Location */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="location" className="text-right">Location</Label>
                            <Input
                                id="location"
                                name="location"
                                defaultValue={project?.location}
                                placeholder="123 Main St"
                                className="col-span-3"
                            />
                        </div>

                        {/* Status */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">Status</Label>
                            <div className="col-span-3">
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="planning">Planning</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Due Date (3 Selects) */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right ">Due Date</Label>
                            <div className="col-span-3 flex gap-2">
                                {/* Month */}
                                <Select value={month} onValueChange={setMonth}>
                                    <SelectTrigger className="w-[130px]">
                                        <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTHS.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Day */}
                                <Select value={day} onValueChange={setDay}>
                                    <SelectTrigger className="w-[80px]">
                                        <SelectValue placeholder="Day" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {days.map((d) => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Year */}
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {years.map((y) => (
                                            <SelectItem key={y} value={y}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="description" className="text-right pt-2">Desc</Label>
                            <div className="col-span-3 space-y-1">
                                <Textarea
                                    id="description"
                                    name="description"
                                    defaultValue={project?.description}
                                    placeholder="Brief description..."
                                    className="resize-none"
                                    maxLength={150}
                                    onChange={(e) => setDescLength(e.target.value.length)}
                                />
                                <div className="text-right text-xs text-muted-foreground">
                                    {descLength}/150
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="notes" className="text-right">Notes</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                defaultValue={project?.notes}
                                placeholder="Internal notes..."
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="hover:bg-blue-600 transition-colors">
                            {loading ? (project ? 'Updating...' : 'Creating...') : (project ? 'Save Changes' : 'Create Project')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
