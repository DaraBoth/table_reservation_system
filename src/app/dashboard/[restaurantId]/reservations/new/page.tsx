import { getActiveRestaurant } from '@/lib/restaurant-context'
import { getCachedUser } from '@/lib/supabase/server'
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
  const user = await getCachedUser()
  if (!user) return null

  const res = await getActiveRestaurant(routeId)
  if (!res) return <div>{t('dashboard.noRestaurantMembership', { defaultValue: 'Error: No restaurant membership found.' })}</div>

  const membership = res.membership as any
  const restaurantId = membership.restaurant_id
  const businessType = (membership.restaurants?.business_type as BusinessType) || 'restaurant'

  // Read pre-selected table from URL param (e.g., tapped from Tables page)
  const { tableId } = await searchParams

  // Deliberately NOT fetching tables/zones here. This page now depends only
  // on the already-cached auth/membership lookup, so it renders instantly —
  // the form fetches tables/zones itself client-side after mount, showing a
  // loading state only in the table-picker grid instead of blocking the
  // whole page (see getTablesAndZonesForBooking in actions/tables.ts).
  return (
    <CreateReservationForm
      restaurantId={restaurantId}
      preSelectedTableId={tableId}
      businessType={businessType}
    />
  )
}
