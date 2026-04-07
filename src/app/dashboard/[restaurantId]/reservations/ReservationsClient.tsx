'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { Plus, ChevronRight, ClipboardList, CalendarDays, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { getTerms } from '@/lib/business-type'
import { DateNavigator } from '@/components/dashboard/DateNavigator'
import { Tables } from '@/lib/types/database'
import { groupAndSortTables } from '@/lib/sorting'
import { ViewSwitcher, type ViewStyle } from '@/components/dashboard/ViewSwitcher'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { ActionHub } from '@/components/dashboard/ActionHub'
import { BarChart3 } from 'lucide-react'

interface Reservation extends Tables<'reservations'> {
  physical_tables: Pick<Tables<'physical_tables'>, 'table_name' | 'capacity'> | null
  profiles?: { full_name: string | null } | null
}

interface Props {
  initialBookings: Reservation[]
  restaurantId: string
  currentSlug?: string
  currentUserId?: string
  initialDate: string
  todayIso: string
  businessType: string
  tables: Tables<'physical_tables'>[]
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  arrived: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  completed: 'bg-muted/60/40 text-foreground/70 border-border',
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
  completed: 'from-slate-600/30 to-slate-700/30 border-border/20',
  no_show: 'from-orange-600/30 to-amber-600/30 border-orange-500/20',
}

export function ReservationsClient({ 
  initialBookings, 
  restaurantId, 
  currentSlug,
  currentUserId, 
  initialDate, 
  todayIso, 
  businessType, 
  tables 
}: Props) {
  const dashboardSlug = currentSlug || restaurantId
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [bookings, setBookings] = useState<Reservation[]>(initialBookings)
  const [viewStyle, setViewStyle] = useState<ViewStyle>('grid')
  const [now, setNow] = useState(new Date())

  // Keep clock running
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Load view preference
  useEffect(() => {
    const saved = localStorage.getItem('reservationsViewStyle') as ViewStyle
    if (saved && ['grid', 'list', 'compact'].includes(saved)) {
      setViewStyle(saved)
    }
  }, [])

  const handleViewChange = (style: ViewStyle) => {
    setViewStyle(style)
    localStorage.setItem('reservationsViewStyle', style)
  }

  const handleShareStatus = async () => {
    const dateParsed = parseISO(selectedDate)
    const dateStr = format(dateParsed, 'EEEE, MMM d')
    const timeStr = format(now, 'hh:mm bb')
    
    // Determine which tables are occupied on this specific date
    const occupiedRows = bookings.filter(b => ['confirmed', 'arrived'].includes(b.status))
    const occupiedTableIds = occupiedRows.map(b => b.table_id)

    // Use our sorting utility to get consistent grouping
    // We need zones, but they might be on the tables themselves
    const uniqueZones = Array.from(new Set(tables.map(t => (t as any).zones).filter(Boolean).map(z => JSON.stringify(z)))).map(s => JSON.parse(s))
    const { sortedZones, grouped, unassigned } = groupAndSortTables(tables, uniqueZones)
    
    let text = `Date: ${dateStr} As of ${timeStr}\n\n`
    
    text += `AVAILABLE (${tables.filter(t => !occupiedTableIds.includes(t.id)).length}):\n`
    
    const renderTableStatus = (t: any, isAvailable: boolean) => {
      if (isAvailable) {
        return `• ${t.table_name} (${t.capacity} Seats)\n`
      } else {
        const res = occupiedRows.find(b => b.table_id === t.id)
        if (!res) return ''
        const hhmm = res.start_time?.replace(/^(\d{2}):(\d{2}):\d{2}$/, (_: string, h: string, m: string) => {
          const hh = parseInt(h);
          return `${hh % 12 || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
        });
        return `• ${t.table_name} - ${res.guest_name} ${hhmm}\n`
      }
    }

    // List by Zone
    sortedZones.forEach(zone => {
      const zoneTables = grouped[zone.id] || []
      const availableInZone = zoneTables.filter(t => !occupiedTableIds.includes(t.id))
      if (availableInZone.length > 0) {
        text += `[${zone.name}]\n`
        availableInZone.forEach(t => { text += renderTableStatus(t, true) })
      }
    })
    
    if (unassigned.filter(t => !occupiedTableIds.includes(t.id)).length > 0) {
      text += `[Unassigned]\n`
      unassigned.filter(t => !occupiedTableIds.includes(t.id)).forEach(t => { text += renderTableStatus(t, true) })
    }
    
    text += `\nBOOKED (${occupiedTableIds.length}):\n`
    sortedZones.forEach(zone => {
      const zoneTables = grouped[zone.id] || []
      const bookedInZone = zoneTables.filter(t => occupiedTableIds.includes(t.id))
      if (bookedInZone.length > 0) {
        text += `[${zone.name}]\n`
        bookedInZone.forEach(t => { text += renderTableStatus(t, false) })
      }
    })

    if (unassigned.filter(t => occupiedTableIds.includes(t.id)).length > 0) {
      text += `[Unassigned]\n`
      unassigned.filter(t => occupiedTableIds.includes(t.id)).forEach(t => { text += renderTableStatus(t, false) })
    }
    
    try {
      await navigator.clipboard.writeText(text.trim())
      toast.success('Status report copied!')
    } catch (err) {
      toast.error('Failed to copy status')
    }
  }

  const supabase = createClient()
  const terms = getTerms(businessType)
  const isSelectedToday = selectedDate === todayIso

  const fetchLatestData = useCallback(async () => {
    const { data } = await supabase
      .from('reservations')
      .select('*, physical_tables(table_name, capacity, zones(name, sort_order)), profiles(full_name)')
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
      {/* Header with Live Pulse and Date/Time */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-foreground italic tracking-tight uppercase">
              {terms.bookings}
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareStatus}
              className="h-7 rounded-lg px-2 border-violet-500/20 bg-violet-600/5 text-violet-400 hover:bg-violet-600 hover:text-white transition-all gap-1 text-[9px] font-black uppercase tracking-widest"
            >
              Share Status
            </Button>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <Clock className="w-3 h-3" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">
              {format(now, 'EEEE, MMM d, yyyy • hh:mm a')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSelectedToday && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live Sync</span>
            </div>
          )}
          <Link
            id="new-booking-button"
            href={`/dashboard/${dashboardSlug}/reservations/new`}
            className={cn(
              buttonVariants({ size: 'sm' }),
              'bg-gradient-to-r from-violet-600 to-indigo-600 border-0 rounded-xl gap-1.5 font-black text-foreground shadow-lg shadow-violet-500/20 h-10 px-4 transition-all duration-300 active:scale-95'
            )}
          >
            <Plus className="w-4 h-4" /> New {terms.booking}
          </Link>
        </div>
      </div>

      {/* 🗓️ Day Navigator */}
      <DateNavigator
        selectedDate={selectedDate}
        onChange={setSelectedDate}
        todayDate={todayIso}
        className="w-full"
      />

      {/* Bookings List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Booked for {isSelectedToday ? 'Today' : format(parseISO(selectedDate), 'MMM dd')}
            </h2>
          </div>
          <ViewSwitcher currentStyle={viewStyle} onStyleChange={handleViewChange} />
        </div>

        {bookings.length > 0 ? (
          <div className={cn(
            "grid gap-3",
            viewStyle === 'grid' ? "grid-cols-2 sm:grid-cols-3" : 
            viewStyle === 'compact' ? "grid-cols-3 sm:grid-cols-5" : 
            "grid-cols-1"
          )}>
            {bookings.map((res, idx) => {
              if (viewStyle === 'list') {
                return (
                  <motion.div
                    id={`booking-list-${res.id}`}
                    key={res.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                  >
                    <Link 
                      id={`booking-link-list-${res.id}`}
                      href={`/dashboard/${dashboardSlug}/reservations/${res.id}/edit`}
                      className="group flex items-center gap-4 p-3 rounded-2xl bg-card/40 border border-border hover:border-violet-500/30 transition-all overflow-hidden"
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-sm font-black",
                        statusAvatarBg[res.status] ?? "from-violet-600/30 to-indigo-600/30"
                      )}>
                        {res.guest_name?.slice(0, 1).toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                        <div>
                          <p className="text-sm font-black truncate">{res.guest_name}</p>
                          <div className="flex items-center gap-2">
                             <p className="text-[10px] text-muted-foreground uppercase font-bold">
                               {res.start_time?.replace(/^(\d{2}):(\d{2}):\d{2}$/, (_, h, m) => {
                                 const hh = parseInt(h);
                                 return `${hh % 12 || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
                               })}
                             </p>
                             <span className="text-[9px] text-muted-foreground/40 font-bold px-1.5 py-0.5 rounded-lg border border-border bg-card/50 truncate max-w-[100px]">
                               {String(res.created_by) === String(currentUserId) ? 'Created by you' : `Created by ${res.profiles?.full_name || 'Staff'}`}
                             </span>
                          </div>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{terms.unit}</p>
                          <p className="text-xs font-bold text-foreground/80 truncate">{res.unit_name || res.physical_tables?.table_name || '—'}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Party</p>
                          <p className="text-xs font-bold text-foreground/80">{res.party_size || 0} People</p>
                        </div>
                        <div className="flex justify-end">
                           <Badge className={cn('text-[9px] font-black px-2 py-0.5 border rounded-lg uppercase tracking-widest', statusColors[res.status] ?? '')}>
                            {statusLabels[res.status] ?? res.status}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              }

              if (viewStyle === 'compact') {
                return (
                  <motion.div
                    id={`booking-compact-${res.id}`}
                    key={res.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.02 }}
                  >
                    <Link 
                      id={`booking-link-compact-${res.id}`}
                      href={`/dashboard/${dashboardSlug}/reservations/${res.id}/edit`}
                      className="relative block h-24 p-3 rounded-2xl bg-card/40 border border-border hover:border-violet-500/30 transition-all overflow-hidden group"
                    >
                      <div className={cn(
                        "absolute top-0 right-0 w-1 h-full",
                        statusColors[res.status]?.split(' ')[0] || "bg-violet-500"
                      )} />
                      <p className="text-[11px] font-black truncate pr-2">{res.guest_name}</p>
                      <div className="flex items-center justify-between gap-1 overflow-hidden">
                        <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter whitespace-nowrap">
                          {res.start_time?.replace(/^(\d{2}):(\d{2}):\d{2}$/, (_, h, m) => {
                            const hh = parseInt(h);
                            return `${hh % 12 || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
                          })}
                        </p>
                        <p className="text-[8px] text-muted-foreground/60 font-medium truncate italic mt-1 pr-1 border-l pl-1 border-border/20">
                          {String(res.created_by) === String(currentUserId) ? 'You' : (res.profiles?.full_name?.split(' ')[0] || 'Staff')}
                        </p>
                      </div>
                      <div className="mt-auto pt-2 border-t border-border/20 flex items-center justify-between">
                         <span className="text-[9px] font-black text-muted-foreground/60">{res.party_size}p</span>
                         <span className="text-[9px] font-black text-violet-400 bg-violet-500/5 px-1 rounded truncate">{(res.unit_name || res.physical_tables?.table_name || '').slice(0, 3)}</span>
                      </div>
                    </Link>
                  </motion.div>
                )
              }

              return (
                <motion.div
                  id={`booking-grid-${res.id}`}
                  key={res.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  <BookingCard res={res} restaurantId={restaurantId} dashboardSlug={dashboardSlug} todayIso={todayIso} currentUserId={currentUserId} />
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="py-20 text-center bg-card/30 rounded-[2.5rem] border border-border border-dashed backdrop-blur-sm">
            <ClipboardList className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-20" />
            <p className="text-muted-foreground font-black text-lg italic tracking-tight">No {terms.bookingsLower} for this day</p>
            <p className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-widest mt-1">Check another day or create a new booking</p>
          </div>
        )}
      </section>
      <ActionHub 
        actions={[
          { 
            label: 'New Reservation', 
            icon: <Plus className="w-6 h-6" />, 
            color: 'bg-violet-600 text-white',
            onClick: () => window.location.href = `/dashboard/${dashboardSlug}/reservations/new`
          },
          { 
            label: 'View Reports', 
            icon: <BarChart3 className="w-5 h-5" />, 
            color: 'bg-blue-600 text-white',
            onClick: () => window.location.href = `/dashboard/${dashboardSlug}/reports`
          },
        ]} 
      />
    </div>
  )
}

function BookingCard({ res, restaurantId, dashboardSlug, todayIso, currentUserId }: { res: Reservation; restaurantId: string; dashboardSlug: string; todayIso: string; currentUserId?: string }) {
  const start = res.start_time
    ? new Date(`${res.reservation_date}T${res.start_time}`)
    : null

  const isToday = res.reservation_date === todayIso
  const canEdit = isToday && !['cancelled', 'completed'].includes(res.status)

  const timeStr = start ? format(start, 'hh:mm a') : null

  const card = (
    <div 
      id={`booking-card-inner-${res.id}`}
      className={cn(
        'relative flex flex-col gap-3 p-4 rounded-3xl border-2 transition-all duration-300',
        canEdit
          ? 'bg-card border-border hover:border-violet-500/50 active:scale-[0.97]'
          : 'bg-card/50 border-border/50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn(
          'w-12 h-12 rounded-2xl bg-gradient-to-br border flex items-center justify-center text-xl font-black text-foreground flex-shrink-0 shadow-lg',
          statusAvatarBg[res.status] ?? 'from-violet-600/30 to-indigo-600/30 border-violet-500/20'
        )}>
          {res.guest_name?.slice(0, 1).toUpperCase() || '?'}
        </div>
        <Badge className={cn('text-[10px] font-black px-2 py-0.5 border rounded-xl whitespace-nowrap leading-none transition-all', statusColors[res.status] ?? '')}>
          {statusLabels[res.status] ?? res.status}
        </Badge>
      </div>
      <div>
        <p className="text-sm font-black text-foreground leading-tight truncate">{res.guest_name}</p>
        {res.guest_phone && <p className="text-xs text-muted-foreground mt-0.5 truncate">{res.guest_phone}</p>}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="bg-muted px-2 py-0.5 rounded-lg font-semibold text-foreground/70 truncate max-w-[60px]">
          {res.unit_name || res.physical_tables?.table_name || '—'}
        </span>
        {res.party_size && res.party_size > 0 && (
          <><span className="text-muted-foreground/60">·</span><span>{res.party_size}p</span></>
        )}
      </div>
      {timeStr && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 overflow-hidden">
             <p className="text-[11px] text-muted-foreground font-black flex items-center gap-1 uppercase tracking-tight">
               <CalendarDays className="w-3 h-3 text-muted-foreground/60" /> {timeStr}
             </p>
             <p className="text-[9px] text-muted-foreground/50 font-bold truncate italic">
               {String(res.created_by) === String(currentUserId) ? 'Created by you' : (res.profiles?.full_name || 'Staff')}
             </p>
          </div>

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
          <span className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-tighter flex items-center gap-0.5">
            Manage <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      )}
    </div>
  )

  if (canEdit) return <Link id={`booking-link-grid-${res.id}`} href={`/dashboard/${dashboardSlug}/reservations/${res.id}/edit`}>{card}</Link>
  return card
}
