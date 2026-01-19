'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2, CheckCircle, ChevronLeft, ChevronRight, FileText, FileSignature, ShieldAlert, BadgeDollarSign, Building, Zap, Droplets, Hammer, ThermometerSun } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// --- Validation Schemas ---
const step1Schema = z.object({
    type: z.string().min(1, "Please select a document type"),
    title: z.string().min(3, "Title must be at least 3 characters"),
    address: z.string().min(5, "Full address is required"),
    jurisdiction: z.string().min(2, "Jurisdiction is required (City/State)")
})

const step2Schema = z.object({
    ownerName: z.string().min(1, "Owner/Supervisor Name is required"),
    ownerAddress: z.string().optional(),
    ownerPhone: z.string().optional(),
    contractorName: z.string().min(1, "Contractor/Reporter Name is required"),
    contractorLicense: z.string().optional(),
    contractorAddress: z.string().optional(),
})

// Timeline or Incident Details
const step3Schema = z.object({
    startDate: z.string().optional(),
    completionDate: z.string().optional(),
    incidentDate: z.string().optional(),
    incidentTime: z.string().optional(),
    weather: z.string().optional(),
})

// Valuation or Specific Details
const step4Schema = z.object({
    estimatedCost: z.string().optional(),
    scope: z.string().optional(),
    incidentType: z.string().optional(),
    description: z.string().optional(),
    correctiveActions: z.string().optional(),
})

const step5Schema = z.object({
    includeDisclaimers: z.boolean(),
    agreeToMock: z.boolean().refine(val => val === true, "You must acknowledge this is a mock document"),
})

// Combined Schema
const formSchema = step1Schema.merge(step2Schema).merge(step3Schema).merge(step4Schema).merge(step5Schema)
type FormData = z.infer<typeof formSchema>

interface NewDocumentWizardProps {
    projectId: string
    onSuccess?: () => void
    onCancel?: () => void
}

// --- Document Categories & Types ---
const docCategories = [
    { id: 'permit', title: 'Permit Application', desc: 'Official city work permits.', icon: FileText },
    { id: 'contract', title: 'Subcontractor Agreement', desc: 'Legal contracts for trades.', icon: FileSignature },
    { id: 'safety', title: 'Safety Report', desc: 'OSHA logs and rapid reports.', icon: ShieldAlert },
    { id: 'bid', title: 'Project Bid', desc: 'Formal cost estimates & proposals.', icon: BadgeDollarSign },
]

const permitTypes = [
    { id: 'building_permit', title: 'Building Permit', desc: 'General construction and structural work.', icon: Building },
    { id: 'electrical_permit', title: 'Electrical Permit', desc: 'Wiring, fixtures, and service panels.', icon: Zap },
    { id: 'plumbing_permit', title: 'Plumbing Permit', desc: 'Piping, fixtures, and water systems.', icon: Droplets },
    { id: 'mechanical_permit', title: 'Mechanical Permit', desc: 'HVAC, ductwork, and gas lines.', icon: Hammer },
]

export function NewDocumentWizard({ projectId, onSuccess, onCancel }: NewDocumentWizardProps) {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [showForm, setShowForm] = useState(false)

    const { register, control, handleSubmit, trigger, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: '',
            title: '',
            address: '',
            jurisdiction: '',
            ownerName: '',
            contractorName: '',
            includeDisclaimers: true,
            agreeToMock: false,
            // Safety Defaults
            incidentType: 'near_miss',
            weather: 'Clear',
        },
        mode: 'onChange'
    })

    const formData = watch()
    const isSafety = selectedCategory === 'safety'

    // Handle Category Selection
    const handleCategorySelect = (catId: string) => {
        if (selectedCategory === catId) {
            // Optional: Deselect if clicking same? No, stickiness is better for "Next" flow.
            return
        }
        setSelectedCategory(catId)
        if (catId !== 'permit') {
            // Auto-map non-permit types
            if (catId === 'contract') setValue('type', 'subcontractor_agreement')
            if (catId === 'safety') setValue('type', 'safety_report')
            if (catId === 'bid') setValue('type', 'project_bid')
        } else {
            setValue('type', '') // Reset type for permit so user must choose
        }
    }

    const validateStep = async (currentStep: number) => {
        let valid = false
        if (currentStep === 1) valid = await trigger(['type', 'title', 'address', 'jurisdiction'])
        if (currentStep === 2) valid = await trigger(['ownerName', 'contractorName'])

        if (currentStep === 3) {
            if (isSafety) {
                valid = await trigger(['incidentDate', 'incidentTime', 'weather'])
                // Manual check because schema is optional for hybrid
                if (!formData.incidentDate) { setValue('incidentDate', ''); await trigger('incidentDate'); return false; }
            } else {
                valid = await trigger(['startDate', 'completionDate'])
                if (!formData.startDate) { setValue('startDate', ''); await trigger('startDate'); return false; }
            }
        }

        if (currentStep === 4) {
            if (isSafety) {
                valid = await trigger(['incidentType', 'description'])
                if (!formData.description) { setValue('description', ''); await trigger('description'); return false; }
            } else {
                valid = await trigger(['estimatedCost', 'scope'])
                if (!formData.estimatedCost) { setValue('estimatedCost', ''); await trigger('estimatedCost'); return false; }
            }
        }

        return valid
    }

    const handleNext = async () => {
        if (step === 1 && !showForm) {
            if (!selectedCategory) {
                toast.error("Please select a document category")
                return
            }
            setShowForm(true)
            return
        }

        const isValid = await validateStep(step)
        if (isValid) setStep(prev => Math.min(prev + 1, 5))
    }

    const handleBack = () => {
        if (step === 1 && showForm) {
            setShowForm(false)
            return
        }
        if (step === 1 && !showForm) {
            if (onCancel) onCancel()
            else router.back()
            return
        }
        setStep(prev => Math.max(prev - 1, 1))
    }

    const onSubmit = async (data: FormData) => {
        setLoading(true)
        try {
            const res = await fetch('/api/generate-doc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    ...data,
                    category: selectedCategory // Explicitly pass category
                })
            })
            const result = await res.json()
            if (res.ok) {
                toast.success('Document Generated Successfully')
                if (onSuccess) {
                    onSuccess()
                } else {
                    router.push(`/dashboard/projects/${projectId}?tab=documents`)
                }
            } else {
                toast.error(result.message || 'Generation Failed')
            }
        } catch (error) {
            toast.error('Network Error')
        } finally {
            setLoading(false)
        }
    }

    const steps = [
        { id: 1, title: 'Basics' },
        { id: 2, title: 'Parties' },
        { id: 3, title: isSafety ? 'Incident' : 'Timeline' },
        { id: 4, title: isSafety ? 'Details' : 'Valuation' },
        { id: 5, title: 'Review' }
    ]

    return (
        <div className="max-w-4xl mx-auto relative cursor-default text-left">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto px-4 relative">
                {steps.map((s) => (
                    <div key={s.id} className="flex flex-col items-center z-10 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border transition-all duration-300 ${step >= s.id ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-110' : 'bg-muted text-muted-foreground border-muted-foreground/30'
                            }`}>
                            {step > s.id ? <CheckCircle className="h-5 w-5" /> : s.id}
                        </div>
                        <span className={`text-xs mt-2 font-medium transition-colors ${step >= s.id ? 'text-foreground' : 'text-muted-foreground'}`}>{s.title}</span>
                    </div>
                ))}
                <div className="absolute top-4 left-0 w-full h-0.5 bg-muted -z-0 hidden md:block" />
            </div>

            <Card className="min-h-[500px] flex flex-col border-muted/60 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">
                        {step === 1 && !showForm && 'Document Basics'}
                        {step === 1 && showForm && 'Project Details'}
                        {step === 2 && (isSafety ? 'Reporter & Supervisor' : 'Parties Involved')}
                        {step === 3 && (isSafety ? 'Incident Context' : 'Project Timeline')}
                        {step === 4 && (isSafety ? 'Incident Details' : 'Valuation & Scope')}
                        {step === 5 && 'Review & Generate'}
                    </CardTitle>
                    <CardDescription>
                        {step === 1 && !showForm && 'Select a document category.'}
                        {step === 1 && showForm && 'Enter basic project information.'}
                        {step === 2 && 'Who is involved?'}
                        {step === 3 && (isSafety ? 'When and where did it happen?' : 'Timeframe for the project.')}
                        {step === 4 && (isSafety ? 'What happened?' : 'Financials and work description.')}
                        {step === 5 && 'Confirm details before generation.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto max-h-[600px] px-6 py-4">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">

                                {/* Category Selection View */}
                                {!showForm && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {docCategories.map((cat) => {
                                            const Icon = cat.icon
                                            const isSelected = selectedCategory === cat.id
                                            return (
                                                <div
                                                    key={cat.id}
                                                    onClick={() => handleCategorySelect(cat.id)}
                                                    className={`cursor-pointer rounded-xl border-2 p-5 transition-all hover:border-primary/50 flex items-start gap-4 ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:bg-muted/50'}`}
                                                >
                                                    <div className={`p-3 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                                                        <Icon className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-lg">{cat.title}</h3>
                                                        <p className="text-sm text-muted-foreground leading-snug">{cat.desc}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Details View (If category selected and Next pressed) */}
                                {showForm && (
                                    <>
                                        {/* Permit Specific Sub-selection */}
                                        {selectedCategory === 'permit' && (
                                            <div className="space-y-3">
                                                <Label className="text-base">Permit Type</Label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Controller
                                                        name="type"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <>
                                                                {permitTypes.map((dt) => {
                                                                    const Icon = dt.icon
                                                                    return (
                                                                        <div
                                                                            key={dt.id}
                                                                            onClick={() => field.onChange(dt.id)}
                                                                            className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-primary/50 flex items-start gap-4 ${field.value === dt.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card'}`}
                                                                        >
                                                                            <div className={`p-2.5 rounded-lg ${field.value === dt.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                                                <Icon className="h-5 w-5" />
                                                                            </div>
                                                                            <div>
                                                                                <h3 className="font-semibold">{dt.title}</h3>
                                                                                <p className="text-sm text-muted-foreground leading-snug">{dt.desc}</p>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </>
                                                        )}
                                                    />
                                                </div>
                                                {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                                            </div>
                                        )}

                                        {/* Common Basics Fields (Always show once category chosen) */}
                                        <div className="space-y-4 pt-4 border-t">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Project / Document Title</Label>
                                                    <Input {...register('title')} placeholder="e.g. Unit 4B Renovation" />
                                                    {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Jurisdiction (City, State)</Label>
                                                    <Input {...register('jurisdiction')} placeholder="e.g. Austin, TX" />
                                                    {errors.jurisdiction && <p className="text-sm text-destructive">{errors.jurisdiction.message}</p>}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Full Project Address</Label>
                                                <Input {...register('address')} placeholder="123 Main Street, Austin, TX 78701" />
                                                {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2"><div className="w-1 h-4 bg-primary rounded-full" /> {isSafety ? 'Job Site Supervisor' : 'Property Owner'}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{isSafety ? 'Supervisor Name' : 'Owner Name'}</Label>
                                            <Input {...register('ownerName')} placeholder="Full Name" />
                                            {errors.ownerName && <p className="text-sm text-destructive">{errors.ownerName.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone (Optional)</Label>
                                            <Input {...register('ownerPhone')} placeholder="(555) 123-4567" />
                                        </div>
                                        <div className="col-span-1 md:col-span-2 space-y-2">
                                            <Label>Address (Optional)</Label>
                                            <Input {...register('ownerAddress')} placeholder="Mailing Address..." />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2"><div className="w-1 h-4 bg-secondary rounded-full" /> {isSafety ? 'Reporter / Safety Officer' : 'Licensed Contractor'}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{isSafety ? 'Reporter Name' : 'Company Name'}</Label>
                                            <Input {...register('contractorName')} placeholder={isSafety ? "Safety Officer Name" : "BuildRight Construction"} />
                                            {errors.contractorName && <p className="text-sm text-destructive">{errors.contractorName.message}</p>}
                                        </div>
                                        {!isSafety && (
                                            <div className="space-y-2">
                                                <Label>License #</Label>
                                                <Input {...register('contractorLicense')} placeholder="GC-123456" />
                                            </div>
                                        )}
                                        <div className="col-span-1 md:col-span-2 space-y-2">
                                            <Label>Address (Optional)</Label>
                                            <Input {...register('contractorAddress')} placeholder="HQ Address..." />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6 max-w-lg mx-auto py-10">
                                {isSafety ? (
                                    /* Safety: Incident Time & Context */
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <Label>Date of Incident</Label>
                                            <Input type="date" {...register('incidentDate')} />
                                            {errors.incidentDate && <p className="text-sm text-destructive">Required for safety reports</p>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Time</Label>
                                                <Input type="time" {...register('incidentTime')} />
                                                {errors.incidentTime && <p className="text-sm text-destructive">Required</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Weather</Label>
                                                <div className="relative">
                                                    <ThermometerSun className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input {...register('weather')} className="pl-9" placeholder="e.g. Sunny, 85F" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Standard: Project Timeline */
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <Label>Proposed Start Date</Label>
                                            <Input type="date" {...register('startDate')} />
                                            {errors.startDate && <p className="text-sm text-destructive">Required</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Estimated Completion / Due Date</Label>
                                            <Input type="date" {...register('completionDate')} />
                                            {errors.completionDate && <p className="text-sm text-destructive">Required</p>}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                                {isSafety ? (
                                    /* Safety: Details */
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label>Incident Type</Label>
                                            <Controller
                                                name="incidentType"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="near_miss">Near Miss</SelectItem>
                                                            <SelectItem value="injury">Injury / Illness</SelectItem>
                                                            <SelectItem value="property_damage">Property Damage</SelectItem>
                                                            <SelectItem value="hazard">Hazard Observation</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Description of Event</Label>
                                            <Textarea
                                                {...register('description')}
                                                placeholder="Describe what happened, root cause, and immediate outcome..."
                                                className="min-h-[120px]"
                                            />
                                            {errors.description && <p className="text-sm text-destructive">Required</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Immediate Corrective Actions</Label>
                                            <Textarea
                                                {...register('correctiveActions')}
                                                placeholder="What steps were taken immediately? (Optional)"
                                                className="min-h-[80px]"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    /* Standard: Valuation & Scope */
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <Label className="text-base">Initial Valuation / Estimated Cost</Label>
                                            <div className="relative max-w-xs">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                                <Input {...register('estimatedCost')} className="pl-8 text-lg font-medium" placeholder="0.00" />
                                            </div>
                                            {errors.estimatedCost && <p className="text-sm text-destructive">{errors.estimatedCost.message}</p>}
                                        </div>
                                        <div className="space-y-2 h-full">
                                            <Label className="text-base">Detailed Scope of Work</Label>
                                            <p className="text-sm text-muted-foreground">Describe the work to be performed. This will appear prominently on the permit.</p>
                                            <Textarea
                                                {...register('scope')}
                                                placeholder="E.g. Full interior renovation of Unit 4B including new electrical panel, updated plumbing fixtures, and drywall replacement..."
                                                className="min-h-[200px] text-base leading-relaxed"
                                            />
                                            {errors.scope && <p className="text-sm text-destructive">{errors.scope.message}</p>}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {step === 5 && (
                            <motion.div key="step5" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                                <div className="rounded-lg border bg-muted/30 p-6 space-y-4">
                                    <h3 className="font-semibold text-lg border-b pb-2">Summary</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground block">Type</span>
                                            <span className="font-medium capitalize">{formData.type.replace('_', ' ')}</span>
                                        </div>
                                        {isSafety ? (
                                            <div>
                                                <span className="text-muted-foreground block">Date</span>
                                                <span className="font-medium">{formData.incidentDate || "N/A"}</span>
                                            </div>
                                        ) : (
                                            <div>
                                                <span className="text-muted-foreground block">Cost</span>
                                                <span className="font-medium">${formData.estimatedCost}</span>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-muted-foreground block">{isSafety ? 'Supervisor' : 'Owner'}</span>
                                            <span className="font-medium">{formData.ownerName}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block">{isSafety ? 'Reporter' : 'Contractor'}</span>
                                            <span className="font-medium">{formData.contractorName}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground block">Address</span>
                                            <span className="font-medium">{formData.address}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 p-4 border rounded-lg bg-yellow-500/10 border-yellow-500/20">
                                    <div className="flex items-start space-x-3">
                                        <Controller
                                            name="agreeToMock"
                                            control={control}
                                            render={({ field }) => (
                                                <Checkbox
                                                    id="terms"
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="mt-1"
                                                />
                                            )}
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="terms" className="text-sm font-medium leading-none">I acknowledge this is a MOCK document.</Label>
                                            <p className="text-xs text-muted-foreground leading-snug">
                                                This document is generated by AI for simulation, testing, and training purposes only. It is NOT a valid legal permit.
                                            </p>
                                        </div>
                                    </div>
                                    {errors.agreeToMock && <p className="text-sm text-destructive font-medium">{errors.agreeToMock.message}</p>}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
                <CardFooter className="flex justify-between border-t p-6 bg-muted/10">
                    <Button variant="ghost" onClick={handleBack} disabled={loading}>
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>

                    {step < 5 ? (
                        <Button onClick={handleNext}>
                            Next <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit(onSubmit)}
                            disabled={loading || !formData.agreeToMock}
                            className="w-40"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><FileText className="mr-2 h-4 w-4" /> Generate PDF</>}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
