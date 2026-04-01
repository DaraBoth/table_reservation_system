import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button-variants'
import { parseTsRange } from '@/lib/utils' // removed from use
import type { Tables } from '@/lib/types/database'
import { Plus, ChevronRight, ClipboardList, Calendar } from 'lucide-react'
import { getTerms } from '@/lib/business-type'
import type { BusinessType } from '@/lib/business-type'

export const metadata = { title: 'Bookings — TableBook' }

const statusColors: Record<string, string> = {
  pending:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  arrived:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  completed: 'bg-slate-600/40 text-slate-300 border-slate-700',
  no_show:   'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

const statusLabels: Record<string, string> = {
  pending:   'Waiting',
  confirmed: 'Confirmed',
  arrived:   'Arrived',
  cancelled: 'Cancelled',
  completed: 'Done',
  no_show:   'No Show',
}

// Dot color for the avatar glow
const statusDots: Record<string, string> = {
  pending:   'bg-amber-400',
  confirmed: 'bg-emerald-400',
  arrived:   'bg-blue-400',
  cancelled: 'bg-red-400',
  completed: 'bg-slate-400',
  no_show:   'bg-orange-400',
}

// Avatar gradient per status
const statusAvatarBg: Record<string, string> = {
  pending:   'from-amber-600/30 to-orange-600/30 border-amber-500/20',
  confirmed: 'from-emerald-600/30 to-teal-600/30 border-emerald-500/20',
  arrived:   'from-blue-600/30 to-indigo-600/30 border-blue-500/20',
  cancelled: 'from-red-600/20 to-rose-600/20 border-red-500/20',
  completed: 'from-slate-600/30 to-slate-700/30 border-slate-600/20',
  no_show:   'from-orange-600/30 to-amber-600/30 border-orange-500/20',
}

export default async function ReservationsPage() {
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

  const businessType = (membership.restaurants?.business_type ?? 'restaurant') as BusinessType
  const terms = getTerms(businessType)

  const { data: raw } = await supabase
    .from('reservations')
    .select('*, physical_tables(table_name, capacity)')
    .eq('restaurant_id', membership.restaurant_id)
    .order('created_at', { ascending: false })
    .limit(50)

  const reservations = (raw ?? []) as unknown as Array<
    Tables<'reservations'> & { physical_tables: Pick<Tables<'physical_tables'>, 'table_name' | 'capacity'> | null }
  >

  const active = reservations.filter(r => !['cancelled', 'completed'].includes(r.status))
  const done   = reservations.filter(r => ['cancelled', 'completed'].includes(r.status))

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-black text-white italic tracking-tight uppercase">
            {terms.bookings}
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/dashboard/reservations/new"
          className={cn(
            buttonVariants({ size: 'sm' }),
            'bg-gradient-to-r from-violet-600 to-indigo-600 border-0 rounded-xl gap-1.5 font-bold shadow-lg shadow-violet-500/20 h-10 px-4'
          )}
        >
          <Plus className="w-4 h-4" /> New {terms.booking}
        </Link>
      </div>

      <p className="text-slate-400 text-xs font-semibold px-1">
        Showing {reservations.length} {terms.bookingsLower} total
      </p>

      {/* Active bookings */}
      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Active</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {active.map(res => <BookingCard key={res.id} res={res} />)}
          </div>
        </section>
      )}

      {/* Past bookings */}
      {done.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Past</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 opacity-60">
            {done.map(res => <BookingCard key={res.id} res={res} />)}
          </div>
        </section>
      )}

      {/* Empty state */}
      {reservations.length === 0 && (
        <div className="text-center py-16 bg-slate-900 rounded-3xl border border-slate-800">
          <div className="mb-4 flex justify-center">
            <ClipboardList className="w-12 h-12 text-slate-600" />
          </div>
          <p className="text-slate-300 font-bold text-base">No {terms.bookingsLower} yet</p>
          <p className="text-slate-500 text-sm mt-1 mb-6">Add your first {terms.bookingLower} now</p>
          <Link
            href="/dashboard/reservations/new"
            className={cn(buttonVariants(), 'bg-gradient-to-r from-violet-600 to-indigo-600 border-0 rounded-xl font-bold')}
          >
            + New {terms.booking}
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Booking Card ──────────────────────────────────────────────────────────────
function BookingCard({
  res
}: {
  res: Tables<'reservations'> & { physical_tables: Pick<Tables<'physical_tables'>, 'table_name' | 'capacity'> | null }
}) {
  const start = new Date(`${res.reservation_date}T${res.start_time}`)
  const canEdit = !['cancelled', 'completed'].includes(res.status)

  const dayStr = start
    ? new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null
  const timeStr = start
    ? new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  const card = (
    <div className={cn(
      'relative flex flex-col gap-3 p-4 rounded-3xl border-2 transition-all',
      canEdit
        ? 'bg-slate-900 border-slate-800 hover:border-slate-600 active:scale-[0.97]'
        : 'bg-slate-900/50 border-slate-800/50'
    )}>
      {/* Status badge — top right */}
      <div className="flex items-start justify-between gap-2">
        <div className={cn(
          'w-12 h-12 rounded-2xl bg-gradient-to-br border flex items-center justify-center text-xl font-black text-white flex-shrink-0',
          statusAvatarBg[res.status] ?? 'from-violet-600/30 to-indigo-600/30 border-violet-500/20'
        )}>
          {res.guest_name.slice(0, 1).toUpperCase()}
        </div>

        <Badge className={cn(
          'text-[10px] font-black px-2 py-0.5 border rounded-xl whitespace-nowrap leading-none',
          statusColors[res.status] ?? ''
        )}>
          {statusLabels[res.status] ?? res.status}
        </Badge>
      </div>

      {/* Name */}
      <div>
        <p className="text-sm font-black text-white leading-tight truncate">{res.guest_name}</p>
        {res.guest_phone && (
          <p className="text-xs text-slate-500 mt-0.5 truncate">{res.guest_phone}</p>
        )}
      </div>

      {/* Table + party */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="bg-slate-800 px-2 py-0.5 rounded-lg font-semibold text-slate-300 truncate max-w-[60px]">
          {res.physical_tables?.table_name ?? '—'}
        </span>
        {/* Only show party size for restaurants, not hotels (which don't track it) */}
        {res.party_size && res.party_size > 0 && (
          <>
            <span className="text-slate-600">·</span>
            <span>{res.party_size}p</span>
          </>
        )}
      </div>

      {/* Date/time */}
      {dayStr && (
        <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
          <Calendar className="w-3 h-3" /> {dayStr}{timeStr && ` · ${timeStr}`}
        </p>
      )}

      {/* Tap hint for editable cards */}
      {canEdit && (
        <div className="flex items-center justify-end">
          <span className="text-[10px] text-slate-600 font-semibold flex items-center gap-0.5">
            Tap to manage <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      )}
    </div>
  )

  // Wrap in a link if can be edited
  if (canEdit) {
    return (
      <Link href={`/dashboard/reservations/${res.id}/edit`}>
        {card}
      </Link>
    )
  }

  return card
}
