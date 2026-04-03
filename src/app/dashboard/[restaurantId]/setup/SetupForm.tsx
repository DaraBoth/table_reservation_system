'use client'

import React, { useActionState, useRef, useState } from 'react'
import { completeRestaurantSetup } from '@/app/actions/restaurants'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Store, BedDouble, Hotel, AlertTriangle, Mail, Phone, MapPin, Upload, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const typeInfo: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }>; desc: string }> = {
  restaurant: { label: 'Restaurant', Icon: Store,     desc: 'Dining, tables & cafe' },
  hotel:      { label: 'Hotel',      Icon: Hotel,     desc: 'Rooms & concierge' },
  guesthouse: { label: 'Guest house', Icon: BedDouble, desc: 'Simple lodging' },
}

export function SetupForm({ restaurant }: { restaurant: any }) {
  const [state, action, pending] = useActionState(completeRestaurantSetup, null)
  const [name, setName] = useState<string>(restaurant.name ?? '')
  const [contactEmail, setContactEmail] = useState<string>(restaurant.contact_email ?? '')
  const [contactPhone, setContactPhone] = useState<string>(restaurant.contact_phone ?? '')
  const [address, setAddress] = useState<string>(restaurant.address ?? '')
  const [logoUrl, setLogoUrl] = useState<string>(restaurant.logo_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const businessType: string = restaurant.business_type || 'restaurant'
  const type = typeInfo[businessType] ?? typeInfo.restaurant
  const TypeIcon = type.Icon

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File must be under 2 MB')
      return
    }
    setUploadError(null)
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `logos/${restaurant.id}.${ext}`
      const { error } = await supabase.storage
        .from('restaurant-assets')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data } = supabase.storage.from('restaurant-assets').getPublicUrl(path)
      // Bust cache with timestamp
      setLogoUrl(`${data.publicUrl}?t=${Date.now()}`)
    } catch (err: any) {
      setUploadError(err.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="businessType" value={businessType} />
      <input type="hidden" name="logoUrl" value={logoUrl} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Row 1: Logo tile + Identity tile */}
      <div className="grid grid-cols-2 gap-3">

        {/* Logo tile — fully clickable */}
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'relative aspect-square rounded-3xl border-2 overflow-hidden transition-all group',
            logoUrl
              ? 'border-violet-500/40 bg-slate-900'
              : 'border-dashed border-slate-700 bg-slate-900 hover:border-violet-500/50 active:scale-[0.98]',
            uploading && 'pointer-events-none opacity-60'
          )}
        >
          {logoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                <Upload className="w-5 h-5 text-white" />
                <span className="text-white text-[9px] font-black uppercase tracking-widest">Change</span>
              </div>
            </>
          ) : uploading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 text-violet-400 animate-spin" />
              <span className="text-[9px] text-violet-400 font-black uppercase tracking-widest">Uploading</span>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                <Upload className="w-5 h-5 text-slate-500 group-hover:text-violet-400 transition-colors" />
              </div>
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest text-center leading-tight">Tap to upload logo</span>
              <span className="text-[8px] text-slate-700 font-bold">PNG · JPG · WEBP</span>
            </div>
          )}
        </button>

        {/* Identity tile */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between gap-3">
          <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Identity</p>

          {/* Business type — read-only */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-violet-600/10 border border-violet-500/20">
            <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
              <TypeIcon className="w-3 h-3 text-white" />
            </div>
            <span className="text-white font-black text-[10px] flex-1 truncate">{type.label}</span>
            <span className="text-[8px] text-violet-400 font-black border border-violet-500/30 px-1 py-0.5 rounded shrink-0">Set</span>
          </div>

          {/* Business name */}
          <Input
            name="name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="ភោជនីយដ្ឋាន..."
            className="h-10 bg-slate-950 border-slate-700 text-white font-bold rounded-xl focus:border-violet-500 transition-all placeholder:text-slate-700 text-xs"
          />
        </div>
      </div>

      {/* Remove logo button — shown below row 1 when logo is set */}
      {logoUrl && !uploading && (
        <button
          type="button"
          onClick={() => { setLogoUrl(''); setUploadError(null) }}
          className="w-full h-8 flex items-center justify-center gap-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-rose-400 hover:border-rose-500/30 transition-all"
        >
          <X className="w-3 h-3" /> Remove Logo
        </button>
      )}

      {uploadError && (
        <p className="text-rose-400 text-xs font-bold flex items-center gap-1.5 px-1">
          <AlertTriangle className="w-3 h-3 shrink-0" /> {uploadError}
        </p>
      )}

      {/* Row 2: Email + Phone */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-slate-500" />
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Email</p>
          </div>
          <Input
            name="contactEmail"
            type="email"
            value={contactEmail}
            onChange={e => setContactEmail(e.target.value)}
            placeholder="info@restaurant.com.kh"
            className="h-10 bg-slate-950 border-slate-700 text-white font-bold rounded-xl focus:border-violet-500 transition-all placeholder:text-slate-700 text-xs"
          />
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-slate-500" />
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Phone</p>
          </div>
          <Input
            name="contactPhone"
            type="tel"
            value={contactPhone}
            onChange={e => setContactPhone(e.target.value)}
            placeholder="+855 12 345 678"
            className="h-10 bg-slate-950 border-slate-700 text-white font-bold rounded-xl focus:border-violet-500 transition-all placeholder:text-slate-700 text-xs"
          />
        </div>
      </div>

      {/* Row 3: Address */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2.5">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-slate-500" />
          <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Address</p>
        </div>
        <Input
          name="address"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="ផ្លូវ 278, សង្កាត់ទន្លេបាសាក់, ភ្នំពេញ"
          className="h-10 bg-slate-950 border-slate-700 text-white font-bold rounded-xl focus:border-violet-500 transition-all placeholder:text-slate-600 text-sm"
        />
      </div>

      {/* Submit */}
      <div className="pt-1 space-y-2">
        {state?.error && (
          <p className="text-rose-400 text-xs font-bold flex items-center gap-1.5 px-1">
            <AlertTriangle className="w-3 h-3 shrink-0" /> {state.error}
          </p>
        )}
        <Button
          type="submit"
          disabled={pending || uploading}
          className="w-full h-14 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 rounded-2xl font-black text-lg shadow-xl shadow-violet-500/30 transition-all active:scale-[0.98]"
        >
          {pending ? 'Initializing...' : 'Launch Dashboard'}
        </Button>
      </div>
    </form>
  )
}
