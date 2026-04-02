'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { ActionState } from './auth'

const TableSchema = z.object({
  tableName: z.string().min(1, 'Table name is required'),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
  description: z.string().optional(),
})

export async function createPhysicalTable(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', user.id)
    .single()

  const canManage = membership?.role === 'admin' || membership?.role === 'superadmin' || membership?.role === 'staff'
  if (!canManage || !membership.restaurant_id) {
    return { error: 'Unauthorized' }
  }

  const parsed = TableSchema.safeParse({
    tableName: formData.get('tableName'),
    capacity: formData.get('capacity'),
    description: formData.get('description'),
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase.from('physical_tables').insert({
    restaurant_id: membership.restaurant_id,
    table_name: parsed.data.tableName,
    capacity: parsed.data.capacity,
    description: parsed.data.description || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/tables')
  return { success: `Table "${parsed.data.tableName}" created.` }
}

export async function updatePhysicalTable(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', user.id)
    .single()

  const canEdit = membership?.role === 'admin' || membership?.role === 'superadmin' || membership?.role === 'staff'
  if (!canEdit) return { error: 'Unauthorized' }

  const tableId = formData.get('tableId') as string
  const parsed = TableSchema.safeParse({
    tableName: formData.get('tableName'),
    capacity: formData.get('capacity'),
    description: formData.get('description'),
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { error } = await supabase
    .from('physical_tables')
    .update({
      table_name: parsed.data.tableName,
      capacity: parsed.data.capacity,
      description: parsed.data.description || null,
      is_active: formData.get('isActive') !== 'false',
    })
    .eq('id', tableId)
    .eq('restaurant_id', membership.restaurant_id!)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/tables')
  return { success: 'Table updated.' }
}

export async function deletePhysicalTable(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', user.id)
    .single()

  const isAdmin = membership?.role === 'admin' || membership?.role === 'superadmin'
  if (!isAdmin) return { error: 'Unauthorized — Admin only' }

  const tableId = formData.get('tableId') as string
  if (!tableId) return { error: 'Table ID missing' }

  // We no longer block deletion if history exists, 
  // because reservations now store a static snapshot in 'unit_name'.

  const { error } = await supabase
    .from('physical_tables')
    .delete()
    .eq('id', tableId)
    .eq('restaurant_id', membership.restaurant_id!)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/tables')
  return { success: 'Unit deleted successfully.' }
}
