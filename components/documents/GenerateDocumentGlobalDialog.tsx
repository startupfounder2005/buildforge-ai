'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { NewDocumentWizard } from './NewDocumentWizard'
import { useRouter, usePathname } from 'next/navigation'
import { Plus, Wand2 } from 'lucide-react'

interface GenerateDocumentGlobalDialogProps {
    projects: { id: string, name: string }[]
    userId: string
    customTrigger?: React.ReactNode
}

export function GenerateDocumentGlobalDialog({ projects, userId, customTrigger }: GenerateDocumentGlobalDialogProps) {
    const [open, setOpen] = useState(false)
    const [projectId, setProjectId] = useState<string>('')
    const [step, setStep] = useState<'project_select' | 'wizard'>('project_select')
    const router = useRouter()
    const pathname = usePathname()

    const handleProjectSelect = () => {
        if (!projectId) return
        setStep('wizard')
    }

    const handleSuccess = () => {
        setOpen(false)

        if (pathname !== '/dashboard/documents') {
            router.push('/dashboard/documents')
        } else {
            router.refresh()
        }

        // Reset state after closing
        setTimeout(() => {
            setProjectId('')
            setStep('project_select')
        }, 500)
    }

    const handleCancel = () => {
        if (step === 'wizard') {
            setStep('project_select')
        } else {
            setOpen(false)
        }
    }

    const onOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
            // Reset after transition
            setTimeout(() => {
                setProjectId('')
                setStep('project_select')
            }, 300)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {customTrigger ? customTrigger : (
                    <Button variant="outline" className="gap-2 border-dashed border-zinc-700 hover:bg-zinc-900 hover:text-blue-500 hover:border-blue-500/50">
                        <Plus className="h-4 w-4" /> Generate New
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className={`${step === 'wizard' ? 'max-w-5xl h-[90vh] md:h-auto' : 'sm:max-w-[425px]'} overflow-hidden transition-all duration-300`}>
                <DialogHeader className={step === 'wizard' ? 'hidden' : ''}>
                    <DialogTitle>Generate New Document</DialogTitle>
                    <DialogDescription>
                        Select a project to start the AI document generator.
                    </DialogDescription>
                </DialogHeader>

                {step === 'project_select' && (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="project">Project</Label>
                            <Select value={projectId} onValueChange={setProjectId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a project..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button onClick={handleProjectSelect} disabled={!projectId}>
                                Continue <Wand2 className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'wizard' && (
                    <div className="h-full overflow-y-auto p-1">
                        <NewDocumentWizard
                            projectId={projectId}
                            onSuccess={handleSuccess}
                            onCancel={handleCancel}
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
