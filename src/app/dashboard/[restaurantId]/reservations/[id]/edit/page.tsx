import { getActiveRestaurant } from '@/lib/restaurant-context'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ReservationForm } from '@/components/restaurant/reservation-form'
import type { Tables } from '@/lib/types/database'
import type { BusinessType } from '@/lib/business-type'
import { CancelReservationButton, UpdateStatusButton } from '../../ReservationActions'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Edit Booking — TableBook' }

interface Props {
  params: Promise<{ id: string, restaurantId: string }>
}

const statusColors: Record<string, string> = {
  pending:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  completed: 'bg-muted/60/40 text-foreground/70 border-border',
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
  const { id, restaurantId: routeId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const res = await getActiveRestaurant(routeId)
  if (!res) redirect('/dashboard')

  const membership = res.membership as any
  const businessType = (membership?.restaurants?.business_type ?? 'restaurant') as BusinessType


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

  const start = new Date(`${reservation.reservation_date}T${reservation.start_time}`)
  const end = new Date(`${reservation.reservation_date}T${reservation.end_time}`)

  if (isNaN(start.getTime())) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-2xl">⚠️</p>
        <h2 className="text-base font-bold text-foreground">Invalid booking data</h2>
        <p className="text-muted-foreground text-sm">The time format for this booking is broken.</p>
      </div>
    )
  }

  const isAdmin = membership.role === 'admin'
  const canCancel = !['cancelled', 'completed'].includes(reservation.status)

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Quick Actions bar — only visible when booking is still active */}
      {canCancel && (
        <div className="bg-card border border-border rounded-3xl overflow-hidden">

          {/* Status section */}
          {isAdmin && (
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Change Status</p>
                <Badge className={cn('text-xs font-black px-3 py-1 border rounded-xl', statusColors[reservation.status] ?? '')}>
                  {statusLabels[reservation.status] ?? reservation.status}
                </Badge>
              </div>
              <UpdateStatusButton reservationId={reservation.id} currentStatus={reservation.status} />
            </div>
          )}

          {/* Cancel — danger zone at bottom */}
          <div className={cn('p-4', isAdmin && 'border-t border-border')}>
            {!isAdmin && (
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Current Status</p>
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
