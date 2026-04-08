'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncCustomerData } from './customers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { ActionState } from './auth'

/**
 * 🛠️ Extract Wall Clock Time (Local)
 * 
 * Safely pulls the HH:mm from a ISO-like string (YYYY-MM-DDTHH:mm:ss)
 * without falling back to new Date() which might shift to UTC in Node.js
 */
function extractWallClockTime(isoString: string): string {
  // Try regex for 'T20:30' pattern
  const match = isoString.match(/T(\d{2}):(\d{2})/)
  if (match) return `${match[1]}:${match[2]}:00`

  // Fallback: try splitting
  if (isoString.includes('T')) {
    const timePart = isoString.split('T')[1]
    const [h, m] = timePart.split(':')
    if (h && m) return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`
  }

  // Final fallback (risky but needed)
  const d = new Date(isoString)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`
}

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
  status: z.string().optional(),
  saveToCommon: z.boolean().optional(),
  extraSlots: z.string().optional(),
})

async function getMembershipForRestaurant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  restaurantId: string,
) {
  // Try to find specific restaurant membership
  const { data: membership } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id, restaurants(business_type)')
    .eq('user_id', userId)
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .maybeSingle()

  if (membership) return membership

  // Fallback: Check if user is a global superadmin
  const { data: superadminRole } = await supabase
    .from('account_memberships')
    .select('role, restaurant_id')
    .eq('user_id', userId)
    .eq('role', 'superadmin')
    .eq('is_active', true)
    .maybeSingle()

  return superadminRole
}

export async function createReservation(_: ActionState, formData: FormData): Promise<ActionState> {
  const restaurantId = String(formData.get('restaurantId') || '')
  if (!restaurantId) return { error: 'Restaurant context missing' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const membership = await getMembershipForRestaurant(supabase, user.id, restaurantId)

  if (!membership || !membership.restaurant_id) return { error: 'No restaurant assigned' }
  if (!['admin', 'superadmin', 'staff'].includes(membership.role)) return { error: 'Unauthorized' }

  const parsed = ReservationSchema.safeParse({
    tableId: formData.get('tableId'),
    guestName: formData.get('guestName'),
    guestPhone: formData.get('guestPhone'),
    party_size: formData.get('partySize'),
    notes: formData.get('notes'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime') as string | null || undefined,
    status: formData.get('status') as string || 'confirmed',
    saveToCommon: formData.get('saveToCommon') === 'true',
    extraSlots: formData.get('extraSlots') as string || undefined,
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { 
    tableId, guestName, guestPhone, party_size: partySize, 
    notes, startTime, endTime: providedEnd, status: userStatus, 
    saveToCommon, extraSlots: extraSlotsRaw 
  } = parsed.data

  // Use robust wall clock time extraction to avoid UTC shifts
  const startTimeStr = extractWallClockTime(startTime)

  const startObj = new Date(startTime)
  const endObj   = providedEnd ? new Date(providedEnd) : new Date(startObj.getTime() + 2 * 60 * 60 * 1000)
  
  const reservationDate = startObj.getFullYear() + '-' + String(startObj.getMonth() + 1).padStart(2,'0') + '-' + String(startObj.getDate()).padStart(2,'0')
  const checkoutDate = endObj.getFullYear() + '-' + String(endObj.getMonth() + 1).padStart(2,'0') + '-' + String(endObj.getDate()).padStart(2,'0')
  const endTimeStr = extractWallClockTime(endObj.toISOString())

  const businessType = (membership as any).restaurants?.business_type || 'restaurant'
  const isHotel = businessType === 'hotel' || businessType === 'guesthouse'
  const isMultiDay = reservationDate !== checkoutDate

  // AUTO-CONFIRM LOGIC: If they select 'Waiting' (pending) but the table is actually free, make it 'confirmed'
  let finalStatus = userStatus || 'confirmed'
  if (finalStatus === 'pending') {
    // 1. Fetch potential overlaps using the unified logic rules
    const { data: overlaps } = await supabase
      .from('reservations')
      .select('id, start_time, end_time, reservation_date, checkout_date')
      .eq('table_id', tableId)
      .in('status', ['pending', 'confirmed', 'arrived'])
      .lte('reservation_date', reservationDate)
      .gte('checkout_date', reservationDate)

    const hasConflict = (overlaps || []).some(r => {
      if (isHotel) {
        // Hotel: Check-out today check
        if (r.checkout_date === reservationDate && r.end_time) {
          if (startTimeStr >= r.end_time) return false
        }
        // Hotel: Check-in today check
        if (r.reservation_date === reservationDate && r.start_time) {
          if (endTimeStr <= r.start_time) return false
        }
        return true
      }
      // Restaurant: Any booking on this day is a conflict
      return true
    })

    if (!hasConflict) {
      finalStatus = 'confirmed'
    }
  }


  // Fetch table name for snapshot
  const { data: tableData } = await supabase
    .from('physical_tables')
    .select('table_name')
    .eq('id', tableId)
    .single()

  // ─── BRANCH: HOTEL (Range) or RESTAURANT (Split/Extra) ───────────────────────
  
  const hasExtraSlots = extraSlotsRaw && JSON.parse(extraSlotsRaw).length > 0
  const extraSlots = hasExtraSlots ? JSON.parse(extraSlotsRaw) : []

  if (isHotel) {
    // 🏨 HOTEL: Standard sequence (Check-in to Check-out)
    const { data, error } = await supabase.from('reservations').insert({
      restaurant_id: membership.restaurant_id,
      table_id: tableId,
      unit_name: tableData?.table_name || 'Unknown Unit',
      guest_name: guestName,
      guest_phone: guestPhone || null,
      party_size: partySize,
      notes: notes || null,
      status: finalStatus as any, 
      reservation_date: reservationDate,
      checkout_date: checkoutDate,
      start_time: startTimeStr,
      end_time: endTimeStr,
      created_by: user.id,
    }).select().single()

    if (error) return { error: error.message }
    const deviceToken = String(formData.get('deviceToken') || '')
    const { notifyNewBooking } = await import('@/lib/notifications')
    await notifyNewBooking(data.id, deviceToken)

  } else {
    // 🍽️ RESTAURANT: Multi-slot or Split range
    const groupId = (hasExtraSlots || isMultiDay) ? crypto.randomUUID() : null
    const records = []

    // 1. Add primary slot
    records.push({
      restaurant_id: membership.restaurant_id,
      table_id: tableId,
      group_id: groupId,
      unit_name: tableData?.table_name || 'Unknown Unit',
      guest_name: guestName,
      guest_phone: guestPhone || null,
      party_size: partySize,
      notes: notes || null,
      status: finalStatus as any, 
      reservation_date: reservationDate,
      checkout_date: reservationDate,
      start_time: startTimeStr,
      end_time: endTimeStr,
      created_by: user.id,
    })

    // 2. Add extra slots from '+' button
    if (hasExtraSlots) {
      extraSlots.forEach((slot: { date: string; partySize: number; status?: string }) => {
        const d = new Date(slot.date)
        const dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
        const tStr = extractWallClockTime(slot.date)
        // Extra slots default to 2hr duration unless specified otherwise
        const tEnd = new Date(new Date(slot.date).getTime() + 2 * 60 * 60 * 1000)
        const tEndStr = extractWallClockTime(tEnd.toISOString())

        records.push({
          restaurant_id: membership.restaurant_id,
          table_id: tableId,
          group_id: groupId,
          unit_name: tableData?.table_name || 'Unknown Unit',
          guest_name: guestName,
          guest_phone: guestPhone || null,
          party_size: slot.partySize || partySize,
          notes: notes || null,
          status: (slot.status || finalStatus) as any, 
          reservation_date: dStr,
          checkout_date: dStr,
          start_time: tStr,
          end_time: tEndStr,
          created_by: user.id,
        })
      })
    } 
    // 3. Fallback: Old range-based split logic (if no extraSlots but isMultiDay)
    else if (isMultiDay) {
      let current = new Date(startObj)
      current.setDate(current.getDate() + 1) // skip primary already added
      while (current <= endObj) {
        const dateStr = current.getFullYear() + '-' + String(current.getMonth() + 1).padStart(2,'0') + '-' + String(current.getDate()).padStart(2,'0')
        records.push({
          restaurant_id: membership.restaurant_id,
          table_id: tableId,
          group_id: groupId,
          unit_name: tableData?.table_name || 'Unknown Unit',
          guest_name: guestName,
          guest_phone: guestPhone || null,
          party_size: partySize,
          notes: notes || null,
          status: finalStatus as any, 
          reservation_date: dateStr,
          checkout_date: dateStr,
          start_time: startTimeStr,
          end_time: endTimeStr,
          created_by: user.id,
        })
        current.setDate(current.getDate() + 1)
      }
    }

    const { data: insertedReservations, error } = await supabase
      .from('reservations')
      .insert(records)
      .select('id')

    if (error) return { error: error.message }

    const primaryReservationId = insertedReservations?.[0]?.id
    if (primaryReservationId) {
      const deviceToken = String(formData.get('deviceToken') || '')
      const { notifyNewBooking } = await import('@/lib/notifications')
      await notifyNewBooking(primaryReservationId, deviceToken)
    }

  }

  // 👤 Auto-register / Update Customer Record
  await syncCustomerData(
    membership.restaurant_id, 
    guestName, 
    guestPhone || null,
    null, // email
    notes || null
  )

  revalidatePath(`/dashboard/${restaurantId}/reservations`)
  revalidatePath(`/dashboard/${restaurantId}/units`)
  revalidatePath(`/dashboard/${restaurantId}`)
  redirect(`/dashboard/${restaurantId}/units`)
}

// ─── Cancel reservation ───────────────────────────────────────────────────────

export async function cancelReservation(_: ActionState, formData: FormData): Promise<ActionState> {
  const restaurantId = String(formData.get('restaurantId') || '')
  if (!restaurantId) return { error: 'Restaurant context missing' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const membership = await getMembershipForRestaurant(supabase, user.id, restaurantId)

  if (!membership || !membership.restaurant_id || !['admin', 'superadmin', 'staff'].includes(membership.role)) {
    return { error: 'Unauthorized — staff or admins only' }
  }

  const reservationId = formData.get('reservationId') as string
  if (!reservationId) return { error: 'Reservation ID required' }

  const { error } = await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', reservationId)
    .eq('restaurant_id', restaurantId) // Fix: use the restaurantId from params/form instead of potentially NULL membership.restaurant_id

  if (error) return { error: error.message }

  // 🔔 Trigger Push Notification
  const deviceToken = String(formData.get('deviceToken') || '')
  const { notifyCancellation } = await import('@/lib/notifications')
  await notifyCancellation(reservationId, deviceToken)


  revalidatePath(`/dashboard/${restaurantId}/reservations`)
  revalidatePath(`/dashboard/${restaurantId}`)
  return { success: 'Reservation cancelled.' }
}

// ─── Update reservation status (staff/admin) ─────────────────────────────────

export async function updateReservationStatus(_: ActionState, formData: FormData): Promise<ActionState> {
  const restaurantId = String(formData.get('restaurantId') || '')
  if (!restaurantId) return { error: 'Restaurant context missing' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const membership = await getMembershipForRestaurant(supabase, user.id, restaurantId)

  if (!membership || !['admin', 'superadmin', 'staff'].includes(membership.role)) {
    return { error: 'Unauthorized — staff or admins only' }
  }

  const reservationId = formData.get('reservationId') as string
  const status = formData.get('status') as string

  const { error } = await supabase
    .from('reservations')
    .update({ status: status as any })
    .eq('id', reservationId)
    .eq('restaurant_id', restaurantId)

  if (error) return { error: error.message }

  // 🔔 Trigger Push Notification
  const deviceToken = String(formData.get('deviceToken') || '')
  const { notifyArrival, notifyBookingUpdate } = await import('@/lib/notifications')
  if (status === 'arrived') {
    await notifyArrival(reservationId, deviceToken)
  } else if (status === 'cancelled') {
    const { notifyCancellation } = await import('@/lib/notifications')
    await notifyCancellation(reservationId, deviceToken)
  } else {
    await notifyBookingUpdate(reservationId, deviceToken)
  }


  revalidatePath(`/dashboard/${restaurantId}/reservations`)
  revalidatePath(`/dashboard/${restaurantId}/reservations/${reservationId}`)
  revalidatePath(`/dashboard/${restaurantId}/units`)
  revalidatePath(`/dashboard/${restaurantId}`)
  return { success: 'Status updated.' }
}

// ─── Update reservation (edit) ────────────────────────────────────────────────

export async function updateReservation(_: ActionState, formData: FormData): Promise<ActionState> {
  const restaurantId = String(formData.get('restaurantId') || '')
  if (!restaurantId) return { error: 'Restaurant context missing' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const membership = await getMembershipForRestaurant(supabase, user.id, restaurantId)

  if (!membership || !membership.restaurant_id) return { error: 'Unauthorized' }
  if (!['admin', 'superadmin', 'staff'].includes(membership.role)) return { error: 'Unauthorized' }

  const reservationId = (formData.get('id') || formData.get('reservationId')) as string
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
    status: formData.get('status') as string || undefined,
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { tableId, guestName, guestPhone, party_size: partySize, notes, startTime, endTime: providedEnd, status } = parsed.data

  const startObj = new Date(startTime)
  const endObj   = providedEnd ? new Date(providedEnd) : new Date(startObj.getTime() + 2 * 60 * 60 * 1000)
  
  const reservationDate = startObj.getFullYear() + '-' + String(startObj.getMonth() + 1).padStart(2,'0') + '-' + String(startObj.getDate()).padStart(2,'0')
  const checkoutDate = endObj.getFullYear() + '-' + String(endObj.getMonth() + 1).padStart(2,'0') + '-' + String(endObj.getDate()).padStart(2,'0')
  const startTimeStr = extractWallClockTime(startTime)
  const endTimeStr = extractWallClockTime(endObj.toISOString())

  // Fetch table name for snapshot (in case table was changed)
  const { data: tableData } = await supabase
    .from('physical_tables')
    .select('table_name')
    .eq('id', tableId)
    .single()

  const { error } = await supabase
    .from('reservations')
    .update({
      table_id: tableId,
      unit_name: tableData?.table_name || 'Unknown Unit',
      guest_name: guestName,
      guest_phone: guestPhone || null,
      party_size: partySize,
      notes: notes || null,
      status: status as any,
      reservation_date: reservationDate,
      checkout_date: checkoutDate, // Added column
      start_time: startTimeStr,
      end_time: endTimeStr,
    })
    .eq('id', reservationId)
    .eq('restaurant_id', restaurantId)

  if (error) {
    if (error.code === '23P01') {
      return { error: 'Table is busy at this slot for the new selection.' }
    }
    return { error: error.message }
  }

  // 👤 Auto-register / Update Customer Record
  await syncCustomerData(
    restaurantId, 
    guestName, 
    guestPhone || null,
    null, // email
    notes || null
  )

  // 🔔 Trigger Push Notification
  const deviceToken = String(formData.get('deviceToken') || '')
  const { notifyBookingUpdate } = await import('@/lib/notifications')
  await notifyBookingUpdate(reservationId, deviceToken)


  revalidatePath(`/dashboard/${restaurantId}/reservations`)
  revalidatePath(`/dashboard/${restaurantId}/reservations/${reservationId}`)
  revalidatePath(`/dashboard/${restaurantId}/units`)
  redirect(`/dashboard/${restaurantId}/units`)
}
