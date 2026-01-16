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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

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

    // State for Import Tabs
    const [activeTab, setActiveTab] = useState("write")
    const [tempTextPreview, setTempTextPreview] = useState<string>("")
    const [tempImagePreview, setTempImagePreview] = useState<string | null>(null)
    const [tempImageFile, setTempImageFile] = useState<File | null>(null)

    // State for Bulk Actions
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isExporting, setIsExporting] = useState(false)

    // State for Image Preview Modal
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

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

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === notes.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(notes.map(n => n.id)))
        }
    }

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return
        setShowBulkDeleteConfirm(true)
    }

    const performBulkDelete = async () => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('project_notes')
                .delete()
                .in('id', Array.from(selectedIds))

            if (error) throw error

            setNotes(prev => prev.filter(n => !selectedIds.has(n.id)))
            setSelectedIds(new Set())
            toast.success("Notes deleted successfully")
        } catch (error) {
            toast.error('Failed to delete notes')
        } finally {
            setLoading(false)
            setShowBulkDeleteConfirm(false)
        }
    }

    const handleBulkExport = async () => {
        if (selectedIds.size === 0) return
        setIsExporting(true)

        try {
            const zip = new JSZip()
            const exportFolder = zip.folder("project-notes")

            // Get selected notes
            const notesToExport = notes.filter(n => selectedIds.has(n.id))

            await Promise.all(notesToExport.map(async (note) => {
                const datePrefix = new Date(note.created_at).toISOString().split('T')[0]

                if (note.type === 'image' && note.media_url) {
                    try {
                        const response = await fetch(note.media_url)
                        const blob = await response.blob()
                        // Try to get extension from url or default to png
                        const ext = note.media_url.split('.').pop()?.split('?')[0] || 'png'
                        const filename = `${datePrefix}_${note.content.substring(0, 30).replace(/[^a-z0-9]/gi, '_')}.${ext}`
                        exportFolder?.file(filename, blob)
                    } catch (e) {
                        console.error("Failed to fetch image", e)
                        exportFolder?.file(`${datePrefix}_error_log.txt`, `Failed to download image note: ${note.id}`)
                    }
                } else {
                    // Text Note
                    const filename = `${datePrefix}_note_${note.id.substring(0, 8)}.html`
                    const content = `
                        <html>
                        <head><title>Note ${note.id}</title></head>
                        <body>
                            <h1>Note Created: ${new Date(note.created_at).toLocaleString()}</h1>
                            <hr/>
                            ${note.content}
                        </body>
                        </html>
                    `
                    exportFolder?.file(filename, content)
                }
            }))

            const content = await zip.generateAsync({ type: "blob" })
            saveAs(content, `notes-export-${new Date().toISOString().split('T')[0]}.zip`)
            toast.success("Export complete")
            setSelectedIds(new Set())
        } catch (error) {
            console.error(error)
            toast.error("Failed to export notes")
        } finally {
            setIsExporting(false)
        }
    }

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
            setTempTextPreview("")
            setTempImagePreview(null)
            setTempImageFile(null)
            setActiveTab("write")
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
                <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                        <>
                            <Button variant="outline" onClick={handleBulkExport} disabled={isExporting}>
                                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Export ({selectedIds.size})</>}
                            </Button>
                            <Button variant="destructive" onClick={handleBulkDelete}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedIds.size})
                            </Button>
                        </>
                    )}
                    <Button onClick={() => setOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Note
                    </Button>
                </div>

                <Dialog open={open} onOpenChange={handleDialogOpenChange}>
                    {/* ... (existing dialog content untouched) ... */}
                    <DialogContent className={`flex flex-col transition-all duration-300 ${activeTab === 'write' ? 'max-w-3xl h-[85vh]' : 'max-w-lg h-auto'}`}>
                        <DialogHeader>
                            <DialogTitle>{editingNote ? 'Edit Note' : 'Add New Note'}</DialogTitle>
                            <DialogDescription>
                                {editingNote ? 'Update your note below.' : 'Choose how you want to add your note.'}
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                            {!editingNote && (
                                <TabsList className="grid w-full grid-cols-3 mb-4">
                                    <TabsTrigger value="write">Write Note</TabsTrigger>
                                    <TabsTrigger value="text">Import Text/Doc</TabsTrigger>
                                    <TabsTrigger value="image">Import Image</TabsTrigger>
                                </TabsList>
                            )}

                            {/* WRITE TAB */}
                            <TabsContent value="write" className="flex-1 flex flex-col overflow-hidden m-0">
                                <div className="flex-1 overflow-hidden border rounded-md relative">
                                    <ReactQuill
                                        theme="snow"
                                        value={content}
                                        onChange={setContent}
                                        className="h-full pb-12"
                                        modules={modules}
                                    />
                                </div>
                                <div className="flex justify-end text-xs text-muted-foreground mt-1">
                                    {stripHtml(content).length} / 2500 characters
                                </div>
                                <DialogFooter className="mt-4">
                                    <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>Cancel</Button>
                                    <Button onClick={handleSave} disabled={saving || stripHtml(content).length > 2500}>
                                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {editingNote ? 'Update Note' : 'Save Note'}
                                    </Button>
                                </DialogFooter>
                            </TabsContent>

                            {/* IMPORT TEXT TAB */}
                            <TabsContent value="text" className="flex flex-col m-0 space-y-4">
                                <div className="border-2 border-dashed border-zinc-700 rounded-lg h-48 flex flex-col items-center justify-center text-center space-y-3 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors group cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept=".txt,.md"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                const reader = new FileReader()
                                                reader.onload = (e) => {
                                                    const text = e.target?.result as string
                                                    setTempTextPreview(text)
                                                }
                                                reader.readAsText(file)
                                            }
                                        }}
                                    />
                                    <div className="bg-zinc-800 p-3 rounded-full group-hover:bg-zinc-700 transition-colors">
                                        <StickyNote className="h-6 w-6 text-zinc-400 group-hover:text-zinc-200" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm text-zinc-200">Click to upload text file</p>
                                        <p className="text-xs text-muted-foreground">Support for .txt, .md</p>
                                    </div>
                                </div>
                                {tempTextPreview && (
                                    <div className="h-64 border rounded-md p-4 overflow-y-auto bg-muted/10 font-mono text-xs whitespace-pre-wrap">
                                        {tempTextPreview}
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button
                                        onClick={async () => {
                                            if (tempTextPreview) {
                                                setSaving(true)
                                                try {
                                                    const user = (await supabase.auth.getUser()).data.user
                                                    if (!user) return

                                                    const { data, error } = await supabase
                                                        .from('project_notes')
                                                        .insert({
                                                            content: tempTextPreview.replace(/\n/g, '<br/>'),
                                                            project_id: projectId,
                                                            user_id: user.id,
                                                            type: 'text'
                                                        })
                                                        .select()
                                                        .single()

                                                    if (error) throw error

                                                    setNotes(prev => [data, ...prev])
                                                    toast.success("Note imported successfully")
                                                    handleDialogOpenChange(false)
                                                } catch (err) {
                                                    toast.error("Failed to save note")
                                                } finally {
                                                    setSaving(false)
                                                }
                                            }
                                        }}
                                        disabled={!tempTextPreview || saving}
                                    >
                                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save as Note'}
                                    </Button>
                                </DialogFooter>
                            </TabsContent>

                            {/* IMPORT IMAGE TAB */}
                            <TabsContent value="image" className="flex flex-col m-0 space-y-4">
                                <div className="border-2 border-dashed border-zinc-700 rounded-lg h-48 flex flex-col items-center justify-center text-center space-y-3 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors group cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                const url = URL.createObjectURL(file)
                                                setTempImagePreview(url)
                                                setTempImageFile(file)
                                            }
                                        }}
                                    />
                                    <div className="bg-zinc-800 p-3 rounded-full group-hover:bg-zinc-700 transition-colors">
                                        <StickyNote className="h-6 w-6 text-zinc-400 group-hover:text-zinc-200" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm text-zinc-200">Click to upload image</p>
                                        <p className="text-xs text-muted-foreground">Support for .png, .jpg, .webp</p>
                                    </div>
                                </div>
                                {tempImagePreview && (
                                    <div className="h-64 border rounded-md p-4 flex items-center justify-center bg-zinc-950 overflow-hidden">
                                        <img src={tempImagePreview} className="max-h-full max-w-full object-contain shadow-lg rounded-sm" />
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button
                                        onClick={async () => {
                                            if (tempImageFile) {
                                                setSaving(true)
                                                try {
                                                    const fileName = `${Date.now()}-${tempImageFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
                                                    const { data: uploadData, error: uploadError } = await supabase.storage
                                                        .from('project-assets')
                                                        .upload(fileName, tempImageFile)

                                                    if (uploadError) throw uploadError

                                                    const { data: { publicUrl } } = supabase.storage
                                                        .from('project-assets')
                                                        .getPublicUrl(fileName)

                                                    const user = (await supabase.auth.getUser()).data.user
                                                    if (!user) return

                                                    const { data, error } = await supabase
                                                        .from('project_notes')
                                                        .insert({
                                                            content: tempImageFile.name,
                                                            project_id: projectId,
                                                            user_id: user.id,
                                                            type: 'image',
                                                            media_url: publicUrl
                                                        })
                                                        .select()
                                                        .single()

                                                    if (error) throw error

                                                    setNotes(prev => [data, ...prev])
                                                    toast.success("Image note added")
                                                    handleDialogOpenChange(false)
                                                } catch (err: any) {
                                                    toast.error("Failed to add image note. Ensure 'project-assets' bucket exists.")
                                                    console.error(err)
                                                } finally {
                                                    setSaving(false)
                                                }
                                            }
                                        }}
                                        disabled={!tempImageFile || saving}
                                    >
                                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Add to Notes'}
                                    </Button>
                                </DialogFooter>
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </div>

            {notes.length > 0 && (
                <div className="flex items-center gap-2 px-1">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="select-all"
                            checked={selectedIds.size === notes.length && notes.length > 0}
                            onCheckedChange={toggleSelectAll}
                        />
                        <label
                            htmlFor="select-all"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                            Select All
                        </label>
                    </div>
                    {selectedIds.size > 0 && <span className="text-xs text-muted-foreground ml-2">{selectedIds.size} selected</span>}
                </div>
            )}

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
                            <Card
                                key={note.id}
                                className={`cursor-pointer hover:border-primary/50 transition-colors group relative overflow-hidden flex flex-col ${selectedIds.has(note.id) ? 'border-primary bg-primary/5' : ''}`}
                                onClick={() => {
                                    if (selectedIds.size > 0) {
                                        toggleSelect(note.id)
                                    } else {
                                        note.type === 'image' ? setPreviewImage(note.media_url) : setViewNote(note)
                                    }
                                }}
                            >
                                <div className="absolute top-2 left-2 z-50" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedIds.has(note.id)}
                                        onCheckedChange={() => toggleSelect(note.id)}
                                        className="bg-background/80 backdrop-blur-sm data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                    />
                                </div>

                                {note.type === 'image' ? (
                                    <>
                                        {/* Image Note Card - Compact */}
                                        <div className="h-32 w-full bg-zinc-900 relative group-hover:opacity-90 transition-opacity">
                                            {note.media_url && (
                                                <img src={note.media_url} alt="Note Attachment" className="w-full h-full object-cover" />
                                            )}
                                            {selectedIds.has(note.id) && (
                                                <div className="absolute inset-0 bg-primary/20 z-10" />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                                                <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setPreviewImage(note.media_url); }}>
                                                    Preview
                                                </Button>
                                            </div>
                                        </div>
                                        <CardContent className="p-3 flex items-center justify-between text-card-foreground">
                                            <div className="flex-1 min-w-0 mr-2 ml-6"> {/* Added ml-6 for checkbox space */}
                                                <p className="font-medium text-xs truncate text-zinc-300">{note.content || "Image Asset"}</p>
                                                <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(note.created_at))} ago</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:bg-red-600 hover:text-white transition-colors shrink-0"
                                                onClick={(e) => handleDelete(e, note.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </CardContent>
                                    </>
                                ) : (
                                    <>
                                        {/* Text Note Card */}
                                        <CardHeader className="pb-2 pl-10"> {/* Added pl-10 for checkbox */}
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                                    <StickyNote className="h-4 w-4 text-blue-500" />
                                                    Text Note
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
                                                            <DropdownMenuItem className="text-red-500 focus:text-white focus:bg-red-600" onClick={(e) => handleDelete(e, note.id)}>
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
                                            <div className="mt-2 text-xs text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:underline">
                                                Click to read more
                                            </div>
                                        </CardContent>
                                    </>
                                )}
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

            {/* Image Preview Dialog */}
            <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-black/90 border-zinc-800">
                    <DialogTitle className="sr-only">Image Preview</DialogTitle>
                    <div className="relative w-full h-full min-h-[50vh] flex items-center justify-center">
                        {previewImage && (
                            <img src={previewImage} alt="Full Preview" className="max-w-full max-h-[85vh] object-contain" />
                        )}
                        <Button
                            variant="ghost"
                            className="absolute top-2 right-2 text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
                            onClick={() => setPreviewImage(null)}
                        >
                            <span className="sr-only">Close</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </Button>
                    </div>
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

            {/* Bulk Delete Alert */}
            <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedIds.size} notes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all selected notes.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={performBulkDelete} className="bg-red-600 hover:bg-red-700">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
