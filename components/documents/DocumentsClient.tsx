'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UpgradeDialog } from '@/components/shared/UpgradeDialog'
import {
    Search, Filter, FileText, MoreHorizontal, Download, Eye, Trash2,
    Grid, List, Loader2, ArrowUpDown, Info, ShieldCheck, Building2, Upload, Plus
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { jsPDF } from "jspdf"
import { ImportDocumentGlobalDialog } from './ImportDocumentGlobalDialog'
import { GenerateDocumentGlobalDialog } from './GenerateDocumentGlobalDialog'
import { DocumentDetailsSheet } from './DocumentDetailsSheet'
import { motion, AnimatePresence } from "framer-motion"

interface DocumentsClientProps {
    initialDocuments: any[]
    projects: { id: string, name: string }[]
    userId: string
    plan: string
}

export function DocumentsClient({ initialDocuments, projects, userId, plan }: DocumentsClientProps) {
    const [documents, setDocuments] = useState(initialDocuments)
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [sortOption, setSortOption] = useState('date-desc')
    const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [upgradeOpen, setUpgradeOpen] = useState(false)

    const isFree = plan === 'free'
    const docsLimitReached = isFree && documents.length >= 5

    // Dialogs & Sheets
    const [detailsDoc, setDetailsDoc] = useState<any | null>(null)

    const supabase = createClient()
    const router = useRouter()

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel('documents_global')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${userId}` },
                async (payload) => {
                    router.refresh()
                })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, userId, router])

    // Update local state when server data changes
    useEffect(() => {
        setDocuments(initialDocuments)
    }, [initialDocuments])

    // Client-side Filter & Sort
    const filteredDocs = documents.filter(doc => {
        const matchesSearch =
            doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.projects?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.description?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesType = typeFilter === 'all' || doc.type === typeFilter

        return matchesSearch && matchesType
    }).sort((a, b) => {
        switch (sortOption) {
            case 'date-desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            case 'date-asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            case 'name-asc': return a.title.localeCompare(b.title)
            case 'name-desc': return b.title.localeCompare(a.title)
            default: return 0
        }
    })

    // Actions
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedDocIds(filteredDocs.map(d => d.id))
        } else {
            setSelectedDocIds([])
        }
    }

    const toggleSelection = (id: string) => {
        setSelectedDocIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    // Helper: Generate PDF Blob for AI Docs
    const generatePdfBlob = (doc: any): Promise<Blob> | null => {
        if (doc.content_json?.pdf_base64) {
            return fetch(`data:application/pdf;base64,${doc.content_json.pdf_base64}`).then(res => res.blob())
        }

        // Return promise that resolves to blob
        return new Promise((resolve) => {
            let content = typeof doc.content_json === 'object'
                ? (doc.content_json.raw || JSON.stringify(doc.content_json, null, 2))
                : "No content available."

            const pdf = new jsPDF()
            let y = 20
            const margin = 20
            const pageWidth = 170

            // Header
            pdf.setFont("helvetica", "bold")
            pdf.setFontSize(22)
            pdf.text(doc.title, margin, y)
            y += 10

            // Meta
            pdf.setFont("helvetica", "normal")
            pdf.setFontSize(10)
            pdf.setTextColor(100)
            pdf.text(`Type: ${doc.type} | Version: ${doc.version || 1} | Date: ${format(new Date(doc.created_at), 'MMM dd, yyyy')}`, margin, y)
            y += 15

            // Content
            pdf.setFont("times", "normal")
            pdf.setFontSize(12)
            pdf.setTextColor(0)

            const lines = content.split('\n')

            lines.forEach((line: string) => {
                if (y > 280) {
                    pdf.addPage()
                    y = 20
                }
                if (line.startsWith('# ')) {
                    pdf.setFont("helvetica", "bold")
                    pdf.setFontSize(16)
                    pdf.text(line.replace('# ', ''), margin, y + 6)
                    y += 12
                    pdf.setFont("times", "normal")
                    pdf.setFontSize(12)
                    return
                }
                const cleanLine = line.replace(/\*\*/g, '').replace(/###/g, '')
                if (cleanLine.trim().length === 0) {
                    y += 5
                    return
                }
                const splitText = pdf.splitTextToSize(cleanLine, pageWidth)
                pdf.text(splitText, margin, y)
                y += (splitText.length * 5) + 2
            })

            resolve(pdf.output('blob'))
        })
    }


    // Single Document Download with Fallback
    const handleDownload = async (doc: any) => {
        try {
            if (doc.file_url) {
                // Download existing file
                window.open(doc.file_url, '_blank')
                return;
            }

            const blob = await generatePdfBlob(doc)
            if (blob) {
                saveAs(blob, `${doc.title.replace(/\s+/g, '_')}.pdf`)
                toast.success('PDF Generated')
            }
        } catch (e) {
            console.error(e)
            toast.error('Failed to download document')
        }
    }

    // Preview Logic - acts like opening file
    const handlePreview = async (doc: any) => {
        try {
            if (doc.file_url) {
                window.open(doc.file_url, '_blank')
                return
            }
            // For AI docs, open generated PDF in new tab
            const blob = await generatePdfBlob(doc)
            if (blob) {
                const url = URL.createObjectURL(blob)
                window.open(url, '_blank')
            }
        } catch (e) {
            toast.error("Failed to open preview")
        }
    }

    const handleBulkDownload = async () => {
        if (selectedDocIds.length === 0) return
        setLoading(true)
        const zip = new JSZip()
        let count = 0

        try {
            const docsToDownload = documents.filter(d => selectedDocIds.includes(d.id))

            for (const doc of docsToDownload) {
                if (doc.file_url) {
                    const response = await fetch(doc.file_url)
                    const blob = await response.blob()
                    const ext = doc.file_url.split('.').pop() || 'pdf'
                    zip.file(`${doc.title}.${ext}`, blob)
                    count++
                } else {
                    const blob = await generatePdfBlob(doc)
                    if (blob) {
                        zip.file(`${doc.title}.pdf`, blob)
                        count++
                    }
                }
            }

            if (count > 0) {
                const content = await zip.generateAsync({ type: "blob" })
                saveAs(content, "documents_export.zip")
                toast.success(`Exported ${count} documents.`)
            } else {
                toast.error("No valid files to download.")
            }
        } catch (e) {
            console.error(e)
            toast.error("Failed to export documents.")
        } finally {
            setLoading(false)
            setSelectedDocIds([])
        }
    }

    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

    const executeBulkDelete = async () => {
        try {
            const { error } = await supabase
                .from('documents')
                .delete()
                .in('id', selectedDocIds)

            if (error) throw error

            // Immediate UI Update
            setDocuments(prev => prev.filter(d => !selectedDocIds.includes(d.id)))
            toast.success("Documents deleted.")
            setSelectedDocIds([])
        } catch (e) {
            toast.error("Failed to delete.")
        } finally {
            setConfirmBulkDelete(false)
        }
    }

    const executeDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('documents')
                .delete()
                .eq('id', id)

            if (error) throw error

            // Immediate UI Update
            setDocuments(prev => prev.filter(d => d.id !== id))
            toast.success('Deleted')
        } catch (e) {
            toast.error('Failed to delete')
        } finally {
            setConfirmDeleteId(null)
        }
    }

    // Common Actions Dropdown
    const ActionDropdown = ({ doc }: { doc: any }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePreview(doc) }}>
                    <Eye className="mr-2 h-4 w-4" /> Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(doc) }}>
                    <Download className="mr-2 h-4 w-4" /> Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDetailsDoc(doc) }}>
                    <Info className="mr-2 h-4 w-4" /> Info
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-red-500 focus:bg-red-500 focus:text-white cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(doc.id)
                    }}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex flex-1 items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search documents..."
                            className="pl-8 bg-zinc-900 border-zinc-800 focus:border-blue-500/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-800 hover:bg-zinc-800 transition-colors">
                            <div className="flex items-center gap-2">
                                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                                <SelectValue placeholder="Type" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="permit">Permit</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="invoice">Invoice</SelectItem>
                            <SelectItem value="change_order">Change Order</SelectItem>
                            <SelectItem value="daily_log">Daily Log</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sortOption} onValueChange={setSortOption}>
                        <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-800 hover:bg-zinc-800 transition-colors">
                            <div className="flex items-center gap-2">
                                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                                <SelectValue placeholder="Sort" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            <SelectItem value="date-desc">Newest First</SelectItem>
                            <SelectItem value="date-asc">Oldest First</SelectItem>
                            <SelectItem value="name-asc">Name A-Z</SelectItem>
                            <SelectItem value="name-desc">Name Z-A</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <div className="flex items-center bg-zinc-900 rounded-md border border-zinc-800 p-0.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 rounded-sm transition-all ${viewMode === 'table'
                                ? 'bg-[#7C3AED] text-white shadow-sm hover:bg-[#6D28D9]'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                }`}
                            onClick={() => setViewMode('table')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 rounded-sm transition-all ${viewMode === 'grid'
                                ? 'bg-[#7C3AED] text-white shadow-sm hover:bg-[#6D28D9]'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                }`}
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid className="h-4 w-4" />
                        </Button>
                    </div>

                    {docsLimitReached ? (
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-900/20"
                            onClick={() => setUpgradeOpen(true)}
                        >
                            <Upload className="h-4 w-4" />
                            Import Document
                        </Button>
                    ) : (
                        <ImportDocumentGlobalDialog projects={projects} userId={userId} />
                    )}

                    {docsLimitReached ? (
                        <Button
                            variant="outline"
                            className="gap-2 border-dashed border-zinc-700 hover:bg-zinc-900 hover:text-blue-500 hover:border-blue-500/50"
                            onClick={() => setUpgradeOpen(true)}
                        >
                            <Plus className="h-4 w-4" /> Generate New
                        </Button>
                    ) : (
                        <GenerateDocumentGlobalDialog projects={projects} userId={userId} />
                    )}

                    <UpgradeDialog
                        open={upgradeOpen}
                        onOpenChange={setUpgradeOpen}
                        limitType="document"
                    />
                </div>
            </div>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
                {selectedDocIds.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 flex items-center justify-between px-4"
                    >
                        <span className="text-sm font-medium text-blue-400">
                            {selectedDocIds.length} selected
                        </span>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" className="hover:bg-blue-500/20 hover:text-blue-400 h-8 gap-2" onClick={handleBulkDownload} disabled={loading}>
                                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                                Export Zip
                            </Button>
                            <Button size="sm" variant="ghost" className="hover:bg-red-500/20 hover:text-red-400 h-8 gap-2" onClick={() => setConfirmBulkDelete(true)}>
                                <Trash2 className="h-3 w-3" />
                                Delete
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content Area */}
            {filteredDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] border border-dashed border-zinc-800 rounded-lg bg-zinc-900/20">
                    <FileText className="h-10 w-10 text-zinc-600 mb-4" />
                    <h3 className="text-lg font-semibold text-zinc-300">No documents found</h3>
                    <p className="text-zinc-500">Try adjusting your filters or import a new document.</p>
                </div>
            ) : (
                viewMode === 'table' ? (
                    <div className="rounded-md border border-zinc-800 bg-zinc-950/50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-zinc-900/50">
                                <TableRow className="hover:bg-transparent border-zinc-800">
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={selectedDocIds.length === filteredDocs.length && filteredDocs.length > 0}
                                            onCheckedChange={(c) => handleSelectAll(c as boolean)}
                                            className="border-zinc-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 translate-y-[2px]"
                                        />
                                    </TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDocs.map((doc) => (
                                    <TableRow
                                        key={doc.id}
                                        className="group hover:bg-zinc-900/50 border-zinc-800 transition-colors cursor-pointer"
                                        onClick={() => toggleSelection(doc.id)}
                                    >
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedDocIds.includes(doc.id)}
                                                onCheckedChange={() => toggleSelection(doc.id)}
                                                className="border-zinc-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 translate-y-[2px]"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-500/10 rounded-md">
                                                    <FileText className="h-4 w-4 text-blue-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="truncate max-w-[200px] group-hover:text-blue-400 transition-colors">{doc.title}</span>
                                                    {doc.is_official && (
                                                        <span className="flex items-center gap-1 text-[10px] text-green-500 uppercase tracking-wider font-semibold">
                                                            <ShieldCheck className="h-3 w-3" /> Official
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-zinc-900 text-zinc-400 border-zinc-800 font-normal hover:bg-zinc-800">
                                                <Building2 className="h-3 w-3 mr-1" />
                                                {doc.projects?.name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="capitalize text-zinc-400">
                                            {doc.type.replace(/_/g, ' ')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={doc.status === 'Imported' ? 'destructive' : 'default'} className={doc.status === 'Imported' ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20" : ""}>
                                                {doc.status || 'Draft'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-zinc-500 text-sm">
                                            {format(new Date(doc.created_at), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <ActionDropdown doc={doc} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredDocs.map((doc) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                key={doc.id}
                                className={`group relative bg-zinc-950 border rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer ${selectedDocIds.includes(doc.id) ? "border-blue-500 ring-1 ring-blue-500" : "border-zinc-800 hover:border-zinc-700"}`}
                                onClick={() => toggleSelection(doc.id)}
                            >
                                <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedDocIds.includes(doc.id)}
                                        onCheckedChange={() => toggleSelection(doc.id)}
                                        className="border-zinc-600 data-[state=checked]:bg-blue-500"
                                    />
                                </div>

                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-zinc-900 rounded-lg group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                                        <FileText className="h-6 w-6 text-zinc-500 group-hover:text-blue-500" />
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <Badge variant="secondary" className="bg-zinc-900 text-xs">
                                            {doc.type.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                </div>

                                <h3 className="font-semibold truncate pr-6 mb-1 group-hover:text-blue-400 transition-colors">{doc.title}</h3>
                                <p className="text-xs text-zinc-500 mb-4 flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {doc.projects?.name}
                                </p>

                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-900">
                                    <span className="text-xs text-zinc-500">{format(new Date(doc.created_at), 'MMM d')}</span>
                                    <div onClick={e => e.stopPropagation()}>
                                        <ActionDropdown doc={doc} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )
            )}

            <DocumentDetailsSheet
                open={!!detailsDoc}
                onOpenChange={(open) => !open && setDetailsDoc(null)}
                document={detailsDoc}
                onUpdate={(updatedDoc) => {
                    setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d))
                    setDetailsDoc(updatedDoc)
                }}
            />

            <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the document. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => confirmDeleteId && executeDelete(confirmDeleteId)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedDocIds.length} {selectedDocIds.length === 1 ? 'Document' : 'Documents'}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the selected {selectedDocIds.length === 1 ? 'document' : 'documents'}. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeBulkDelete} className="bg-red-600 hover:bg-red-700">
                            {selectedDocIds.length === 1 ? 'Delete' : 'Delete All'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
