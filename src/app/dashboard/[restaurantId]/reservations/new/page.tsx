import { getActiveRestaurant } from '@/lib/restaurant-context'
import { createClient } from '@/lib/supabase/server'
import { CreateReservationForm } from './CreateReservationForm'
import type { BusinessType } from '@/lib/business-type'

export const metadata = { title: 'New Booking — TableBook' }

export default async function NewReservationPage({ params, searchParams }: { params: Promise<{ restaurantId: string }>, searchParams: Promise<{ tableId?: string }> }) {
  const { restaurantId: routeId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const res = await getActiveRestaurant(routeId)
  if (!res) return <div>Error: No restaurant membership found.</div>
  
  const membership = res.membership as any
  const restaurantId = membership.restaurant_id
  const businessType = (membership.restaurants?.business_type as BusinessType) || 'restaurant'

  const { data: tableData } = await supabase
    .from('physical_tables')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('table_name')
  
  const tables = tableData || []

  // Read pre-selected table from URL param (e.g., tapped from Tables page)
  const { tableId } = await searchParams

  return (
    <CreateReservationForm
      tables={tables ?? []}
      restaurantId={restaurantId}
      preSelectedTableId={tableId}
      businessType={businessType}
    />
  )
}
