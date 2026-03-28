import { createClient } from '@/lib/supabase/server'
import { CreateReservationForm } from './CreateReservationForm'

export const metadata = { title: 'New Reservation — TableBook' }

export default async function NewReservationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('restaurant_id')
    .eq('user_id', user.id)
    .single()

  const { data: tables } = await supabase
    .from('physical_tables')
    .select('*')
    .eq('restaurant_id', membership?.restaurant_id ?? '')
    .eq('is_active', true)
    .order('table_name')

  return <CreateReservationForm tables={tables ?? []} />
}
