import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button-variants'
import type { Tables } from '@/lib/types/database'
import { CalendarDays, Users, Table2, Clock, Plus, ChevronRight, BedDouble } from 'lucide-react'
import { parseTsRange } from '@/lib/utils'
import { getTerms } from '@/lib/business-type'
import type { BusinessType } from '@/lib/business-type'

export const metadata = { title: 'Home — TableBook' }

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  completed: 'bg-slate-600/40 text-slate-300 border-slate-700',
  no_show: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

const statusLabels: Record<string, string> = {
  pending: 'Waiting',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Done',
  no_show: 'No Show',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membershipRaw } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id, restaurants(business_type)')
    .eq('user_id', user.id)
    .single()

  const membership = membershipRaw as Tables<'account_memberships'> & { restaurants: { business_type: string } | null } | null
  if (!membership?.restaurant_id) return null

  const rid = membership.restaurant_id
  const businessType = (membership.restaurants?.business_type ?? 'restaurant') as BusinessType
  const terms = getTerms(businessType)
  const UnitIcon = terms.hasCheckout ? BedDouble : Table2

  const { data: reservationsRaw } = await supabase
    .from('reservations')
    .select('*, physical_tables(table_name, capacity)')
    .eq('restaurant_id', rid)
    .in('status', ['pending', 'confirmed'])
    .order('created_at', { ascending: false })
    .limit(10)

  const { count: totalToday } = await supabase
    .from('reservations').select('*', { count: 'exact', head: true })
    .eq('restaurant_id', rid).neq('status', 'cancelled')

  const { count: totalTables } = await supabase
    .from('physical_tables').select('*', { count: 'exact', head: true })
    .eq('restaurant_id', rid).eq('is_active', true)

  const { count: pendingCount } = await supabase
    .from('reservations').select('*', { count: 'exact', head: true })
    .eq('restaurant_id', rid).eq('status', 'pending')

  const upcomingReservations = (reservationsRaw ?? []) as unknown as Array<Tables<'reservations'> & { physical_tables: { table_name: string; capacity: number } | null }>

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Greeting Section */}
      <div className="pt-2">
        <p className="text-slate-400 text-sm">{todayStr}</p>
        <h1 className="text-2xl font-black text-white mt-0.5">Today&apos;s Overview</h1>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-violet-400" />
          </div>
          <div className="text-3xl font-black text-white tabular-nums">{totalToday ?? 0}</div>
          <div className="text-xs text-slate-400 font-medium leading-tight">Total {terms.bookings}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white tabular-nums">{pendingCount ?? 0}</div>
          <div className="text-xs text-slate-400 font-medium leading-tight">Waiting</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <UnitIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white tabular-nums">{totalTables ?? 0}</div>
          <div className="text-xs text-slate-400 font-medium leading-tight">{terms.units}</div>
        </div>
      </div>

      {/* Quick Action: New Booking */}
      <Link
        href="/dashboard/reservations/new"
        className="flex items-center justify-between w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl p-4 shadow-lg shadow-violet-500/25 transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-base leading-tight">New {terms.booking}</p>
            <p className="text-white/70 text-xs mt-0.5">Add a new {terms.unitLower} {terms.bookingLower}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/60" />
      </Link>

      {/* Upcoming Bookings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white">Upcoming {terms.bookings}</h2>
          <Link href="/dashboard/reservations" className="text-sm text-violet-400 font-semibold">
            See all
          </Link>
        </div>

        {upcomingReservations.length > 0 ? (
          <div className="space-y-2">
            {upcomingReservations.map((res) => {
              const { start } = parseTsRange(res.reservation_time)
              const dateDisplay = start
                ? new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : null
              const timeDisplay = start
                ? new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : null
              return (
                <Link
                  key={res.id}
                  href={`/dashboard/reservations/${res.id}/edit`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-[0.99] transition-all"
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/20 flex items-center justify-center text-base font-black text-violet-300 flex-shrink-0">
                    {res.guest_name.slice(0, 1).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{res.guest_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {res.physical_tables?.table_name ?? '—'} {!terms.hasCheckout && `· ${res.party_size} ${res.party_size === 1 ? 'person' : 'people'}`}
                    </p>
                  </div>

                  {/* Time + Status */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Badge className={cn('text-[10px] font-bold px-2 py-0.5 border rounded-lg', statusColors[res.status] ?? '')}>
                      {statusLabels[res.status] ?? res.status}
                    </Badge>
                    {(dateDisplay || timeDisplay) && (
                      <span className="text-xs text-slate-500">
                        {dateDisplay && <span>{dateDisplay}</span>}
                        {dateDisplay && timeDisplay && ' · '}
                        {timeDisplay && <span>{timeDisplay}</span>}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-slate-400 text-sm font-medium">No {terms.bookingsLower} yet</p>
            <Link
              href="/dashboard/reservations/new"
              className={cn(buttonVariants({ size: 'sm' }), 'mt-4 bg-gradient-to-r from-violet-600 to-indigo-600 border-0 rounded-xl')}
            >
              Add First {terms.booking}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
