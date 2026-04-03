import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export const ACTIVE_RESTAURANT_COOKIE = 'active_restaurant_id'

export async function getActiveRestaurant() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 1. Get all memberships for the user
  const { data: memberships } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id, restaurants(name, business_type, is_new)')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (!memberships || memberships.length === 0) return null

  // 2. Get the active ID from cookie
  const cookieStore = await cookies()
  const cookieId = cookieStore.get(ACTIVE_RESTAURANT_COOKIE)?.value

  // 3. Find the membership matching the cookie ID, or fallback to the first one
  const activeMembership = memberships.find(m => m.restaurant_id === cookieId) || memberships[0]

  return {
    membership: activeMembership,
    allMemberships: memberships,
    activeId: activeMembership.restaurant_id,
  }
}

export async function setActiveRestaurantId(id: string) {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_RESTAURANT_COOKIE, id, { 
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
}
