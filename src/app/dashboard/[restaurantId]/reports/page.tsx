import { getActiveRestaurant } from '@/lib/restaurant-context'
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
  completed: 'bg-muted/60/40 text-foreground/70 border-border',
  no_show:   'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

const statusLabels: Record<string, string> = {
  pending: 'Waiting', confirmed: 'Confirmed', arrived: 'Arrived', cancelled: 'Cancelled',
  completed: 'Done', no_show: 'No Show',
}

export default async function ReportsPage({ params, searchParams }: { params: Promise<{ restaurantId: string }>, searchParams: Promise<{ week?: string, status?: string }> }) {
  const { restaurantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const res = await getActiveRestaurant(restaurantId)
  if (!res) return null
  const membershipRaw = res.membership

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

  // ── Parallel Data Fetching (Block 1) ────────────────────────────────────────
  const [resResponse, ptResponse, restaurantResponse, memberListResponse] = await Promise.all([
    supabase
      .from('reservations')
      .select('*, physical_tables(table_name, capacity)')
      .eq('restaurant_id', rid)
      .gte('reservation_date', startIso)
      .lte('reservation_date', endIso)
      .order('reservation_date', { ascending: true }),
    supabase
      .from('physical_tables')
      .select('id, table_name, capacity')
      .eq('restaurant_id', rid)
      .eq('is_active', true),
    supabase
      .from('restaurants')
      .select('business_type')
      .eq('id', rid)
      .single(),
    membership.role === 'admin' 
      ? supabase.from('account_memberships').select('user_id').eq('restaurant_id', rid)
      : Promise.resolve({ data: null })
  ])

  const weekData = (resResponse.data ?? []) as unknown as Array<Tables<'reservations'> & { physical_tables: { table_name: string; capacity: number } | null }>
  const allTables = (ptResponse.data ?? []) as unknown as Tables<'physical_tables'>[]
  const businessType = restaurantResponse.data?.business_type || 'restaurant'
  const memberList = memberListResponse.data
  const isAdmin = membership.role === 'admin'

  // ── Profile Pre-fetching for Admin (Parallel Block 2) ────────────────────────
  let staffNames: Record<string, string> = {}
  if (isAdmin && memberList) {
    const validMemberIds = new Set(memberList.map(m => m.user_id))
    const creatorIds = Array.from(new Set(
      weekData
        .map(r => r.created_by)
        .filter((id): id is string => !!id && validMemberIds.has(id))
    ))

    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', creatorIds)
      
      profiles?.forEach(p => { staffNames[p.id] = p.full_name || 'Member' })
    }
  }

  const validMemberIds = isAdmin && memberList ? new Set(memberList.map(m => m.user_id)) : new Set<string>()

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
  .filter(t => t.volume > 0)
  .sort((a, b) => b.volume - a.volume)

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

  // ── 5. Staff Performance Tracking (Admin Only) ──────────────────────────────
  let staffPerformance: any[] | undefined = undefined

  if (isAdmin) {
     const performanceMap = new Map<string, { id: string, name: string, completed: number, confirmed: number, cancelled: number, no_show: number, total: number }>()

     weekData.forEach(r => {
       const uid = r.created_by
       if (!uid || !validMemberIds.has(uid)) return 
       
       const name = staffNames[uid] || 'Unnamed Member'
       const prev = performanceMap.get(uid) || { id: uid, name, completed: 0, confirmed: 0, cancelled: 0, no_show: 0, total: 0 }
       
       if (r.status === 'completed') prev.completed++
       else if (r.status === 'confirmed') prev.confirmed++
       else if (r.status === 'cancelled') prev.cancelled++
       else if (r.status === 'no_show') prev.no_show++
       
       prev.total++
       performanceMap.set(uid, prev)
     })

     staffPerformance = Array.from(performanceMap.values())
       .sort((a, b) => b.total - a.total)
  }

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
      isAdmin={isAdmin}
      staffPerformance={staffPerformance}
    />
  )
}
