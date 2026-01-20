'use client'

import { use } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { NewDocumentWizard } from '@/components/documents/NewDocumentWizard'

export default function GenerateDocPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = use(params)

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-bold tracking-tight">Generate Document</h2>
                    <p className="text-muted-foreground">AI-powered construction document generation.</p>
                </div>
                <Link href={`/dashboard/projects/${projectId}`}>
                    <Button variant="outline">Back to Project</Button>
                </Link>
            </div>

            <NewDocumentWizard projectId={projectId} />
        </div>
    )
}
