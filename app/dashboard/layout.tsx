import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { GlobalSearch } from "@/components/global/GlobalSearch"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { SubscriptionChecker } from "@/components/subscription/SubscriptionChecker"
import {
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Search, Command, LogOut, User as UserIcon, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { signout } from "@/app/auth/actions"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Fetch Profile for Avatar
    const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', user.id)
        .single()

    const initial = profile?.full_name
        ? profile.full_name.charAt(0).toUpperCase()
        : user.email?.charAt(0).toUpperCase() || 'U'

    return (
        <SidebarProvider className="h-screen w-full overflow-hidden">
            <AppSidebar />
            <main className="flex-1 flex flex-col h-full overflow-y-auto bg-background">
                <header className="flex h-16 shrink-0 items-center gap-4 px-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-30 font-sans">
                    <div className="flex items-center gap-2">
                        {/* Trigger for mobile */}
                        <div className="md:hidden">
                            <SidebarTrigger className="-ml-1" />
                        </div>
                        <Separator orientation="vertical" className="mr-2 h-4 md:hidden" />

                        <div className="flex items-center gap-2">
                            {/* Optional: Add Logo here if not in Sidebar */}
                        </div>
                    </div>

                    {/* Mobile Logo */}
                    <div className="flex items-center gap-2 text-primary font-bold md:hidden">
                        <Command className="h-6 w-6" />
                        <span>BuildForge</span>
                    </div>

                    {/* Search Bar - Center/Left aligned */}
                    <div className="flex-1 max-w-xl ml-4 hidden md:block z-50">
                        <GlobalSearch />
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <NotificationBell />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full transition-all hover:ring-1 hover:ring-primary hover:ring-offset-1 hover:scale-105">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={profile?.avatar_url || ''} alt="@user" className="object-cover" />
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            {initial}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <a href="/dashboard/account" className="cursor-pointer flex items-center">
                                        <UserIcon className="mr-2 h-4 w-4" /> Profile
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <a href="/dashboard/settings" className="cursor-pointer flex items-center">
                                        <Settings className="mr-2 h-4 w-4" /> Settings
                                    </a>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <form action={signout}>
                                    <button style={{ cursor: 'pointer' }} className="w-full text-left">
                                        <DropdownMenuItem className="text-destructive focus:bg-red-600 focus:text-white cursor-pointer transition-colors">
                                            <LogOut className="mr-2 h-4 w-4" /> Log out
                                        </DropdownMenuItem>
                                    </button>
                                </form>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 md:p-8">
                    <SubscriptionChecker />
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}

