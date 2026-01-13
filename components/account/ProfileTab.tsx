"use client"

import { useState, useCallback, useRef, useEffect, useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { Camera, Loader2, CheckCircle2, User, Mail, Building, Briefcase, Phone } from "lucide-react"
import Cropper from "react-easy-crop"
import { Point, Area } from "react-easy-crop"
import { updateProfile, uploadAvatar } from "@/app/dashboard/account/actions"

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
    avatar_url: string | null;
}

export function ProfileTab({ user }: { user: UserProfile }) {
    const [isLoading, setIsLoading] = useState(false)

    // Server Actions State
    // Server Actions State
    const [state, formAction, isPending] = useActionState(updateProfile, { message: '' })

    // Image Crop State
    const [cropImage, setCropImage] = useState<string | null>(null)
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [isCropOpen, setIsCropOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (state?.message === 'Success') {
            toast.success("Profile updated successfully")
        } else if (state?.message) {
            toast.error(state.message)
        }
    }, [state])

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

            setIsLoading(true)
            const result = await uploadAvatar(formData)
            setIsLoading(false)

            if (result.message === 'Success') {
                toast.success("Profile photo updated")
                setIsCropOpen(false)
                setCropImage(null)
                // In a real app, we might need to manually refresh the router or update local state if revalidatePath is slow
            } else {
                toast.error(result.message)
            }
        } catch (e) {
            console.error(e)
            toast.error("Failed to crop/upload image")
            setIsLoading(false)
        }
    }

    // Determine initials
    const initials = user?.full_name
        ? user.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : 'U'

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Form */}
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your public profile and contact details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form id="profile-form" action={formAction} className="space-y-5">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2" htmlFor="fullName"><User className="h-4 w-4 text-muted-foreground" /> Full Name</Label>
                                    <Input
                                        name="fullName"
                                        id="fullName"
                                        defaultValue={user?.full_name || ""}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2" htmlFor="role"><Briefcase className="h-4 w-4 text-muted-foreground" /> Role / Title</Label>
                                    <Input
                                        name="role"
                                        id="role"
                                        defaultValue={user?.role || ""}
                                        placeholder="Project Manager"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> Email Address</Label>
                                <div className="relative">
                                    <Input
                                        value={user?.email || ""}
                                        disabled
                                        className="bg-muted pl-10"
                                    />
                                    <CheckCircle2 className="absolute left-3 top-2.5 h-4 w-4 text-green-500" />
                                    <Button type="button" variant="ghost" className="absolute right-1 top-1 h-8 text-xs text-muted-foreground">Verified</Button>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2" htmlFor="company"><Building className="h-4 w-4 text-muted-foreground" /> Company</Label>
                                    <Input
                                        name="company"
                                        id="company"
                                        defaultValue={user?.company_name || ""}
                                        placeholder="Acme Inc."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2" htmlFor="phone"><Phone className="h-4 w-4 text-muted-foreground" /> Phone</Label>
                                    <Input
                                        name="phone"
                                        id="phone"
                                        defaultValue={user?.phone || ""}
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4 flex justify-between">
                        <p className="text-xs text-muted-foreground">Changes are saved automatically when you click verify.</p>
                        <Button type="submit" form="profile-form">
                            Save Changes
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Right Column: Preview & Avatar */}
            <div className="space-y-6">
                <Card className="overflow-hidden border-primary/20 shadow-md">
                    <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    </div>
                    <CardContent className="pt-0 relative">
                        <div className="flex flex-col items-center -mt-12">
                            <div className="relative group">
                                <Avatar className="h-24 w-24 border-4 border-background shadow-xl cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <AvatarImage src={user?.avatar_url || undefined} className="object-cover" />
                                    <AvatarFallback className="text-2xl font-bold bg-secondary text-secondary-foreground">
                                        {initials}
                                    </AvatarFallback>
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[1px]">
                                        <Camera className="h-8 w-8 text-white" />
                                    </div>
                                </Avatar>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-md"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Camera className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="text-center mt-4 space-y-1">
                                <h3 className="font-bold text-xl">{user?.full_name || 'Your Name'}</h3>
                                <p className="text-sm text-balance text-muted-foreground flex items-center justify-center gap-1.5">
                                    {user?.role || 'Role'} <span className="text-indigo-500">•</span> {user?.company_name || 'Company'}
                                </p>
                                <Badge variant="outline" className="mt-2 border-green-500/30 text-green-500 bg-green-500/10">
                                    Verifed Account
                                </Badge>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Profile ID</div>
                            <div className="p-3 bg-muted rounded-md font-mono text-xs break-all text-muted-foreground">
                                {user?.id}
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
                    <div className="relative h-64 w-full bg-black/5 rounded-md overflow-hidden mt-4">
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
                    <div className="py-4 space-y-2">
                        <Label>Zoom</Label>
                        <Slider
                            defaultValue={[1]}
                            min={1}
                            max={3}
                            step={0.1}
                            value={[zoom]}
                            onValueChange={(val) => setZoom(val[0])}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCropOpen(false)}>Cancel</Button>
                        <Button onClick={saveCroppedImage} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Photo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

