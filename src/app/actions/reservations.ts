'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { ActionState } from './auth'

// ─── Create reservation ───────────────────────────────────────────────────────

const CreateReservationSchema = z.object({
  tableId: z.string().uuid('Invalid table'),
  guestName: z.string().min(1, 'Guest name is required'),
  guestPhone: z.string().optional(),
  guestEmail: z.string().email().optional().or(z.literal('')),
  partySize: z.coerce.number().int().min(1, 'Party size must be at least 1'),
  notes: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
})

export async function createReservation(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Resolve tenant — restaurant_id ALWAYS comes from server, never client
  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', user.id)
    .single()

  if (!membership || !membership.restaurant_id) return { error: 'No restaurant assigned' }
  if (!['admin', 'staff'].includes(membership.role)) return { error: 'Unauthorized' }

  const parsed = CreateReservationSchema.safeParse({
    tableId: formData.get('tableId'),
    guestName: formData.get('guestName'),
    guestPhone: formData.get('guestPhone'),
    guestEmail: formData.get('guestEmail'),
    partySize: formData.get('partySize'),
    notes: formData.get('notes'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { tableId, guestName, guestPhone, guestEmail, partySize, notes, startTime, endTime } = parsed.data

  if (new Date(startTime) >= new Date(endTime)) {
    return { error: 'End time must be after start time' }
  }

  // Build tsrange string: '[start, end)'
  const reservationTime = `[${startTime}, ${endTime})`

  const { error } = await supabase.from('reservations').insert({
    restaurant_id: membership.restaurant_id, // injected server-side
    table_id: tableId,
    guest_name: guestName,
    guest_phone: guestPhone || null,
    guest_email: guestEmail || null,
    party_size: partySize,
    notes: notes || null,
    status: 'confirmed',
    reservation_time: reservationTime,
    created_by: user.id,
  })

  if (error) {
    if (error.code === '23P01') {
      return { error: 'This table is already booked for that time slot. Please choose a different table or time.' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard/reservations')
  revalidatePath('/dashboard')
  return { success: 'Reservation created successfully!' }
}

// ─── Cancel reservation ───────────────────────────────────────────────────────

export async function cancelReservation(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', user.id)
    .single()

  if (!membership || !membership.restaurant_id) return { error: 'Unauthorized' }

  const reservationId = formData.get('reservationId') as string
  if (!reservationId) return { error: 'Reservation ID required' }

  const { error } = await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', reservationId)
    .eq('restaurant_id', membership.restaurant_id) // RLS double-check

  if (error) return { error: error.message }

  revalidatePath('/dashboard/reservations')
  revalidatePath('/dashboard')
  return { success: 'Reservation cancelled.' }
}

// ─── Update reservation status (admin) ───────────────────────────────────────

export async function updateReservationStatus(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') return { error: 'Unauthorized — admins only' }

  const reservationId = formData.get('reservationId') as string
  const status = formData.get('status') as string

  const { error } = await supabase
    .from('reservations')
    .update({ status: status as any })
    .eq('id', reservationId)
    .eq('restaurant_id', membership.restaurant_id!)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/reservations')
  return { success: 'Status updated.' }
}
