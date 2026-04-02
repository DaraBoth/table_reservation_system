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
  const today = new Date()
  const todayIso = format(today, 'yyyy-MM-dd')
  const yesterdayIso = format(subDays(today, 1), 'yyyy-MM-dd')
  const archiveDate = date || yesterdayIso

  // Initial Fetch: Today's Active
  const { data: initialActive } = await supabase
    .from('reservations')
    .select('*, physical_tables(table_name, capacity)')
    .eq('restaurant_id', membership.restaurant_id)
    .eq('reservation_date', todayIso)
    .in('status', ['pending', 'confirmed', 'arrived'])
    .order('start_time', { ascending: true })

  // Initial Fetch: Archive Day
  const { data: initialArchive } = await supabase
    .from('reservations')
    .select('*, physical_tables(table_name, capacity)')
    .eq('restaurant_id', membership.restaurant_id)
    .eq('reservation_date', archiveDate)
    .order('start_time', { ascending: true })

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <ReservationsClient
        initialActive={(initialActive ?? []) as any}
        initialArchive={(initialArchive ?? []) as any}
        restaurantId={membership.restaurant_id}
        archiveDate={archiveDate}
        businessType={businessType}
      />
    </div>
  )
}
