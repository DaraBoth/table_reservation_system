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
  LayoutGrid, Layers, Mail, Phone, Globe
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

export default function GlobalSetupPage() {
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isAtLimit) {
      toast.error('Expansion limit reached. Please contact support to increase your quota.')
      return
    }

    const form = new FormData(event.currentTarget)
    form.set('businessType', businessType)
    form.set('adminFullName', '')
    form.set('adminUsername', '')
    form.set('adminPassword', '')

    startTransition(async () => {
      const result = await createRestaurant({ success: '', error: '' }, form)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Property established successfully!')
      }
    })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center custom-scrollbar overflow-x-hidden p-0 m-0">
      <form onSubmit={handleSubmit} className="w-full min-h-screen flex flex-col animate-in fade-in duration-700">
        
        {/* Mobile Header / Navigation Bar */}
        <div className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-[10px] font-black uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Dashboard
          </Link>
          {status && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isAtLimit ? "bg-amber-500" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]")} />
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                Quota: {status.count}/{status.max === Infinity ? '∞' : status.max}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center py-12 px-6 space-y-12">
          {/* Hero Section */}
          <div className="flex flex-col items-center text-center space-y-6 w-full">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-600/20 blur-3xl rounded-full" />
              <div className="relative w-20 h-20 rounded-[2rem] bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-600/30">
                <Sparkles className="w-10 h-10 text-foreground animate-pulse" />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter italic uppercase leading-tight">
                Establish Brand
              </h1>
              <p className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-[0.3em] leading-relaxed max-w-sm mx-auto">
                Deploying high-density business logic to your portfolio context
              </p>
            </div>
          </div>

          {/* Module Identification Section */}
          <div className="w-full space-y-6">
            <div className="flex items-center gap-3 w-full justify-center lg:justify-start lg:max-w-4xl lg:mx-auto">
              <div className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center">
                <Layers className="w-4 h-4 text-violet-500" />
              </div>
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] italic">Module Identification</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full lg:max-w-4xl lg:mx-auto">
              {TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setBusinessType(t.value)}
                  className={cn(
                    'relative group flex flex-col gap-5 p-7 rounded-[2.5rem] border transition-all duration-500 active:scale-[0.98] text-left w-full',
                    businessType === t.value
                      ? 'bg-violet-600/10 border-violet-500/50 shadow-[0_30px_60px_rgba(0,0,0,0.3)]'
                      : 'bg-card/40 border-border/50 hover:bg-card hover:border-border'
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0",
                    businessType === t.value ? "bg-violet-600 text-foreground shadow-xl shadow-violet-600/40" : "bg-muted text-muted-foreground/60 group-hover:scale-110"
                  )}>
                    {(() => { const TIcon = t.icon; return <TIcon className="w-7 h-7" /> })()}
                  </div>
                  <div>
                    <p className={cn('text-[14px] font-black uppercase tracking-tight', businessType === t.value ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground transition-colors')}>
                      {t.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 font-bold mt-2 leading-relaxed opacity-80">
                      {t.desc}
                    </p>
                  </div>
                  {businessType === t.value && (
                    <div className="absolute top-8 right-8 w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/50 animate-in zoom-in duration-300">
                      <Check className="w-4 h-4 text-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Registry Protocol Section */}
          <div className="w-full space-y-6">
            <div className="flex items-center gap-3 w-full justify-center lg:justify-start lg:max-w-4xl lg:mx-auto">
              <div className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center">
                <Globe className="w-4 h-4 text-violet-500" />
              </div>
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] italic">Registry Protocol</h2>
            </div>

            <div className="w-full lg:max-w-4xl lg:mx-auto glassmorphic-card rounded-[3rem] p-8 md:p-12 space-y-10 border border-border/50 bg-card/20 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Brand Identity</label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Noir Bistro"
                    className="w-full h-14 px-8 rounded-3xl bg-background border border-border text-sm text-foreground font-bold placeholder:text-muted-foreground/20 focus:outline-none focus:border-violet-500 transition-all shadow-inner uppercase tracking-wider"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Slug Identifier</label>
                  <div className="relative">
                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      name="slug"
                      required
                      placeholder="noir-bistro"
                      className="w-full h-14 pl-14 pr-8 rounded-3xl bg-background border border-border text-sm text-foreground font-bold placeholder:text-muted-foreground/20 focus:outline-none focus:border-violet-500 transition-all shadow-inner lowercase italic"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Primary Contact Email</label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      name="contactEmail"
                      type="email"
                      placeholder="hello@noir.com"
                      className="w-full h-14 pl-14 pr-8 rounded-3xl bg-background border border-border text-sm text-foreground font-bold placeholder:text-muted-foreground/20 focus:outline-none focus:border-violet-500 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Phone Registry</label>
                  <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      name="contactPhone"
                      placeholder="+855 12 345 678"
                      className="w-full h-14 pl-14 pr-8 rounded-3xl bg-background border border-border text-sm text-foreground font-bold placeholder:text-muted-foreground/20 focus:outline-none focus:border-violet-500 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">Deployment Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      name="address"
                      placeholder="Signature Square, Central Park, Level 4"
                      className="w-full h-14 pl-14 pr-8 rounded-3xl bg-background border border-border text-sm text-foreground font-bold placeholder:text-muted-foreground/20 focus:outline-none focus:border-violet-500 transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:max-w-4xl lg:mx-auto pt-6">
            <button
              type="submit"
              disabled={isPending || isAtLimit}
              className={cn(
                "w-full h-20 rounded-[2.5rem] font-black text-[14px] uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-[0.98] group flex items-center justify-center gap-4 border",
                isAtLimit 
                  ? "bg-background text-muted-foreground border-border cursor-not-allowed" 
                  : "bg-violet-600 border-violet-500 text-foreground hover:bg-violet-500 shadow-violet-600/40"
              )}
            >
              {isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Establish Brand Context
                  <ShieldCheck className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
            <p className="text-center text-[9px] text-muted-foreground font-bold uppercase tracking-[0.3em] mt-8 opacity-40 italic">
               Enterprise Security Protocol • Global Brand Deployment v2.4 
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
