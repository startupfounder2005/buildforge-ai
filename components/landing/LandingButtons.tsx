'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2 } from "lucide-react"

export function LandingButtons() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleLoginClick = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsLoading(true)
        router.push('/auth/login')
    }

    return (
        <div className="flex flex-col sm:flex-row gap-6 mt-8">
            <Button asChild size="lg" className="h-12 px-8 text-base bg-[#0047AB] hover:bg-[#0055CC] text-white transition-all">
                <Link href="/auth/signup">Get Started</Link>
            </Button>
            <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base border-white/20 hover:bg-accent hover:border-accent hover:text-white transition-all backdrop-blur-sm min-w-[120px]"
                onClick={handleLoginClick}
                disabled={isLoading}
            >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Login"}
            </Button>
        </div>
    )
}
