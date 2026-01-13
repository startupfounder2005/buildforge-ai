"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, CreditCard, Download, ExternalLink, Zap } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function BillingTab({ plan = 'free' }: { plan?: string }) {
    const isPro = plan === 'pro'

    return (
        <div className="space-y-8">
            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free Plan */}
                <Card className={`relative flex flex-col ${!isPro ? 'border-primary shadow-md' : ''}`}>
                    <CardHeader>
                        {!isPro && <Badge className="w-fit mb-2">Current Plan</Badge>}
                        <CardTitle className="text-2xl">Free</CardTitle>
                        <CardDescription>Essential tools for small projects.</CardDescription>
                        <div className="mt-4">
                            <span className="text-4xl font-bold">€0</span>
                            <span className="text-muted-foreground">/month</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ul className="space-y-3">
                            {['5 Documents / Month', 'Basic PDF Generation', 'Community Support', 'Watermarked Documents'].map((feat, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm">
                                    <Check className="h-4 w-4 text-green-500" />
                                    {feat}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant="outline" disabled={!isPro}>
                            {!isPro ? "Your Current Plan" : "Downgrade to Free"}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Pro Plan */}
                <Card className={`relative flex flex-col border-indigo-500/20 overflow-hidden ${isPro ? 'border-indigo-500 ring-1 ring-indigo-500' : ''}`}>
                    <div className="absolute top-0 right-0 p-3">
                        <Badge variant="outline" className="border-indigo-500 text-indigo-500 bg-indigo-500/10">Recommended</Badge>
                    </div>
                    {/* Gradient Background Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent pointer-events-none" />

                    <CardHeader>
                        {isPro && <Badge className="w-fit mb-2 bg-indigo-600 hover:bg-indigo-700">Current Plan</Badge>}
                        <CardTitle className="text-2xl flex items-center gap-2">
                            Pro <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        </CardTitle>
                        <CardDescription>Unlock full power of Obsidian.</CardDescription>
                        <div className="mt-4">
                            <span className="text-4xl font-bold">€49</span>
                            <span className="text-muted-foreground">/month</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ul className="space-y-3">
                            {[
                                'Unlimited Documents',
                                'AI Predictions & Risk Analysis',
                                'Priority Email Support',
                                'White-label PDFs (No Watermark)',
                                'Custom Branding',
                                'Export to Procore/AutoCAD'
                            ].map((feat, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm">
                                    <Check className="h-4 w-4 text-indigo-500" />
                                    {feat}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-indigo-500/20">
                            {isPro ? "Manage Subscription" : "Upgrade to Pro"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Payment Method */}
            <Card>
                <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription>Manage your payment details and billing address.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-14 bg-slate-100 rounded border flex items-center justify-center">
                                {/* Simple Visa placeholder logo */}
                                <div className="font-bold text-blue-800 italic text-xs">VISA</div>
                            </div>
                            <div>
                                <div className="font-medium flex items-center gap-2">
                                    Visa ending in 4242
                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">Default</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">Expires 12/2026</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/20 border-t px-6 py-4">
                    <Button variant="outline" size="sm">
                        <CreditCard className="mr-2 h-4 w-4" /> Add Payment Method
                    </Button>
                </CardFooter>
            </Card>

            {/* Invoices */}
            <Card>
                <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                    <CardDescription>View and download past invoices.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                { id: 'INV-003', status: 'Paid', amount: '€49.00', date: 'Oct 01, 2026' },
                                { id: 'INV-002', status: 'Paid', amount: '€49.00', date: 'Sep 01, 2026' },
                                { id: 'INV-001', status: 'Paid', amount: '€49.00', date: 'Aug 01, 2026' },
                            ].map((inv) => (
                                <TableRow key={inv.id}>
                                    <TableCell className="font-medium">{inv.id}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-green-600 bg-green-500/10 border-green-500/20">
                                            {inv.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{inv.amount}</TableCell>
                                    <TableCell>{inv.date}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Download className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
