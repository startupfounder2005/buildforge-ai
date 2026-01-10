import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { FileText, Calendar, Info, ShieldCheck, Clock } from "lucide-react"

interface DocumentDetailsSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    document: any | null
}

export function DocumentDetailsSheet({ open, onOpenChange, document }: DocumentDetailsSheetProps) {
    if (!document) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Document Details</SheetTitle>
                    <SheetDescription>
                        Complete information and metadata.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-8 space-y-8">
                    {/* Header Section */}
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                            <FileText className="h-8 w-8 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{document.title}</h3>
                            <p className="text-muted-foreground capitalize">{document.type.replace(/_/g, ' ')}</p>
                        </div>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                            <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                                <ShieldCheck className="h-3 w-3" /> Status
                            </div>
                            <div>
                                <Badge variant={document.status === 'approved' ? 'default' : 'secondary'} className="capitalize">
                                    {document.status || 'Draft'}
                                </Badge>
                            </div>
                        </div>
                        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                            <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                                <Clock className="h-3 w-3" /> Created
                            </div>
                            <div className="font-medium text-sm">
                                {format(new Date(document.created_at), 'MMM dd, yyyy h:mm a')}
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 font-semibold">
                            <Info className="h-4 w-4 text-blue-500" />
                            Notes & Description
                        </div>
                        <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-zinc-950/50">
                            <div className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
                                {document.description || "No description provided for this document."}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Additional Metadata if needed */}
                    {document.is_official && (
                        <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-400 rounded-md text-sm border border-green-500/20">
                            <ShieldCheck className="h-4 w-4" />
                            This is marked as an Official Authority Document.
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
