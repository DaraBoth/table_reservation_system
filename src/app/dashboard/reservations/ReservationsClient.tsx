'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { Plus, ChevronRight, ClipboardList, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { getTerms } from '@/lib/business-type'
import { DateNavigator } from '@/components/dashboard/DateNavigator'
import { Tables } from '@/lib/types/database'

interface Reservation extends Tables<'reservations'> {
  physical_tables: Pick<Tables<'physical_tables'>, 'table_name' | 'capacity'> | null
  unit_name?: string | null
  checkout_date?: string | null
}

interface Props {
  initialBookings: Reservation[]
  restaurantId: string
  initialDate: string
  businessType: string
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

const statusAvatarBg: Record<string, string> = {
  pending: 'from-amber-600/30 to-orange-600/30 border-amber-500/20',
  confirmed: 'from-emerald-600/30 to-teal-600/30 border-emerald-500/20',
  arrived: 'from-blue-600/30 to-indigo-600/30 border-blue-500/20',
  cancelled: 'from-red-600/20 to-rose-600/20 border-red-500/20',
  completed: 'from-slate-600/30 to-slate-700/30 border-slate-600/20',
  no_show: 'from-orange-600/30 to-amber-600/30 border-orange-500/20',
}

export function ReservationsClient({ initialBookings, restaurantId, initialDate, businessType }: Props) {
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [bookings, setBookings] = useState<Reservation[]>(initialBookings)
  const supabase = createClient()
  const terms = getTerms(businessType)
  const todayIso = format(new Date(), 'yyyy-MM-dd')
  const isSelectedToday = selectedDate === todayIso

  const fetchLatestData = useCallback(async () => {
    const { data } = await supabase
      .from('reservations')
      .select('*, physical_tables(table_name, capacity)')
      .eq('restaurant_id', restaurantId)
      .lte('reservation_date', selectedDate)
      .gte('checkout_date', selectedDate)
      .order('start_time', { ascending: true })

    if (data) setBookings(data as any)
  }, [supabase, restaurantId, selectedDate])

  useEffect(() => {
    fetchLatestData()
  }, [selectedDate, fetchLatestData])

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
            Manage your schedule
          </p>
        </div>
        <Link
          href="/dashboard/reservations/new"
          className={cn(
            buttonVariants({ size: 'sm' }),
            'bg-gradient-to-r from-violet-600 to-indigo-600 border-0 rounded-xl gap-1.5 font-black text-white shadow-lg shadow-violet-500/20 h-10 px-4 transition-all duration-300 active:scale-95'
          )}
        >
          <Plus className="w-4 h-4" /> New {terms.booking}
        </Link>
      </div>

      {/* 🗓️ Day Navigator */}
      <DateNavigator
        selectedDate={selectedDate}
        onChange={setSelectedDate}
        className="w-full"
      />

      {/* Bookings List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Booked for {isSelectedToday ? 'Today' : format(parseISO(selectedDate), 'MMM dd')}
            </h2>
          </div>
          {isSelectedToday && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">Live Sync</span>
            </div>
          )}
        </div>

        {bookings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {bookings.map(res => <BookingCard key={res.id} res={res} />)}
          </div>
        ) : (
          <div className="py-20 text-center bg-slate-900/30 rounded-[2.5rem] border border-slate-800 border-dashed backdrop-blur-sm">
            <ClipboardList className="w-8 h-8 text-slate-800 mx-auto mb-3 opacity-20" />
            <p className="text-slate-500 font-black text-lg italic tracking-tight">No {terms.bookingsLower} for this day</p>
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-1">Check another day or create a new booking</p>
          </div>
        )}
      </section>
    </div>
  )
}

function BookingCard({ res }: { res: Reservation }) {
  // Use parseISO to handle the reservation_date string correctly
  const start = res.start_time
    ? new Date(`${res.reservation_date}T${res.start_time}`)
    : null

  const isToday = res.reservation_date === format(new Date(), 'yyyy-MM-dd')
  const canEdit = isToday && !['cancelled', 'completed'].includes(res.status)

  const timeStr = start ? format(start, 'hh:mm a') : null

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
          {res.guest_name?.slice(0, 1).toUpperCase() || '?'}
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
          {res.unit_name || res.physical_tables?.table_name || '—'}
        </span>
        {res.party_size && res.party_size > 0 && (
          <><span className="text-slate-600">·</span><span>{res.party_size}p</span></>
        )}
      </div>
      {timeStr && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] text-slate-500 font-black flex items-center gap-1 uppercase tracking-tight">
            <Calendar className="w-3 h-3 text-slate-600" /> {timeStr}
          </p>

          {/* Premium Range Badge for Multi-day stays */}
          {res.reservation_date && res.checkout_date && res.reservation_date !== res.checkout_date && (
            <div className="flex items-center gap-1 text-[9px] font-black text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-lg w-fit uppercase tracking-tighter shadow-sm">
              <span className="opacity-70">Stay:</span>
              {format(parseISO(res.reservation_date), 'MMM d')}
              <span className="opacity-40 px-0.5">→</span>
              {format(parseISO(res.checkout_date), 'MMM d')}
            </div>
          )}
        </div>
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
