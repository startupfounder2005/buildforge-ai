'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { NewDocumentWizard } from './NewDocumentWizard'
import { useRouter, usePathname } from 'next/navigation'
import { Plus, Wand2, Building2, Loader2 } from 'lucide-react'

interface GenerateDocumentGlobalDialogProps {
    projects: { id: string, name: string }[]
    userId: string
    customTrigger?: React.ReactNode | ((props: { isLoading: boolean }) => React.ReactNode)
    defaultProjectId?: string
}

export function GenerateDocumentGlobalDialog({ projects, userId, customTrigger, defaultProjectId }: GenerateDocumentGlobalDialogProps) {
    const [open, setOpen] = useState(false)
    const [projectId, setProjectId] = useState<string>(defaultProjectId || '')
    const [step, setStep] = useState<'project_select' | 'wizard'>(defaultProjectId ? 'wizard' : 'project_select')
    const [isLoadingTrigger, setIsLoadingTrigger] = useState(false)
    const router = useRouter()
    const pathname = usePathname()

    const handleProjectSelect = () => {
        if (!projectId) return
        setStep('wizard')
    }

    const handleOpen = () => {
        setIsLoadingTrigger(true)
        setTimeout(() => {
            setOpen(true)
            setIsLoadingTrigger(false)
        }, 500)
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
            if (!defaultProjectId) {
                setProjectId('')
                setStep('project_select')
            } else {
                // If default is set, keep it and reset to wizard for next time
                setProjectId(defaultProjectId)
                setStep('wizard')
            }
        }, 500)
    }

    const handleCancel = () => {
        if (step === 'wizard' && !defaultProjectId) {
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
                if (!defaultProjectId) {
                    setProjectId('')
                    setStep('project_select')
                } else {
                    setProjectId(defaultProjectId)
                    setStep('wizard')
                }
            }, 300)
        }
    }

    return (
        <>
            {customTrigger ? (
                <div onClick={(e) => {
                    e.preventDefault();
                    if (!isLoadingTrigger) handleOpen();
                }}>
                    {typeof customTrigger === 'function'
                        ? customTrigger({ isLoading: isLoadingTrigger })
                        : customTrigger
                    }
                </div>
            ) : (
                <Button
                    variant="outline"
                    onClick={handleOpen}
                    disabled={isLoadingTrigger}
                    className="gap-2 border-dashed border-zinc-700 hover:bg-zinc-900 hover:text-blue-500 border border-transparent hover:border-white transition-all"
                >
                    {isLoadingTrigger ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Generate New
                </Button>
            )}

            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className={`${step === 'wizard' ? 'max-w-5xl h-[90vh] md:h-auto' : 'sm:max-w-[425px]'} overflow-hidden transition-all duration-300`}>
                    <DialogHeader className={step === 'wizard' ? 'hidden' : ''}>
                        <DialogTitle>Generate New Document</DialogTitle>
                        <DialogDescription>
                            Select a project to start the AI document generator.
                        </DialogDescription>
                    </DialogHeader>

                    {projects.length === 0 && !defaultProjectId ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
                            <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-zinc-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium text-lg">No Projects Found</p>
                                <p className="text-sm text-zinc-400 max-w-xs mx-auto">
                                    You need to create a project first before you can generate documents.
                                </p>
                            </div>
                            <Button
                                onClick={() => router.push('/dashboard/projects')}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Create Project
                            </Button>
                        </div>
                    ) : (
                        step === 'project_select' && (
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
                        )
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
        </>
    )
}
