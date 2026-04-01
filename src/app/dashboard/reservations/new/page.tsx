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

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('restaurant_id, restaurants(business_type)')
    .eq('user_id', user.id)
    .single()

  const restaurantId = membership?.restaurant_id ?? ''
  const businessType = ((membership as any)?.restaurants?.business_type ?? 'restaurant') as BusinessType

  const { data: tables } = await supabase
    .from('physical_tables')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('table_name')

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
