"use client"

import * as React from "react"
import { ObsidianLogo } from "@/components/ui/ObsidianLogo"
import {
    SquareTerminal, // Dashboard
    FolderOpen, // Projects
    FileText, // Permits & Documents
    BarChart2, // AI Predictions
    User, // Account
    Settings, // Settings
    HelpCircle, // Help
    Command,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

const data = {
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: SquareTerminal,
        },
        {
            title: "Projects",
            url: "/dashboard/projects",
            icon: FolderOpen,
        },
        {
            title: "Permits & Documents",
            url: "/dashboard/documents",
            icon: FileText,
        },
        {
            title: "AI Predictions",
            url: "/dashboard/predictions",
            icon: BarChart2,
        },
    ],
    navSecondary: [
        {
            title: "Account",
            url: "/dashboard/account",
            icon: User,
        },
        {
            title: "Settings",
            url: "/dashboard/settings",
            icon: Settings,
        },
        {
            title: "Help",
            url: "/dashboard/help",
            icon: HelpCircle,
        },
    ],
}

// ... imports

// ... data object

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()

    return (
        <Sidebar
            collapsible="none"
            variant="sidebar"
            {...props}
            className="bg-card border-r border-border flex-none"
        >
            <SidebarHeader className="p-2 pb-0">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="h-auto hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-transparent hover:border-white transition-all">
                            <Link href="/dashboard" className="flex flex-row items-center justify-start gap-3">
                                <div className="flex aspect-square size-10 items-center justify-center shrink-0 bg-white rounded-lg p-0.5 shadow-sm border border-border/10 overflow-hidden">
                                    <ObsidianLogo className="size-full scale-110" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                    <span className="truncate font-bold text-sidebar-foreground text-lg">Obsidian</span>
                                    <span className="truncate text-xs text-muted-foreground font-medium">Enterprise</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-muted-foreground">Platform</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {data.navMain.map((item) => {
                                const isActive = item.url === '/dashboard'
                                    ? pathname === '/dashboard'
                                    : pathname.startsWith(item.url)

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.title}
                                            className="font-medium data-[active=true]:bg-primary data-[active=true]:text-primary-foreground transition-all duration-200 border border-transparent hover:border-white"
                                        >
                                            <Link href={item.url}>
                                                <item.icon className="h-4 w-4" />
                                                <span className="truncate">{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup className="mt-auto">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {data.navSecondary.map((item) => {
                                const isActive = pathname.startsWith(item.url)
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            size="sm"
                                            isActive={isActive}
                                            className="font-medium text-muted-foreground hover:text-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground border border-transparent hover:border-white"
                                        >
                                            <Link href={item.url}>
                                                <item.icon className="h-4 w-4" />
                                                <span className="truncate">{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-border">
                <div className="text-xs text-muted-foreground text-center group-data-[collapsible=icon]:hidden">
                    &copy; 2026 Obsidian
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
