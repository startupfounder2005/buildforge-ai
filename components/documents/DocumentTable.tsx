'use client'

import { useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, Eye, MoreHorizontal, Trash2, Loader2, X, Info } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { toast } from "sonner"
import { deleteDocument } from "@/app/dashboard/projects/actions"
import { jsPDF } from "jspdf"
import ReactMarkdown from 'react-markdown'

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

interface DocumentTableProps {
    documents: any[]
}

import { DocumentDetailsSheet } from './DocumentDetailsSheet'

export function DocumentTable({ documents }: DocumentTableProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [previewDoc, setPreviewDoc] = useState<any | null>(null)
    const [detailsDoc, setDetailsDoc] = useState<any | null>(null)

    const handleDeleteClick = (id: string) => {
        setConfirmDeleteId(id)
    }

    const executeDelete = async () => {
        if (!confirmDeleteId) return
        setDeletingId(confirmDeleteId)
        try {
            const res = await deleteDocument(confirmDeleteId)
            if (res.message === 'Success') {
                toast.success('Document deleted')
            } else {
                toast.error(res.message)
            }
        } catch (error) {
            toast.error('Failed to delete')
        } finally {
            setDeletingId(null)
            setConfirmDeleteId(null)
        }
    }

    const handleDownload = (doc: any) => {
        try {
            if (doc.content_json?.pdf_base64) {
                // Download existing PDF
                const link = document.createElement('a');
                link.href = `data:application/pdf;base64,${doc.content_json.pdf_base64}`;
                link.download = `${doc.title.replace(/\s+/g, '_')}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('PDF Downloaded')
                return;
            }

            // Legacy Fallback: Generate PDF using jspdf if base64 PDF is not available
            let content = typeof doc.content_json === 'object'
                ? (doc.content_json.raw || JSON.stringify(doc.content_json, null, 2))
                : "No content available."

            const pdf = new jsPDF()
            let y = 20
            const margin = 20
            const pageWidth = 170

            // Header
            pdf.setFont("times", "bold")
            pdf.setFontSize(22)
            pdf.text(doc.title, margin, y)
            y += 10

            // Meta
            pdf.setFont("helvetica", "normal")
            pdf.setFontSize(10)
            pdf.setTextColor(100)
            pdf.text(`Type: ${doc.type} | Version: ${doc.version || 1} | Date: ${format(new Date(doc.created_at), 'MMM dd, yyyy')}`, margin, y)
            y += 15

            // Content Parser
            pdf.setFont("times", "normal")
            pdf.setFontSize(12)
            pdf.setTextColor(0)

            const lines = content.split('\n')

            lines.forEach((line: string) => {
                if (y > 280) {
                    pdf.addPage()
                    y = 20
                }

                // Headers
                if (line.startsWith('### ')) {
                    pdf.setFont("times", "bold")
                    pdf.setFontSize(14)
                    pdf.text(line.replace('### ', ''), margin, y + 5)
                    y += 10
                    pdf.setFont("times", "normal")
                    pdf.setFontSize(12)
                    return
                }
                if (line.startsWith('## ')) {
                    pdf.setFont("times", "bold")
                    pdf.setFontSize(16)
                    pdf.text(line.replace('## ', ''), margin, y + 6)
                    y += 12
                    pdf.setFont("times", "normal")
                    pdf.setFontSize(12)
                    return
                }
                if (line.startsWith('# ')) {
                    pdf.setFont("times", "bold")
                    pdf.setFontSize(18)
                    pdf.text(line.replace('# ', ''), margin, y + 8)
                    y += 14
                    pdf.setFont("times", "normal")
                    pdf.setFontSize(12)
                    return
                }

                // Bold key-values (Simple ** replacement)
                // Note: jsPDF doesn't support inline bold switch easily without splitTextToSize or HTML. 
                // We will perform a simple cleanup for specific artifacts.
                let cleanLine = line
                    .replace(/\*\*/g, '') // Remove bold markers
                    .replace(/###/g, '')  // Remove residual hashes
                    .replace(/---/g, '_______________________________________') // Horizontal rule replacement

                if (cleanLine.trim().length === 0) {
                    y += 5 // Paragraph spacing
                    return
                }

                const splitText = pdf.splitTextToSize(cleanLine, pageWidth)
                pdf.text(splitText, margin, y)
                y += (splitText.length * 5) + 2
            })

            pdf.save(`${doc.title.replace(/\s+/g, '_')}.pdf`)
            toast.success('PDF Downloaded')
        } catch (e) {
            console.error(e)
            toast.error('Failed to generate PDF')
        }
    }

    if (!documents || documents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed">
                <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No documents yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                    Generate pending permits, contracts, or bid packages.
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Document Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {documents.map((doc) => (
                        <TableRow key={doc.id} className="group hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-500" />
                                    <span
                                        className="cursor-pointer hover:underline decoration-blue-500/50 underline-offset-4 transition-all"
                                        onClick={() => {
                                            if (doc.file_url) {
                                                window.open(doc.file_url, '_blank')
                                            } else {
                                                setPreviewDoc(doc)
                                            }
                                        }}
                                    >
                                        {doc.title}
                                    </span>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                        onClick={(e) => { e.stopPropagation(); setDetailsDoc(doc); }}
                                    >
                                        <Info className="h-3 w-3 text-muted-foreground dark:text-zinc-300" />
                                    </Button>
                                </div>
                            </TableCell>
                            <TableCell className="capitalize">{doc.type}</TableCell>
                            <TableCell>
                                <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'}>
                                    {doc.status || 'Draft'}
                                </Badge>
                            </TableCell>
                            <TableCell>v{doc.version || 1}</TableCell>
                            <TableCell>{format(new Date(doc.created_at), 'MMM dd, yyyy')}</TableCell>
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
                                        <DropdownMenuItem
                                            className="focus:bg-zinc-800 focus:text-white cursor-pointer"
                                            onClick={() => {
                                                if (doc.file_url) {
                                                    window.open(doc.file_url, '_blank')
                                                } else {
                                                    setPreviewDoc(doc) // Standard preview
                                                }
                                            }}
                                        >
                                            {doc.file_url ? (
                                                <><Eye className="mr-2 h-4 w-4" /> View Original</>
                                            ) : (
                                                <><Eye className="mr-2 h-4 w-4" /> Preview PDF</>
                                            )}
                                        </DropdownMenuItem>
                                        {!doc.file_url && (
                                            <DropdownMenuItem
                                                className="focus:bg-blue-600 focus:text-white cursor-pointer"
                                                onClick={() => handleDownload(doc)}
                                            >
                                                <Download className="mr-2 h-4 w-4" /> Download PDF
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-red-600 focus:text-red-600"
                                            onClick={() => handleDeleteClick(doc.id)}
                                            disabled={deletingId === doc.id}
                                        >
                                            {deletingId === doc.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
                <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 bg-zinc-900 border-zinc-800 text-zinc-100 overflow-hidden outline-none">
                    <DialogHeader className="p-4 bg-zinc-900 border-b border-zinc-800 flex-shrink-0 flex flex-row items-center justify-between z-10">
                        <div>
                            <DialogTitle className="text-zinc-100">{previewDoc?.title}</DialogTitle>
                            <DialogDescription className="text-zinc-400">
                                Preview Mode • {previewDoc?.type} • v{previewDoc?.version || 1}
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto md:p-0 flex justify-center bg-zinc-950 relative z-0">
                        {previewDoc && previewDoc.content_json?.pdf_base64 ? (
                            <iframe
                                src={`data:application/pdf;base64,${previewDoc.content_json.pdf_base64}`}
                                className="w-full h-full min-h-[85vh] border-none"
                                title="PDF Preview"
                            />
                        ) : (
                            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-zinc-950 relative z-0">
                                <div className="bg-white text-black shadow-2xl w-full max-w-[210mm] min-h-[297mm] p-[20mm] md:p-[25mm] text-sm font-serif leading-relaxed whitespace-pre-wrap z-10">
                                    {/* Paper Effect - Render Markdown Fallback */}
                                    {previewDoc && (
                                        <div className="prose prose-sm max-w-none prose-headings:font-serif prose-p:font-serif prose-li:font-serif prose-headings:text-black prose-p:text-black prose-li:text-black">
                                            <ReactMarkdown>
                                                {typeof previewDoc?.content_json === 'object'
                                                    ? (previewDoc?.content_json.raw || JSON.stringify(previewDoc?.content_json))
                                                    : "No content available."
                                                }
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex justify-end gap-2 flex-shrink-0 z-10">
                        <Button variant="outline" className="text-foreground" onClick={() => setPreviewDoc(null)}>Close</Button>
                        <Button onClick={() => handleDownload(previewDoc)}>
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <DocumentDetailsSheet
                open={!!detailsDoc}
                onOpenChange={(open) => !open && setDetailsDoc(null)}
                document={detailsDoc}
            />

            <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the document.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
