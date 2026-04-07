'use client'

import React, { useState, useCallback, useRef } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  userName: string
  onUpload: (blob: Blob) => Promise<void>
  disabled?: boolean
}

export function AvatarUpload({ currentAvatarUrl, userName, onUpload, disabled }: AvatarUploadProps) {
  const [image, setImage] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onCropComplete = useCallback((_croppedArea: Area, nextCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(nextCroppedAreaPixels)
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

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob | null> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return null

    // Set target size for avatar (e.g. 512px max for performance/storage)
    const TARGET_SIZE = 512
    canvas.width = TARGET_SIZE
    canvas.height = TARGET_SIZE

    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(
      image,
      Math.floor(pixelCrop.x),
      Math.floor(pixelCrop.y),
      Math.floor(pixelCrop.width),
      Math.floor(pixelCrop.height),
      0,
      0,
      TARGET_SIZE,
      TARGET_SIZE
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/jpeg', 0.85) // Good balance of quality/size
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
      toast.error('Could not crop photo')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="relative group">
      <div className={cn(
        "w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700 shadow-2xl relative transition-all duration-500",
        disabled ? "opacity-50 grayscale" : "group-hover:scale-105 group-hover:shadow-violet-500/30"
      )}>
        {currentAvatarUrl ? (
          <img 
            src={currentAvatarUrl} 
            alt={userName} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-3xl font-black italic uppercase tracking-tighter">
            {userName.slice(0, 2)}
          </div>
        )}

        {!disabled && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2"
          >
            <Camera className="w-6 h-6 text-white" />
            <span className="text-[8px] font-black uppercase tracking-widest text-white/80">Edit Photo</span>
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
        <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] bg-card border-border/50 rounded-3xl p-0 overflow-hidden shadow-2xl flex flex-col">
          <DialogHeader className="p-6 pb-0 flex-shrink-0">
            <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-foreground">
              Edit Photo
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="relative w-full h-[300px] sm:aspect-square bg-black/40 mt-6 border-y border-border/20">
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
                      cropAreaClassName: "border-2 border-violet-500 rounded-full"
                  }}
                />
              )}
            </div>

          <div className="p-8 space-y-8 bg-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Zoom</span>
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
                {isUploading ? 'Saving...' : 'Save Photo'}
              </Button>
            </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
