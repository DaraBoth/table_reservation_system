import { getActiveRestaurant } from '@/lib/restaurant-context'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import { CreateReservationForm } from './CreateReservationForm'
import type { BusinessType } from '@/lib/business-type'
import { createPrivateMetadata } from '@/lib/seo'
import { getServerT } from '@/i18n/server'

export async function generateMetadata() {
  const { t } = await getServerT()
  return createPrivateMetadata(
    t('meta.newBookingTitle', { defaultValue: 'New Booking' }),
    t('meta.newBookingDescription', { defaultValue: 'Create a new reservation for a guest or walk-in.' })
  )
}

export default async function NewReservationPage({ params, searchParams }: { params: Promise<{ restaurantId: string }>, searchParams: Promise<{ tableId?: string }> }) {
  const { t } = await getServerT()
  const { restaurantId: routeId } = await params
  const supabase = await createClient()
  const user = await getCachedUser()
  if (!user) return null

  const res = await getActiveRestaurant(routeId)
  if (!res) return <div>{t('dashboard.noRestaurantMembership', { defaultValue: 'Error: No restaurant membership found.' })}</div>

  const membership = res.membership as any
  const restaurantId = membership.restaurant_id
  const businessType = (membership.restaurants?.business_type as BusinessType) || 'restaurant'

  // Independent queries — run in parallel, in the same request as the
  // (already-cached) auth/membership lookup above. A separate client-side
  // fetch was tried here and reverted: it can't share this request's
  // memoized auth check, so it paid for a second full auth+membership
  // round-trip after hydration instead of piggybacking on this one — net
  // slower, not faster. One request, in parallel, is the fastest this gets.
  const [{ data: tableData }, { data: zones }] = await Promise.all([
    supabase
      .from('physical_tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true),
    supabase
      .from('zones')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('sort_order', { ascending: true }),
  ])

  const tables = tableData || []

  // Read pre-selected table from URL param (e.g., tapped from Tables page)
  const { tableId } = await searchParams

  return (
    <CreateReservationForm
      tables={tables}
      zones={zones ?? []}
      restaurantId={restaurantId}
      preSelectedTableId={tableId}
      businessType={businessType}
    />
  )
}
