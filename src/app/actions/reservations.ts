'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { ActionState } from './auth'

// ─── Create reservation ───────────────────────────────────────────────────────

const ReservationSchema = z.object({
  id: z.string().uuid().optional(),
  tableId: z.string().uuid('Invalid table'),
  guestName: z.string().min(1, 'Guest name is required'),
  guestPhone: z.string().optional(),
  party_size: z.coerce.number().int().min(1, 'Party size must be at least 1'),
  notes: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().optional(), // hotel checkout
  saveToCommon: z.boolean().optional(),
})

export async function createReservation(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Resolve tenant
  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', user.id)
    .single()

  if (!membership || !membership.restaurant_id) return { error: 'No restaurant assigned' }
  if (!['admin', 'staff'].includes(membership.role)) return { error: 'Unauthorized' }

  const parsed = ReservationSchema.safeParse({
    tableId: formData.get('tableId'),
    guestName: formData.get('guestName'),
    guestPhone: formData.get('guestPhone'),
    party_size: formData.get('partySize'),
    notes: formData.get('notes'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime') as string | null || undefined,
    saveToCommon: formData.get('saveToCommon') === 'true',
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { tableId, guestName, guestPhone, party_size: partySize, notes, startTime, endTime: providedEnd, saveToCommon } = parsed.data

  // Use provided checkout time (hotel) or default to +2 hours (restaurant)
  const startObj = new Date(startTime)
  const endObj   = providedEnd ? new Date(providedEnd) : new Date(startObj.getTime() + 2 * 60 * 60 * 1000)
  
  // Format as pure, predictable strings to store natively in Postgres
  // This bypasses any timezone coercion that previously corrupted dates!
  const reservationDate = startObj.getFullYear() + '-' + String(startObj.getMonth() + 1).padStart(2,'0') + '-' + String(startObj.getDate()).padStart(2,'0')
  const startTimeStr = String(startObj.getHours()).padStart(2,'0') + ':' + String(startObj.getMinutes()).padStart(2,'0') + ':00'
  const endTimeStr = String(endObj.getHours()).padStart(2,'0') + ':' + String(endObj.getMinutes()).padStart(2,'0') + ':00'

  const { error } = await supabase.from('reservations').insert({
    restaurant_id: membership.restaurant_id,
    table_id: tableId,
    guest_name: guestName,
    guest_phone: guestPhone || null,
    guest_email: null, // explicitly null per user request
    party_size: partySize,
    notes: notes || null,
    status: 'pending', // Usually defaults to pending for UI updates unless directly confirmed
    reservation_date: reservationDate,
    start_time: startTimeStr,
    end_time: endTimeStr,
    created_by: user.id,
  })
    .select()
    .single()

  if (error) {
    if (error.code === '23P01') {
      return { error: 'Table is busy at this slot. Please choose another table/time.' }
    }
    return { error: error.message }
  }

  // 🔔 Trigger Push Notification
  const { notifyNewBooking } = await import('@/lib/notifications')
  notifyNewBooking(data.id)

  // Handle Common Customer saving
  if (saveToCommon) {
    await supabase.from('common_customers').upsert({
      restaurant_id: membership.restaurant_id,
      name: guestName,
      phone: guestPhone || null,
      // party_size optional — not required for saved customers
    }, { onConflict: 'restaurant_id,phone' })
  }

  revalidatePath('/dashboard/reservations')
  revalidatePath('/dashboard/tables')
  revalidatePath('/dashboard')
  redirect('/dashboard/tables')
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

  // 🔔 Trigger Push Notification
  const { notifyCancellation } = await import('@/lib/notifications')
  notifyCancellation(reservationId)

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

  // 🔔 Trigger Push Notification
  if (status === 'arrived') {
    const { notifyArrival } = await import('@/lib/notifications')
    notifyArrival(reservationId)
  }

  revalidatePath('/dashboard/reservations')
  return { success: 'Status updated.' }
}

// ─── Update reservation (edit) ────────────────────────────────────────────────

export async function updateReservation(_: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', user.id)
    .single()

  if (!membership || !membership.restaurant_id) return { error: 'Unauthorized' }
  if (!['admin', 'staff'].includes(membership.role)) return { error: 'Unauthorized' }

  const reservationId = formData.get('id') as string
  if (!reservationId) return { error: 'Reservation ID required for update' }

  const parsed = ReservationSchema.safeParse({
    id: reservationId,
    tableId: formData.get('tableId'),
    guestName: formData.get('guestName'),
    guestPhone: formData.get('guestPhone'),
    party_size: formData.get('partySize'),
    notes: formData.get('notes'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime') as string | null || undefined,
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { tableId, guestName, guestPhone, party_size: partySize, notes, startTime, endTime: providedEnd } = parsed.data

  const startObj = new Date(startTime)
  const endObj   = providedEnd ? new Date(providedEnd) : new Date(startObj.getTime() + 2 * 60 * 60 * 1000)
  
  const reservationDate = startObj.getFullYear() + '-' + String(startObj.getMonth() + 1).padStart(2,'0') + '-' + String(startObj.getDate()).padStart(2,'0')
  const startTimeStr = String(startObj.getHours()).padStart(2,'0') + ':' + String(startObj.getMinutes()).padStart(2,'0') + ':00'
  const endTimeStr = String(endObj.getHours()).padStart(2,'0') + ':' + String(endObj.getMinutes()).padStart(2,'0') + ':00'

  const { error } = await supabase
    .from('reservations')
    .update({
      table_id: tableId,
      guest_name: guestName,
      guest_phone: guestPhone || null,
      party_size: partySize,
      notes: notes || null,
      reservation_date: reservationDate,
      start_time: startTimeStr,
      end_time: endTimeStr,
    })
    .eq('id', reservationId)
    .eq('restaurant_id', membership.restaurant_id)

  if (error) {
    if (error.code === '23P01') {
      return { error: 'Table is busy at this slot for the new selection.' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard/reservations')
  revalidatePath(`/dashboard/reservations/${reservationId}`)
  revalidatePath('/dashboard/tables')
  redirect('/dashboard/tables')
}
