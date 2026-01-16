import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Hammer } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ActivityItem {
    id: string
    type: 'project' | 'document'
    title: string
    subtitle?: string
    timestamp: string
}

interface RecentActivityProps {
    activities: ActivityItem[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
    return (
        <Card className="col-span-1 lg:col-span-1">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                    Latest actions across your workspace
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                    {activities.length === 0 && (
                        <p className="text-sm text-muted-foreground">No recent activity found.</p>
                    )}
                    {activities.map((activity) => (
                        <div key={activity.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback className={`${activity.type === 'project' ? 'bg-primary text-primary-foreground' : 'bg-blue-500/20 text-blue-500'}`}>
                                    {activity.type === 'project' ? <Hammer className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                </AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{activity.title}</p>
                                <p className="text-xs text-muted-foreground">
                                    {activity.subtitle || (activity.type === 'project' ? 'New Project Created' : 'Document Generated')}
                                </p>
                            </div>
                            <div className="ml-auto font-medium text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
