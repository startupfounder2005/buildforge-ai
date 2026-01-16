"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import { NotificationList } from "./NotificationList"
import { motion, AnimatePresence } from "framer-motion"

export function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        fetchUnreadCount()

        // Count Subscription
        const channel = supabase
            .channel('notifications-count')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: 'is_read=eq.false',
                },
                () => {
                    setUnreadCount((prev) => prev + 1)
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    // Primitive re-fetch strategy for simplicity on UPDATE (read status change)
                    // Optimally we'd check payload.new.is_read vs payload.old.is_read
                    fetchUnreadCount()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchUnreadCount = async () => {
        // Can't use auth.uid() in client component directly without await getUser 
        // or passing prop. We'll just use getUser here.
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false)

        setUnreadCount(count || 0)
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group">
                    <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <AnimatePresence>
                        {unreadCount > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-background"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[380px] p-0 mr-4" align="end" sideOffset={8}>
                <div className="flex flex-col bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-xl overflow-hidden">
                    <div className="p-4 bg-muted/20 border-b border-border/50">
                        <h4 className="font-semibold text-sm">Notifications</h4>
                    </div>
                    <NotificationList onClose={() => setIsOpen(false)} />
                </div>
            </PopoverContent>
        </Popover>
    )
}
