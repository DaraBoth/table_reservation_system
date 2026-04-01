import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ReservationForm } from '@/components/restaurant/reservation-form'
import { parseTsRange } from '@/lib/utils'
import type { Tables } from '@/lib/types/database'
import type { BusinessType } from '@/lib/business-type'
import { CancelReservationButton, UpdateStatusButton } from '../../ReservationActions'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Edit Booking — TableBook' }

interface Props {
  params: Promise<{ id: string }>
}

const statusColors: Record<string, string> = {
  pending:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  completed: 'bg-slate-600/40 text-slate-300 border-slate-700',
  no_show:   'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

const statusLabels: Record<string, string> = {
  pending:   'Waiting',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Done',
  no_show:   'No Show',
}

export default async function EditReservationPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('restaurant_id, role, restaurants(business_type)')
    .eq('user_id', user.id)
    .single()

  const businessType = ((membership as any)?.restaurants?.business_type ?? 'restaurant') as BusinessType

  if (!membership?.restaurant_id) redirect('/dashboard')

  const { data: reservation } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', id)
    .eq('restaurant_id', membership.restaurant_id)
    .single()

  if (!reservation) notFound()

  const { data: tables } = await supabase
    .from('physical_tables')
    .select('*')
    .eq('restaurant_id', membership.restaurant_id)
    .eq('is_active', true)
    .order('table_name')

  const { start, end } = parseTsRange(reservation.reservation_time)

  if (!start) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-2xl">⚠️</p>
        <h2 className="text-base font-bold text-white">Invalid booking data</h2>
        <p className="text-slate-500 text-sm">The time format for this booking is broken.</p>
      </div>
    )
  }

  const isAdmin = membership.role === 'admin'
  const canCancel = !['cancelled', 'completed'].includes(reservation.status)

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Quick Actions bar — only visible when booking is still active */}
      {canCancel && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">

          {/* Status section */}
          {isAdmin && (
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Change Status</p>
                <Badge className={cn('text-xs font-black px-3 py-1 border rounded-xl', statusColors[reservation.status] ?? '')}>
                  {statusLabels[reservation.status] ?? reservation.status}
                </Badge>
              </div>
              <UpdateStatusButton reservationId={reservation.id} currentStatus={reservation.status} />
            </div>
          )}

          {/* Cancel — danger zone at bottom */}
          <div className={cn('p-4', isAdmin && 'border-t border-slate-800')}>
            {!isAdmin && (
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Current Status</p>
                <Badge className={cn('text-xs font-black px-3 py-1 border rounded-xl', statusColors[reservation.status] ?? '')}>
                  {statusLabels[reservation.status] ?? reservation.status}
                </Badge>
              </div>
            )}
            <CancelReservationButton reservationId={reservation.id} />
          </div>
        </div>
      )}

      {/* Edit Form */}
      <ReservationForm
        tables={tables || []}
        restaurantId={membership.restaurant_id}
        initialData={{ ...reservation, start_time: start, end_time: end || undefined }}
        businessType={businessType}
      />
    </div>
  )
}
