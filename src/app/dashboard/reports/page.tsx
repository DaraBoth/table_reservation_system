import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Tables } from '@/lib/types/database'
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import ReportsDashboardClient from './ReportsDashboardClient'

export const metadata = { title: 'Business Report — BookJM' }

interface Props {
  searchParams: Promise<{ 
    week?: string; 
    status?: string; 
  }>
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
  pending: 'Waiting', confirmed: 'Confirmed', arrived: 'Arrived', cancelled: 'Cancelled',
  completed: 'Done', no_show: 'No Show',
}

export default async function ReportsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membershipRaw } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', user.id)
    .single()

  const membership = membershipRaw as Tables<'account_memberships'> | null
  const canView = membership?.role === 'admin' || membership?.role === 'staff'
  if (!canView) redirect('/dashboard')

  const rid = membership.restaurant_id!
  const { week } = await searchParams

  // ── Weekly Logic (Monday to Sunday) ─────────────────────────────────────────
  const referenceDate = week ? parseISO(week) : new Date()
  const monday = startOfWeek(referenceDate, { weekStartsOn: 1 })
  const sunday = endOfWeek(referenceDate, { weekStartsOn: 1 })

  const startIso = format(monday, "yyyy-MM-dd")
  const endIso = format(sunday, "yyyy-MM-dd")

  // ── Fetch ALL reservations for this week ────────────────────────────────────
  const { data: resRaw } = await supabase
    .from('reservations')
    .select('*, physical_tables(table_name, capacity)')
    .eq('restaurant_id', rid)
    .gte('reservation_date', startIso)
    .lte('reservation_date', endIso)
    .order('reservation_date', { ascending: true })

  type ResWithTable = Tables<'reservations'> & {
    physical_tables: { table_name: string; capacity: number } | null
  }
  const weekData = (resRaw ?? []) as unknown as ResWithTable[]

  // ── Fetch ALL physical tables for this restaurant ───────────────────────────
  const { data: ptRaw } = await supabase
     .from('physical_tables')
     .select('id, table_name, capacity')
     .eq('restaurant_id', rid)
     .eq('is_active', true)

  const allTables = (ptRaw ?? []) as unknown as Tables<'physical_tables'>[]

  // ── 1. Weekly Status Trend (Mon to Sun) ─────────────────────────────────────
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const statusTrend = days.map((dayName, i) => {
    const dayDate = addDays(monday, i)
    const dayReservations = weekData.filter(r => isSameDay(parseISO(r.reservation_date), dayDate))
    
    return {
      day: dayName,
      completed: dayReservations.filter(r => r.status === 'completed').length,
      cancelled: dayReservations.filter(r => r.status === 'cancelled').length,
      no_show:   dayReservations.filter(r => r.status === 'no_show').length,
      others:    dayReservations.filter(r => !['completed', 'cancelled', 'no_show'].includes(r.status)).length,
      total:     dayReservations.length
    }
  })

  // ── 2. Ranking-Based Performance (Total Guests for the full week) ──────────
  const tablePerformance = allTables.map(t => {
    const totalVolume = weekData
       .filter(r => r.table_id === t.id)
       .reduce((s, r) => s + (r.party_size || 0), 0)

    return {
      id: t.id,
      name: t.table_name,
      capacity: t.capacity,
      volume: totalVolume
    }
  })
  .filter(t => t.volume > 0) // Only show tables that have data this week
  .sort((a, b) => b.volume - a.volume) // Rank busiest tables to the top

  // ── 3. Top Customers (By Phone Frequency) ───────────────────────────────────
  const customerMap = new Map<string, { visits: number, guests: number, name: string }>()
  weekData.forEach(r => {
    if (!r.guest_phone && !r.guest_name) return
    const key = r.guest_phone || r.guest_name
    const prev = customerMap.get(key) || { visits: 0, guests: 0, name: r.guest_name }
    customerMap.set(key, {
      visits: prev.visits + 1,
      guests: prev.guests + r.party_size,
      name: r.guest_name
    })
  })

  const topCustomers = Array.from(customerMap.entries())
    .map(([key, val]) => ({ key, ...val }))
    .sort((a, b) => b.visits - a.visits || b.guests - a.guests)
    .slice(0, 5)

  // ── 4. Business Type Details ───────────────────────────────────────────────
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('business_type')
    .eq('id', rid)
    .single()

  const businessType = restaurant?.business_type || 'restaurant'

  // ── Overall Stats ───────────────────────────────────────────────────────────
  const totalCompleted = weekData.filter(r => r.status === 'completed').length
  const totalGuests = weekData.filter(r => r.status === 'completed').reduce((s, r) => s + (r.party_size || 0), 0)
  
  const dateLabel = `Week of ${format(monday, "MMM dd, yyyy")}`

  return (
    <ReportsDashboardClient
      dateLabel={dateLabel}
      totalCompleted={totalCompleted}
      totalGuests={totalGuests}
      statusTrend={statusTrend}
      tablePerformance={tablePerformance}
      topCustomers={topCustomers}
      businessType={businessType}
      statusColors={statusColors}
      statusLabels={statusLabels}
    />
  )
}
