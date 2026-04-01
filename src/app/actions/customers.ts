'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteCommonCustomer(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  if (!id) return { error: 'Missing ID' }
  const { error } = await supabase.from('common_customers').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/customers')
  return { success: true }
}

export async function addCommonCustomer(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('restaurant_id')
    .eq('user_id', user.id)
    .single()

  if (!membership?.restaurant_id) return { error: 'No restaurant assigned' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Name is required' }

  const phone     = (formData.get('phone') as string)?.trim() || null
  const partySize = parseInt(formData.get('partySize') as string) || 2
  const notes     = (formData.get('notes') as string)?.trim() || null

  const { error } = await supabase.from('common_customers').upsert({
    restaurant_id:    membership.restaurant_id,
    name,
    phone,
    default_party_size: partySize,
    notes,
  }, { onConflict: 'restaurant_id,phone' })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/customers')
  return { success: true }
}
export async function updateCommonCustomer(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const id    = formData.get('id') as string
  const name  = (formData.get('name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim() || null

  if (!id) return { error: 'Missing ID' }
  if (!name) return { error: 'Name is required' }

  const { error } = await supabase
    .from('common_customers')
    .update({ name, phone })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/customers')
  return { success: true }
}
