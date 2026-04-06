'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { TableCard } from './TableCard'
import { CreateTableDialog } from './CreateTableDialog'
import { BarChart3, CircleCheck, CircleX, Clock, Activity } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { getTerms } from '@/lib/business-type'
import type { Tables } from '@/lib/types/database'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { DateNavigator } from '@/components/dashboard/DateNavigator'
import { ViewSwitcher, type ViewStyle } from '@/components/dashboard/ViewSwitcher'
import { User, Settings2 } from 'lucide-react'
import { EditTableSheet } from './EditTableSheet'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

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

interface TablesClientProps {
  initialTables: Tables<'physical_tables'>[]
  initialBusyRows: any[]
  restaurantId: string
  businessType: string
  isAdmin: boolean
  initialDate: string
  initialNowIso: string
}

export function TablesClient({
  initialTables,
  initialBusyRows,
  restaurantId,
  businessType,
  isAdmin,
  initialDate,
  initialNowIso
}: TablesClientProps) {
  const [tables, setTables] = useState(initialTables)
  const [busyRows, setBusyRows] = useState(initialBusyRows)
  const [now, setNow] = useState(() => new Date(initialNowIso))
  const [viewStyle, setViewStyle] = useState<ViewStyle>('grid')
  
  // 💾 Persist View Preference
  useEffect(() => {
    const saved = localStorage.getItem('tables-view-style') as ViewStyle
    if (saved && (saved === 'grid' || saved === 'list' || saved === 'compact')) {
      setViewStyle(saved)
    }
  }, [])

  const handleUpdateViewStyle = (s: ViewStyle) => {
    setViewStyle(s)
    localStorage.setItem('tables-view-style', s)
  }

  // Load view preference
  useEffect(() => {
    const saved = localStorage.getItem('tablesViewStyle') as ViewStyle
    if (saved && ['grid', 'list', 'compact'].includes(saved)) {
      setViewStyle(saved)
    }
  }, [])

  const handleViewChange = (style: ViewStyle) => {
    setViewStyle(style)
    localStorage.setItem('tablesViewStyle', style)
  }

  const supabase = createClient()
  const terms = getTerms(businessType)
  const [selectedDate, setSelectedDate] = useState(initialDate)

  // Keep clock running
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

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
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('table_name')

    if (data) setTables(data as any)
  }, [supabase, restaurantId])

  useEffect(() => {
    // 🛰️ Real-time subscription to BOTH reservations and physical tables
    const channel = supabase
      .channel(`tables-realtime-${restaurantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `restaurant_id=eq.${restaurantId}` }, () => {
        fetchLatestBusyRows()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'physical_tables', filter: `restaurant_id=eq.${restaurantId}` }, () => {
        fetchLatestTables()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, restaurantId, fetchLatestBusyRows, fetchLatestTables])

  // Reset busy rows when date changes to prevent "ghost" data
  useEffect(() => {
    setBusyRows([])
    fetchLatestBusyRows()
  }, [selectedDate, fetchLatestBusyRows])

  const isHotel = businessType === 'hotel' || businessType === 'guesthouse'
  const todayStr = format(now, 'yyyy-MM-dd')

  const busyMap = useMemo(() => {
    const map = new Map<string, BusyInfo>()
    busyRows.forEach(row => {
      if (!row.table_id) return

      // 🕵️ Check-out Logic: If it's the checkout day, check if time passed
      if (isHotel && row.checkout_date === todayStr && row.end_time) {
        const [h, m] = row.end_time.split(':').map(Number)
        const checkOut = new Date(now)
        checkOut.setHours(h, m, 0, 0)
        if (now >= checkOut) return // Room is now free!
      }

      map.set(row.table_id, {
        guestName: row.guest_name,
        guestPhone: row.guest_phone,
        createdByName: (row as any).profiles?.full_name || 'Staff',
        status: row.status,
        partySize: row.party_size || 0,
        reservationDate: row.reservation_date,
        checkoutDate: row.checkout_date,
        startTime: row.start_time,
        endTime: row.end_time
      })
    })
    return map
  }, [busyRows, todayStr, now, isHotel])

  const activeTables = tables.filter(t => t.is_active)
  const freeCount = activeTables.filter(t => !busyMap.has(t.id)).length
  const busyCount = activeTables.filter(t => busyMap.has(t.id)).length

  return (
    <div className="relative space-y-6">
      {/* 🔮 Magic UI Style Grid Background — only in dark mode */}
      <div className="absolute inset-0 -top-20 -z-10 h-[1000px] w-full bg-background hidden dark:block [background:radial-gradient(125%_125%_at_50%_10%,#020617_40%,#1e1b4b_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
      </div>

      {/* Header with Live Pulse */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-foreground italic tracking-tight uppercase">
              {terms.units} Status
            </h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">Live Feed</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">
              {format(now, 'EEEE, MMM d, yyyy • hh:mm a')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ViewSwitcher currentStyle={viewStyle} onStyleChange={handleUpdateViewStyle} />
          <Link
            href="/dashboard/reports"
            className="flex items-center gap-1.5 h-10 px-4 bg-card border border-border rounded-xl text-foreground/70 text-xs font-black uppercase tracking-tight hover:border-violet-500/50 hover:text-violet-300 transition-all shadow-lg"
          >
            <BarChart3 className="w-3.5 h-3.5" /> Reports
          </Link>
          <CreateTableDialog businessType={businessType as any} restaurantId={restaurantId} />
        </div>
      </div>

      {/* 🗓️ Universal Date Navigator */}
      <DateNavigator
        selectedDate={selectedDate}
        onChange={setSelectedDate}
        todayDate={initialDate}
        className="w-full"
      />

      {/* Modern Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden group bg-card/40 border border-emerald-500/20 rounded-3xl p-5 flex items-center gap-4 transition-all hover:bg-card/60"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shadow-inner">
            <CircleCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-3xl font-black text-foreground leading-tight">
              <NumberTicker value={freeCount} />
            </p>
            <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest mt-0.5">Available</p>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-emerald-500/10 transition-all" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden group bg-card/40 border border-rose-500/20 rounded-3xl p-5 flex items-center gap-4 transition-all hover:bg-card/60"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center shadow-inner">
            <CircleX className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <p className="text-3xl font-black text-foreground leading-tight">
              <NumberTicker value={busyCount} />
            </p>
            <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest mt-0.5">Booked</p>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-rose-500/10 transition-all" />
        </motion.div>
      </div>

      {/* Table Display */}
      {tables.length > 0 ? (
        <div className={cn(
          "grid gap-4",
          viewStyle === 'grid' ? "grid-cols-2 sm:grid-cols-3" : 
          viewStyle === 'compact' ? "grid-cols-3 sm:grid-cols-5 md:grid-cols-6" : 
          "grid-cols-1"
        )}>
          {tables.map((t, idx) => {
            const busyInfo = busyMap.get(t.id)
            const isBusy = !!busyInfo
            const isOffline = !t.is_active
            const isTappable = !isBusy && !isOffline

            return (
              <React.Fragment key={t.id}>
                {/* Compact View Render */}
                {viewStyle === 'compact' && (
                  <motion.div
                    id={`table-compact-${t.id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="relative group h-24 rounded-2xl border transition-all duration-300 overflow-hidden"
                  >

                    <div className={cn(
                      "absolute inset-0 z-0 opacity-40",
                      isOffline ? "bg-muted" : isBusy ? "bg-rose-500/10" : "bg-emerald-500/5 hover:bg-emerald-500/10"
                    )} />
                    <div className={cn(
                      "relative z-10 p-3 h-full flex flex-col justify-between border-t-2",
                      isOffline ? "border-muted" : isBusy ? "border-rose-500" : "border-emerald-500"
                    )}>
                      <div className="min-w-0 leading-none">
                        <p className="text-[11px] font-black text-foreground truncate uppercase italic">{t.table_name}</p>
                        {isBusy && busyInfo && (
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <p className="text-[11px] font-black text-rose-400 truncate uppercase tracking-tighter">
                              {busyInfo.guestName.split(' ')[0]} ({busyInfo.partySize}p)
                            </p>
                            <p className="text-[7px] text-muted-foreground/50 font-bold truncate italic leading-none">
                              Created by {busyInfo.createdByName || 'Staff Member'}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">{t.capacity}p</span>
                        {isBusy && busyInfo && (
                           <div className="flex items-center gap-1">
                             <span className="text-[8px] font-black text-rose-400/50 uppercase tracking-tighter">
                               {busyInfo.startTime?.replace(/^(\d{2}):(\d{2}):\d{2}$/, (_, h, m) => {
                                 const hh = parseInt(h);
                                 return `${hh % 12 || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
                               })}
                             </span>
                             <User className="w-2.5 h-2.5 text-rose-400" />
                           </div>
                        )}
                      </div>
                    </div>
                    {isTappable ? (
                      <Link id={`book-link-compact-${t.id}`} href={`/dashboard/${restaurantId}/reservations/new?tableId=${t.id}`} className="absolute inset-0 z-20" />
                    ) : (
                      <div className="absolute inset-0 z-20" />
                    )}

                    {/* Action Indicator - Topmost layer */}
                    <div className="absolute top-2 right-2 z-50 flex items-center justify-center">
                      <EditTableSheet 
                        table={t} 
                        businessType={businessType} 
                        isAdmin={isAdmin}
                        trigger={
                          <button className="w-7 h-7 flex items-center justify-center bg-background border border-border rounded-xl text-muted-foreground hover:text-violet-400 hover:border-violet-500/50 transition-all shadow-xl active:scale-95 pointer-events-auto">
                            <Settings2 className="w-4 h-4" />
                          </button>
                        }
                      />
                    </div>
                  </motion.div>
                )}

                {/* List View Render */}
                {viewStyle === 'list' && (
                  <motion.div
                    id={`table-list-${t.id}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="group relative flex items-center gap-4 p-4 rounded-2xl bg-card/40 border border-border hover:border-violet-500/30 transition-all h-16 overflow-hidden"
                  >
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      isOffline ? "bg-muted" : isBusy ? "bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.4)]" : "bg-emerald-500"
                    )} />
                    
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
                             <div className="flex flex-col items-start gap-0.5 min-w-0">
                               <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-rose-300/60 truncate italic">
                                  <span>
                                    {busyInfo.startTime?.replace(/^(\d{2}):(\d{2}):\d{2}$/, (_, h, m) => {
                                      const hh = parseInt(h);
                                      return `${hh % 12 || 12}:${m} ${hh >= 12 ? 'PM' : 'AM'}`;
                                    })}
                                  </span>
                                  {busyInfo.guestPhone && (
                                    <>
                                      <span className="opacity-40">·</span>
                                      <span>{busyInfo.guestPhone}</span>
                                    </>
                                  )}
                               </div>
                               <p className="text-[8px] text-muted-foreground/40 font-bold uppercase tracking-widest leading-none">
                                 Created by {busyInfo.createdByName || 'Staff'}
                               </p>
                             </div>
                          </div>
                        )}
                        {!isBusy && !isOffline && (
                          <span className="text-[10px] font-black text-emerald-400/60 uppercase tracking-[0.2em]">Ready For {terms.booking}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 relative z-30">
                        <Badge className={cn(
                          'text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-widest',
                          isOffline ? 'bg-muted text-muted-foreground/60 border-border'
                            : isBusy ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        )}>
                          {isOffline ? 'OFF' : isBusy ? 'Booked' : 'AVAILABLE'}
                        </Badge>
                        <div className="pointer-events-auto">
                          <EditTableSheet 
                            table={t} 
                            businessType={businessType} 
                            isAdmin={isAdmin}
                            trigger={
                              <button 
                                id={`edit-table-list-${t.id}`}
                                className="w-8 h-8 flex items-center justify-center bg-background border border-border/50 rounded-xl text-muted-foreground hover:text-violet-400 hover:border-violet-500/50 transition-all shadow-sm active:scale-90"
                              >
                                <Settings2 className="w-4 h-4" />
                              </button>
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {isTappable && (
                      <Link id={`book-link-list-${t.id}`} href={`/dashboard/${restaurantId}/reservations/new?tableId=${t.id}`} className="absolute inset-0 z-10" />
                    )}
                  </motion.div>
                )}

                {/* Standard Grid View */}
                {viewStyle === 'grid' && (
                  <motion.div
                    id={`table-grid-${t.id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <TableCard
                      table={t}
                      busyInfo={busyInfo}
                      isBusy={isBusy}
                      isOffline={isOffline}
                      isTappable={isTappable}
                      businessType={businessType}
                      isAdmin={isAdmin}
                    />
                  </motion.div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-card/30 rounded-[2.5rem] border border-border border-dashed backdrop-blur-sm">
          <p className="text-muted-foreground font-black text-lg italic tracking-tight">No {terms.unitsLower} yet</p>
          <p className="text-muted-foreground/60 text-xs mt-1 mb-8 font-bold uppercase tracking-widest">Add your first unit to start live operations</p>
        </div>
      )}

      <div className="text-center space-y-2 pt-8 pb-4 opacity-50 flex flex-col items-center">
        <Activity className="w-4 h-4 text-emerald-500 animate-pulse mb-1" />
        <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-[0.2em] leading-relaxed px-8">
          Everything updates live as it happens.
        </p>
      </div>
    </div>
  )
}
