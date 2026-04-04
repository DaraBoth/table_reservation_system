'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getMembershipForRestaurant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  restaurantId: string,
) {
  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .maybeSingle()

  return membership
}

export async function deleteCommonCustomer(_: unknown, formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '')
  if (!restaurantId) return { error: 'Restaurant context missing' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const membership = await getMembershipForRestaurant(supabase, user.id, restaurantId)
  if (!membership?.restaurant_id) return { error: 'Unauthorized' }

  const id = formData.get('id') as string
  if (!id) return { error: 'Missing ID' }
  const { error } = await supabase.from('common_customers').delete().eq('id', id).eq('restaurant_id', restaurantId)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/${restaurantId}/customers`)
  return { success: true }
}

export async function addCommonCustomer(_: unknown, formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '')
  if (!restaurantId) return { error: 'Restaurant context missing' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const membership = await getMembershipForRestaurant(supabase, user.id, restaurantId)

  if (!membership?.restaurant_id) return { error: 'No restaurant assigned' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Name is required' }

  const phone     = (formData.get('phone') as string)?.trim() || null
  const partySize = parseInt(formData.get('partySize') as string) || 2
  const notes     = (formData.get('notes') as string)?.trim() || null

  const { error } = await supabase.from('common_customers').upsert({
    restaurant_id:    restaurantId,
    name,
    phone,
    default_party_size: partySize,
    notes,
  }, { onConflict: 'restaurant_id,phone' })

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/${restaurantId}/customers`)
  return { success: true }
}
export async function updateCommonCustomer(_: unknown, formData: FormData) {
  const restaurantId = String(formData.get('restaurantId') || '')
  if (!restaurantId) return { error: 'Restaurant context missing' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const membership = await getMembershipForRestaurant(supabase, user.id, restaurantId)
  if (!membership?.restaurant_id) return { error: 'Unauthorized' }

  const id    = formData.get('id') as string
  const name  = (formData.get('name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim() || null

  if (!id) return { error: 'Missing ID' }
  if (!name) return { error: 'Name is required' }

  const { error } = await supabase
    .from('common_customers')
    .update({ name, phone })
    .eq('id', id)
    .eq('restaurant_id', restaurantId)

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/${restaurantId}/customers`)
  return { success: true }
}
