import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { CreateTableDialog } from './CreateTableDialog'
import { cn } from '@/lib/utils'
import type { Tables } from '@/lib/types/database'
import Link from 'next/link'
import { BarChart3 } from 'lucide-react'
import { getTerms } from '@/lib/business-type'
import type { BusinessType } from '@/lib/business-type'

export const metadata = { title: 'Tables — TableBook' }

export default async function TablesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membershipRaw } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id, restaurants(business_type)')
    .eq('user_id', user.id)
    .single()

  const membership = membershipRaw as Tables<'account_memberships'> & { restaurants: { business_type: string } | null } | null
  const isAdmin = membership?.role === 'admin'
  const isStaff = membership?.role === 'staff'
  const businessType = (membership?.restaurants?.business_type ?? 'restaurant') as BusinessType
  const terms = getTerms(businessType)

  if (!isAdmin && !isStaff) redirect('/dashboard')

  const { data: raw } = await supabase
    .from('physical_tables')
    .select('*')
    .eq('restaurant_id', membership.restaurant_id!)
    .order('table_name')

  const tables = (raw ?? []) as Tables<'physical_tables'>[]

  // ── Busy = has pending OR confirmed reservation ANYWHERE today ─────────────
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  // Format as a tsrange that covers all of today
  const todayRange = `["${todayStart.toISOString()}","${todayEnd.toISOString()}"]`

  const { data: busyRows } = await supabase
    .from('reservations')
    .select('table_id, guest_name, status')
    .eq('restaurant_id', membership.restaurant_id!)
    .in('status', ['pending', 'confirmed'])       // completed/cancelled = free
    .filter('reservation_time', 'ov', todayRange) // has a booking today

  const busyMap = new Map<string, { guestName: string; status: string }>()
  for (const row of busyRows ?? []) {
    if (row.table_id) {
      busyMap.set(row.table_id, { guestName: row.guest_name, status: row.status })
    }
  }

  const freeTables  = tables.filter(t => !busyMap.has(t.id) && t.is_active).length
  const busyTables  = tables.filter(t =>  busyMap.has(t.id)).length

  return (
    <div className="space-y-5 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-slate-400 text-sm">{tables.length} {terms.unitsLower} total · today</p>
          <p className="text-xs text-slate-500 mt-0.5">
            <span className="text-emerald-400 font-bold">{freeTables} free</span>
            {busyTables > 0 && <span className="text-rose-400 font-bold"> · {busyTables} busy today</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/dashboard/reports"
              className="flex items-center gap-1.5 h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 text-xs font-bold hover:border-violet-500/50 hover:text-violet-300 transition-all"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Reports
            </Link>
          )}
          {isAdmin && <CreateTableDialog businessType={businessType} />}
        </div>
      </div>

      {/* Summary strip */}
      <div className="flex gap-3">
        <div className="flex-1 bg-slate-900 border border-emerald-500/20 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-sm">✅</div>
          <div>
            <p className="text-xl font-black text-white">{freeTables}</p>
            <p className="text-xs text-slate-400">Free Today</p>
          </div>
        </div>
        <div className="flex-1 bg-slate-900 border border-rose-500/20 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center text-sm">🔴</div>
          <div>
            <p className="text-xl font-black text-white">{busyTables}</p>
            <p className="text-xs text-slate-400">Busy Today</p>
          </div>
        </div>
      </div>

      {/* Table Grid */}
      {tables.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {tables.map(t => {
            const busyInfo = busyMap.get(t.id)
            const isBusy    = !!busyInfo
            const isOffline = !t.is_active
            const isTappable = !isBusy && !isOffline

            const card = (
              <div className={cn(
                'relative p-4 rounded-2xl border-2 flex flex-col gap-2 transition-all',
                isOffline
                  ? 'bg-slate-950 border-slate-800 opacity-50'
                  : isBusy
                    ? 'bg-rose-500/5 border-rose-500/30'
                    : 'bg-slate-900 border-emerald-500/20 hover:border-emerald-400/60 hover:bg-slate-800/80 active:scale-[0.97]'
              )}>
                {/* Status dot */}
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'w-2.5 h-2.5 rounded-full flex-shrink-0',
                    isOffline ? 'bg-slate-600'
                      : isBusy    ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse'
                      : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  )} />
                  {isOffline && <span className="text-[10px] text-slate-500 font-bold uppercase">Offline</span>}
                </div>

                {/* Table Name */}
                <p className={cn('text-2xl font-black', isOffline ? 'text-slate-600' : isBusy ? 'text-rose-200' : 'text-white')}>
                  {t.table_name}
                </p>

                {/* Capacity */}
                <p className={cn('text-xs font-semibold', isOffline ? 'text-slate-600' : 'text-slate-400')}>
                  Up to {t.capacity} people
                </p>

                {/* Status label */}
                <Badge className={cn(
                  'text-[11px] font-bold w-fit px-2 py-0.5 rounded-lg border',
                  isOffline ? 'bg-slate-800 text-slate-500 border-slate-700'
                    : isBusy  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                )}>
                  {isOffline ? 'Offline' : isBusy ? 'Busy Today' : 'Free'}
                </Badge>

                {/* Guest name if busy */}
                {isBusy && busyInfo?.guestName && (
                  <p className="text-[10px] text-rose-400/80 font-semibold truncate mt-0.5">
                    👤 {busyInfo.guestName}
                  </p>
                )}

                {/* Tap to book hint */}
                {isTappable && (
                  <p className="text-[10px] text-emerald-500/50 font-bold mt-auto pt-1 flex items-center gap-1">
                    Tap to book <span>→</span>
                  </p>
                )}
              </div>
            )

            return isTappable ? (
              <Link key={t.id} href={`/dashboard/reservations/new?tableId=${t.id}`}>
                {card}
              </Link>
            ) : (
              <div key={t.id}>{card}</div>
            )
          })}
        </div>

      ) : (
        <div className="text-center py-16 bg-slate-900 rounded-2xl border border-slate-800">
          <div className="text-5xl mb-4">{terms.emoji}</div>
          <p className="text-slate-300 font-bold text-base">No {terms.unitsLower} yet</p>
          <p className="text-slate-500 text-sm mt-1 mb-6">Add your first {terms.unitLower} to get started</p>
          {isAdmin && <CreateTableDialog businessType={businessType} />}
        </div>
      )}

      {/* Note */}
      <p className="text-center text-xs text-slate-600 pb-2">
        A {terms.unitLower} shows Busy if it has a pending or confirmed {terms.bookingLower} today. 
        It becomes Free when the {terms.bookingLower} is marked Done or Cancelled.
      </p>
    </div>
  )
}
