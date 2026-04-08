'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { getTerms } from '@/lib/business-type'
import type { Tables } from '@/lib/types/database'
import { groupAndSortTables } from '@/lib/sorting'
import { ZoneManagementDialog } from './ZoneManagementDialog'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { DateNavigator } from '@/components/dashboard/DateNavigator'
import { ViewSwitcher, type ViewStyle } from '@/components/dashboard/ViewSwitcher'
import { User, Settings2, BarChart3, CircleCheck, CircleX, Activity, Plus, LayoutList } from 'lucide-react'
import { EditUnitSheet } from './EditUnitSheet'
import { UnitCard } from './UnitCard'
import { CreateUnitDialog } from './CreateUnitDialog'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ActionHub } from '@/components/dashboard/ActionHub'
import { toast } from 'sonner'

interface BusyInfo {
  guestName: string
  guestPhone?: string
  createdByName?: string
  status: string
  partySize: number
  reservationDate?: string
  checkoutDate?: string
  startTime?: string
  endTime?: string
}

interface BusyRow {
  table_id: string | null
  guest_name: string
  guest_phone?: string | null
  status: string
  party_size: number | null
  reservation_date?: string | null
  checkout_date?: string | null
  start_time?: string | null
  end_time?: string | null
  profiles?: { full_name?: string | null } | null
}

type TableWithZone = Tables<'physical_tables'> & { zones?: { id?: string; name: string; sort_order: number } | null }

interface UnitsClientProps {
  initialTables: Tables<'physical_tables'>[]
  initialBusyRows: BusyRow[]
  restaurantId: string
  businessType: string
  canManage: boolean
  initialDate: string
  initialNowIso: string
  mode?: 'monitoring' | 'management'
  currentSlug?: string
}

export function UnitsClient({
  initialTables,
  initialBusyRows,
  restaurantId,
  businessType,
  canManage,
  initialDate,
  initialNowIso,
  mode = 'monitoring',
  currentSlug
}: UnitsClientProps) {
  const [tables, setTables] = useState<TableWithZone[]>(initialTables as TableWithZone[])
  const [zones, setZones] = useState<{ id: string; name: string; sort_order: number }[]>([])
  const [busyRows, setBusyRows] = useState(initialBusyRows)
  const [now, setNow] = useState(() => new Date(initialNowIso))
  const [viewStyle, setViewStyle] = useState<ViewStyle>('grid')
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [liveMessage, setLiveMessage] = useState<string | null>(null)
  const liveMessageTimeoutRef = useRef<number | null>(null)
  
  const supabase = useMemo(() => createClient(), [])
  const terms = getTerms(businessType)
  const dashboardSlug = currentSlug || restaurantId
  const availableLabel = 'Available'
  const occupiedLabel = terms.hasCheckout ? 'Occupied' : 'Booked'
  const selectedDateLabel = format(parseISO(selectedDate), 'MMMM d')
  const unitGridClass = viewStyle === 'grid'
    ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
    : viewStyle === 'compact'
      ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6'
      : 'grid-cols-1'

  const handleUpdateViewStyle = (s: ViewStyle) => {
    setViewStyle(s)
    localStorage.setItem('units-view-style', s)
  }

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

  // Keep clock running
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('units-view-style') as ViewStyle | null
    if (saved !== 'grid' && saved !== 'list' && saved !== 'compact') return

    const frame = window.requestAnimationFrame(() => {
      setViewStyle(saved)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    setTables(initialTables as TableWithZone[])
  }, [initialTables])

  useEffect(() => {
    setBusyRows(initialBusyRows)
  }, [initialBusyRows])

  const clientTodayIso = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])

  const fetchLatestBusyRows = useCallback(async () => {
    const fmt = selectedDate
    const { data } = await supabase
      .from('reservations')
      .select('table_id, guest_name, guest_phone, status, party_size, reservation_date, checkout_date, start_time, end_time, profiles(full_name)')
      .eq('restaurant_id', restaurantId)
      .in('status', ['pending', 'confirmed', 'arrived'])
      .lte('reservation_date', fmt)
      .gte('checkout_date', fmt)

    if (data) setBusyRows(data)
  }, [supabase, restaurantId, selectedDate])

  const fetchLatestTables = useCallback(async () => {
    const { data } = await supabase
      .from('physical_tables')
      .select('*, zones(*)')
      .eq('restaurant_id', restaurantId)

    if (data) setTables(data as TableWithZone[])
  }, [supabase, restaurantId])

  const fetchZones = useCallback(async () => {
    const { data } = await supabase
      .from('zones')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('sort_order', { ascending: true })

    if (data) setZones(data)
  }, [supabase, restaurantId])

  useEffect(() => {
    const load = async () => {
      await fetchZones()
    }
    void load()
  }, [fetchZones])

  useEffect(() => {
    const channel = supabase
      .channel(`tables-realtime-${restaurantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `restaurant_id=eq.${restaurantId}` }, (payload: { eventType: string; new: Record<string, unknown> }) => {
        if (payload.eventType === 'INSERT') {
          const guestName = typeof payload.new.guest_name === 'string' ? payload.new.guest_name : 'Guest'
          const tableId = typeof payload.new.table_id === 'string' ? payload.new.table_id : null
          const tableName = tableId ? tables.find((table) => table.id === tableId)?.table_name : null
          const message = tableName ? `${tableName} booked for ${guestName}` : `${guestName} booked`
          showLiveMessage(message)
          toast.success(message)
        } else {
          showLiveMessage(`${occupiedLabel} status updated`)
        }
        void fetchLatestBusyRows()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'physical_tables', filter: `restaurant_id=eq.${restaurantId}` }, () => { showLiveMessage(`${terms.units} updated`); void fetchLatestTables() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'zones', filter: `restaurant_id=eq.${restaurantId}` }, () => { showLiveMessage('Zones updated'); void fetchZones() })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLatestBusyRows, fetchLatestTables, fetchZones, occupiedLabel, restaurantId, showLiveMessage, supabase, tables, terms.units])

  useEffect(() => {
    return () => {
      if (liveMessageTimeoutRef.current) {
        window.clearTimeout(liveMessageTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const refreshAll = () => {
      void fetchLatestBusyRows()
      void fetchLatestTables()
      void fetchZones()
    }

    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshAll()
      }
    }

    const interval = window.setInterval(refreshAll, 15000)

    window.addEventListener('focus', refreshAll)
    document.addEventListener('visibilitychange', refreshOnVisible)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshAll)
      document.removeEventListener('visibilitychange', refreshOnVisible)
    }
  }, [fetchLatestBusyRows, fetchLatestTables, fetchZones])

  useEffect(() => {
    const load = async () => {
      await fetchLatestBusyRows()
    }
    void load()
  }, [fetchLatestBusyRows])

  const isHotel = businessType === 'hotel' || businessType === 'guesthouse'
  const todayStr = format(now, 'yyyy-MM-dd')

  const busyMap = useMemo(() => {
    const map = new Map<string, BusyInfo>()
    busyRows.forEach(row => {
      if (!row.table_id) return
      if (isHotel && row.checkout_date === todayStr && row.end_time) {
        const [h, m] = row.end_time.split(':').map(Number)
        const checkOut = new Date(now)
        checkOut.setHours(h, m, 0, 0)
        if (now >= checkOut) return
      }
      map.set(row.table_id, {
        guestName: row.guest_name,
        guestPhone: row.guest_phone ?? undefined,
        createdByName: row.profiles?.full_name || 'Staff',
        status: row.status,
        partySize: row.party_size || 0,
        reservationDate: row.reservation_date ?? undefined,
        checkoutDate: row.checkout_date ?? undefined,
        startTime: row.start_time ?? undefined,
        endTime: row.end_time ?? undefined
      })
    })
    return map
  }, [busyRows, todayStr, now, isHotel])

  const activeTables = tables.filter(t => t.is_active)
  const freeCount = activeTables.filter(t => !busyMap.has(t.id)).length
  const busyCount = activeTables.filter(t => busyMap.has(t.id)).length

  const { sortedZones, grouped, unassigned } = useMemo(() => 
    groupAndSortTables(tables, zones), 
    [tables, zones]
  )


  const renderTableItem = (t: TableWithZone, idx: number, busyInfo: BusyInfo | undefined, isBusy: boolean, isOffline: boolean, isTappable: boolean) => (
    <React.Fragment key={t.id}>
      {viewStyle === 'compact' && (
        <motion.div
          id={`table-compact-${t.id}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.02 }}
          className="relative group h-24 rounded-2xl border transition-all duration-300 overflow-hidden"
        >
          <div className={cn("absolute inset-0 z-0 opacity-40", isOffline ? "bg-muted" : isBusy ? "bg-rose-500/10" : "bg-emerald-500/5 hover:bg-emerald-500/10")} />
          <div className={cn("relative z-10 p-3 h-full flex flex-col justify-between border-t-2", isOffline ? "border-muted" : isBusy ? "border-rose-500" : "border-emerald-500")}>
            <div className="min-w-0 leading-none">
              <p className="text-[11px] font-black text-foreground truncate uppercase italic">{t.table_name}</p>
              {isBusy && busyInfo && (
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-[11px] font-black text-rose-400 truncate uppercase tracking-tighter">{busyInfo.guestName?.split(' ')[0]} ({busyInfo.partySize}p)</p>
                  <p className="text-[7px] text-muted-foreground/50 font-bold truncate italic leading-none">Created by {busyInfo.createdByName}</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">{t.capacity}p</span>
              {isBusy && busyInfo && (
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-black text-rose-400/50 uppercase tracking-tighter">
                      {busyInfo.startTime?.replace(/^(\d{2}):(\d{2}):\d{2}$/, (_: string, h: string, m: string) => {
                        const hh = parseInt(h);
                        return `${hh % 12 || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
                      })}
                    </span>
                    <User className="w-2.5 h-2.5 text-rose-400" />
                  </div>
              )}
            </div>
          </div>
          {mode === 'management' ? (
            <EditUnitSheet table={t} businessType={businessType} canManage={canManage} zones={zones} trigger={<button type="button" aria-label={`Edit ${terms.unitLower} ${t.table_name}`} className="absolute inset-0 z-20 cursor-pointer w-full h-full" />} />
          ) : isTappable ? (
            <Link href={`/dashboard/${dashboardSlug}/reservations/new?tableId=${t.id}`} className="absolute inset-0 z-20" />
          ) : (
            <div className="absolute inset-0 z-20" />
          )}
          {mode === 'management' && (
            <div className="absolute top-2 right-2 z-50 flex items-center justify-center pointer-events-none">
              <div className="w-7 h-7 flex items-center justify-center bg-background border border-border rounded-xl text-muted-foreground shadow-xl">
                <Settings2 className="w-4 h-4" />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {viewStyle === 'list' && (
        <motion.div
          id={`table-list-${t.id}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.02 }}
          className="group relative flex items-center gap-4 p-4 rounded-2xl bg-card/40 border border-border hover:border-violet-500/30 transition-all h-16 overflow-hidden"
        >
          <div className={cn("w-2.5 h-2.5 rounded-full", isOffline ? "bg-muted" : isBusy ? "bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.4)]" : "bg-emerald-500")} />
          <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <p className="text-base font-black italic tracking-tighter truncate pr-2">{t.table_name}</p>
              <span className="px-2 py-0.5 rounded-lg bg-muted text-[10px] font-black text-muted-foreground uppercase">{t.capacity} {terms.capacityUnit}</span>
            </div>
            <div className="hidden sm:flex flex-1 items-center gap-4 truncate">
              {isBusy && busyInfo?.guestName && (
                <div className="flex items-center gap-4 text-rose-300 px-3 py-1 rounded-xl bg-rose-500/5 border border-rose-500/10 min-w-0">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span className="text-xs font-black uppercase tracking-tight truncate">{busyInfo.guestName} ({busyInfo.partySize}p)</span>
                  </div>
                  <span className="w-1 h-1 rounded-full bg-rose-500/30" />
                  <div className="flex flex-col items-start gap-0.5 min-w-0 text-[10px] uppercase font-black tracking-widest text-rose-300/60 italic">
                    <span>{busyInfo.startTime?.replace(/^(\d{2}):(\d{2}):\d{2}$/, (_: string, h: string, m: string) => (parseInt(h) % 12 || 12) + ':' + m + (parseInt(h) >= 12 ? ' PM' : ' AM'))}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 relative z-30 justify-end">
              <Badge className={cn('text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-widest', isOffline ? 'bg-muted text-muted-foreground/60 border-border' : isBusy ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')}>
                {isOffline ? 'OFF' : isBusy ? occupiedLabel : availableLabel.toUpperCase()}
              </Badge>
              {mode === 'management' && (
                <div className="w-8 h-8 flex items-center justify-center bg-background border border-border/50 rounded-xl text-muted-foreground shadow-sm">
                  <Settings2 className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
          {mode === 'management' ? (
            <EditUnitSheet table={t} businessType={businessType} canManage={canManage} zones={zones} trigger={<button type="button" aria-label={`Edit ${terms.unitLower} ${t.table_name}`} className="absolute inset-0 z-10 cursor-pointer w-full h-full" />} />
          ) : isTappable ? (
            <Link href={`/dashboard/${dashboardSlug}/reservations/new?tableId=${t.id}&date=${selectedDate}`} className="absolute inset-0 z-10" />

          ) : (
            <div className="absolute inset-0 z-10" />
          )}
        </motion.div>
      )}

      {viewStyle === 'grid' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }}>
          <UnitCard 
            table={t} 
            busyInfo={busyInfo} 
            isBusy={isBusy} 
            isOffline={isOffline} 
            isTappable={isTappable} 
            businessType={businessType} 
            canManage={canManage} 
            zones={zones} 
            mode={mode}
            currentSlug={dashboardSlug}
            selectedDate={selectedDate}

          />
        </motion.div>
      )}
    </React.Fragment>
  )

  return (
    <div className="relative space-y-2">
      <div className="absolute inset-0 -top-20 -z-10 h-[1000px] w-full bg-background hidden dark:block [background:radial-gradient(125%_125%_at_50%_10%,#020617_40%,#1e1b4b_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
      </div>

      <div className="flex flex-col gap-3 sm:gap-5 lg:gap-6 pt-2 sm:pt-4 lg:pt-6 pb-1 sm:pb-2">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground italic tracking-tighter uppercase leading-none">
              {mode === 'management' ? `Manage ${terms.units}` : `${terms.units} Status`}
            </h1>
            
            {mode === 'monitoring' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 backdrop-blur-md shadow-[0_0_15px_rgba(139,92,246,0.1)]">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                </div>
                <span className="text-[10px] sm:text-xs font-black text-violet-300 uppercase tracking-widest">
                  {format(now, 'MMMM d')}
                </span>
              </div>
            )}

            {liveMessage ? (
              <Badge className="border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300 shadow-sm shadow-emerald-950/20">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {liveMessage}
              </Badge>
            ) : null}
          </div>

        </div>

        {mode === 'management' && (
          <div className="hidden md:flex justify-end pt-0">
            <ViewSwitcher currentStyle={viewStyle} onStyleChange={handleUpdateViewStyle} />
          </div>
        )}

        {mode === 'management' && (
          <div className="flex md:hidden gap-2">
            <CreateUnitDialog
              businessType={businessType}
              restaurantId={restaurantId}
              zones={zones}
              trigger={(
                <button
                  type="button"
                  className="flex-1 h-10 rounded-xl bg-violet-600 text-white text-[10px] font-black uppercase tracking-[0.18em] shadow-lg shadow-violet-500/20"
                >
                  Add {terms.unit}
                </button>
              )}
            />
            <ZoneManagementDialog
              restaurantId={restaurantId}
              onUpdate={fetchZones}
              trigger={(
                <button
                  type="button"
                  className="h-10 px-4 rounded-xl border border-border bg-card text-muted-foreground text-[10px] font-black uppercase tracking-[0.18em]"
                >
                  Zones
                </button>
              )}
            />
          </div>
        )}

        {mode === 'management' && (
          <div className="flex md:hidden items-center justify-between gap-3 px-1">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.18em]">
              View
            </span>
            <ViewSwitcher currentStyle={viewStyle} onStyleChange={handleUpdateViewStyle} />
          </div>
        )}
      </div>

      {mode === 'monitoring' && (
        <DateNavigator selectedDate={selectedDate} onChange={setSelectedDate} todayDate={clientTodayIso} className="w-full" />
      )}

      {mode === 'monitoring' && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[ { label: availableLabel, count: freeCount, icon: CircleCheck, color: 'emerald' }, { label: occupiedLabel, count: busyCount, icon: CircleX, color: 'rose' } ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={cn("relative overflow-hidden group bg-card/40 border rounded-3xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 transition-all hover:bg-card/60", stat.color === 'emerald' ? "border-emerald-500/20" : "border-rose-500/20")}>
              <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-inner", stat.color === 'emerald' ? "bg-emerald-500/10" : "bg-rose-500/10")}>
                <stat.icon className={cn("w-5 h-5 sm:w-6 sm:h-6", stat.color === 'emerald' ? "text-emerald-400" : "text-rose-400")} />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-foreground leading-tight"><NumberTicker value={stat.count} /></p>
                <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest mt-0.5">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Full-Width Grid Structure for Settings UI */}
      <div className="w-full">
        {/* Main Content Area */}
        <div className="space-y-12">
          {mode === 'monitoring' && (
            <div className="flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2 min-w-0">
                <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">
                  {selectedDate === initialDate ? `${terms.units} For Today` : `${terms.units} For ${format(parseISO(selectedDate), 'MMM dd')}`}
                </h2>
              </div>
              <ViewSwitcher currentStyle={viewStyle} onStyleChange={handleUpdateViewStyle} />
            </div>
          )}

          {sortedZones.map((zone) => {
            const zoneTables = grouped[zone.id] || []
            if (zoneTables.length === 0 && mode !== 'management') return null
            return (
              <div key={zone.id} id={`zone-${zone.id}`} className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                  <div className="h-6 w-1 rounded-full bg-violet-500/50" />
                  <h2 className="text-sm font-black text-foreground uppercase tracking-[0.2em] italic">{zone.name}</h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                </div>
                {zoneTables.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border bg-card/20 px-6 py-10 text-center">
                    <p className="text-sm font-black italic tracking-tight text-muted-foreground">No {terms.unitsLower} assigned yet</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Use Add {terms.unit} or edit an existing one to place it in this zone</p>
                  </div>
                ) : (
                  <div className={cn("grid gap-4", unitGridClass)}>
                    {zoneTables.map((t, idx) => (
                      <React.Fragment key={t.id}>
                        {viewStyle === 'compact' && (
                          <motion.div
                            id={`table-compact-${t.id}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            className="relative group h-24 rounded-2xl border transition-all duration-300 overflow-hidden"
                          >
                            <div className={cn("absolute inset-0 z-0 opacity-40", !t.is_active ? "bg-muted" : busyMap.has(t.id) ? "bg-rose-500/10" : "bg-emerald-500/5 hover:bg-emerald-500/10")} />
                            <div className={cn("relative z-10 p-3 h-full flex flex-col justify-between border-t-2", !t.is_active ? "border-muted" : busyMap.has(t.id) ? "border-rose-500" : "border-emerald-500")}>
                              <div className="min-w-0 leading-none">
                                <p className="text-[11px] font-black text-foreground truncate uppercase italic">{t.table_name}</p>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">{t.capacity}p</span>
                              </div>
                            </div>
                            {mode === 'management' ? (
                              <EditUnitSheet table={t} businessType={businessType} canManage={canManage} zones={zones} trigger={<button type="button" aria-label={`Edit ${terms.unitLower} ${t.table_name}`} className="absolute inset-0 z-20 cursor-pointer w-full h-full" />} />
                            ) : busyMap.has(t.id) || !t.is_active ? (
                              <div className="absolute inset-0 z-20" />
                            ) : (
                              <Link href={`/dashboard/${dashboardSlug}/reservations/new?tableId=${t.id}&date=${selectedDate}`} className="absolute inset-0 z-20" />

                            )}
                          </motion.div>
                        )}

                        {viewStyle === 'list' && (
                          <motion.div
                            id={`table-list-${t.id}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className="group relative flex items-center gap-4 p-4 rounded-2xl bg-card/40 border border-border hover:border-violet-500/30 transition-all h-16 overflow-hidden"
                          >
                            <div className={cn("w-2.5 h-2.5 rounded-full", !t.is_active ? "bg-muted" : busyMap.has(t.id) ? "bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.4)]" : "bg-emerald-500")} />
                            <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <p className="text-base font-black italic tracking-tighter truncate pr-2">{t.table_name}</p>
                              </div>
                              <div className="flex items-center gap-2 relative z-30 justify-end">
                                {mode === 'management' && (
                                  <div className="w-8 h-8 flex items-center justify-center bg-background border border-border/50 rounded-xl text-muted-foreground shadow-sm">
                                    <Settings2 className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                            {mode === 'management' ? (
                              <EditUnitSheet table={t} businessType={businessType} canManage={canManage} zones={zones} trigger={<button type="button" aria-label={`Edit ${terms.unitLower} ${t.table_name}`} className="absolute inset-0 z-10 cursor-pointer w-full h-full" />} />
                            ) : busyMap.has(t.id) || !t.is_active ? (
                              <div className="absolute inset-0 z-10" />
                            ) : (
                              <Link href={`/dashboard/${dashboardSlug}/reservations/new?tableId=${t.id}&date=${selectedDate}`} className="absolute inset-0 z-10" />

                            )}
                          </motion.div>
                        )}

                        {viewStyle === 'grid' && (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }}>
                            <UnitCard 
                              table={t} 
                              busyInfo={busyMap.get(t.id)} 
                              isBusy={!!busyMap.get(t.id)} 
                              isOffline={!t.is_active} 
                              isTappable={!busyMap.has(t.id) && t.is_active} 
                              businessType={businessType} 
                              canManage={canManage} 
                              zones={zones} 
                              mode={mode}
                              currentSlug={dashboardSlug}
                            />
                          </motion.div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {unassigned.length > 0 && (
            <div id="zone-unassigned" className="space-y-4">
              <div className="flex items-center gap-3 px-1">
                <div className="h-6 w-1 rounded-full bg-muted" />
                <h2 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em] italic">Unassigned</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
              </div>
              <div className={cn("grid gap-4", unitGridClass)}>
                {unassigned.map((t, idx) => renderTableItem(t, idx, busyMap.get(t.id), !!busyMap.get(t.id), !t.is_active, !busyMap.has(t.id) && t.is_active))}
              </div>
            </div>
          )}

          {tables.length === 0 && (
            <div className="text-center py-20 bg-card/30 rounded-[2.5rem] border border-border border-dashed backdrop-blur-sm">
              <p className="text-muted-foreground font-black text-lg italic tracking-tight">No {terms.unitsLower} yet</p>
              <p className="text-muted-foreground/60 text-xs mt-1 mb-8 font-bold uppercase tracking-widest">Add your first {terms.unitLower} to start live operations</p>
            </div>
          )}
        </div>
      </div>

      <div className="hidden sm:flex text-center space-y-2 pt-8 pb-4 opacity-50 flex-col items-center">
        <Activity className="w-4 h-4 text-emerald-500 animate-pulse mb-1" />
        <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-[0.2em] leading-relaxed px-8">Everything updates live as it happens.</p>
      </div>

      {mode === 'management' && (
        <div className="hidden md:block">
        <ActionHub 
          actions={[
            { 
              label: `Add ${terms.unit}`, 
              icon: <Plus className="w-6 h-6" />, 
              color: 'bg-violet-600 text-white',
              component: <CreateUnitDialog businessType={businessType} restaurantId={restaurantId} zones={zones} />
            },
            { 
              label: 'Manage Zones', 
              icon: <LayoutList className="w-5 h-5" />, 
              color: 'bg-emerald-600 text-white',
              component: <ZoneManagementDialog restaurantId={restaurantId} onUpdate={fetchZones} />
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
      )}
    </div>
  )
}
