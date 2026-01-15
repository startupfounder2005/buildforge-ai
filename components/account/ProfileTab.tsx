"use client"

import { useState, useCallback, useRef, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import {
    Camera, Loader2, CheckCircle2, User, Mail, Building,
    Briefcase, Phone, Edit2, Copy, ShieldCheck, X, Save,
    AlertCircle, ChevronsUpDown, Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import Cropper from "react-easy-crop"
import { Point, Area } from "react-easy-crop"
import {
    updateProfile, uploadAvatar, initiateEmailChange,
    initiatePhoneVerification, verifyPhoneAction, verifyEmailChangeAction
} from "@/app/dashboard/account/actions"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { countryCodes } from "@/lib/countries"
import { User as AuthUser } from "@supabase/supabase-js"

// --- Simple Canvas Crop Utility ---
async function getCroppedImgLocal(
    imageSrc: string,
    pixelCrop: Area
): Promise<Blob | null> {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return null

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    )

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob)
        }, 'image/jpeg')
    })
}

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        image.setAttribute('crossOrigin', 'anonymous')
        image.src = url
    })
}

// --- Component ---

interface UserProfile {
    id: string;
    full_name: string | null;
    email: string;
    company_name: string | null;
    role: string | null;
    phone: string | null;
    phone_verified?: boolean;
    avatar_url: string | null;
    bio?: string | null;
    subscription_tier?: string;
}

const getRoleBadgeColor = (role: string | null) => {
    switch ((role || '').toLowerCase()) {
        case 'admin': return 'bg-red-500/10 text-red-500 border-red-500/20';
        case 'manager': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        case 'contractor': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
        case 'engineer': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
        default: return 'bg-secondary/50 text-secondary-foreground border-secondary-foreground/20';
    }
}

export function ProfileTab({ user: initialUser }: { user: UserProfile }) {
    const [user, setUser] = useState(initialUser)
    const [authUser, setAuthUser] = useState<AuthUser | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isPending, startTransition] = useTransition()
    const supabase = createClient()
    const router = useRouter()

    // Email Dialog State
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
    const [emailStep, setEmailStep] = useState<'init' | 'verify'>('init')
    const [emailCode, setEmailCode] = useState("")

    // Phone Dialog State
    const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false)
    const [phoneStep, setPhoneStep] = useState<'init' | 'verify'>('init')
    const [phoneCode, setPhoneCode] = useState("")
    const [openCombobox, setOpenCombobox] = useState(false)

    // Image Crop State
    const [cropImage, setCropImage] = useState<string | null>(null)
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [isCropOpen, setIsCropOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    const [countryIso, setCountryIso] = useState("US")
    const [localPhone, setLocalPhone] = useState("")
    const [pendingEmail, setPendingEmail] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Fetch Auth User
    useEffect(() => {
        const getAuthUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setAuthUser(user)
        }
        getAuthUser()
    }, [supabase])

    // Sync state with prop updates
    useEffect(() => {
        setUser(initialUser)
        setPendingEmail(initialUser.email)
    }, [initialUser])

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel('profile-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Profile updated realtime:', payload)
                    setUser(payload.new as UserProfile)
                    toast.info("Profile updated from another session")
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user.id, supabase])

    // Parse initial phone
    useEffect(() => {
        if (user?.phone) {
            const sortedCodes = [...countryCodes].sort((a, b) => b.dial_code.length - a.dial_code.length)
            const match = sortedCodes.find(c => user.phone!.startsWith(c.dial_code))

            if (match) {
                setCountryIso(match.code)
                setLocalPhone(user.phone.slice(match.dial_code.length))
            } else {
                setLocalPhone(user.phone)
            }
        }
    }, [user.phone])

    // Derived dial code
    const selectedCountry = countryCodes.find(c => c.code === countryIso) || countryCodes.find(c => c.code === "US")!
    const dialCode = selectedCountry.dial_code

    // Handlers
    const handleSave = async (formData: FormData) => {
        // Combine country code and local phone
        if (localPhone) {
            formData.set('phone', `${dialCode}${localPhone}`)
        } else {
            formData.set('phone', '')
        }

        // Ensure role
        if (!formData.get('role') && user.role) {
            formData.set('role', user.role)
        }

        startTransition(async () => {
            try {
                const result = await updateProfile(null, formData)

                if (result.message === 'Success') {
                    toast.success("Profile updated successfully")
                    setIsEditing(false)

                    // Determine if phone/email changed
                    const newPhone = formData.get('phone') as string
                    const phoneChanged = newPhone !== user.phone
                    const newEmail = formData.get('email') as string

                    // Optimistic update
                    setUser(prev => ({
                        ...prev,
                        full_name: formData.get('fullName') as string,
                        role: formData.get('role') as string,
                        company_name: formData.get('company') as string,
                        phone: newPhone || null,
                        email: newEmail,
                        phone_verified: phoneChanged ? false : prev.phone_verified,
                        bio: formData.get('bio') as string,
                    }))

                    // Refresh auth user data
                    setTimeout(async () => {
                        const { data: { user } } = await supabase.auth.getUser()
                        setAuthUser(user)
                        router.refresh() // Refresh layout to sync everything
                    }, 1000)

                } else {
                    toast.error(result.message || "Failed to update profile")
                }
            } catch (error) {
                console.error("Profile update error:", error)
                toast.error("An unexpected error occurred")
            }
        })
    }

    // Email Handlers
    const handleEmailInit = async () => {
        startTransition(async () => {
            // Use pendingEmail if set, otherwise user.email
            const emailToVerify = pendingEmail || user.email

            if (emailToVerify === user.email) {
                // Logic handled by button click now, but kept safe here
            }

            const result = await initiateEmailChange(emailToVerify)
            if (result.message === 'Success') {
                toast.success("Verification code sent to " + emailToVerify)
                setEmailStep('verify')
            } else {
                toast.error(result.message)
            }
        })
    }

    const handleEmailVerify = async () => {
        if (emailCode.length < 6) {
            toast.error("Please enter the verification code.")
            return
        }
        startTransition(async () => {
            const result = await verifyEmailChangeAction(user.email, emailCode)
            if (result.message === 'Success') {
                toast.success("Email verified successfully!")
                setIsEmailDialogOpen(false)
                setEmailStep('init')
                setEmailCode("")
                const { data: { user: updatedAuthUser } } = await supabase.auth.getUser()
                setAuthUser(updatedAuthUser)
            } else {
                toast.error(result.message)
            }
        })
    }

    // Phone Handlers
    const handlePhoneInit = async () => {
        if (!user.phone) {
            toast.error("Please save a phone number first.")
            return
        }
        startTransition(async () => {
            const result = await initiatePhoneVerification(user.phone!)
            if (result.message === 'Success') {
                toast.success("SMS Code sent!")
                setPhoneStep('verify')
            } else {
                toast.error(result.message)
            }
        })
    }

    const handlePhoneVerify = async () => {
        if (phoneCode.length !== 6) {
            toast.error("Code must be 6 digits.")
            return
        }
        startTransition(async () => {
            const result = await verifyPhoneAction(user.phone!, phoneCode)
            if (result.message === 'Success') {
                toast.success("Phone verified successfully!")
                setIsPhoneDialogOpen(false)
                setPhoneStep('init')
                setPhoneCode("")
                setUser(prev => ({ ...prev, phone_verified: true }))
            } else {
                toast.error(result.message)
            }
        })
    }

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            const reader = new FileReader()
            reader.addEventListener("load", () => {
                setCropImage(reader.result?.toString() || null)
                setIsCropOpen(true)
            })
            reader.readAsDataURL(file)
        }
    }

    const saveCroppedImage = async () => {
        if (!cropImage || !croppedAreaPixels) return
        try {
            const blob = await getCroppedImgLocal(cropImage, croppedAreaPixels)
            if (!blob) throw new Error("Failed to create blob")

            const formData = new FormData()
            formData.append('avatar', blob, 'avatar.jpg')

            setIsUploading(true)
            const result = await uploadAvatar(formData)
            setIsUploading(false)

            if (result.message === 'Success') {
                toast.success("Profile photo updated")
                setIsCropOpen(false)
                setCropImage(null)
                router.refresh()
            } else {
                toast.error(result.message)
            }
        } catch (e) {
            console.error(e)
            toast.error("Failed to crop/upload image")
            setIsUploading(false)
        }
    }

    const copyProfileId = () => {
        navigator.clipboard.writeText(user.id)
        toast.success("Profile ID copied to clipboard")
    }

    const initials = user?.full_name
        ? user.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : 'U'

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Left Column: Form */}
            <div className="lg:col-span-2 space-y-6 h-full">
                <form id="profile-form" action={handleSave} className="h-full">
                    <Card className="border-border/50 shadow-sm h-full flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 shrink-0">
                            <div className="space-y-1.5">
                                <CardTitle className="text-xl">Personal Information</CardTitle>
                                <CardDescription>Manage your public profile and contact details.</CardDescription>
                            </div>
                            {!isEditing ? (
                                <Button onClick={(e) => {
                                    e.preventDefault()
                                    setIsEditing(true)
                                }} variant="secondary" className="gap-2 text-foreground/80 font-medium shadow-sm border border-border/50 transition-all hover:bg-accent hover:text-white hover:border-accent">
                                    <Edit2 className="h-4 w-4" /> Edit Profile
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" onClick={(e) => {
                                        e.preventDefault()
                                        setIsEditing(false)
                                    }} disabled={isPending}>Cancel</Button>
                                    <Button type="submit" className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition-colors font-medium" disabled={isPending}>
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Save Changes
                                    </Button>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2.5">
                                        <Label className="flex items-center gap-2 text-muted-foreground" htmlFor="fullName">
                                            <User className="h-4 w-4" /> Full Name
                                        </Label>
                                        {isEditing ? (
                                            <Input name="fullName" defaultValue={user?.full_name || ""} placeholder="John Doe" className="bg-background/50" />
                                        ) : (
                                            <div className="font-medium text-lg px-0.5 py-1.5 border-b border-transparent">{user?.full_name || "Not set"}</div>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="flex items-center gap-2 text-muted-foreground" htmlFor="role">
                                            <Briefcase className="h-4 w-4" /> Role / Title
                                        </Label>
                                        {isEditing ? (
                                            <Select name="role" defaultValue={user?.role || "user"}>
                                                <SelectTrigger className="bg-background/50">
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="user">User</SelectItem>
                                                    <SelectItem value="admin">Administrator</SelectItem>
                                                    <SelectItem value="manager">Project Manager</SelectItem>
                                                    <SelectItem value="contractor">Contractor</SelectItem>
                                                    <SelectItem value="engineer">Engineer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Badge variant="outline" className={`px-3 py-1 text-sm font-medium capitalize ${getRoleBadgeColor(user?.role || 'user')}`}>
                                                {user?.role || "User"}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="flex items-center gap-2 text-muted-foreground" htmlFor="email">
                                        <Mail className="h-4 w-4" /> Email Address
                                    </Label>

                                    {isEditing ? (
                                        <div className="flex gap-2 relative group items-center">
                                            <div className="relative flex-1">
                                                <Input
                                                    name="email"
                                                    value={pendingEmail}
                                                    onChange={(e) => setPendingEmail(e.target.value)}
                                                    className="bg-background/50 pl-10"
                                                />
                                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                className="shadow-sm border border-border/50 hover:bg-accent hover:text-white hover:border-accent transition-all"
                                                onClick={() => {
                                                    if (pendingEmail === user.email) {
                                                        toast.info("Email is unchanged. Enter a new email to update.")
                                                        return
                                                    }
                                                    setIsEmailDialogOpen(true)
                                                }}
                                            >
                                                Change
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground opacity-70" />
                                                <span>{user?.email}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Email Verification Status */}
                                                {(authUser && user.email === authUser.email && !authUser.new_email) ? (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex items-center gap-1.5 cursor-help bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                                                    <ShieldCheck className="h-3 w-3 text-green-500" />
                                                                    <span className="text-[10px] font-medium text-green-500">Verified</span>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Email verified via Supabase Auth</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"

                                                        onClick={() => {
                                                            setEmailStep('init')
                                                            setIsEmailDialogOpen(true)
                                                        }}
                                                        className="h-7 px-3 text-xs font-medium text-emerald-600 border-emerald-600/20 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-500"
                                                    >
                                                        Verify Now
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Email Verification Dialog */}
                                <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Verify Email Address</DialogTitle>
                                            <DialogDescription>
                                                {emailStep === 'init'
                                                    ? `Send a verification code to ${user.email}.`
                                                    : `Enter the code sent to ${user.email}.`}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                            {emailStep === 'init' ? (
                                                <div className="flex flex-col items-center justify-center space-y-4 py-4">
                                                    <div className="h-16 w-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-2">
                                                        <Mail className="h-8 w-8 text-blue-500" />
                                                    </div>
                                                    <p className="text-sm text-center text-muted-foreground">
                                                        We will send a verification code to <strong>{user.email}</strong>.
                                                        Please check your inbox (and spam folder).
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label>Verification Code</Label>
                                                        <Input
                                                            className="text-center text-xl tracking-widest font-mono"
                                                            placeholder="Enter code"
                                                            value={emailCode}
                                                            onChange={(e) => setEmailCode(e.target.value)}
                                                        />
                                                        <p className="text-xs text-muted-foreground border-l-2 border-primary/20 pl-2 mt-2">
                                                            Check your email for the confirmation link or code.
                                                        </p>
                                                    </div>
                                                    <p className="text-xs text-center text-muted-foreground">
                                                        Didn't receive code? <Button variant="link" className="h-auto p-0" onClick={handleEmailInit}>Resend</Button>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <Button variant="ghost" onClick={() => setIsEmailDialogOpen(false)}>Cancel</Button>
                                            {emailStep === 'init' ? (
                                                <Button onClick={handleEmailInit} disabled={isPending}>
                                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Send Code
                                                </Button>
                                            ) : (
                                                <Button onClick={handleEmailVerify} disabled={isPending || !emailCode}>
                                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Verify Email
                                                </Button>
                                            )}
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2.5">
                                        <Label className="flex items-center gap-2 text-muted-foreground" htmlFor="company">
                                            <Building className="h-4 w-4" /> Company
                                        </Label>
                                        {isEditing ? (
                                            <Input name="company" defaultValue={user?.company_name || ""} placeholder="Acme Inc." className="bg-background/50" />
                                        ) : (
                                            <div className="font-medium px-0.5 py-1.5 border-b border-transparent">{user?.company_name || "Not set"}</div>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="flex items-center gap-2 text-muted-foreground" htmlFor="phone">
                                            <Phone className="h-4 w-4" /> Phone
                                        </Label>
                                        {isEditing ? (
                                            <div className="flex gap-2">
                                                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" role="combobox" aria-expanded={openCombobox} className="w-[140px] justify-between bg-muted/50 px-3 font-normal">
                                                            <span className="flex items-center gap-2 truncate">
                                                                <span className="text-base">{selectedCountry.flag}</span>
                                                                {selectedCountry.dial_code}
                                                            </span>
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[300px] p-0" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Search country..." />
                                                            <CommandList>
                                                                <CommandEmpty>No country found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {countryCodes.map((country) => (
                                                                        <CommandItem
                                                                            key={country.code}
                                                                            value={`${country.name} ${country.code} ${country.dial_code}`}
                                                                            onSelect={() => {
                                                                                setCountryIso(country.code)
                                                                                setOpenCombobox(false)
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn("mr-2 h-4 w-4", countryIso === country.code ? "opacity-100" : "opacity-0")}
                                                                            />
                                                                            <span className="mr-2 text-lg">{country.flag}</span>
                                                                            <span className="flex-1 truncate">{country.name}</span>
                                                                            <span className="ml-auto text-muted-foreground text-xs">{country.dial_code}</span>
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                <Input name="phone_local" value={localPhone} onChange={(e) => setLocalPhone(e.target.value)} placeholder="(555) 000-0000" className="bg-background/50 flex-1" />
                                            </div>
                                        ) : (
                                            <div className={`flex items-center justify-between rounded-md border text-sm shadow-sm transition-all ${user?.phone && user.phone_verified ? "border-input bg-muted/50 px-3 py-2 text-muted-foreground" : "border-transparent px-0.5 py-1.5"}`}>
                                                <div className="flex items-center gap-2">
                                                    <span>{user?.phone ? user.phone : <span className="text-muted-foreground italic">No phone added</span>}</span>
                                                </div>
                                                {user?.phone && (
                                                    <div className="flex items-center gap-2">
                                                        {user.phone_verified ? (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="flex items-center gap-1.5 cursor-help bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                                                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                                            <span className="text-[10px] font-medium text-green-500">Verified</span>
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>Phone number verified</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        ) : (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"

                                                                onClick={() => {
                                                                    setPhoneStep("init")
                                                                    setIsPhoneDialogOpen(true)
                                                                }}
                                                                className="h-7 px-3 text-xs font-medium text-emerald-600 border-emerald-600/20 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-500"
                                                            >
                                                                Verify Now
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Phone Verification Dialog */}
                                <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Verify Phone Number</DialogTitle>
                                            <DialogDescription>
                                                {phoneStep === 'init'
                                                    ? `Send a seamless verification code to ${user.phone}.`
                                                    : `Enter the 6-digit code sent to ${user.phone}.`}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                            {phoneStep === 'init' ? (
                                                <div className="flex flex-col items-center justify-center space-y-4 py-4">
                                                    <div className="h-16 w-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-2">
                                                        <Phone className="h-8 w-8 text-blue-500" />
                                                    </div>
                                                    <p className="text-sm text-center text-muted-foreground">
                                                        We will send an SMS with a verification code to <strong>{user.phone}</strong>.
                                                        Standard messaging rates may apply.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label>Verification Code</Label>
                                                        <Input
                                                            className="text-center text-2xl tracking-[0.5em] font-mono"
                                                            maxLength={6}
                                                            placeholder="000000"
                                                            value={phoneCode}
                                                            onChange={(e) => setPhoneCode(e.target.value)}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-center text-muted-foreground">
                                                        Didn't receive code? <Button variant="link" className="h-auto p-0" onClick={handlePhoneInit}>Resend</Button>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <Button variant="ghost" onClick={() => setIsPhoneDialogOpen(false)}>Cancel</Button>
                                            {phoneStep === 'init' ? (
                                                <Button onClick={handlePhoneInit} disabled={isPending}>
                                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Send Code
                                                </Button>
                                            ) : (
                                                <Button onClick={handlePhoneVerify} disabled={isPending || phoneCode.length !== 6}>
                                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Verify Number
                                                </Button>
                                            )}
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <div className="space-y-2.5">
                                    <Label className="flex items-center gap-2 text-muted-foreground" htmlFor="bio">
                                        <Edit2 className="h-4 w-4" /> Bio
                                    </Label>
                                    {isEditing ? (
                                        <div className="relative">
                                            <Textarea
                                                name="bio"
                                                defaultValue={user?.bio || ""}
                                                placeholder="Tell us a bit about yourself..."
                                                maxLength={150}
                                                className="bg-background/50 min-h-[100px] resize-none"
                                            />
                                            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground pointer-events-none">
                                                Max 150 chars
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground leading-relaxed px-0.5 py-1.5 border-b border-transparent min-h-[40px] break-words whitespace-pre-wrap">
                                            {user?.bio || "No bio added yet."}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>

            {/* Right Column: Preview & Avatar */}
            <div className="space-y-6 h-full">
                <Card className="overflow-hidden border-border/50 shadow-lg relative group/card h-full flex flex-col">
                    <div className="h-32 bg-gradient-to-br from-primary/80 via-primary to-purple-600 relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    </div>
                    <CardContent className="pt-0 relative flex-grow flex flex-col items-center justify-between">
                        <div className="flex flex-col items-center -mt-16 w-full">
                            <motion.div
                                className="relative group cursor-pointer"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                <Avatar className="h-32 w-32 border-[6px] border-background shadow-2xl" onClick={() => fileInputRef.current?.click()}>
                                    <AvatarImage src={user?.avatar_url || undefined} className="object-cover" />
                                    <AvatarFallback className="text-4xl font-black bg-gradient-to-br from-gray-800 to-black text-white">
                                        {initials}
                                    </AvatarFallback>

                                    {/* Upload Overlay */}
                                    <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                                        <Camera className="h-8 w-8 text-white mb-1" />
                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Update</span>
                                    </div>
                                </Avatar>

                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </motion.div>

                            <div className="text-center mt-5 space-y-1.5 w-full">
                                <div className="flex items-center justify-center gap-2">
                                    <h3 className="font-bold text-2xl tracking-tight">{user?.full_name || 'Your Name'}</h3>
                                    {user?.email && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <CheckCircle2 className="h-5 w-5 text-blue-500 fill-blue-500/10" />
                                                </TooltipTrigger>
                                                <TooltipContent>Verified Account</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>

                                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                    <span className="capitalize">{user?.role || 'User'}</span>
                                    <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                    <span className="font-medium text-foreground/80">{user?.company_name || 'No Company'}</span>
                                </p>

                                <div className="pt-3 flex justify-center gap-2">
                                    {user.subscription_tier === 'pro' ? (
                                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20 transition-colors cursor-default">
                                            Active Subscription
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground border-border bg-muted/50">
                                            No active subscription
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 space-y-4 w-full">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profile ID</Label>
                                <div
                                    className="group relative p-3 bg-muted/40 hover:bg-muted/60 border border-border/50 rounded-lg font-mono text-xs text-muted-foreground break-all transition-colors cursor-pointer flex items-center justify-between gap-2"
                                    onClick={copyProfileId}
                                >
                                    <span className="truncate">{user?.id}</span>
                                    <Copy className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Crop Modal */}
            <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Profile Photo</DialogTitle>
                        <DialogDescription>
                            Drag to position and pinch to zoom.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="relative h-64 w-full bg-black/5 rounded-md overflow-hidden mt-4 ring-1 ring-border">
                        {cropImage && (
                            <Cropper
                                image={cropImage}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        )}
                    </div>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Zoom</span>
                                <span>{Math.round(zoom * 100)}%</span>
                            </div>
                            <Slider
                                defaultValue={[1]}
                                min={1}
                                max={3}
                                step={0.1}
                                value={[zoom]}
                                onValueChange={(val) => setZoom(val[0])}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCropOpen(false)}>Cancel</Button>
                        <Button
                            onClick={saveCroppedImage}
                            disabled={isUploading}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white"
                        >
                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Photo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
