'use client'

import React, { useState, useCallback, useRef } from 'react'
import Cropper from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Camera, Upload, X, Check, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface LogoUploadProps {
  currentLogoUrl?: string | null
  businessName: string
  onUpload: (blob: Blob) => Promise<void>
  disabled?: boolean
}

export function LogoUpload({ currentLogoUrl, businessName, onUpload, disabled }: LogoUploadProps) {
  const [image, setImage] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImage(reader.result?.toString() || null)
        setIsDialogOpen(true)
      })
      reader.readAsDataURL(file)
    }
  }

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.setAttribute('crossOrigin', 'anonymous')
      image.src = url
    })

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob | null> => {
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
      }, 'image/jpeg', 0.9)
    })
  }

  const handleSave = async () => {
    if (!image || !croppedAreaPixels) return

    try {
      setIsUploading(true)
      const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels)
      if (croppedImageBlob) {
        await onUpload(croppedImageBlob)
        setIsDialogOpen(false)
        setImage(null)
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to crop logo')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="relative group">
      <div className={cn(
        "w-32 h-32 rounded-[2.5rem] overflow-hidden bg-card border-2 border-border/50 shadow-2xl relative transition-all duration-500",
        disabled ? "opacity-50 grayscale" : "group-hover:border-violet-500/50 group-hover:shadow-violet-500/20"
      )}>
        {currentLogoUrl ? (
          <img 
            src={currentLogoUrl} 
            alt={businessName} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-card to-muted/30">
            <Store className="w-10 h-10 text-muted-foreground/20" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{businessName.slice(0, 3)}</span>
          </div>
        )}

        {!disabled && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]"
          >
            <Camera className="w-8 h-8 text-white" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Update Logo</span>
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <Dialog open={isDialogOpen} onOpenChange={(open) => !isUploading && setIsDialogOpen(open)}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border/50 rounded-3xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-foreground">
              Crop Business Logo
            </DialogTitle>
          </DialogHeader>

          <div className="relative w-full aspect-square bg-black/20 mt-6 border-y border-border/20">
            {image && (
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                classes={{ 
                    containerClassName: "bg-black",
                    cropAreaClassName: "border-2 border-violet-500 rounded-3xl"
                }}
              />
            )}
          </div>

          <div className="p-8 space-y-8 bg-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Zoom Level</span>
                <span className="text-[10px] font-black text-violet-500">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-violet-600 appearance-none bg-border/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-600 [&::-webkit-slider-thumb]:shadow-xl [&::-webkit-slider-thumb]:shadow-violet-500/40"
              />
            </div>

            <DialogFooter className="flex-row gap-3 sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                disabled={isUploading}
                className="flex-1 sm:flex-none h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isUploading}
                className="flex-1 sm:flex-none h-12 px-8 bg-violet-600 hover:bg-violet-500 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-violet-500/20"
              >
                {isUploading ? 'Uploading...' : 'Save Logo'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
