'use client'

import * as React from "react"
import { useRouter } from "next/navigation"
import { useDebounce } from "use-debounce"
import { Calculator, Calendar, CreditCard, Settings, Smile, User, FileText, Folder, Search, Loader2, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
    CommandDialog
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"

export function GlobalSearch() {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [debouncedQuery] = useDebounce(query, 300)
    const [loading, setLoading] = React.useState(false)

    // Results State
    const [projects, setProjects] = React.useState<any[]>([])
    const [documents, setDocuments] = React.useState<any[]>([])

    // Ref to detect clicks outside
    const containerRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                // Focus input
                const input = document.querySelector('[cmdk-input]') as HTMLElement
                if (input) input.focus()
            }
        }

        const handleClickOutside = (e: MouseEvent) => {
            // Close on click outside
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    React.useEffect(() => {
        const search = async () => {
            const trimmedQuery = debouncedQuery.trim().toLowerCase()

            if (!trimmedQuery || trimmedQuery.length < 2) {
                setProjects([])
                setDocuments([])
                return
            }

            setLoading(true)
            const supabase = createClient()

            try {
                let projQuery = supabase.from('projects').select('id, name, status, description').limit(5)
                let docQuery = supabase.from('documents').select('id, title, type, project_id, projects(name)').limit(5)

                // --- SMART CATEGORY SEARCH ---
                if (trimmedQuery === 'projects' || trimmedQuery === 'project') {
                    // Fetch all (recent) projects
                    projQuery = projQuery.order('created_at', { ascending: false }).limit(10)
                    // Reset docs if they only wanted projects? Or show both? Let's show both but prioritize projects.
                    // Actually, if they search "projects", they probably just want projects.
                    const { data: projs } = await projQuery
                    setProjects(projs || [])
                    setDocuments([])
                    setLoading(false)
                    return
                }

                if (trimmedQuery === 'permits' || trimmedQuery === 'permit') {
                    // Fetch all permit documents
                    // Note: 'type' is an enum/string. We match typical permit types.
                    docQuery = supabase
                        .from('documents')
                        .select('id, title, type, project_id, projects(name)')
                        .ilike('type', '%permit%') // "building_permit", etc.
                        .limit(10)

                    const { data: docs } = await docQuery
                    setProjects([])
                    setDocuments(docs || [])
                    setLoading(false)
                    return
                }

                // --- STANDARD FUZZY SEARCH ---
                // Projects: Name, Description, Status
                const { data: projs } = await supabase
                    .from('projects')
                    .select('id, name, status, description')
                    .or(`name.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%,status.ilike.%${debouncedQuery}%`)
                    .limit(5)

                // Documents: Title, Type (cast to text), Project Name
                // Note: We can't easily join-search project name in one go without complex embedded filtering.
                // For now, we search Title and Type.
                const { data: docs } = await supabase
                    .from('documents')
                    .select('id, title, type, project_id, projects(name)')
                    .or(`title.ilike.%${debouncedQuery}%,type.ilike.%${debouncedQuery}%`)
                    .limit(5)

                setProjects(projs || [])
                setDocuments(docs || [])
            } catch (err) {
                console.error("Search error:", err)
            } finally {
                setLoading(false)
            }
        }

        search()
    }, [debouncedQuery])

    const handleSelect = (type: 'project' | 'document', item: any) => {
        setOpen(false)
        if (type === 'project') {
            router.push(`/dashboard/projects/${item.id}`)
        } else {
            if (item.project_id) {
                router.push(`/dashboard/projects/${item.project_id}?tab=documents&open_doc=${item.id}`)
            } else {
                router.push(`/dashboard/documents?open_doc=${item.id}`)
            }
        }
    }

    return (
        <div ref={containerRef} className="relative w-full max-w-xl group z-50">
            {/* 
                We override the default Command styles to look like a simple input.
                The default Command has 'bg-popover' and 'overflow-hidden'. 
                We want 'overflow-visible' so the list can pop out, and 'bg-transparent' for the root.
             */}
            <Command
                shouldFilter={false}
                className="rounded-lg bg-transparent shadow-none border-none overflow-visible"
            >
                {/* 
                   CommandInput in shadcn/ui ALREADY has a Search icon and border-b. 
                   We need to customize its className to match our desired "Input" look:
                   - bg-card (darker)
                   - border-none (or specific border)
                   - rounded-md
                */}
                <div className="relative">
                    <CommandInput
                        placeholder="Search projects, documents..."
                        value={query}
                        onValueChange={(val) => {
                            setQuery(val);
                            if (val.length > 0) setOpen(true);
                        }}
                        onFocus={() => {
                            if (query.length > 0) setOpen(true)
                        }}
                        // Seamless Input Style: lighter background, no borders until focus
                        className="bg-secondary/50 border-none rounded-md pl-2 h-9 text-sm focus:ring-1 focus:ring-[#0047AB]/50 focus:bg-background transition-all placeholder:text-muted-foreground/70"
                    />

                    {loading && (
                        <div className="absolute right-3 top-2.5">
                            <Loader2 className="h-4 w-4 animate-spin text-[#0047AB]" />
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {open && (query.length > 0) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 8 }}
                            exit={{ opacity: 0, scale: 0.98, y: 4 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute top-full left-0 w-full bg-[#1A1A1A] rounded-lg border border-white/10 shadow-2xl overflow-hidden z-[60]"
                        >
                            <CommandList className="max-h-[400px] overflow-y-auto p-2">
                                {!loading && projects.length === 0 && documents.length === 0 && (
                                    <CommandEmpty className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                                        <Search className="h-8 w-8 opacity-20" />
                                        <span>No results found for "{query}"</span>
                                    </CommandEmpty>
                                )}

                                {projects.length > 0 && (
                                    <CommandGroup heading="Projects" className="text-muted-foreground font-medium text-xs uppercase tracking-wider mb-2">
                                        {projects.map(project => (
                                            <CommandItem
                                                key={project.id}
                                                value={`project-${project.id}`}
                                                onSelect={() => handleSelect('project', project)}
                                                className="cursor-pointer data-[selected=true]:bg-[#0047AB] data-[selected=true]:text-white rounded-md my-1 px-3 py-2.5 transition-colors group/item"
                                            >
                                                <div className="bg-white/10 p-1.5 rounded-md mr-3 group-data-[selected=true]/item:bg-white/20 transition-colors">
                                                    <Folder className="h-4 w-4 text-blue-400 group-data-[selected=true]/item:text-white" />
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-semibold text-sm">{project.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] opacity-70 truncate max-w-[200px]">{project.description || "No description"}</span>
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/70 capitalize border border-white/5">
                                                            {project.status || 'Active'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-data-[selected=true]/item:opacity-100 transition-opacity -translate-x-2 group-data-[selected=true]/item:translate-x-0" />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}

                                {(projects.length > 0 && documents.length > 0) && <div className="h-px bg-white/10 mx-2 my-2" />}

                                {documents.length > 0 && (
                                    <CommandGroup heading="Documents" className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
                                        {documents.map(doc => (
                                            <CommandItem
                                                key={doc.id}
                                                value={`doc-${doc.id}`}
                                                onSelect={() => handleSelect('document', doc)}
                                                className="cursor-pointer data-[selected=true]:bg-[#0047AB] data-[selected=true]:text-white rounded-md my-1 px-3 py-2.5 transition-colors group/item"
                                            >
                                                <div className="bg-white/10 p-1.5 rounded-md mr-3 group-data-[selected=true]/item:bg-white/20 transition-colors">
                                                    <FileText className="h-4 w-4 text-orange-400 group-data-[selected=true]/item:text-white" />
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-semibold text-sm">{doc.title}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] opacity-70 capitalize">{doc.type?.replace('_', ' ') || 'Document'}</span>
                                                        {doc.projects?.name && (
                                                            <>
                                                                <span className="text-[10px] opacity-40">•</span>
                                                                <div className="flex items-center gap-1 text-[10px] opacity-70">
                                                                    <Folder className="h-2 w-2" />
                                                                    {doc.projects.name}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-data-[selected=true]/item:opacity-100 transition-opacity -translate-x-2 group-data-[selected=true]/item:translate-x-0" />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Command>
        </div>
    )
}
