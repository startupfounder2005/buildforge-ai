'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Save, Loader2, Plus, StickyNote, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from 'date-fns'
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

// Dynamic import with forwardRef wrapper to fix findDOMNode issue
const ReactQuill = dynamic(
    () => import('react-quill-new'),
    { ssr: false }
)

interface ProjectNotesProps {
    projectId: string
}

export function ProjectNotes({ projectId }: ProjectNotesProps) {
    const supabase = createClient()
    const [notes, setNotes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [content, setContent] = useState('')
    const [saving, setSaving] = useState(false)
    const [viewNote, setViewNote] = useState<any | null>(null)
    const [editingNote, setEditingNote] = useState<any | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const fetchNotes = async () => {
        const { data } = await supabase
            .from('project_notes')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })

        if (data) {
            setNotes(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchNotes()

        const channel = supabase
            .channel('notes_list_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'project_notes', filter: `project_id=eq.${projectId}` }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setNotes(prev => [payload.new, ...prev.filter(n => n.id !== payload.new.id)])
                } else if (payload.eventType === 'DELETE') {
                    setNotes(prev => prev.filter(n => n.id !== payload.old.id))
                } else if (payload.eventType === 'UPDATE') {
                    setNotes(prev => prev.map(n => n.id === payload.new.id ? payload.new : n))
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [projectId, supabase])

    const handleSave = async () => {
        if (!content || content === '<p><br></p>') {
            toast.error('Note cannot be empty')
            return
        }

        setSaving(true)
        try {
            const user = (await supabase.auth.getUser()).data.user
            if (!user) return

            if (editingNote) {
                // Update
                const { data, error } = await supabase
                    .from('project_notes')
                    .update({ content, updated_at: new Date().toISOString() })
                    .eq('id', editingNote.id)
                    .select()
                    .single()

                if (error) throw error

                // Optimistic update handled by subscription or manual:
                setNotes(prev => prev.map(n => n.id === editingNote.id ? data : n))
                toast.success('Note updated')
            } else {
                // Create
                const { data, error } = await supabase
                    .from('project_notes')
                    .insert({ content, project_id: projectId, user_id: user.id })
                    .select()
                    .single()

                if (error) throw error

                // Optimistic update
                setNotes(prev => [data, ...prev])
                toast.success('Note added')
            }

            setOpen(false)
            setContent('')
            setEditingNote(null)
        } catch (error) {
            toast.error('Failed to save note')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setDeleteId(id)
    }

    const confirmDelete = async () => {
        if (!deleteId) return

        try {
            const { error } = await supabase
                .from('project_notes')
                .delete()
                .eq('id', deleteId)

            if (error) throw error

            setNotes(prev => prev.filter(n => n.id !== deleteId))
            toast.success('Note deleted')
        } catch (error) {
            toast.error('Failed to delete note')
        } finally {
            setDeleteId(null)
        }
    }

    const openEdit = (e: React.MouseEvent, note: any) => {
        e.stopPropagation()
        setEditingNote(note)
        setContent(note.content)
        setOpen(true)
    }

    const handleDialogOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
            setEditingNote(null)
            setContent('')
        }
    }

    const modules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'clean']
        ]
    }), [])

    // Helper to strip HTML for preview
    const stripHtml = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    }

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-lg">Project Notes</h3>
                    <p className="text-sm text-muted-foreground">Keep track of important details and updates.</p>
                </div>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Note
                </Button>

                <Dialog open={open} onOpenChange={handleDialogOpenChange}>
                    <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>{editingNote ? 'Edit Note' : 'Add New Note'}</DialogTitle>
                            <DialogDescription>
                                {editingNote ? 'Update your note below.' : 'Write your observation or update below.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-hidden border rounded-md">
                            <ReactQuill
                                theme="snow"
                                value={content}
                                onChange={setContent}
                                className="h-full pb-12" // Padding for toolbar
                                modules={modules}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingNote ? 'Update Note' : 'Save Note'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <ScrollArea className="flex-1 -mx-4 px-4">
                {loading ? (
                    <div className="flex h-32 items-center justify-center text-muted-foreground">Loading notes...</div>
                ) : notes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed bg-muted/20">
                        <StickyNote className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No notes yet</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mt-1">
                            Add your first note to start tracking progress.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {notes.map((note) => (
                            <Card key={note.id} className="cursor-pointer hover:border-primary/50 transition-colors group relative" onClick={() => setViewNote(note)}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base font-medium flex items-center gap-2">
                                            <StickyNote className="h-4 w-4 text-blue-500" />
                                            Note via User
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(note.created_at))} ago
                                            </span>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-blue-500/10 hover:text-blue-400 transition-colors">
                                                        <MoreVertical className="h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => openEdit(e, note)}>
                                                        <Pencil className="mr-2 h-3 w-3" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={(e) => handleDelete(e, note.id)}>
                                                        <Trash2 className="mr-2 h-3 w-3" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-4">
                                        {stripHtml(note.content)}
                                    </p>
                                    <div className="mt-2 text-xs text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                        Click to read more
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Read Note Dialog */}
            <Dialog open={!!viewNote} onOpenChange={(open) => !open && setViewNote(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Note Details</DialogTitle>
                        <DialogDescription>
                            Created {viewNote && formatDistanceToNow(new Date(viewNote.created_at))} ago
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-4 border rounded-md bg-muted/10 prose prose-sm max-w-none dark:prose-invert">
                        {viewNote && (
                            <div dangerouslySetInnerHTML={{ __html: viewNote.content }} />
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setViewNote(null)}>Close</Button>
                        {viewNote && (
                            <Button onClick={() => {
                                setEditingNote(viewNote)
                                setContent(viewNote.content)
                                setViewNote(null)
                                setOpen(true)
                            }}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit Note
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the note.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
