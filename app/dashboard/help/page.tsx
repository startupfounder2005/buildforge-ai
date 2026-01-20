import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, BookOpen, MessageCircle } from 'lucide-react'

export default function HelpPage() {
    return (
        <div className="space-y-6 container max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
                <p className="text-muted-foreground">Need assistance? We're here to help.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" /> Documentation
                        </CardTitle>
                        <CardDescription>Read our guides and API reference.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Learn how to generate permits, manage projects, and use AI predictions effectively.
                        </p>
                        <Button variant="secondary" className="w-full">View Guides</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-primary" /> Contact Support
                        </CardTitle>
                        <CardDescription>Get in touch with our team.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Facing a bug or need enterprise features? Email our support team directly.
                        </p>
                        <Button className="w-full">
                            <Mail className="mr-2 h-4 w-4" /> support@buildforge.ai
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-8 border-yellow-500/20 bg-yellow-500/5">
                <CardHeader>
                    <CardTitle className="text-yellow-500">Early Access Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm">
                        You are on the BuildForge AI MVP. If you encounter any issues, please report them directly to the developer console or your account manager.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
