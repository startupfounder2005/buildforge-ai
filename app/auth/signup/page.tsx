'use client'

import Link from 'next/link'
import { signup } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useSearchParams, useRouter } from 'next/navigation'
import React, { Suspense, useState, useEffect } from 'react'
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react'
import zxcvbn from "zxcvbn"
import { ObsidianLogo } from '@/components/ui/ObsidianLogo'

function SignupForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const errorParam = searchParams.get('error')
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (errorParam) {
            setError(errorParam)
            setLoading(false)
        }
    }, [errorParam])

    // Strength Meter Logic
    const strength = zxcvbn(password)
    const strengthPercent = (strength.score + 1) * 20
    const strengthColor = strength.score < 2 ? "bg-red-500" : strength.score < 3 ? "bg-yellow-500" : "bg-green-500"
    const strengthLabel = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"][strength.score]

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters")
            setLoading(false)
            return
        }

        if (!/\d/.test(password)) {
            setError("Password must contain at least one number")
            setLoading(false)
            return
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            setError("Password must contain at least one special character")
            setLoading(false)
            return
        }

        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const result = await signup(formData) as { error?: string } | undefined

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center pt-8">
                    <div className="flex justify-center mb-6">
                        <ObsidianLogo className="h-24 w-24 drop-shadow-[0_0_20px_rgba(147,51,234,0.4)]" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
                    <CardDescription>
                        Enter your information to get started
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input id="fullName" name="fullName" placeholder="John Doe" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Company</Label>
                                <Input id="companyName" name="companyName" placeholder="Acme Construction" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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
                                </Button>
                            </div>

                            {password && (
                                <div className="space-y-1 pt-1">
                                    <div className="flex justify-between text-xs">
                                        <span className={strength.score < 2 ? "text-red-500" : strength.score < 3 ? "text-yellow-500" : "text-green-500"}>
                                            {strengthLabel}
                                        </span>
                                        <span className="text-muted-foreground">{strengthPercent}%</span>
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
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className={`pr-10 transition-colors ${confirmPassword
                                        ? (password === confirmPassword ? "border-blue-500 ring-blue-500/20" : "border-red-500 ring-red-500/20")
                                        : ""
                                        }`}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                                <Shield className="h-4 w-4" />
                                <span>{error}</span>
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Sign Up
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account? <Link href="/auth/login" className="underline hover:text-primary">Sign in</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignupForm />
        </Suspense>
    )
}
