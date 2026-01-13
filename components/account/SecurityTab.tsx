"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Shield, Smartphone, Globe, Lock, Eye, EyeOff, Loader2, Trash2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import zxcvbn from "zxcvbn"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function SecurityTab() {
    const [showCurrentPass, setShowCurrentPass] = useState(false)
    const [showNewPass, setShowNewPass] = useState(false)

    // Password Form State
    const [currentPass, setCurrentPass] = useState("")
    const [newPass, setNewPass] = useState("")
    const [confirmPass, setConfirmPass] = useState("")
    const [loading, setLoading] = useState(false)

    // Strength Meter
    const strength = zxcvbn(newPass)
    const strengthPercent = (strength.score + 1) * 20
    const strengthColor = strength.score < 2 ? "bg-red-500" : strength.score < 3 ? "bg-yellow-500" : "bg-green-500"
    const strengthLabel = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"][strength.score]

    // Delete Modal
    const [deleteOpen, setDeleteOpen] = useState(false)

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPass !== confirmPass) {
            toast.error("Passwords do not match")
            return
        }
        if (strength.score < 2) {
            toast.error("Password is too weak")
            return
        }
        setLoading(true)
        // Simulate API
        await new Promise(resolve => setTimeout(resolve, 1500))
        setLoading(false)
        setCurrentPass("")
        setNewPass("")
        setConfirmPass("")
        toast.success("Password updated successfully")
    }

    const handleDeleteAccount = () => {
        toast.error("Account deletion scheduled (Simulation)")
        setDeleteOpen(false)
    }

    return (
        <div className="space-y-8">
            {/* Password Change */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-indigo-500" /> Change Password
                    </CardTitle>
                    <CardDescription>Ensure your account is secure with a strong password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form id="pwd-form" onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
                        <div className="space-y-2">
                            <Label>Current Password</Label>
                            <div className="relative">
                                <Input
                                    type={showCurrentPass ? "text" : "password"}
                                    value={currentPass}
                                    onChange={(e) => setCurrentPass(e.target.value)}
                                />
                                <Button
                                    type="button" variant="ghost" size="icon"
                                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
                                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                                >
                                    {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <div className="relative">
                                <Input
                                    type={showNewPass ? "text" : "password"}
                                    value={newPass}
                                    onChange={(e) => setNewPass(e.target.value)}
                                />
                                <Button
                                    type="button" variant="ghost" size="icon"
                                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
                                    onClick={() => setShowNewPass(!showNewPass)}
                                >
                                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            {newPass && (
                                <div className="space-y-1 pt-1">
                                    <div className="flex justify-between text-xs">
                                        <span className={strength.score < 2 ? "text-red-500" : strength.score < 3 ? "text-yellow-500" : "text-green-500"}>
                                            {strengthLabel}
                                        </span>
                                        <span className="text-muted-foreground">{strengthPercentage(strength.score)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${strengthColor}`}
                                            style={{ width: `${strengthPercent}%` }}
                                        />
                                    </div>
                                    {strength.feedback.warning && (
                                        <p className="text-xs text-red-500/80">{strength.feedback.warning}</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm New Password</Label>
                            <Input
                                type="password"
                                value={confirmPass}
                                onChange={(e) => setConfirmPass(e.target.value)}
                            />
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button type="submit" form="pwd-form" disabled={loading || !currentPass || !newPass}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                    </Button>
                </CardFooter>
            </Card>

            {/* 2FA */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-green-500" /> Two-Factor Authentication
                            </CardTitle>
                            <CardDescription>Add an extra layer of security to your account.</CardDescription>
                        </div>
                        <Switch />
                    </div>
                </CardHeader>
                <CardContent>
                    <Alert className="bg-primary/5 border-primary/20">
                        <Smartphone className="h-4 w-4 text-primary" />
                        <AlertTitle>Authenticator App</AlertTitle>
                        <AlertDescription>
                            Use an authenticator app like Google Authenticator or Authy to generate verification codes.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            {/* Login Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Login Activity</CardTitle>
                    <CardDescription>Recent sign-in attempts to your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Device</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <div className="font-medium">Chrome on Linux</div>
                                        <div className="text-xs text-muted-foreground">10.128.0.2 (Current)</div>
                                    </div>
                                </TableCell>
                                <TableCell>Austin, TX, USA</TableCell>
                                <TableCell>Just now</TableCell>
                                <TableCell className="text-right"><Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">Active</Badge></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="flex items-center gap-2">
                                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <div className="font-medium">Safari on iPhone</div>
                                        <div className="text-xs text-muted-foreground">192.168.1.1</div>
                                    </div>
                                </TableCell>
                                <TableCell>Austin, TX, USA</TableCell>
                                <TableCell>2 days ago</TableCell>
                                <TableCell className="text-right"><Badge variant="outline">Signed Out</Badge></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Delete Account */}
            <Card className="border-red-500/30 bg-red-500/5">
                <CardHeader>
                    <CardTitle className="text-red-500 flex items-center gap-2">
                        <Trash2 className="h-5 w-5" /> Danger Zone
                    </CardTitle>
                    <CardDescription className="text-red-500/80">
                        Irreversible actions. Proceed with caution.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-red-500/80 mb-4">
                        Deleting your account will permanently remove all your projects, documents, and data. This action cannot be undone.
                    </p>
                    <Button variant="destructive" onClick={() => setDeleteOpen(true)}>Delete Account</Button>
                </CardContent>
            </Card>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-500">Delete Account?</DialogTitle>
                        <DialogDescription>
                            This action is permanent and cannot be undone. All your data will be wiped.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <Label>Type "DELETE" to confirm</Label>
                        <Input placeholder="DELETE" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteAccount}>Permanently Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function strengthPercentage(score: number) {
    return (score + 1) * 20
}
