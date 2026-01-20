import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 min-h-[50vh]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse text-sm">Loading workspace...</p>
        </div>
    )
}
