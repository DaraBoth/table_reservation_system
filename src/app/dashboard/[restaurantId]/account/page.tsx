import { getActiveRestaurant } from '@/lib/restaurant-context'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AccountClient } from './AccountClient'
import { createPrivateMetadata } from '@/lib/seo'
import { getServerT } from '@/i18n/server'

export const metadata = createPrivateMetadata('Account Settings', 'Update your profile, password, store details, and short link.')

export default async function ({ params }: { params: Promise<{ restaurantId: string }> }) {
  await getServerT()
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
