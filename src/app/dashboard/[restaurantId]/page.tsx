import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BedDouble, Table2 } from 'lucide-react'
import { getTerms } from '@/lib/business-type'
import type { BusinessType } from '@/lib/business-type'
import { DashboardClient } from './DashboardClient'
import type { Tables } from '@/lib/types/database'

export const metadata = { title: 'Home — TableBook' }

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

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membershipRaw } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id, restaurants(business_type, is_new)')
    .eq('user_id', user.id)
    .single()

  const membership = membershipRaw as any
  if (!membership?.restaurant_id) return null

  if (membership.restaurants?.is_new) {
    redirect('/dashboard/setup')
  }

  const rid = membership.restaurant_id
  const businessType = (membership.restaurants?.business_type ?? 'restaurant') as BusinessType
  const terms = getTerms(businessType)
  const UnitIcon = terms.hasCheckout ? BedDouble : Table2

  // Get Today's Date in ISO format (YYYY-MM-DD)
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayIso = `${year}-${month}-${day}`

  // 🚀 Bulletproof Consolidation: Get EVERYTHING for Today in one go to ensure counts match the list
  const { data: rawRows } = await supabase
    .from('reservations')
    .select('id, status, guest_name, start_time, party_size, reservation_date, physical_tables(table_name, capacity)')
    .eq('restaurant_id', rid)
    .eq('reservation_date', todayIso)
    .neq('status', 'cancelled')
    .order('start_time', { ascending: true })

  const reservations = rawRows as any[] || []
  
  // Calculate stats from the same data set used for the list
  const totalToday = reservations.length
  const pendingCount = reservations.filter(r => r.status === 'pending').length
  
  // Tables count remains separate as it's a different table
  const { data: allTableRows } = await supabase
    .from('physical_tables').select('id')
    .eq('restaurant_id', rid).eq('is_active', true)
  const totalTables = allTableRows?.length ?? 0

  const upcomingReservations = reservations.slice(0, 10)

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <DashboardClient 
      initialData={{
        totalToday,
        pendingCount,
        totalTables,
        upcomingReservations,
        businessType,
        todayStr
      }} 
    />
  )
}
