'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import Link from 'next/link'
import { format } from 'date-fns'
import { Search, Filter, MoreHorizontal, Eye, Trash2, Edit, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ProjectStats } from './ProjectStats'
import { ProjectDialog } from './ProjectDialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Button } from "@/components/ui/button"
import { deleteProject } from '@/app/dashboard/projects/actions'
import { toast } from "sonner"

import { UpgradeDialog } from '@/components/shared/UpgradeDialog'

interface ProjectsClientWrapperProps {
    initialProjects: any[]
    plan: string
}

export function ProjectsClientWrapper({ initialProjects, plan }: ProjectsClientWrapperProps) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
    const [upgradeOpen, setUpgradeOpen] = useState(false)

    // Edit State
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [projectToEdit, setProjectToEdit] = useState<any>(null)

    const isFree = plan === 'free'
    const projectLimitReached = isFree && initialProjects.length >= 1

    const handleDeleteClick = (id: string) => {
        setProjectToDelete(id)
        setDeleteDialogOpen(true)
    }

    const handleEditClick = (project: any) => {
        setProjectToEdit(project)
        setEditDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!projectToDelete) return

        const result = await deleteProject(projectToDelete)

        if (result?.message === 'Success') {
            toast.success("Project deleted successfully")
        } else {
            toast.error(result?.message || 'Failed to delete project')
        }
        setDeleteDialogOpen(false)
        setProjectToDelete(null)
    }

    const filteredProjects = initialProjects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) ||
            project.location?.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter
        return matchesSearch && matchesStatus
    })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
                    <p className="text-muted-foreground">Manage your construction sites</p>
                </div>
                {/* Create Project Dialog */}
                {projectLimitReached ? (
                    <Button
                        onClick={() => setUpgradeOpen(true)}
                        className="hover:bg-blue-600 transition-colors"
                    >
                        <Plus className="mr-2 h-4 w-4" /> New Project
                    </Button>
                ) : (
                    <ProjectDialog>
                        <Button className="hover:bg-blue-600 transition-colors">
                            <Plus className="mr-2 h-4 w-4" /> New Project
                        </Button>
                    </ProjectDialog>
                )}
            </div>

            <UpgradeDialog
                open={upgradeOpen}
                onOpenChange={setUpgradeOpen}
                limitType="project"
            />

            <div className="grid gap-6 md:grid-cols-3">
                <ProjectStats projects={initialProjects} />

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                        <CardDescription>Use filters to find specific projects</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search projects..."
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="planning">Planning</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Project List</CardTitle>
                    <CardDescription>{filteredProjects.length} projects found</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProjects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No projects found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProjects.map((project) => (
                                    <TableRow key={project.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/dashboard/projects/${project.id}`} className="hover:underline">
                                                {project.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{project.location || '—'}</TableCell>
                                        <TableCell>
                                            <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                                                {project.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {project.due_date ? format(new Date(project.due_date), 'MMM d, yyyy') : '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/dashboard/projects/${project.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" /> View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEditClick(project)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Project
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:bg-red-600 focus:text-white cursor-pointer"
                                                        onClick={() => handleDeleteClick(project.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Project
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the project
                            and all associated documents.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Project Dialog */}
            <ProjectDialog
                project={projectToEdit}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />
        </div>
    )
}
