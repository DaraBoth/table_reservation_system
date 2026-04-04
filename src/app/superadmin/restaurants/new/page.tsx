'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createRestaurant } from '@/app/actions/restaurants'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Store, ShieldCheck, Sparkles,
  MapPin, Calendar as CalendarIcon, Check, AlertCircle,
  UtensilsCrossed, Building2, Home,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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

export default function NewRestaurantPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState<{ error?: string; success?: string } | null>(null)
  const [businessType, setBusinessType] = useState<BusinessType>('restaurant')

  const selectedType = TYPES.find(t => t.value === businessType)!

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState(null)
    const form = new FormData(event.currentTarget)
    form.set('businessType', businessType)

    startTransition(async () => {
      const result = await createRestaurant(null, form)
      if (result?.error) {
        setState({ error: result.error })
      } else if (result?.success) {
        setState({ success: result.success })
        setTimeout(() => router.push('/superadmin/restaurants'), 1800)
      }
    })
  }

  return (
    <div className="space-y-6 max-w-2xl pb-16">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/superadmin/restaurants"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-foreground">New {selectedType.label.split('/')[0].trim()}</h1>
          <p className="text-xs text-muted-foreground">Set up a new tenant and admin account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Step 1: Choose business type ── */}
        <section className="bg-card border border-border rounded-3xl p-5 space-y-3">
          <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
            Step 1 · What kind of business?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setBusinessType(t.value)}
                className={cn(
                  'relative p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.97]',
                  businessType === t.value
                    ? cn('bg-gradient-to-br', t.color, t.border)
                    : 'bg-background border-border hover:border-border'
                )}
              >
                {businessType === t.value && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-foreground" />
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 bg-white/10">
                  {(() => { const TIcon = t.icon; return <TIcon className="w-5 h-5 text-foreground" /> })()}
                </div>
                <p className={cn('text-sm font-black', businessType === t.value ? 'text-foreground' : 'text-foreground/70')}>
                  {t.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{t.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* ── Step 2: Business info ── */}
        <section className="bg-card border border-border rounded-3xl p-5 space-y-4">
          <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
            Step 2 · Business Info
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">
                Name *
              </label>
              <input
                name="name"
                required
                placeholder={businessType === 'restaurant' ? 'The Golden Fork' : businessType === 'hotel' ? 'Grand Palace Hotel' : 'Sunrise Guest House'}
                className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">
                URL Slug *
              </label>
              <input
                name="slug"
                required
                placeholder={businessType === 'restaurant' ? 'golden-fork' : businessType === 'hotel' ? 'grand-palace' : 'sunrise-guesthouse'}
                className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">Email</label>
              <input
                name="contactEmail"
                type="email"
                placeholder="info@business.com"
                className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">Phone</label>
              <input
                name="contactPhone"
                placeholder="+855 12 345 678"
                className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">Address</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                name="address"
                placeholder="123 Main Street, Phnom Penh"
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-background border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">Subscription Expires</label>
            <div className="relative">
              <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                name="subscriptionExpiresAt"
                type="datetime-local"
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-background border border-border text-foreground text-sm font-semibold focus:outline-none focus:border-violet-500 transition-colors [color-scheme:dark]"
              />
            </div>
          </div>
        </section>

        {/* ── Step 3: Admin account ── */}
        <section className="bg-card border border-border rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-600/15 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
              Step 3 · Admin Account
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">Full Name *</label>
              <input
                name="adminFullName"
                required
                placeholder="Owner Name"
                className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">Email / Username *</label>
              <input
                name="adminUsername"
                required
                placeholder="admin@hotel.com"
                className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">Password *</label>
            <input
              name="adminPassword"
              type="password"
              required
              placeholder="••••••••"
              className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        </section>

        {/* Feedback */}
        {state?.error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm font-bold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {state.error}
          </div>
        )}
        {state?.success && (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm font-bold">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            {state.success}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-foreground rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-violet-500/25 transition-all active:scale-[0.98]"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Creating…
            </span>
          ) : (
            `Create ${selectedType.label.split('/')[0].trim()} & Admin`
          )}
        </button>
      </form>
    </div>
  )
}
