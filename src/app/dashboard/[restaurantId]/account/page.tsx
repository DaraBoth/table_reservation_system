import { getActiveRestaurant } from '@/lib/restaurant-context'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AccountClient } from './AccountClient'

export default async function ({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const res = await getActiveRestaurant(restaurantId)
  if (!res) return null
  const membership = res.membership as any
  const profile = (res as any).profile || null

  return (
    <AccountClient 
      user={user} 
      membership={membership as any} 
      profile={profile as any} 
    />
  )
}
