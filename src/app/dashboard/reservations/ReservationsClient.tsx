'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { format, subDays } from 'date-fns'
import { Plus, ChevronRight, ClipboardList, Calendar, History } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { PastBookingsFilter } from './PastBookingsFilter'
import type { Tables } from '@/lib/types/database'
import { getTerms } from '@/lib/business-type'

interface Reservation extends Tables<'reservations'> {
  physical_tables: Pick<Tables<'physical_tables'>, 'table_name' | 'capacity'> | null
}

interface Props {
  initialActive: Reservation[]
  initialArchive: Reservation[]
  restaurantId: string
  archiveDate: string
  businessType: string
}

const statusColors: Record<string, string> = {
  pending:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  arrived:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  completed: 'bg-slate-600/40 text-slate-300 border-slate-700',
  no_show:   'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

const statusLabels: Record<string, string> = {
  pending:   'Waiting',
  confirmed: 'Confirmed',
  arrived:   'Arrived',
  cancelled: 'Cancelled',
  completed: 'Done',
  no_show:   'No Show',
}

const statusAvatarBg: Record<string, string> = {
  pending:   'from-amber-600/30 to-orange-600/30 border-amber-500/20',
  confirmed: 'from-emerald-600/30 to-teal-600/30 border-emerald-500/20',
  arrived:   'from-blue-600/30 to-indigo-600/30 border-blue-500/20',
  cancelled: 'from-red-600/20 to-rose-600/20 border-red-500/20',
  completed: 'from-slate-600/30 to-slate-700/30 border-slate-600/20',
  no_show:   'from-orange-600/30 to-amber-600/30 border-orange-500/20',
}

export function ReservationsClient({ initialActive, initialArchive, restaurantId, archiveDate, businessType }: Props) {
  const [active, setActive] = useState<Reservation[]>(initialActive)
  const [archive, setArchive] = useState<Reservation[]>(initialArchive)
  const supabase = createClient()
  const todayIso = format(new Date(), 'yyyy-MM-dd')
  const terms = getTerms(businessType)

  const fetchLatestData = useCallback(async () => {
    // Re-fetch today's active
    const { data: latestActive } = await supabase
      .from('reservations')
      .select('*, physical_tables(table_name, capacity)')
      .eq('restaurant_id', restaurantId)
      .eq('reservation_date', todayIso)
      .in('status', ['pending', 'confirmed', 'arrived'])
      .order('start_time', { ascending: true })

    if (latestActive) setActive(latestActive as any)

    // Re-fetch archive for selected date
    const { data: latestArchive } = await supabase
      .from('reservations')
      .select('*, physical_tables(table_name, capacity)')
      .eq('restaurant_id', restaurantId)
      .eq('reservation_date', archiveDate)
      .order('start_time', { ascending: true })

    if (latestArchive) setArchive(latestArchive as any)
  }, [supabase, restaurantId, todayIso, archiveDate])

  useEffect(() => {
    // Initial sync with props if archiveDate changed via URL
    setActive(initialActive)
    setArchive(initialArchive)
  }, [initialActive, initialArchive, archiveDate])

  useEffect(() => {
    // Setup Realtime subscription
    const channel = supabase
      .channel(`reservations-realtime-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => {
          // Whenever ANY change occurs, re-fetch to ensure UI is fresh
          fetchLatestData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, restaurantId, fetchLatestData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-black text-white italic tracking-tight uppercase">
            {terms.bookings}
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none">
            Live Operations & Archive
          </p>
        </div>
        <Link
          href="/dashboard/reservations/new"
          className={cn(
            buttonVariants({ size: 'sm' }),
            'bg-gradient-to-r from-violet-600 to-indigo-600 border-0 rounded-xl gap-1.5 font-bold shadow-lg shadow-violet-500/20 h-10 px-4 transition-all duration-300 active:scale-95'
          )}
        >
          <Plus className="w-4 h-4" /> New {terms.booking}
        </Link>
      </div>

      {/* Active Today bookings */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Live Arrivals (Today)</h2>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">Live Sync</span>
          </div>
        </div>
        {active.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {active.map(res => <BookingCard key={res.id} res={res} />)}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 transition-all duration-500">
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest italic">No more arrivals expected today</p>
          </div>
        )}
      </section>

      {/* Archive section */}
      <section className="space-y-4 pt-4 border-t border-slate-800/50">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <History className="w-3 h-3 text-violet-400" />
            <h2 className="text-xs font-black text-white uppercase tracking-widest leading-none">Daily Archive</h2>
          </div>
          <span className="text-[9px] text-slate-600 font-black uppercase tracking-tighter italic">Browse History</span>
        </div>

        <PastBookingsFilter selectedDate={archiveDate} />

        {archive.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 opacity-90 transition-all duration-500">
            {archive.map(res => <BookingCard key={res.id} res={res} />)}
          </div>
        ) : (
          <div className="py-12 text-center bg-slate-900/30 rounded-3xl border border-slate-800/50 border-dashed">
            <ClipboardList className="w-8 h-8 text-slate-800 mx-auto mb-3" />
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest italic">Empty records for this day</p>
          </div>
        )}
      </section>
    </div>
  )
}

function BookingCard({ res }: { res: Reservation }) {
  const start = new Date(`${res.reservation_date}T${res.start_time}`)
  const isToday = res.reservation_date === format(new Date(), 'yyyy-MM-dd')
  const canEdit = isToday && !['cancelled', 'completed'].includes(res.status)

  const timeStr = start
    ? format(start, 'hh:mm a')
    : null

  const card = (
    <div className={cn(
      'relative flex flex-col gap-3 p-4 rounded-3xl border-2 transition-all duration-300',
      canEdit
        ? 'bg-slate-900 border-slate-800 hover:border-violet-500/50 active:scale-[0.97]'
        : 'bg-slate-900/50 border-slate-800/50'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className={cn(
          'w-12 h-12 rounded-2xl bg-gradient-to-br border flex items-center justify-center text-xl font-black text-white flex-shrink-0 shadow-lg',
          statusAvatarBg[res.status] ?? 'from-violet-600/30 to-indigo-600/30 border-violet-500/20'
        )}>
          {res.guest_name.slice(0, 1).toUpperCase()}
        </div>
        <Badge className={cn('text-[10px] font-black px-2 py-0.5 border rounded-xl whitespace-nowrap leading-none transition-all', statusColors[res.status] ?? '')}>
          {statusLabels[res.status] ?? res.status}
        </Badge>
      </div>
      <div>
        <p className="text-sm font-black text-white leading-tight truncate">{res.guest_name}</p>
        {res.guest_phone && <p className="text-xs text-slate-500 mt-0.5 truncate">{res.guest_phone}</p>}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="bg-slate-800 px-2 py-0.5 rounded-lg font-semibold text-slate-300 truncate max-w-[60px]">
          {res.physical_tables?.table_name ?? '—'}
        </span>
        {res.party_size && res.party_size > 0 && (
          <><span className="text-slate-600">·</span><span>{res.party_size}p</span></>
        )}
      </div>
      {timeStr && (
        <p className="text-[11px] text-slate-500 font-black flex items-center gap-1 uppercase tracking-tight">
          <Calendar className="w-3 h-3 text-slate-600" /> {timeStr}
        </p>
      )}
      {canEdit && (
        <div className="flex items-center justify-end">
          <span className="text-[10px] text-slate-600 font-black uppercase tracking-tighter flex items-center gap-0.5">
            Manage <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      )}
    </div>
  )

  if (canEdit) return <Link href={`/dashboard/reservations/${res.id}/edit`}>{card}</Link>
  return card
}
