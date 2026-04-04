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

interface BusyInfo {
  guestName: string
  status: string
  partySize: number
  reservationDate?: string
  checkoutDate?: string
  endTime?: string
}

interface TablesClientProps {
  initialTables: Tables<'physical_tables'>[]
  initialBusyRows: any[]
  restaurantId: string
  businessType: string
  isAdmin: boolean
}

export function TablesClient({
  initialTables,
  initialBusyRows,
  restaurantId,
  businessType,
  isAdmin
}: TablesClientProps) {
  const [tables, setTables] = useState(initialTables)
  const [busyRows, setBusyRows] = useState(initialBusyRows)
  const [now, setNow] = useState(new Date())

  const supabase = createClient()
  const terms = getTerms(businessType)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  // Keep clock running
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const fetchLatestBusyRows = useCallback(async () => {
    const fmt = selectedDate
    const { data } = await supabase
      .from('reservations')
      .select('table_id, guest_name, status, party_size, reservation_date, checkout_date, end_time')
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
        status: row.status,
        partySize: row.party_size || 0,
        reservationDate: row.reservation_date,
        checkoutDate: row.checkout_date,
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
          <Link
            href="/dashboard/reports"
            className="flex items-center gap-1.5 h-10 px-4 bg-card border border-border rounded-xl text-foreground/70 text-xs font-black uppercase tracking-tight hover:border-violet-500/50 hover:text-violet-300 transition-all shadow-lg"
          >
            <BarChart3 className="w-3.5 h-3.5" /> Reports
          </Link>
          <CreateTableDialog businessType={businessType as any} />
        </div>
      </div>

      {/* 🗓️ Universal Date Navigator */}
      <DateNavigator
        selectedDate={selectedDate}
        onChange={setSelectedDate}
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

      {/* Table Grid */}
      {tables.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {tables.map((t, idx) => {
            const busyInfo = busyMap.get(t.id)
            const isBusy = !!busyInfo
            const isOffline = !t.is_active
            const isTappable = !isBusy && !isOffline

            return (
              <motion.div
                key={t.id}
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
