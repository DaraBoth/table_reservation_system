'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { CalendarDays, Clock, Plus, ChevronRight, BedDouble, Table2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { getTerms } from '@/lib/business-type'
import type { BusinessType } from '@/lib/business-type'
import type { Tables } from '@/lib/types/database'
import { toast } from 'sonner'
import { countAvailableUnits } from '@/lib/dashboard-utils'
import { useTranslation } from 'react-i18next'

interface DashboardClientProps {
  restaurantId: string
  activeSlug?: string
  initialData: {
    totalToday: number | null
    pendingCount: number | null
    availableUnits: number | null
    upcomingReservations: Array<Tables<'reservations'> & { physical_tables: { table_name: string; capacity: number } | null }>
    businessType: BusinessType
    todayStr: string
  }
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  arrived: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  completed: 'bg-muted/60/40 text-foreground/70 border-border',
  no_show: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

export function DashboardClient({ initialData, restaurantId, activeSlug }: DashboardClientProps) {
  const { t } = useTranslation()
  const [stats, setStats] = useState(initialData)
  const [liveMessage, setLiveMessage] = useState<string | null>(null)
  const { totalToday, pendingCount, availableUnits, upcomingReservations, businessType, todayStr } = stats
  const terms = getTerms(businessType)
  const UnitIcon = terms.hasCheckout ? BedDouble : Table2
  const supabase = useMemo(() => createClient(), [])
  const dashSlug = activeSlug || restaurantId
  const liveMessageTimeoutRef = useRef<number | null>(null)

  const showLiveMessage = useCallback((message: string) => {
    setLiveMessage(message)
    if (liveMessageTimeoutRef.current) {
      window.clearTimeout(liveMessageTimeoutRef.current)
    }
    liveMessageTimeoutRef.current = window.setTimeout(() => {
      setLiveMessage(null)
      liveMessageTimeoutRef.current = null
    }, 4000)
  }, [])

  const fetchLatestOverview = useCallback(async () => {
    const today = new Date()
    const todayIso = format(today, 'yyyy-MM-dd')

    const [{ data: rawRows }, { data: allTableRows }] = await Promise.all([
      supabase
        .from('reservations')
        .select('id, status, guest_name, start_time, party_size, reservation_date, table_id, physical_tables(table_name, capacity)')
        .eq('restaurant_id', restaurantId)
        .eq('reservation_date', todayIso)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false }),

      supabase
        .from('physical_tables')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true),
    ])

    const reservations = (rawRows as DashboardClientProps['initialData']['upcomingReservations']) || []

    setStats((current) => ({
      ...current,
      totalToday: reservations.length,
      pendingCount: reservations.filter((reservation) => reservation.status === 'pending').length,
      availableUnits: countAvailableUnits(allTableRows?.length ?? 0, reservations),
      upcomingReservations: reservations.slice(0, 10),
      todayStr: format(today, 'EEEE, MMMM d'),
    }))
  }, [restaurantId, supabase])

  useEffect(() => {
    const channel = supabase
      .channel(`dashboard-realtime-${restaurantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `restaurant_id=eq.${restaurantId}` }, (payload: { eventType: string; new: Record<string, unknown> }) => {
        if (payload.eventType === 'INSERT') {
          const guestName = typeof payload.new.guest_name === 'string' ? payload.new.guest_name : 'New guest'
          const startTime = typeof payload.new.start_time === 'string' ? payload.new.start_time.slice(0, 5) : null
          const message = startTime
            ? t('dashboard.newBookingAt', { guestName, startTime })
            : t('dashboard.newBookingPlain', { guestName })
          showLiveMessage(message)
          toast.success(message)
        } else {
          showLiveMessage(t('dashboard.bookingsUpdated'))
        }
        void fetchLatestOverview()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'physical_tables', filter: `restaurant_id=eq.${restaurantId}` }, () => {
        showLiveMessage(t('dashboard.unitsUpdated', { units: terms.units }))
        void fetchLatestOverview()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLatestOverview, restaurantId, showLiveMessage, supabase, t, terms.units])

  useEffect(() => {
    return () => {
      if (liveMessageTimeoutRef.current) {
        window.clearTimeout(liveMessageTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // Correct server-side UTC date: server renders with UTC "today" which may be yesterday
    // in timezones like UTC+7/+8 after midnight. Refetch with the client's local date.
    void fetchLatestOverview()

    const refreshOnFocus = () => {
      void fetchLatestOverview()
    }

    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') {
        void fetchLatestOverview()
      }
    }

    const interval = window.setInterval(() => {
      void fetchLatestOverview()
    }, 15000)

    window.addEventListener('focus', refreshOnFocus)
    document.addEventListener('visibilitychange', refreshOnVisible)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshOnFocus)
      document.removeEventListener('visibilitychange', refreshOnVisible)
    }
  }, [fetchLatestOverview])

  // ✨ Magic UI: Mouse position for follow-glow
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const cardGlow = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `radial-gradient(150px circle at ${x}px ${y}px, rgba(124,58,237,0.1), transparent 80%)`
  )

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 md:pb-6">
      {/* Greeting Section */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="pt-2"
      >
        <p className="text-muted-foreground text-sm font-medium tracking-tight uppercase">{todayStr}</p>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-3xl font-black text-foreground italic tracking-tighter">{t('dashboard.todayOverview')}</h1>
          <AnimatePresence>
            {liveMessage ? (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <Badge className="border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300 shadow-sm shadow-emerald-950/20">
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {liveMessage}
                </Badge>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Stats Row with Magic Card Glow */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('dashboard.totalBookings', { bookings: terms.bookings }), count: totalToday, icon: CalendarDays, color: 'violet', href: `/dashboard/${dashSlug}/reservations` },
          { label: t('dashboard.waiting'), count: pendingCount, icon: Clock, color: 'amber', href: `/dashboard/${dashSlug}/reservations` },
          { label: t('dashboard.availableUnits', { units: terms.units }), count: availableUnits, icon: UnitIcon, color: 'emerald', href: `/dashboard/${dashSlug}/units` }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link 
              href={stat.href}
              onMouseMove={handleMouseMove}
              className="relative overflow-hidden bg-card/60 border border-border rounded-2xl p-4 flex flex-col gap-2 hover:border-border hover:bg-card transition-all active:scale-[0.97] group h-full"
            >
              {/* 🖱️ Interactive Follow-Glow */}
              <motion.div
                className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{ background: cardGlow }}
              />

              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform relative z-10",
                stat.color === 'violet' ? 'bg-violet-500/15' : stat.color === 'amber' ? 'bg-amber-500/15' : 'bg-emerald-500/15'
              )}>
                <stat.icon className={cn(
                  "w-5 h-5",
                  stat.color === 'violet' ? 'text-violet-400' : stat.color === 'amber' ? 'text-amber-400' : 'text-emerald-400'
                )} />
              </div>
              <div className="text-3xl font-black text-foreground tabular-nums relative z-10 mt-1">
                <NumberTicker value={stat.count ?? 0} />
              </div>
              <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-tight relative z-10">
                {stat.label}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Action: New Booking with Subtle Shine Pulse */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Link
          href={`/dashboard/${dashSlug}/reservations/new`}
          className="relative group flex items-center justify-between w-full bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-foreground rounded-2xl p-4 shadow-lg shadow-violet-500/25 transition-all active:scale-[0.98] overflow-hidden"
        >
          {/* Animated Shine Layer */}
          <motion.div 
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full"
            animate={{ translateX: ['100%', '300%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
          />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shadow-inner">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-base leading-tight italic tracking-tight">{t('dashboard.newBooking', { booking: terms.booking })}</p>
              <p className="text-foreground/70 text-[10px] uppercase font-bold tracking-tight mt-0.5">{t('dashboard.addNewBooking', { unitLower: terms.unitLower, bookingLower: terms.bookingLower })}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-foreground/60 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      {/* Upcoming Bookings with Staggered List Animation */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-foreground uppercase tracking-widest italic">{t('dashboard.upcomingBookings', { bookings: terms.bookings })}</h2>
          <Link href={`/dashboard/${dashSlug}/reservations`} className="text-[10px] text-violet-400 font-black uppercase tracking-widest hover:text-violet-300 transition-colors">
            {t('dashboard.seeAll')} →
          </Link>
        </div>

        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {upcomingReservations.length > 0 ? (
              upcomingReservations.map((res, i) => {
                const start = parseISO(`${res.reservation_date}T${res.start_time}`)
                const dateDisplay = format(start, 'MMM d')
                const timeDisplay = format(start, 'hh:mm a')
                
                return (
                  <motion.div
                    key={res.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                  >
                    <Link
                      href={`/dashboard/${dashSlug}/reservations/${res.id}/edit`}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-card/40 border border-border/60 hover:border-border/80 hover:bg-card/60 active:scale-[0.99] transition-all group"
                    >
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-xl bg-linear-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/10 flex items-center justify-center text-lg font-black text-violet-300 shrink-0 group-hover:scale-105 transition-transform">
                        {res.guest_name.slice(0, 1).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate group-hover:text-violet-200 transition-colors">{res.guest_name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mt-0.5">
                          {res.physical_tables?.table_name ?? '—'} {!terms.hasCheckout && `· ${res.party_size} ${terms.partyUnit}`}
                        </p>
                      </div>

                      {/* Time + Status */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge className={cn('text-[9px] font-black px-2 py-0.5 border rounded-lg uppercase tracking-widest', statusColors[res.status] ?? '')}>
                          {t(`status.${res.status}`, { defaultValue: res.status })}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground/60 font-bold">
                          {dateDisplay} · {timeDisplay}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                )
              })
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-card/30 rounded-3xl border border-border border-dashed"
              >
                <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground text-xs font-black uppercase tracking-widest italic">{t('dashboard.noBookingsToday', { bookingsLower: terms.bookingsLower })}</p>
                <Link
                  href={`/dashboard/${dashSlug}/reservations/new`}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600/10 text-violet-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-violet-600/20 transition-all"
                >
                  {t('dashboard.createOne')} <ChevronRight className="w-3 h-3" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
