'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createRestaurant, getExpansionStatus } from '@/app/actions/restaurants'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Store, ShieldCheck, Sparkles,
  MapPin, Calendar as CalendarIcon, Check, AlertCircle,
  UtensilsCrossed, Building2, Home, Loader2,
  LayoutGrid, Layers
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'

type BusinessType = 'restaurant' | 'hotel' | 'guesthouse'

const TYPES: Array<{
  value: BusinessType
  icon: LucideIcon
  label: string
  desc: string
  color: string
  border: string
  dot: string
}> = [
  {
    value: 'restaurant',
    icon: UtensilsCrossed,
    label: 'Restaurant / Café',
    desc: 'Table booking, meal reservations, dine-in management',
    color: 'from-orange-500/20 to-amber-500/20',
    border: 'border-orange-500/40',
    dot: 'bg-orange-400',
  },
  {
    value: 'hotel',
    icon: Building2,
    label: 'Hotel / Resort',
    desc: 'Room booking with check-in and check-out dates',
    color: 'from-blue-500/20 to-indigo-500/20',
    border: 'border-blue-500/40',
    dot: 'bg-blue-400',
  },
  {
    value: 'guesthouse',
    icon: Home,
    label: 'Guest House / B&B',
    desc: 'Small lodging with room reservations and guest tracking',
    color: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/40',
    dot: 'bg-emerald-400',
  },
]

export default function NewBrandPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [businessType, setBusinessType] = useState<BusinessType>('restaurant')
  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState<{ count: number; max: number; isSpecial: boolean; isSuper: boolean } | null>(null)

  useEffect(() => {
    setMounted(true)
    getExpansionStatus().then(setStatus)
  }, [])

  if (!mounted) return null

  const isAtLimit = status ? (status.count >= status.max && !status.isSuper) : false
  const selectedType = TYPES.find(t => t.value === businessType)!

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isAtLimit) {
      toast.error('Expansion limit reached. Please contact support to increase your quota.')
      return
    }

    const form = new FormData(event.currentTarget)
    form.set('businessType', businessType)

    // Fill in empty admin fields to satisfy the action's logic
    form.set('adminFullName', '')
    form.set('adminUsername', '')
    form.set('adminPassword', '')

    startTransition(async () => {
      const result = await createRestaurant({ success: '', error: '' }, form)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Your new brand has been built successfully!')
        router.push('/dashboard')
      }
    })
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-5 duration-700 font-sans">
      
      {/* Dynamic Expansion Tracker */}
      {status && (
        <div className={cn(
          "bg-card/60 backdrop-blur-md border rounded-[2rem] p-5 flex items-center justify-between transition-all duration-500 shadow-2xl",
          isAtLimit ? "border-amber-500/30" : "border-violet-500/20"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors",
              isAtLimit ? "bg-amber-500/10 text-amber-500" : "bg-violet-600/10 text-violet-400"
            )}>
              <Layers className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Portfolio Capacity</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-foreground tracking-tighter italic">
                  {status.count} <span className="text-muted-foreground font-bold tracking-normal italic mx-px">/</span> {status.max === Infinity ? '∞' : status.max}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Brands Established</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end text-right">
             <div className="flex items-center gap-1.5 mb-1 px-2 py-1 bg-black/40 rounded-full border border-white/5">
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isAtLimit ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]")} />
                <span className={cn("text-[8px] font-black uppercase tracking-widest", isAtLimit ? "text-amber-500" : "text-emerald-500")}>
                  {isAtLimit ? 'Limit REACHED' : 'Expansion READY'}
                </span>
             </div>
             {status.isSuper && <span className="text-[8px] font-bold text-violet-400 uppercase tracking-widest italic opacity-60">Superadmin Unrestricted</span>}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col items-center text-center gap-4 pt-2">
        <div className="w-14 h-14 rounded-[1.75rem] bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-600/30">
          <Store className="w-7 h-7 text-foreground" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-foreground tracking-tight italic uppercase">Launch Brand</h1>
          <p className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-[0.2em]">Scale your presence and capture new segments</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Type Selection with Compact Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">1. Logic Module</label>
            <span className="text-[9px] font-bold text-muted-foreground italic uppercase">Optimized layouts available</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setBusinessType(t.value)}
                className={cn(
                  'relative group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 active:scale-[0.98]',
                  businessType === t.value
                    ? 'bg-violet-600/10 border-violet-500/40 shadow-inner'
                    : 'bg-card border-border hover:border-border'
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                  businessType === t.value ? "bg-violet-600 text-foreground shadow-lg shadow-violet-600/20" : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                )}>
                  {(() => { const TIcon = t.icon; return <TIcon className="w-5 h-5 transition-transform group-hover:scale-110" /> })()}
                </div>
                <div className="flex-1 text-left">
                  <p className={cn('text-[11px] font-black uppercase tracking-tight', businessType === t.value ? 'text-foreground' : 'text-muted-foreground')}>
                    {t.label}
                  </p>
                  <p className="text-[9px] text-muted-foreground font-bold mt-0.5 leading-none uppercase tracking-wide opacity-80">
                    {t.desc.split(',')[0]}
                  </p>
                </div>
                {businessType === t.value && (
                  <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center mr-1">
                    <Check className="w-3 h-3 text-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Details with Tight Inputs */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">2. Registry Details</label>
          <div className="bg-card border border-border rounded-[2rem] p-6 space-y-4 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 focus-within:scale-[1.02] transition-transform duration-300">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Legal Brand Name</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Skyline Cuisine"
                  className="w-full h-11 px-5 rounded-xl bg-background border border-border text-xs text-foreground font-bold placeholder:text-muted-foreground focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all shadow-inner"
                />
              </div>

              <div className="space-y-1.5 focus-within:scale-[1.02] transition-transform duration-300">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">URL Identifier</label>
                <input
                  name="slug"
                  required
                  placeholder="skyline-cuisine"
                  className="w-full h-11 px-5 rounded-xl bg-background border border-border text-xs text-foreground font-bold placeholder:text-muted-foreground focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all shadow-inner lowercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Contact Email</label>
                <input
                  name="contactEmail"
                  type="email"
                  placeholder="hello@skyline.com"
                  className="w-full h-11 px-5 rounded-xl bg-background border border-border text-[11px] text-foreground font-bold placeholder:text-muted-foreground focus:outline-none focus:border-violet-500 transition-all shadow-inner"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Phone String</label>
                <input
                  name="contactPhone"
                  placeholder="+855 12 345 678"
                  className="w-full h-11 px-5 rounded-xl bg-background border border-border text-[11px] text-foreground font-bold placeholder:text-muted-foreground focus:outline-none focus:border-violet-500 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Physical Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  name="address"
                  placeholder="123 Signature Row, Phnom Penh"
                  className="w-full h-11 pl-10 pr-5 rounded-xl bg-background border border-border text-[11px] text-foreground font-bold placeholder:text-muted-foreground focus:outline-none focus:border-violet-500 transition-all shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col gap-4">
          <button
            type="submit"
            disabled={isPending || isAtLimit}
            className={cn(
              "w-full h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] group flex items-center justify-center gap-3",
              isAtLimit 
                ? "bg-muted text-muted-foreground/60 border border-border cursor-not-allowed" 
                : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-foreground shadow-violet-600/20"
            )}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isAtLimit ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Expansion Locked
              </>
            ) : (
              <>
                Establish Brand Portfolio
                <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </>
            )}
          </button>

          <Link href="/dashboard" className="text-center text-[9px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors flex items-center justify-center gap-2">
            <ArrowLeft className="w-3 h-3" />
            Return to Command Center
          </Link>
        </div>
      </form>

      {/* Micro-footer */}
      <div className="text-center">
        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest italic opacity-50">Secure multi-brand establishment protocol v2.4</p>
      </div>
    </div>
  )
}
