import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ReservationForm } from '@/components/restaurant/reservation-form'
import { parseTsRange } from '@/lib/utils'
import type { Tables } from '@/lib/types/database'

export const metadata = { title: 'Edit Booking — TableBook' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditReservationPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Get Membership
  const { data: membership } = await supabase
    .from('account_memberships')
    .select('restaurant_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership?.restaurant_id) redirect('/dashboard')

  // 2. Get Reservation
  const { data: reservation } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', id)
    .eq('restaurant_id', membership.restaurant_id)
    .single()

  if (!reservation) notFound()

  // 3. Get Tables for the Grid
  const { data: tables } = await supabase
    .from('physical_tables')
    .select('*')
    .eq('restaurant_id', membership.restaurant_id)
    .eq('is_active', true)
    .order('table_name')

  // Parse start_time for the form
  const { start } = parseTsRange(reservation.reservation_time)
  
  if (!start) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Corrupt Booking Data</h2>
        <p className="text-slate-500 text-sm">The reservation time format is invalid and cannot be edited.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <ReservationForm 
        tables={tables || []} 
        restaurantId={membership.restaurant_id} 
        initialData={{ 
          ...reservation, 
          start_time: start 
        }} 
      />
    </div>
  )
}
