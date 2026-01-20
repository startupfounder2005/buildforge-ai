"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Bell, Moon, Smartphone, Globe, Shield, Key, Share2, Download, Trash2 } from "lucide-react"

export default function SettingsPage() {
    return (
        <div className="space-y-6 container max-w-5xl pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your application preferences and workspace settings.</p>
            </div>

            <div className="grid gap-6">
                {/* Appearance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Moon className="h-5 w-5" /> Appearance
                        </CardTitle>
                        <CardDescription>Customize the look and feel of the application.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Dark Mode</Label>
                                <p className="text-sm text-muted-foreground">Force dark mode across the application.</p>
                            </div>
                            <Switch defaultChecked disabled aria-label="Dark Mode" />
                        </div>
                        <Separator />
                        <div className="grid gap-2">
                            <Label>Accent Color</Label>
                            <div className="flex gap-2">
                                <div className="h-8 w-8 rounded-full bg-blue-600 cursor-pointer ring-2 ring-offset-2 ring-primary"></div>
                                <div className="h-8 w-8 rounded-full bg-green-500 cursor-pointer opacity-50"></div>
                                <div className="h-8 w-8 rounded-full bg-purple-500 cursor-pointer opacity-50"></div>
                                <div className="h-8 w-8 rounded-full bg-orange-500 cursor-pointer opacity-50"></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" /> Notifications
                        </CardTitle>
                        <CardDescription>Configure how you receive alerts and updates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">Receive weekly reports and project updates via email.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Push Notifications</Label>
                                <p className="text-sm text-muted-foreground">Get real-time alerts on your mobile device.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Marketing Emails</Label>
                                <p className="text-sm text-muted-foreground">Receive product announcements and tips.</p>
                            </div>
                            <Switch />
                        </div>
                    </CardContent>
                </Card>

                {/* Integrations */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Share2 className="h-5 w-5" /> Integrations
                        </CardTitle>
                        <CardDescription>Connect BuildForge AI with your favorite tools.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 flex items-center justify-center rounded-md bg-white text-black font-bold">PRO</div>
                                <div>
                                    <p className="font-medium">Procore</p>
                                    <p className="text-xs text-muted-foreground">Sync your documents and drawings.</p>
                                </div>
                            </div>
                            <Button variant="outline">Connect</Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 flex items-center justify-center rounded-md bg-[#4A154B] text-white font-bold">Slack</div>
                                <div>
                                    <p className="font-medium">Slack</p>
                                    <p className="text-xs text-muted-foreground">Get notifications in your team channel.</p>
                                </div>
                            </div>
                            <Button variant="outline">Connect</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* API Keys */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5" /> API Access
                        </CardTitle>
                        <CardDescription>Manage API keys for accessing BuildForge programmatically.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Your API Key</Label>
                            <div className="flex gap-2">
                                <Input readOnly value="bf_live_************************" className="font-mono bg-muted" />
                                <Button variant="secondary">Copy</Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Never share your API key with anyone.</p>
                        </div>
                        <Button>Generate New Key</Button>
                    </CardContent>
                </Card>

                {/* Data & Privacy */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" /> Data & Privacy
                        </CardTitle>
                        <CardDescription>Manage your data and privacy settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Data Export</Label>
                                <p className="text-sm text-muted-foreground">Download all your projects and documents.</p>
                            </div>
                            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Data</Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-destructive">Delete Workspace</Label>
                                <p className="text-sm text-muted-foreground">Permanently delete your workspace and all data.</p>
                            </div>
                            <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete Workspace</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
