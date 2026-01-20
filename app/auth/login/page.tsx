'use client'

import Link from 'next/link'
import { login, requestPasswordReset } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useSearchParams } from 'next/navigation'
import React, { Suspense } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { ObsidianLogo } from '@/components/ui/ObsidianLogo'
import { useFormStatus } from 'react-dom'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

function SubmitButton({ children, className }: { children: React.ReactNode, className?: string }) {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className={className} disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {children}
        </Button>
    )
}

function LoginForm() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const message = searchParams.get('message')
    const [showPassword, setShowPassword] = React.useState(false)

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center pt-8">
                    <div className="flex justify-center mb-6">
                        <ObsidianLogo className="h-24 w-24 drop-shadow-[0_0_20px_rgba(147,51,234,0.4)]" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={login} className="space-y-4">
                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="bg-green-500/15 text-green-500 text-sm p-3 rounded-md">
                                {message}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button type="button" className="text-sm underline text-muted-foreground hover:text-primary">
                                            Forgot your password?
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <div className="flex justify-center mb-4">
                                                <ObsidianLogo className="h-16 w-16 drop-shadow-[0_0_15px_rgba(147,51,234,0.3)]" />
                                            </div>
                                            <DialogTitle className="text-center">Reset Password</DialogTitle>
                                            <DialogDescription className="text-center">
                                                Enter your email address and we'll send you a link to reset your password.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form action={requestPasswordReset}>
                                            <div className="flex items-center space-x-2 py-4">
                                                <div className="grid flex-1 gap-2">
                                                    <Label htmlFor="reset-email" className="sr-only">
                                                        Email
                                                    </Label>
                                                    <Input
                                                        id="reset-email"
                                                        name="email"
                                                        placeholder="m@example.com"
                                                        type="email"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter className="sm:justify-start">
                                                <SubmitButton className="w-full">
                                                    Send Reset Link
                                                </SubmitButton>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="sr-only">
                                        {showPassword ? "Hide password" : "Show password"}
                                    </span>
                                </Button>
                            </div>
                        </div>
                        <SubmitButton className="w-full">Login</SubmitButton>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account? <Link href="/auth/signup" className="underline hover:text-primary">Sign up</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
        </Suspense>
    )
}
