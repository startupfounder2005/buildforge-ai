'use client'

import { useSearchParams } from 'next/navigation'
import { verifyOtp } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import React, { Suspense } from 'react'
import { Mail } from 'lucide-react'

function VerifyForm() {
    const searchParams = useSearchParams()
    const email = searchParams.get('email') || ''
    const error = searchParams.get('error')

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
                    <CardDescription>
                        We've sent a code to <span className="font-medium text-foreground">{email}</span>.
                        <br />Enter it below to verify your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={verifyOtp} className="space-y-4">
                        <input type="hidden" name="email" value={email} />

                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="token">Verification Code</Label>
                            <Input
                                id="token"
                                name="token"
                                placeholder="12345678"
                                required
                                className="text-center text-lg tracking-widest"
                                maxLength={8}
                            />
                        </div>

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                            Verify Email
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center flex-col gap-2">
                    <p className="text-sm text-muted-foreground">
                        Didn't receive the email?
                    </p>
                    <Button variant="link" className="h-auto p-0 text-blue-600" disabled>
                        Resend Code in 30s (Mock)
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyForm />
        </Suspense>
    )
}
