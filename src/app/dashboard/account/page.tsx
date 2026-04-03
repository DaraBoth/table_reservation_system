import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AccountClient } from './AccountClient'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [membershipResponse, profileResponse] = await Promise.all([
    supabase
      .from('account_memberships')
      .select('role, restaurant_id, restaurants(name)')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
  ])

  const membership = membershipResponse.data
  const profile = profileResponse.data

  return (
    <AccountClient 
      user={user} 
      membership={membership as any} 
      profile={profile as any} 
    />
  )
}
