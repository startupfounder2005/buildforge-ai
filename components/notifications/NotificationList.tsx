"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { SheetHeader, SheetTitle } from "@/components/ui/sheet" // Using simple divs usually but sticking to clean HTML
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, FileText, Calendar, DollarSign, UserPlus, Check, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

interface Notification {
    id: string
    title: string
    message: string
    type: 'document' | 'milestone' | 'budget' | 'team' | 'system'
    link?: string
    is_read: boolean
    created_at: string
}

export function NotificationList({ onClose }: { onClose?: () => void }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        fetchNotifications()

        // Realtime Subscription
        const channel = supabase
            .channel('notifications-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    const newNotif = payload.new as Notification
                    // Prepend new notification
                    setNotifications((prev) => [newNotif, ...prev])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const [unreadRes, readRes] = await Promise.all([
            supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_read', false)
                .order('created_at', { ascending: false }),
            supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_read', true)
                .order('created_at', { ascending: false })
                .limit(10)
        ])

        const unread = unreadRes.data || []
        const read = readRes.data || []

        const combined = [...unread, ...read].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setNotifications(combined)
        setLoading(false)
    }

    const markAsRead = async (id: string, link?: string) => {
        // Optimistic UI update
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        )

        // DB Update
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)

        // Navigate if link provided
        if (link) {
            onClose?.()
            router.push(link)
        }
    }

    const markAllRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'document': return <FileText className="h-4 w-4 text-blue-500" />
            case 'milestone': return <Calendar className="h-4 w-4 text-orange-500" />
            case 'budget': return <DollarSign className="h-4 w-4 text-red-500" />
            case 'team': return <UserPlus className="h-4 w-4 text-green-500" />
            default: return <Bell className="h-4 w-4 text-gray-500" />
        }
    }

    if (loading) {
        return (
            <div className="flex h-[300px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (notifications.length === 0) {
        return (
            <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <Bell className="h-8 w-8 opacity-20" />
                <p>No notifications yet</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full max-h-[400px]">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                <span className="text-xs font-semibold text-muted-foreground">Recent</span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-blue-500 hover:text-blue-500 hover:underline decoration-blue-500 underline-offset-4 bg-transparent hover:bg-transparent"
                    onClick={markAllRead}
                >
                    Mark all read
                </Button>
            </div>
            <div className="flex-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                <div className="flex flex-col">
                    <AnimatePresence initial={false}>
                        {notifications.map((notif) => (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={cn(
                                    "relative flex cursor-pointer gap-4 px-4 py-3 transition-colors hover:bg-muted/50 border-b border-border/40 last:border-0",
                                    !notif.is_read && "bg-blue-500/5"
                                )}
                                onClick={() => markAsRead(notif.id, notif.link)}
                            >
                                <div className={cn(
                                    "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background shadow-xs",
                                    !notif.is_read && "border-blue-500/30"
                                )}>
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-medium leading-none">{notif.title}</p>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {notif.message}
                                    </p>
                                </div>
                                {!notif.is_read && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <div className="h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
