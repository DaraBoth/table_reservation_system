import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export const ACTIVE_RESTAURANT_COOKIE = 'active_restaurant_id'

export async function getActiveRestaurant(routeId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 1. Get all memberships for the user
  const { data: memberships } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id, is_special_admin, special_features, restaurants(name, business_type, is_new)')
    .eq('user_id', user.id)
    .eq('is_active', true) as any

  if (!memberships || memberships.length === 0) return null

  // 2. Determine active ID (Prioritize route parameter over cookie, but only if route ID is valid)
  const cookieStore = await cookies()
  const cookieId = cookieStore.get(ACTIVE_RESTAURANT_COOKIE)?.value
  
  // Ensure the routeId provided is actually one of the user's memberships
  const isRouteIdValid = memberships.some((m: any) => m.restaurant_id === routeId)
  const activeId = (isRouteIdValid ? routeId : null) || cookieId || memberships[0].restaurant_id

  // 3. Find the membership matching the active ID, or fallback to the first one
  const activeMembership = memberships.find((m: any) => m.restaurant_id === activeId) || memberships[0]

  // 4. Get the user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return {
    membership: activeMembership,
    allMemberships: memberships,
    activeId: activeMembership.restaurant_id,
    profile: profile || null,
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
