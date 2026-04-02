import { createClient } from '@/lib/supabase/server'
import { format, subDays } from 'date-fns'
import { getTerms } from '@/lib/business-type'
import type { BusinessType } from '@/lib/business-type'
import { ReservationsClient } from './ReservationsClient'
import type { Tables } from '@/lib/types/database'

export const metadata = { title: 'Bookings — TableBook' }

interface Props {
  searchParams: Promise<{ date?: string }>
}

export default async function ReservationsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membershipRaw } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id, restaurants(business_type)')
    .eq('user_id', user.id)
    .single()

  const membership = membershipRaw as any
  if (!membership?.restaurant_id) return null

  const businessType = (membership.restaurants?.business_type ?? 'restaurant') as BusinessType
  const terms = getTerms(businessType)

  const { date } = await searchParams
  const todayIso = format(new Date(), 'yyyy-MM-dd')
  const initialDate = date || todayIso
  const todayStr = todayIso

  // Initial Fetch: Anyone who is IN-HOUSE on the selected date
  const { data: allBookings } = await supabase
    .from('reservations')
    .select('*, physical_tables(table_name, capacity)')
    .eq('restaurant_id', membership.restaurant_id!)
    .lte('reservation_date', initialDate)
    .gte('checkout_date', initialDate)
    .order('start_time', { ascending: true })

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <ReservationsClient
        initialBookings={(allBookings ?? []) as any}
        restaurantId={membership.restaurant_id}
        initialDate={initialDate}
        businessType={businessType}
      />
    </div>
  )
}
