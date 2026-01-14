'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Rocket, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UpgradeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    limitType: 'project' | 'document'
}

export function UpgradeDialog({ open, onOpenChange, limitType }: UpgradeDialogProps) {
    const router = useRouter()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
                            <Rocket className="h-5 w-5" />
                        </div>
                        Upgrade to Pro
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        {limitType === 'project'
                            ? "You've reached the limit of 1 project on the Free plan."
                            : "You've reached the limit of 5 documents on the Free plan."
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">Unlock unlimited access and power up your workflow:</p>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Unlimited Projects</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Unlimited AI Documents</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Priority Support</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Advanced Analytics</span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-purple-500/20"
                        onClick={() => router.push('/dashboard/account?tab=billing')}
                    >
                        Upgrade Now
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
