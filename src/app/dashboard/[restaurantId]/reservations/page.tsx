import { getActiveRestaurant } from '@/lib/restaurant-context'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import { format } from 'date-fns'
import type { BusinessType } from '@/lib/business-type'
import { ReservationsClient } from './ReservationsClient'
import type { Tables } from '@/lib/types/database'
import { createPrivateMetadata } from '@/lib/seo'
import { getServerT } from '@/i18n/server'

type Reservation = Tables<'reservations'> & {
  physical_tables: Pick<Tables<'physical_tables'>, 'table_name' | 'capacity'> | null
  profiles?: { full_name: string | null } | null
}

export async function generateMetadata() {
  const { t } = await getServerT()
  return createPrivateMetadata(
    t('meta.bookingsTitle', { defaultValue: 'Bookings' }),
    t('meta.bookingsDescription', { defaultValue: 'Manage reservations, statuses, and daily service flow.' })
  )
}

export default async function ReservationsPage({ params, searchParams }: { params: Promise<{ restaurantId: string }>, searchParams: Promise<{ date?: string }> }) {
  await getServerT()
  const { restaurantId } = await params
  const supabase = await createClient()
  const user = await getCachedUser()
  if (!user) return null

  const res = await getActiveRestaurant(restaurantId)
  if (!res) return null
  const membershipRaw = res.membership

  const membership = membershipRaw as {
    restaurant_id?: string | null
    restaurants?: { business_type?: string | null } | null
  } | null
  if (!membership?.restaurant_id) return null

  const businessType = (membership.restaurants?.business_type ?? 'restaurant') as BusinessType

  const { date } = await searchParams
  const todayIso = format(new Date(), 'yyyy-MM-dd')
  const initialDate = date || todayIso

  // Fetch tables (for the Share Status report) and the initial bookings list
  // in parallel — these two queries are independent of each other.
  const [{ data: tableData }, { data: allBookings }] = await Promise.all([
    supabase
      .from('physical_tables')
      .select('*, zones(*)')
      .eq('restaurant_id', membership.restaurant_id)
      .eq('is_active', true),
    // Anyone who is IN-HOUSE on the selected date
    supabase
      .from('reservations')
      .select('*, physical_tables(table_name, capacity, zones(name)), profiles(full_name)')
      .eq('restaurant_id', membership.restaurant_id!)
      .lte('reservation_date', initialDate)
      .gte('checkout_date', initialDate)
      .order('created_at', { ascending: false }),
  ])

  const tables = tableData || []


  return (
    <div className="max-w-6xl mx-auto pb-24 md:pb-6">
      <ReservationsClient
        initialBookings={(allBookings ?? []) as Reservation[]}
        restaurantId={membership.restaurant_id}
        currentSlug={res.activeSlug}
        currentUserId={user.id}
        initialDate={initialDate}
        todayIso={todayIso}
        businessType={businessType}
        tables={tables}
      />
    </div>
  )
}
