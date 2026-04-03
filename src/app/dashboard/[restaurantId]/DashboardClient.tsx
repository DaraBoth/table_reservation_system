'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { CalendarDays, Clock, Plus, ChevronRight, BedDouble, Table2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { getTerms } from '@/lib/business-type'
import type { BusinessType } from '@/lib/business-type'
import type { Tables } from '@/lib/types/database'

interface DashboardClientProps {
  restaurantId: string
  initialData: {
    totalToday: number | null
    pendingCount: number | null
    totalTables: number | null
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
  completed: 'bg-slate-600/40 text-slate-300 border-slate-700',
  no_show: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

const statusLabels: Record<string, string> = {
  pending: 'Waiting',
  confirmed: 'Confirmed',
  arrived: 'Arrived',
  cancelled: 'Cancelled',
  completed: 'Done',
  no_show: 'No Show',
}

export function DashboardClient({ initialData, restaurantId }: DashboardClientProps) {
  const { totalToday, pendingCount, totalTables, upcomingReservations, businessType, todayStr } = initialData
  const terms = getTerms(businessType)
  const UnitIcon = terms.hasCheckout ? BedDouble : Table2
  const router = useRouter()
  const supabase = createClient()

  // 🛰️ Real-time subscription to keep numbers and lists in sync
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        router.refresh()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, router])

  // ✨ Magic UI: Mouse position for follow-glow
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20">
      {/* Greeting Section */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="pt-2"
      >
        <p className="text-slate-400 text-sm font-medium tracking-tight uppercase">{todayStr}</p>
        <h1 className="text-3xl font-black text-white mt-1 italic tracking-tighter">Today's Overview</h1>
      </motion.div>

      {/* Stats Row with Magic Card Glow */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: `Total ${terms.bookings}`, count: totalToday, icon: CalendarDays, color: 'violet', href: `/dashboard/${restaurantId}/reservations` },
          { label: 'Waiting', count: pendingCount, icon: Clock, color: 'amber', href: `/dashboard/${restaurantId}/reservations` },
          { label: terms.units, count: totalTables, icon: UnitIcon, color: 'emerald', href: `/dashboard/${restaurantId}/tables` }
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
              className="relative overflow-hidden bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2 hover:border-slate-700 hover:bg-slate-900 transition-all active:scale-[0.97] group h-full"
            >
              {/* 🖱️ Interactive Follow-Glow */}
              <motion.div
                className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                  background: useTransform(
                    [mouseX, mouseY],
                    ([x, y]) => `radial-gradient(150px circle at ${x}px ${y}px, rgba(124,58,237,0.1), transparent 80%)`
                  ),
                }}
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
              <div className="text-3xl font-black text-white tabular-nums relative z-10 mt-1">
                <NumberTicker value={stat.count ?? 0} />
              </div>
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-tight relative z-10">
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
          href={`/dashboard/${restaurantId}/reservations/new`}
          className="relative group flex items-center justify-between w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl p-4 shadow-lg shadow-violet-500/25 transition-all active:scale-[0.98] overflow-hidden"
        >
          {/* Animated Shine Layer */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%]"
            animate={{ translateX: ['100%', '300%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
          />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shadow-inner">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-base leading-tight italic tracking-tight">New {terms.booking}</p>
              <p className="text-white/70 text-[10px] uppercase font-bold tracking-tight mt-0.5">Add a new {terms.unitLower} {terms.bookingLower}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      {/* Upcoming Bookings with Staggered List Animation */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-white uppercase tracking-widest italic">Upcoming {terms.bookings}</h2>
          <Link href={`/dashboard/${restaurantId}/reservations`} className="text-[10px] text-violet-400 font-black uppercase tracking-widest hover:text-violet-300 transition-colors">
            See all →
          </Link>
        </div>

        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {upcomingReservations.length > 0 ? (
              upcomingReservations.map((res, i) => {
                const start = new Date(`${res.reservation_date}T${res.start_time}`)
                const dateDisplay = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                const timeDisplay = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                
                return (
                  <motion.div
                    key={res.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                  >
                    <Link
                      href={`/dashboard/${restaurantId}/reservations/${res.id}/edit`}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 hover:bg-slate-900/60 active:scale-[0.99] transition-all group"
                    >
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/10 flex items-center justify-center text-lg font-black text-violet-300 flex-shrink-0 group-hover:scale-105 transition-transform">
                        {res.guest_name.slice(0, 1).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate group-hover:text-violet-200 transition-colors">{res.guest_name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">
                          {res.physical_tables?.table_name ?? '—'} {!terms.hasCheckout && `· ${res.party_size} People`}
                        </p>
                      </div>

                      {/* Time + Status */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge className={cn('text-[9px] font-black px-2 py-0.5 border rounded-lg uppercase tracking-widest', statusColors[res.status] ?? '')}>
                          {statusLabels[res.status] ?? res.status}
                        </Badge>
                        <span className="text-[10px] text-slate-600 font-bold">
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
                className="text-center py-12 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed"
              >
                <Clock className="w-10 h-10 text-slate-700 mx-auto mb-3 opacity-50" />
                <p className="text-slate-500 text-xs font-black uppercase tracking-widest italic">No bookings yet Today</p>
                <Link
                  href={`/dashboard/${restaurantId}/reservations/new`}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600/10 text-violet-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-violet-600/20 transition-all"
                >
                  Create One <ChevronRight className="w-3 h-3" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
