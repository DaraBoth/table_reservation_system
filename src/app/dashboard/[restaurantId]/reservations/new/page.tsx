import { getActiveRestaurant } from '@/lib/restaurant-context'
import { createClient } from '@/lib/supabase/server'
import { CreateReservationForm } from './CreateReservationForm'
import type { BusinessType } from '@/lib/business-type'
import { createPrivateMetadata } from '@/lib/seo'
import { getServerT } from '@/i18n/server'

export const metadata = createPrivateMetadata('New Booking', 'Create a new reservation for a guest or walk-in.')

export default async function NewReservationPage({ params, searchParams }: { params: Promise<{ restaurantId: string }>, searchParams: Promise<{ tableId?: string }> }) {
  const { t } = await getServerT()
  const { restaurantId: routeId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const res = await getActiveRestaurant(routeId)
  if (!res) return <div>{t('dashboard.noRestaurantMembership', { defaultValue: 'Error: No restaurant membership found.' })}</div>
  
  const membership = res.membership as any
  const restaurantId = membership.restaurant_id
  const businessType = (membership.restaurants?.business_type as BusinessType) || 'restaurant'

  const { data: tableData } = await supabase
    .from('physical_tables')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
  
  const { data: zones } = await supabase
    .from('zones')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('sort_order', { ascending: true })

  const tables = tableData || []

  // Read pre-selected table from URL param (e.g., tapped from Tables page)
  const { tableId } = await searchParams

  return (
    <CreateReservationForm
      tables={tables ?? []}
      zones={zones ?? []}
      restaurantId={restaurantId}
      preSelectedTableId={tableId}
      businessType={businessType}
    />
  )
}
