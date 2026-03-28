import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import type { AccountMembership, Reservation } from '@/lib/types/database'

export const metadata = { title: 'Dashboard — TableBook' }

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  completed: 'bg-slate-600 text-slate-300',
  no_show: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membershipRaw } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', user.id)
    .single()

  const membership = membershipRaw as AccountMembership | null
  if (!membership?.restaurant_id) return null

  const rid = membership.restaurant_id

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

  const { count: totalStaff } = await supabase
    .from('account_memberships').select('*', { count: 'exact', head: true })
    .eq('restaurant_id', rid).eq('role', 'staff').eq('is_active', true)

  const { count: pendingCount } = await supabase
    .from('reservations').select('*', { count: 'exact', head: true })
    .eq('restaurant_id', rid).eq('status', 'pending')

  const upcomingReservations = (reservationsRaw ?? []) as unknown as Array<Reservation & { physical_tables: { table_name: string; capacity: number } | null }>

  const stats = [
    { label: 'Total Reservations', value: totalToday ?? 0, icon: '📅', gradient: 'from-violet-600 to-indigo-600' },
    { label: 'Active Tables', value: totalTables ?? 0, icon: '🪑', gradient: 'from-emerald-600 to-teal-600' },
    { label: 'Staff Members', value: totalStaff ?? 0, icon: '👥', gradient: 'from-amber-600 to-orange-600' },
    { label: 'Pending', value: pendingCount ?? 0, icon: '⏳', gradient: 'from-rose-600 to-pink-600' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link href="/dashboard/reservations/new"
          className={cn(buttonVariants(), 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 shadow-lg shadow-violet-500/25')}>
          + New Booking
        </Link>
      </div>

      {/* Bento Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-slate-900/50 border-slate-800 overflow-hidden relative group hover:border-slate-700 transition-all duration-200 hover:-translate-y-0.5">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
            <CardContent className="p-6 relative">
              <div className="text-3xl mb-3">{stat.icon}</div>
              <div className="text-4xl font-bold text-white tabular-nums">{stat.value}</div>
              <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Upcoming Reservations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-slate-900/50 border-slate-800 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-white">Upcoming Reservations</CardTitle>
              <Link href="/dashboard/reservations"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-slate-400 hover:text-white text-xs')}>
                View all →
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingReservations.length > 0 ? (
                <div className="space-y-3">
                  {upcomingReservations.map((res) => {
                    const timeStr = res.reservation_time?.replace(/[[\]()]/g, '').split(',')[0]?.trim()
                    return (
                      <div key={res.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/20 flex items-center justify-center text-lg flex-shrink-0">
                          👤
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{res.guest_name}</p>
                          <p className="text-xs text-slate-500">
                            {res.physical_tables?.table_name ?? '—'} · {res.party_size} guests
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <Badge className={`text-xs ${statusColors[res.status] ?? ''}`}>{res.status}</Badge>
                          {timeStr && (
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500 text-sm">No upcoming reservations</p>
                  <Link href="/dashboard/reservations/new"
                    className={cn(buttonVariants({ size: 'sm' }), 'mt-4 bg-gradient-to-r from-violet-600 to-indigo-600 border-0')}>
                    Create first booking
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Activity */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingReservations.slice(0, 6).map((res, i) => (
                <div key={res.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/50 transition-all duration-300">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600/40 to-indigo-600/40 border border-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-300 flex-shrink-0">
                    {res.guest_name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate font-medium">{res.guest_name}</p>
                    <p className="text-xs text-slate-500">{res.party_size} guests</p>
                  </div>
                  <Badge className={`text-xs ${statusColors[res.status] ?? ''} flex-shrink-0`}>{res.status}</Badge>
                </div>
              ))}
              {!upcomingReservations.length && (
                <p className="text-slate-500 text-xs text-center py-6">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
