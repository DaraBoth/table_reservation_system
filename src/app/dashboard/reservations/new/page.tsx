import { createClient } from '@/lib/supabase/server'
import { CreateReservationForm } from './CreateReservationForm'
import type { BusinessType } from '@/lib/business-type'

export const metadata = { title: 'New Booking — TableBook' }

interface Props {
  searchParams: Promise<{ tableId?: string }>
}

export default async function NewReservationPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // OPTIMIZED: Single round-trip to get EVERYTHING via the restaurant connection
  const { data: restaurantData, error: resError } = await supabase
    .from('restaurants')
    .select(`
      id,
      business_type,
      physical_tables (*),
      account_memberships!inner (user_id)
    `)
    .eq('account_memberships.user_id', user.id)
    .single()

  // Fallback: If the joined query fails or is not supported by the current RLS/Schema, 
  // we use a slightly more conservative but safe two-step approach
  let finalRestaurantId = ''
  let finalBusinessType: BusinessType = 'restaurant'
  let finalTables: any[] = []

  if (resError || !restaurantData) {
    const { data: membership } = await supabase
      .from('account_memberships')
      .select('restaurant_id, restaurants(business_type)')
      .eq('user_id', user.id)
      .single()
    
    if (!membership) return <div>Error: No restaurant membership found.</div>
    
    finalRestaurantId = membership.restaurant_id || ''
    finalBusinessType = (membership.restaurants as any)?.business_type || 'restaurant'

    const { data: tableData } = await supabase
      .from('physical_tables')
      .select('*')
      .eq('restaurant_id', finalRestaurantId)
      .eq('is_active', true)
      .order('table_name')
    
    finalTables = tableData || []
  } else {
    finalRestaurantId = restaurantData.id
    finalBusinessType = (restaurantData.business_type as BusinessType) || 'restaurant'
    finalTables = (restaurantData.physical_tables as any[] || [])
      .filter(t => t.is_active)
      .sort((a, b) => a.table_name.localeCompare(b.table_name))
  }

  const restaurantId = finalRestaurantId
  const businessType = finalBusinessType
  const tables = finalTables

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
