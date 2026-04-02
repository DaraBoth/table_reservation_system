import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Tables } from '@/lib/types/database'
import { parseTsRange } from '@/lib/utils' // Removed
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ChevronLeft, Table2, User, BarChart2 } from 'lucide-react'

export const metadata = { title: 'Reports — TableBook' }

interface Props {
  searchParams: Promise<{ period?: string }>
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
  const { period = 'week' } = await searchParams

  // ── Date range ─────────────────────────────────────────────────────────────
  const now = new Date()
  const rangeStart = new Date(now)

  if (period === 'today') {
    rangeStart.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    rangeStart.setDate(now.getDate() - 6)
    rangeStart.setHours(0, 0, 0, 0)
  } else if (period === 'month') {
    rangeStart.setDate(1)
    rangeStart.setHours(0, 0, 0, 0)
  }

  const rangeEnd = new Date(now)
  
  const startIso = rangeStart.getFullYear() + '-' + String(rangeStart.getMonth()+1).padStart(2,'0') + '-' + String(rangeStart.getDate()).padStart(2,'0')
  const endIso = rangeEnd.getFullYear() + '-' + String(rangeEnd.getMonth()+1).padStart(2,'0') + '-' + String(rangeEnd.getDate()).padStart(2,'0')

  // ── Fetch reservations in period ───────────────────────────────────────────
  const { data: resRaw } = await supabase
    .from('reservations')
    .select('*, physical_tables(table_name, capacity)')
    .eq('restaurant_id', rid)
    .gte('reservation_date', startIso)
    .lte('reservation_date', endIso)
    .order('created_at', { ascending: false })

  type ResWithTable = Tables<'reservations'> & {
    physical_tables: { table_name: string; capacity: number } | null
  }
  const reservations = (resRaw ?? []) as unknown as ResWithTable[]

  // ── Compute stats ──────────────────────────────────────────────────────────
  const total = reservations.length
  const totalPeople = reservations.reduce((s, r) => s + (r.party_size || 0), 0)
  const confirmed = reservations.filter(r => r.status === 'confirmed' || r.status === 'arrived').length
  const cancelled = reservations.filter(r => r.status === 'cancelled').length
  const completed = reservations.filter(r => r.status === 'completed').length

  // Top tables
  const tableCount = new Map<string, { name: string; count: number; people: number }>()
  for (const r of reservations) {
    if (!r.table_id || r.status === 'cancelled') continue
    const name = r.physical_tables?.table_name ?? r.table_id
    const prev = tableCount.get(r.table_id) ?? { name, count: 0, people: 0 }
    tableCount.set(r.table_id, {
      name,
      count: prev.count + 1,
      people: prev.people + (r.party_size || 0)
    })
  }
  const topTables = Array.from(tableCount.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Top customers
  const customerCount = new Map<string, { count: number; phone: string }>()
  for (const r of reservations) {
    if (r.status === 'cancelled') continue
    const prev = customerCount.get(r.guest_name) ?? { count: 0, phone: r.guest_phone ?? '' }
    customerCount.set(r.guest_name, { count: prev.count + 1, phone: r.guest_phone ?? prev.phone })
  }
  const topCustomers = Array.from(customerCount.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const maxTableCount = topTables[0]?.count ?? 1
  const maxCustomerCount = topCustomers[0]?.count ?? 1

  const periodLabel = period === 'today' ? 'Today' : period === 'week' ? 'Last 7 days' : 'This month'

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header + back */}
      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/dashboard/tables"
          className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">Booking Report</h1>
          <p className="text-slate-400 text-xs mt-0.5">{periodLabel} · {total} bookings</p>
        </div>
      </div>

      {/* Period filter tabs */}
      <div className="flex gap-2 bg-slate-900 p-1.5 rounded-2xl">
        {[
          { value: 'today', label: 'Today' },
          { value: 'week',  label: 'Last 7 days' },
          { value: 'month', label: 'This month' },
        ].map(opt => (
          <Link
            key={opt.value}
            href={`/dashboard/reports?period=${opt.value}`}
            className={cn(
              'flex-1 text-center py-2.5 rounded-xl text-sm font-bold transition-all',
              period === opt.value
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                : 'text-slate-400 hover:text-white'
            )}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Summary numbers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
          <p className="text-3xl font-black text-white">{total}</p>
          <p className="text-xs text-slate-400 font-semibold">Total Bookings</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
          <p className="text-3xl font-black text-white">{totalPeople}</p>
          <p className="text-xs text-slate-400 font-semibold">Total Guests</p>
        </div>
        <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-4 flex flex-col gap-1">
          <p className="text-3xl font-black text-emerald-400">{confirmed}</p>
          <p className="text-xs text-slate-400 font-semibold">Confirmed</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="text-3xl font-black text-slate-300">{completed}</p>
            <p className="text-lg font-bold text-red-400">/ {cancelled}</p>
          </div>
          <p className="text-xs text-slate-400 font-semibold">Done / Cancelled</p>
        </div>
      </div>

      {/* Top Tables */}
      {topTables.length > 0 && (
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Table2 className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-black text-white">Most Booked Tables</h2>
          </div>
          <div className="space-y-3">
            {topTables.map((t, i) => (
              <div key={t.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-black text-slate-400">
                      {i + 1}
                    </span>
                    <span className="font-bold text-white">{t.name}</span>
                    <span className="text-slate-500 text-xs">· {t.people} guests</span>
                  </div>
                  <span className="font-black text-violet-400">{t.count}×</span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all"
                    style={{ width: `${(t.count / maxTableCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top Customers */}
      {topCustomers.length > 0 && (
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-black text-white">Most Frequent Customers</h2>
          </div>
          <div className="space-y-3">
            {topCustomers.map((c, i) => (
              <div key={`${c.name}-${c.phone}-${i}`} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-black text-slate-400">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-bold text-white leading-tight">{c.name}</p>
                      {c.phone && <p className="text-xs text-slate-500">{c.phone}</p>}
                    </div>
                  </div>
                  <span className="font-black text-emerald-400">{c.count}×</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all"
                    style={{ width: `${(c.count / maxCustomerCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Booking History list */}
      {reservations.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">
            Booking History ({total})
          </h2>
          <div className="space-y-2">
            {reservations.map(res => {
              const start = new Date(`${res.reservation_date}T${res.start_time}`)
              const timeStr = start
                ? new Date(start).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })
                : null

              return (
                <div key={res.id} className="flex items-center gap-3 p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/25 to-indigo-600/25 border border-violet-500/15 flex items-center justify-center text-sm font-black text-violet-300 flex-shrink-0">
                    {res.guest_name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{res.guest_name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {res.physical_tables?.table_name ?? '—'} · {res.party_size}p
                      {timeStr ? ` · ${timeStr}` : ''}
                    </p>
                  </div>
                  <Badge className={cn('text-[10px] font-bold px-2 py-0.5 border rounded-lg flex-shrink-0', statusColors[res.status] ?? '')}>
                    {statusLabels[res.status] ?? res.status}
                  </Badge>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {total === 0 && (
        <div className="text-center py-16 bg-slate-900 rounded-3xl border border-slate-800">
          <div className="mb-4 flex justify-center">
            <BarChart2 className="w-12 h-12 text-slate-600" />
          </div>
          <p className="text-slate-300 font-bold">No bookings in this period</p>
          <p className="text-slate-500 text-sm mt-1">Try selecting a different time range</p>
        </div>
      )}
    </div>
  )
}
