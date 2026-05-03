'use client'

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { Plus, ChevronRight, ClipboardList, CalendarDays } from 'lucide-react'
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
import { AnimatePresence, motion } from 'framer-motion'
import { ActionHub } from '@/components/dashboard/ActionHub'
import { BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Reservation extends Tables<'reservations'> {
  physical_tables: Pick<Tables<'physical_tables'>, 'table_name' | 'capacity'> | null
  profiles?: { full_name: string | null } | null
}

type TableWithZone = Tables<'physical_tables'> & { zones?: { id?: string; name: string; sort_order: number } | null }
type ZoneSummary = { id: string; name: string; sort_order: number }

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
  const { t } = useTranslation()
  const dashboardSlug = currentSlug || restaurantId
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [bookings, setBookings] = useState<Reservation[]>(initialBookings)
  const [viewStyle, setViewStyle] = useState<ViewStyle>('grid')
  const [liveMessage, setLiveMessage] = useState<string | null>(null)
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

  const handleViewChange = (style: ViewStyle) => {
    setViewStyle(style)
    localStorage.setItem('reservationsViewStyle', style)
  }

  useEffect(() => {
    const saved = localStorage.getItem('reservationsViewStyle') as ViewStyle | null
    if (saved !== 'grid' && saved !== 'list' && saved !== 'compact') return

    const frame = window.requestAnimationFrame(() => {
      setViewStyle(saved)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  const handleShareStatus = async () => {
    const dateParsed = parseISO(selectedDate)
    const dateStr = format(dateParsed, 'EEEE, MMM d')
    const timeStr = format(new Date(), 'hh:mm bb')
    
    // Determine which tables are occupied on this specific date
    const occupiedRows = bookings.filter(b => ['confirmed', 'arrived'].includes(b.status))
    const occupiedTableIds = occupiedRows.map(b => b.table_id)

    // Use our sorting utility to get consistent grouping
    // We need zones, but they might be on the tables themselves
    const uniqueZones: ZoneSummary[] = Array.from(
      new Map(
        tables
          .map(table => (table as TableWithZone).zones)
          .filter((zone): zone is ZoneSummary => Boolean(zone?.id && zone.name))
          .map(zone => [zone.id, zone])
      ).values()
    )
    const { sortedZones, grouped, unassigned } = groupAndSortTables(tables, uniqueZones)
    
    const availableLabel = t('dashboard.available', { defaultValue: 'Available' })
    const occupiedLabel = terms.hasCheckout
      ? t('dashboard.occupied', { defaultValue: 'Occupied' })
      : t('dashboard.booked', { defaultValue: 'Booked' })

    let text = `${t('dashboard.dateAsOf', { defaultValue: 'Date: {{date}} As of {{time}}', date: dateStr, time: timeStr })}\n\n`
    
    text += `${availableLabel.toUpperCase()} (${tables.filter(t => !occupiedTableIds.includes(t.id)).length}):\n`
    
    const renderTableStatus = (t: TableWithZone, isAvailable: boolean) => {
      if (isAvailable) {
        return `• ${t.table_name} (${t.capacity} ${terms.capacityUnit})\n`
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
      text += `[${t('dashboard.unassigned', { defaultValue: 'Unassigned' })}]\n`
      unassigned.filter(t => !occupiedTableIds.includes(t.id)).forEach(t => { text += renderTableStatus(t, true) })
    }
    
    text += `\n${occupiedLabel.toUpperCase()} (${occupiedTableIds.length}):\n`
    sortedZones.forEach(zone => {
      const zoneTables = grouped[zone.id] || []
      const bookedInZone = zoneTables.filter(t => occupiedTableIds.includes(t.id))
      if (bookedInZone.length > 0) {
        text += `[${zone.name}]\n`
        bookedInZone.forEach(t => { text += renderTableStatus(t, false) })
      }
    })

    if (unassigned.filter(t => occupiedTableIds.includes(t.id)).length > 0) {
      text += `[${t('dashboard.unassigned', { defaultValue: 'Unassigned' })}]\n`
      unassigned.filter(t => occupiedTableIds.includes(t.id)).forEach(t => { text += renderTableStatus(t, false) })
    }
    
    try {
      await navigator.clipboard.writeText(text.trim())
      toast.success(t('dashboard.statusReportCopied', { defaultValue: 'Status report copied!' }))
    } catch {
      toast.error(t('dashboard.failedToCopyStatus', { defaultValue: 'Failed to copy status' }))
    }
  }

  const supabase = useMemo(() => createClient(), [])
  const terms = getTerms(businessType)
  const getStatusLabel = useCallback((status: string) => {
    return t(`status.${status}`, { defaultValue: statusLabels[status] ?? status })
  }, [t])
  // Compute today from the browser's timezone — server may run in UTC and give the wrong date
  // at midnight-1AM in UTC+ timezones (e.g. UTC+7 at 12:51AM = April 8 local, April 7 UTC)
  const clientTodayIso = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])
  const isSelectedToday = selectedDate === clientTodayIso
  const mobileDateLabel = format(parseISO(selectedDate), 'MMMM d')

  const fetchLatestData = useCallback(async () => {
    const { data } = await supabase
      .from('reservations')
      .select('*, physical_tables(table_name, capacity, zones(name, sort_order)), profiles(full_name)')
      .eq('restaurant_id', restaurantId)
      .lte('reservation_date', selectedDate)
      .gte('checkout_date', selectedDate)
      .order('created_at', { ascending: false })


    if (data) setBookings(data as Reservation[])
  }, [supabase, restaurantId, selectedDate])



  useEffect(() => {
    const load = async () => {
      await fetchLatestData()
    }
    void load()
  }, [fetchLatestData])

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
        (payload: { eventType: string; new: Record<string, unknown> }) => {
          if (payload.eventType === 'INSERT') {
            const guestName = typeof payload.new.guest_name === 'string' ? payload.new.guest_name : t('dashboard.newGuest', { defaultValue: 'New guest' })
            const startTime = typeof payload.new.start_time === 'string' ? payload.new.start_time.slice(0, 5) : null
            const message = startTime ? `${guestName} at ${startTime}` : guestName
            showLiveMessage(t('dashboard.newBookingMessage', { defaultValue: 'New booking: {{message}}', message }))
            toast.success(t('dashboard.newBookingMessage', { defaultValue: 'New booking: {{message}}', message }))
          } else {
            showLiveMessage(t('dashboard.bookingsUpdated', { defaultValue: 'Bookings updated' }))
          }
          void fetchLatestData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLatestData, restaurantId, showLiveMessage, supabase])

  useEffect(() => {
    return () => {
      if (liveMessageTimeoutRef.current) {
        window.clearTimeout(liveMessageTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const refreshOnFocus = () => {
      void fetchLatestData()
    }

    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') {
        void fetchLatestData()
      }
    }

    const interval = window.setInterval(() => {
      void fetchLatestData()
    }, 15000)

    window.addEventListener('focus', refreshOnFocus)
    document.addEventListener('visibilitychange', refreshOnVisible)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshOnFocus)
      document.removeEventListener('visibilitychange', refreshOnVisible)
      window.removeEventListener('visibilitychange', refreshOnVisible)
    }
  }, [fetchLatestData])

  return (
    <div className="space-y-6 lg:space-y-7">
      <div className="flex flex-col justify-between gap-3 pt-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 sm:justify-start">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground italic tracking-tight uppercase leading-none">
              {terms.bookings}
            </h1>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 backdrop-blur-md shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </div>
              <span className="text-[10px] sm:text-xs font-black text-violet-300 uppercase tracking-widest">
                {format(new Date(), 'MMMM d')}
              </span>
            </div>

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
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareStatus}
              className="h-9 rounded-xl px-3 border-violet-500/30 bg-violet-600/10 text-violet-300 shadow-sm shadow-violet-950/20 hover:bg-violet-600 hover:text-white hover:border-violet-500 transition-all gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] active:scale-95"
            >
              {t('dashboard.shareStatus', { defaultValue: 'Share Status' })}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:justify-end">
          <Link
            id="new-booking-button"
            href={`/dashboard/${dashboardSlug}/reservations/new`}
            className={cn(
              buttonVariants({ size: 'sm' }),
              'w-full sm:w-auto bg-gradient-to-r from-violet-600 to-indigo-600 border-0 rounded-xl gap-1.5 font-black text-foreground shadow-lg shadow-violet-500/20 h-10 px-4 transition-all duration-300 active:scale-95'
            )}
          >
            <Plus className="w-4 h-4" /> {t('dashboard.newBooking', { defaultValue: 'New {{booking}}', booking: terms.booking })}
          </Link>
        </div>
      </div>

      {/* 🗓️ Day Navigator */}
      <DateNavigator
        selectedDate={selectedDate}
        onChange={setSelectedDate}
        todayDate={clientTodayIso}
        className="w-full"
      />

      {/* Bookings List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              {t('dashboard.bookedFor', {
                defaultValue: 'Booked for {{day}}',
                day: isSelectedToday ? t('dashboard.today', { defaultValue: 'Today' }) : format(parseISO(selectedDate), 'MMM dd')
              })}
            </h2>
          </div>
          <ViewSwitcher currentStyle={viewStyle} onStyleChange={handleViewChange} />
        </div>

        {bookings.length > 0 ? (
          <div className={cn(
            "grid gap-3",
            viewStyle === 'grid' ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : 
            viewStyle === 'compact' ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5" : 
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
                               {String(res.created_by) === String(currentUserId)
                                 ? t('dashboard.createdByYou', { defaultValue: 'Created by you' })
                                 : t('dashboard.createdByName', { defaultValue: 'Created by {{name}}', name: res.profiles?.full_name || t('roles.staff', { defaultValue: 'Staff' }) })}
                             </span>
                          </div>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{terms.unit}</p>
                          <p className="text-xs font-bold text-foreground/80 truncate">{res.unit_name || res.physical_tables?.table_name || '—'}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('dashboard.party', { defaultValue: 'Party' })}</p>
                          <p className="text-xs font-bold text-foreground/80">{res.party_size || 0} {terms.partyUnit}</p>
                        </div>
                        <div className="flex justify-end">
                           <Badge className={cn('text-[9px] font-black px-2 py-0.5 border rounded-lg uppercase tracking-widest', statusColors[res.status] ?? '')}>
                            {getStatusLabel(res.status)}
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
                          {String(res.created_by) === String(currentUserId)
                            ? t('dashboard.you', { defaultValue: 'You' })
                            : (res.profiles?.full_name?.split(' ')[0] || t('roles.staff', { defaultValue: 'Staff' }))}
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
                  <BookingCard res={res} dashboardSlug={dashboardSlug} todayIso={todayIso} currentUserId={currentUserId} />
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="py-20 text-center bg-card/30 rounded-[2.5rem] border border-border border-dashed backdrop-blur-sm">
            <ClipboardList className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-20" />
            <p className="text-muted-foreground font-black text-lg italic tracking-tight">{t('dashboard.noBookingsForDay', { defaultValue: 'No {{bookingsLower}} for this day', bookingsLower: terms.bookingsLower })}</p>
            <p className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-widest mt-1">{t('dashboard.checkAnotherDayOrCreateBooking', { defaultValue: 'Check another day or create a new booking' })}</p>
          </div>
        )}
      </section>
      <div className="hidden md:block">
        <ActionHub 
          actions={[
            { 
              label: t('dashboard.newBooking', { defaultValue: 'New {{booking}}', booking: terms.booking }), 
              icon: <Plus className="w-6 h-6" />, 
              color: 'bg-violet-600 text-white',
              onClick: () => window.location.href = `/dashboard/${dashboardSlug}/reservations/new`
            },
            { 
              label: t('dashboard.viewReports', { defaultValue: 'View Reports' }), 
              icon: <BarChart3 className="w-5 h-5" />, 
              color: 'bg-blue-600 text-white',
              onClick: () => window.location.href = `/dashboard/${dashboardSlug}/reports`
            },
          ]} 
        />
      </div>
    </div>
  )
}

function BookingCard({ res, dashboardSlug, todayIso, currentUserId }: { res: Reservation; dashboardSlug: string; todayIso: string; currentUserId?: string }) {
  const { t } = useTranslation()
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
          {t(`status.${res.status}`, { defaultValue: statusLabels[res.status] ?? res.status })}
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
               {String(res.created_by) === String(currentUserId)
                 ? t('dashboard.createdByYou', { defaultValue: 'Created by you' })
                 : (res.profiles?.full_name || t('roles.staff', { defaultValue: 'Staff' }))}
             </p>
          </div>

          {/* Premium Range Badge for Multi-day stays */}
          {res.reservation_date && res.checkout_date && res.reservation_date !== res.checkout_date && (
            <div className="flex items-center gap-1 text-[9px] font-black text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-lg w-fit uppercase tracking-tighter shadow-sm">
              <span className="opacity-70">{t('dashboard.stay', { defaultValue: 'Stay:' })}</span>
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
            {t('dashboard.manage', { defaultValue: 'Manage' })} <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      )}
    </div>
  )

  if (canEdit) return <Link id={`booking-link-grid-${res.id}`} href={`/dashboard/${dashboardSlug}/reservations/${res.id}/edit`}>{card}</Link>
  return card
}
