import { createAdminClient } from '@/lib/supabase/admin'

export async function dispatchPushNotification({
  restaurantId,
  title,
  body,
  url,
  icon,
}: {
  restaurantId: string
  title: string
  body: string
  url?: string
  icon?: string
}) {
  try {
    // We use the edge function directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase credentials for push notification')
      return
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        title,
        body,
        url,
        icon,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Failed to trigger send-push Edge Function:', err)
    } else {
      const data = await response.json()
      console.log(`Push notification dispatched successfully. Sent to ${data.sentCount} devices.`)
    }
  } catch (err) {
    console.error('Error dispatching push notification:', err)
  }
}

/**
 * High-level helper for new bookings
 */
export async function notifyNewBooking(reservationId: string) {
  const supabase = createAdminClient()
  
  // 1. Fetch details: Guest, Table, Party Size, Creator
  const { data: res, error } = await supabase
    .from('reservations')
    .select('*, physical_tables(table_name), profiles!reservations_created_by_profiles_fkey(full_name)')
    .eq('id', reservationId)
    .single()

  if (error || !res) return

  const tableName = (res.physical_tables as any)?.table_name || '—'
  const creatorName = (res.profiles as any)?.full_name || 'System'
  
  await dispatchPushNotification({
    restaurantId: res.restaurant_id,
    title: `New Booking: ${res.guest_name}`,
    body: `${tableName} | ${res.party_size} People | By: ${creatorName}`,
    url: `/dashboard/reservations/${res.id}/edit`,
  })
}

/**
 * High-level helper for arrivals
 */
export async function notifyArrival(reservationId: string) {
  const supabase = createAdminClient()
  
  const { data: res, error } = await supabase
    .from('reservations')
    .select('*, physical_tables(table_name)')
    .eq('id', reservationId)
    .single()

  if (error || !res) return

  const tableName = (res.physical_tables as any)?.table_name || '—'
  
  await dispatchPushNotification({
    restaurantId: res.restaurant_id,
    title: `Guest Arrived: ${res.guest_name}`,
    body: `Table: ${tableName} | Party of ${res.party_size}`,
    url: `/dashboard/reservations/${res.id}/edit`,
  })
}

/**
 * High-level helper for cancellations
 */
export async function notifyCancellation(reservationId: string) {
  const supabase = createAdminClient()
  
  const { data: res, error } = await supabase
    .from('reservations')
    .select('*, physical_tables(table_name)')
    .eq('id', reservationId)
    .single()

  if (error || !res) return

  await dispatchPushNotification({
    restaurantId: res.restaurant_id,
    title: `Booking Cancelled: ${res.guest_name}`,
    body: `${res.party_size} people canceled their reservation.`,
    url: `/dashboard/reservations`,
  })
}

/**
 * High-level helper for booking updates
 */
export async function notifyBookingUpdate(reservationId: string) {
  const supabase = createAdminClient()
  
  const { data: res, error } = await supabase
    .from('reservations')
    .select('*, physical_tables(table_name)')
    .eq('id', reservationId)
    .single()

  if (error || !res) return

  const tableName = (res.physical_tables as any)?.table_name || '—'
  
  await dispatchPushNotification({
    restaurantId: res.restaurant_id,
    title: `Booking Updated: ${res.guest_name}`,
    body: `${tableName} | ${res.party_size} People | Status: ${res.status.toUpperCase()}`,
    url: `/dashboard/reservations/${res.id}/edit`,
  })
}
