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
import { useTranslation } from 'react-i18next'

type BusinessType = 'restaurant' | 'hotel' | 'guesthouse'

export default function NewRestaurantPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState<{ error?: string; success?: string } | null>(null)
  const [businessType, setBusinessType] = useState<BusinessType>('restaurant')

  const types: Array<{
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
      label: t('setup.typeRestaurantLabel', { defaultValue: 'Restaurant / Cafe' }),
      desc: t('setup.typeRestaurantDesc', { defaultValue: 'Table booking, meal reservations, dine-in management' }),
      color: 'from-orange-500/20 to-amber-500/20',
      border: 'border-orange-500/40',
      dot: 'bg-orange-400',
    },
    {
      value: 'hotel',
      icon: Building2,
      label: t('setup.typeHotelLabel', { defaultValue: 'Hotel / Resort' }),
      desc: t('setup.typeHotelDesc', { defaultValue: 'Room booking with check-in and check-out dates' }),
      color: 'from-blue-500/20 to-indigo-500/20',
      border: 'border-blue-500/40',
      dot: 'bg-blue-400',
    },
    {
      value: 'guesthouse',
      icon: Home,
      label: t('setup.typeGuesthouseLabel', { defaultValue: 'Guest House / B&B' }),
      desc: t('setup.typeGuesthouseDesc', { defaultValue: 'Small lodging with room reservations and guest tracking' }),
      color: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500/40',
      dot: 'bg-emerald-400',
    },
  ]

  const selectedType = types.find(typeItem => typeItem.value === businessType)!

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
          <h1 className="text-xl font-black text-foreground">{t('setup.newTypeTitle', { defaultValue: 'New {{type}}', type: selectedType.label.split('/')[0].trim() })}</h1>
          <p className="text-xs text-muted-foreground">{t('setup.newTenantAdmin', { defaultValue: 'Set up a new tenant and admin account' })}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Step 1: Choose business type ── */}
        <section className="bg-card border border-border rounded-3xl p-5 space-y-3">
          <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
            {t('setup.step1BusinessType', { defaultValue: 'Step 1 · What kind of business?' })}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {types.map(typeItem => (
              <button
                key={typeItem.value}
                type="button"
                onClick={() => setBusinessType(typeItem.value)}
                className={cn(
                  'relative p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.97]',
                  businessType === typeItem.value
                    ? cn('bg-gradient-to-br', typeItem.color, typeItem.border)
                    : 'bg-background border-border hover:border-border'
                )}
              >
                {businessType === typeItem.value && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-foreground" />
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 bg-white/10">
                  {(() => { const TIcon = typeItem.icon; return <TIcon className="w-5 h-5 text-foreground" /> })()}
                </div>
                <p className={cn('text-sm font-black', businessType === typeItem.value ? 'text-foreground' : 'text-foreground/70')}>
                  {typeItem.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{typeItem.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* ── Step 2: Business info ── */}
        <section className="bg-card border border-border rounded-3xl p-5 space-y-4">
          <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
            {t('setup.step2BusinessInfo', { defaultValue: 'Step 2 · Business Info' })}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">
                {t('setup.nameRequired', { defaultValue: 'Name *' })}
              </label>
              <input
                name="name"
                required
                placeholder={businessType === 'restaurant'
                  ? t('setup.namePlaceholderRestaurant', { defaultValue: 'The Golden Fork' })
                  : businessType === 'hotel'
                    ? t('setup.namePlaceholderHotel', { defaultValue: 'Grand Palace Hotel' })
                    : t('setup.namePlaceholderGuesthouse', { defaultValue: 'Sunrise Guest House' })}
                className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">
                {t('setup.urlSlugRequired', { defaultValue: 'URL Slug *' })}
              </label>
              <input
                name="slug"
                required
                placeholder={businessType === 'restaurant'
                  ? t('setup.slugPlaceholderRestaurant', { defaultValue: 'golden-fork' })
                  : businessType === 'hotel'
                    ? t('setup.slugPlaceholderHotel', { defaultValue: 'grand-palace' })
                    : t('setup.slugPlaceholderGuesthouse', { defaultValue: 'sunrise-guesthouse' })}
                className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">{t('account.email', { defaultValue: 'Email' })}</label>
              <input
                name="contactEmail"
                type="email"
                placeholder={t('setup.contactEmailPlaceholder', { defaultValue: 'info@business.com' })}
                className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">{t('account.phone', { defaultValue: 'Phone' })}</label>
              <input
                name="contactPhone"
                placeholder={t('setup.contactPhonePlaceholder', { defaultValue: '+855 12 345 678' })}
                className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">{t('account.address', { defaultValue: 'Address' })}</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                name="address"
                placeholder={t('setup.addressPlaceholder', { defaultValue: '123 Main Street, Phnom Penh' })}
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-background border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">{t('setup.subscriptionExpires', { defaultValue: 'Subscription Expires' })}</label>
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
              {t('setup.step3AdminAccount', { defaultValue: 'Step 3 · Admin Account' })}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">{t('auth.fullName', { defaultValue: 'Full Name' })} *</label>
              <input
                name="adminFullName"
                required
                placeholder={t('setup.ownerNamePlaceholder', { defaultValue: 'Owner Name' })}
                className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">{t('setup.emailOrUsernameRequired', { defaultValue: 'Email / Username *' })}</label>
              <input
                name="adminUsername"
                required
                placeholder={t('setup.adminUsernamePlaceholder', { defaultValue: 'admin@hotel.com' })}
                className="w-full h-12 px-4 rounded-2xl bg-background border border-border text-foreground text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">{t('auth.password', { defaultValue: 'Password' })} *</label>
            <input
              name="adminPassword"
              type="password"
              required
              placeholder={t('setup.passwordMask', { defaultValue: '••••••••' })}
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
              {t('setup.creating', { defaultValue: 'Creating...' })}
            </span>
          ) : (
            t('setup.createPropertyAndAdmin', { defaultValue: 'Create {{type}} & Admin', type: selectedType.label.split('/')[0].trim() })
          )}
        </button>
      </form>
    </div>
  )
}
