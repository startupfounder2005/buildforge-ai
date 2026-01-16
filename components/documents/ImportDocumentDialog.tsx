'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, X, FileText, Loader2, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface ImportDocumentDialogProps {
    projectId: string
    userId: string
    onSuccess?: () => void
}

export function ImportDocumentDialog({ projectId, userId, onSuccess }: ImportDocumentDialogProps) {
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    // Form State
    const [title, setTitle] = useState("")
    const [type, setType] = useState("")
    const [description, setDescription] = useState("")
    // Date input defaults to YYYY-MM-DD
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [isOfficial, setIsOfficial] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0])
        }
    }

    const validateAndSetFile = (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            toast.error("File is too large. Max size is 10MB.")
            return
        }
        setFile(file)
        if (!title) {
            // Auto-fill title from filename (remove extension)
            setTitle(file.name.replace(/\.[^/.]+$/, ""))
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0])
        }
    }

    const handleSubmit = async () => {
        if (!file || !title || !type || !date) {
            toast.error("Please fill in all required fields and upload a file.")
            return
        }

        setLoading(true)
        const supabase = createClient()

        try {
            // 1. Upload File
            const fileExt = file.name.split('.').pop()
            const fileName = `${projectId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

            const { error: uploadError, data: uploadData } = await supabase.storage
                .from('documents')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(fileName)

            // 2. Insert Metadata into Database
            const { error: dbError } = await supabase
                .from('documents')
                .insert({
                    project_id: projectId,
                    user_id: userId,
                    title: title,
                    type: type.toLowerCase().replace(/ /g, '_'),
                    // Store selected date in description since we use created_at for "Activity Feed" timestamp
                    description: description ? `[Date: ${date}]\n${description}` : `[Date: ${date}]`,
                    file_url: publicUrl,
                    // Remove created_at override so it defaults to now() -> Corrects "Recent Activity" 19h ago bug
                    status: 'Imported',
                    is_official: isOfficial
                })
                .select()
                .single()

            if (dbError) throw dbError

            // 3. Trigger Notification
            const { error: notifError } = await supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    type: 'document',
                    title: 'Document Imported',
                    message: `Imported "${title}" to project.`,
                    link: `/dashboard/documents`, // Ideally deeply link if we had ID, but we only have publicUrl easily from storage flow or we need to select back. 
                    // Actually .select() above is redundant if we don't catch data. 
                    // Let's assume list view is fine.
                    is_read: false
                })

            if (notifError) console.error("Import Notification Error", notifError)

            toast.success("Document imported successfully!")
            setOpen(false)
            setFile(null)
            setTitle("")
            setDescription("")
            setIsOfficial(false)
            router.refresh()
            if (onSuccess) onSuccess()

        } catch (error: any) {
            console.error("Import error:", error)
            toast.error(error.message || "Failed to import document")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-900/20">
                    <Upload className="h-4 w-4" />
                    Import Document
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none bg-zinc-900/95 backdrop-blur-xl shadow-2xl text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        Import Document
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Upload an official document, scan, or image to this project.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* File Dropzone */}
                    <div
                        className={`relative group cursor-pointer flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed transition-all duration-200 ${dragActive ? "border-blue-500 bg-blue-500/10" : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50"
                            } ${file ? "border-green-500/50 bg-green-500/5" : ""}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                            onChange={handleFileChange}
                        />

                        {file ? (
                            <div className="flex flex-col items-center text-green-400">
                                <CheckCircle className="h-8 w-8 mb-2" />
                                <span className="text-sm font-medium trunc max-w-[200px] truncate">{file.name}</span>
                                <span className="text-xs text-green-500/70">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-zinc-400 group-hover:text-zinc-300">
                                <Upload className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm font-medium">Click to upload or drag & drop</p>
                                <p className="text-xs opacity-50">PDF, PNG, JPG (Max 10MB)</p>
                            </div>
                        )}

                        {file && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6 rounded-full hover:bg-zinc-800 text-zinc-400"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setFile(null)
                                }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-xs text-zinc-400">Document Title <span className="text-red-500">*</span></Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Signed Permit"
                                className="bg-zinc-800/50 border-zinc-700 focus:border-blue-500/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-xs text-zinc-400">Document Type <span className="text-red-500">*</span></Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="bg-zinc-800/50 border-zinc-700 focus:ring-blue-500/20">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="permit">Permit</SelectItem>
                                    <SelectItem value="contract">Subcontractor Agreement</SelectItem>
                                    <SelectItem value="invoice">Invoice / Receipt</SelectItem>
                                    <SelectItem value="change_order">Change Order</SelectItem>
                                    <SelectItem value="daily_log">Daily Log</SelectItem>
                                    <SelectItem value="inspection">Inspection Report</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-xs text-zinc-400">Document Date <span className="text-red-500">*</span></Label>
                            <Input
                                type="date"
                                id="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-zinc-800/50 border-zinc-700 focus:border-blue-500/50"
                            />
                        </div>
                        <div className="flex items-end pb-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="official"
                                    checked={isOfficial}
                                    onCheckedChange={(c) => setIsOfficial(c as boolean)}
                                    className="border-zinc-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <label
                                    htmlFor="official"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-300"
                                >
                                    Official Authority Document
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="desc" className="text-xs text-zinc-400">Notes / Description</Label>
                        <Textarea
                            id="desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add any relevant details..."
                            className="bg-zinc-800/50 border-zinc-700 focus:border-blue-500/50 min-h-[80px]"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="hover:bg-zinc-800 text-zinc-400">Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !file}
                        className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload Import"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
