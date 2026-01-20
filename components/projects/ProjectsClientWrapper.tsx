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
import { Search, Filter, MoreHorizontal, Eye, Trash2, Edit, Plus, Loader2, Grid, List, ArrowUpDown, CheckCircle, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ProjectStats } from './ProjectStats'
import { ProjectDialog } from './ProjectDialog'
import { motion, AnimatePresence } from 'framer-motion'
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
import { deleteProject, deleteProjects } from '@/app/dashboard/projects/actions'
import { toast } from "sonner"

import { UpgradeDialog } from '@/components/shared/UpgradeDialog'

interface ProjectsClientWrapperProps {
    initialProjects: any[]
    plan: string
}

export function ProjectsClientWrapper({ initialProjects, plan }: ProjectsClientWrapperProps) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
    const [sortOption, setSortOption] = useState('date-desc')
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)
    const [upgradeOpen, setUpgradeOpen] = useState(false)

    // Edit State
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [projectToEdit, setProjectToEdit] = useState<any>(null)

    // Create State
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [isCreateLoading, setIsCreateLoading] = useState(false)

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

    const handleCreateClick = () => {
        setIsCreateLoading(true)
        setTimeout(() => {
            setCreateDialogOpen(true)
            setIsCreateLoading(false)
        }, 500)
    }

    const confirmDelete = async () => {
        if (!projectToDelete) return

        const result = await deleteProject(projectToDelete)

        if (result?.message === 'Success') {
            toast.success("Project deleted successfully")
            setSelectedProjectIds(prev => prev.filter(id => id !== projectToDelete))
        } else {
            toast.error(result?.message || 'Failed to delete project')
        }
        setDeleteDialogOpen(false)
        setProjectToDelete(null)
    }

    const confirmBulkDelete = async () => {
        if (selectedProjectIds.length === 0) return
        setIsBulkDeleting(true)
        const result = await deleteProjects(selectedProjectIds)
        if (result?.message === 'Success') {
            toast.success(`${selectedProjectIds.length} projects deleted`)
            setSelectedProjectIds([])
        } else {
            toast.error(result?.message || 'Failed to delete projects')
        }
        setBulkDeleteDialogOpen(false)
        setIsBulkDeleting(false)
    }

    const toggleSelection = (id: string) => {
        setSelectedProjectIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedProjectIds(filteredProjects.map(p => p.id))
        } else {
            setSelectedProjectIds([])
        }
    }

    const filteredProjects = initialProjects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) ||
            project.location?.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter
        return matchesSearch && matchesStatus
    }).sort((a, b) => {
        switch (sortOption) {
            case 'date-desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            case 'date-asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            case 'name-asc': return a.name.localeCompare(b.name)
            case 'name-desc': return b.name.localeCompare(a.name)
            default: return 0
        }
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
                        className="hover:bg-blue-600 transition-all border border-transparent hover:border-white"
                    >
                        <Plus className="mr-2 h-4 w-4" /> New Project
                    </Button>
                ) : (
                    <>
                        <Button
                            onClick={handleCreateClick}
                            disabled={isCreateLoading}
                            className="hover:bg-blue-600 transition-all border border-transparent hover:border-white"
                        >
                            {isCreateLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            New Project
                        </Button>
                        <ProjectDialog
                            open={createDialogOpen}
                            onOpenChange={setCreateDialogOpen}
                        />
                    </>
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
                        <div className="flex flex-col gap-4">
                            {/* Top Row: Search & Status */}
                            <div className="flex flex-col md:flex-row gap-4 items-center">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search projects..."
                                        className="pl-8 bg-zinc-900 border-zinc-800 focus:border-white/20 transition-all"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full md:w-[180px] bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:border-white transition-all font-medium">
                                        <Filter className="mr-2 h-4 w-4" />
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="planning">Planning</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Bottom Row: Sort & Layout */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 mt-2 border-t border-zinc-800/50">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.1em] mr-2">Display:</span>
                                    <Select value={sortOption} onValueChange={setSortOption}>
                                        <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:border-white transition-all text-xs h-9 font-medium">
                                            <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
                                            <SelectValue placeholder="Sort by" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white p-1">
                                            <SelectItem value="date-desc" className="hover:border-white/50 transition-all border border-transparent cursor-pointer rounded-sm mb-0.5">Newest First</SelectItem>
                                            <SelectItem value="date-asc" className="hover:border-white/50 transition-all border border-transparent cursor-pointer rounded-sm mb-0.5">Oldest First</SelectItem>
                                            <SelectItem value="name-asc" className="hover:border-white/50 transition-all border border-transparent cursor-pointer rounded-sm mb-0.5">Name A-Z</SelectItem>
                                            <SelectItem value="name-desc" className="hover:border-white/50 transition-all border border-transparent cursor-pointer rounded-sm">Name Z-A</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.1em]">Layout:</span>
                                    <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800 p-1 shadow-inner">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`h-7 px-3 rounded-md transition-all border border-transparent hover:border-white gap-2 text-[10px] font-bold uppercase tracking-wider ${viewMode === 'table' ? 'bg-zinc-800 text-white shadow-sm border-zinc-700' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                                            onClick={() => setViewMode('table')}
                                        >
                                            <List className="h-3.5 w-3.5" />
                                            Table
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`h-7 px-3 rounded-md transition-all border border-transparent hover:border-white gap-2 text-[10px] font-bold uppercase tracking-wider ${viewMode === 'grid' ? 'bg-zinc-800 text-white shadow-sm border-zinc-700' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                                            onClick={() => setViewMode('grid')}
                                        >
                                            <Grid className="h-3.5 w-3.5" />
                                            Grid
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="relative overflow-hidden">
                <AnimatePresence>
                    {selectedProjectIds.length > 0 && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-zinc-900 border border-zinc-700 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md"
                        >
                            <span className="text-sm font-medium text-blue-400">{selectedProjectIds.length} selected</span>
                            <div className="h-4 w-[1px] bg-zinc-800" />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 border border-transparent hover:border-red-500/50 transition-all"
                                onClick={() => setBulkDeleteDialogOpen(true)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Selected
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-zinc-400 hover:text-white hover:bg-white/10 h-8 border border-transparent hover:border-white/20 transition-all font-medium"
                                onClick={() => setSelectedProjectIds([])}
                            >
                                Cancel
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <CardHeader>
                    <CardTitle>Project List</CardTitle>
                    <CardDescription>{filteredProjects.length} projects found</CardDescription>
                </CardHeader>
                <CardContent>
                    {viewMode === 'table' ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={selectedProjectIds.length === filteredProjects.length && filteredProjects.length > 0}
                                            onCheckedChange={handleSelectAll}
                                            className="border-zinc-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 translate-y-[2px]"
                                        />
                                    </TableHead>
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
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No projects found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProjects.map((project) => (
                                        <TableRow
                                            key={project.id}
                                            className="group hover:bg-zinc-900/50 border-zinc-800 transition-colors cursor-pointer"
                                            onClick={() => toggleSelection(project.id)}
                                        >
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedProjectIds.includes(project.id)}
                                                    onCheckedChange={() => toggleSelection(project.id)}
                                                    className="border-zinc-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 translate-y-[2px]"
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={`/dashboard/projects/${project.id}`}
                                                    className="hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {project.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{project.location || '—'}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`capitalize font-medium border ${project.status === 'planning'
                                                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                        : project.status === 'active'
                                                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                        }`}
                                                >
                                                    {project.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {project.due_date ? format(new Date(project.due_date), 'MMM d, yyyy') : '—'}
                                            </TableCell>
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 border border-transparent hover:border-white transition-all">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild className="cursor-pointer border border-transparent hover:border-white transition-all">
                                                            <Link href={`/dashboard/projects/${project.id}`}>
                                                                <Eye className="mr-2 h-4 w-4" /> View Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleEditClick(project)}
                                                            className="cursor-pointer border border-transparent hover:border-white transition-all"
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" /> Edit Project
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:bg-red-600 focus:text-white cursor-pointer border border-transparent hover:border-white transition-all"
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
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
                            {filteredProjects.length === 0 ? (
                                <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed border-zinc-800 rounded-xl">
                                    No projects found.
                                </div>
                            ) : (
                                filteredProjects.map((project) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        key={project.id}
                                        className={`group relative bg-zinc-950 border rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer ${selectedProjectIds.includes(project.id) ? "border-blue-500 ring-1 ring-blue-500" : "border-zinc-800 hover:border-zinc-700"}`}
                                        onClick={() => toggleSelection(project.id)}
                                    >
                                        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedProjectIds.includes(project.id)}
                                                onCheckedChange={() => toggleSelection(project.id)}
                                                className="border-zinc-600 data-[state=checked]:bg-blue-500"
                                            />
                                        </div>

                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 bg-zinc-900 rounded-lg group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                                                <Building2 className="h-6 w-6 text-zinc-500 group-hover:text-blue-500" />
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={`capitalize font-medium border ${project.status === 'planning'
                                                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                    : project.status === 'active'
                                                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                    }`}
                                            >
                                                {project.status}
                                            </Badge>
                                        </div>

                                        <h3 className="font-bold text-lg mb-1 group-hover:text-blue-400 transition-colors truncate pr-6">{project.name}</h3>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-4 line-clamp-1">
                                            <Search className="h-3.5 w-3.5" />
                                            {project.location || 'No location set'}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-900">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-0.5">Due Date</span>
                                                <span className="text-xs font-medium text-zinc-400">
                                                    {project.due_date ? format(new Date(project.due_date), 'MMM d, yyyy') : '—'}
                                                </span>
                                            </div>
                                            <div onClick={e => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 border border-transparent hover:border-white transition-all">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild className="cursor-pointer border border-transparent hover:border-white transition-all">
                                                            <Link href={`/dashboard/projects/${project.id}`}>
                                                                <Eye className="mr-2 h-4 w-4" /> View Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleEditClick(project)}
                                                            className="cursor-pointer border border-transparent hover:border-white transition-all"
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" /> Edit Project
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:bg-red-600 focus:text-white cursor-pointer border border-transparent hover:border-white transition-all"
                                                            onClick={() => handleDeleteClick(project.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Project
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}
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

            {/* Bulk Delete Confirmation */}
            <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bulk Delete Projects</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {selectedProjectIds.length} projects?
                            This action cannot be undone and will delete all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmBulkDelete}
                            disabled={isBulkDeleting}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Delete Projects
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
        </div >
    )
}
