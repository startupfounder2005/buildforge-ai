"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, CreditCard, Download, ExternalLink, Zap, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createCheckoutSession, createCustomerPortal } from "@/app/dashboard/account/billing/actions"
import { useState } from "react"
import { toast } from "sonner"

// Replace with your actual Stripe Price ID for the Pro Plan
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || "price_1Q..."

export function BillingTab({ plan = 'free' }: { plan?: string }) {
    const isPro = plan === 'pro'
    const [isLoading, setIsLoading] = useState(false)

    const handleUpgrade = async () => {
        setIsLoading(true)
        try {
            await createCheckoutSession(PRO_PRICE_ID)
        } catch (error: any) {
            toast.error(error.message || "Failed to start checkout")
            setIsLoading(false)
        }
    }

    const handleManage = async () => {
        setIsLoading(true)
        try {
            await createCustomerPortal()
        } catch (error: any) {
            toast.error(error.message || "Failed to open billing portal")
            setIsLoading(false)
        }
    }

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
                            {['1 Active Project', '5 Documents / Month', 'Basic PDF Generation', 'Community Support', 'Watermarked Documents'].map((feat, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm">
                                    <Check className="h-4 w-4 text-green-500" />
                                    {feat}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            variant="outline"
                            disabled={!isPro || isLoading}
                            onClick={handleManage}
                        >
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
                                'Unlimited Projects',
                                'Unlimited Documents',
                                'AI Predictions & Risk Analysis',
                                'Priority Email Support',
                                'White-label PDFs (No Watermark)',
                                'Custom Branding'
                            ].map((feat, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm">
                                    <Check className="h-4 w-4 text-indigo-500" />
                                    {feat}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-indigo-500/20"
                            onClick={isPro ? handleManage : handleUpgrade}
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isPro ? "Manage Subscription" : "Upgrade to Pro"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>

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
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Invoices are managed directly via the <Button variant="link" className="h-auto p-0" onClick={handleManage}>Billing Portal</Button>.
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
