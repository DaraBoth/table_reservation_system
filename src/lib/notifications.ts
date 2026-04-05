import { createAdminClient } from '@/lib/supabase/admin'

export type PushDispatchResult = {
  ok: boolean
  debugId: string
  sentCount: number
  attemptedCount: number
  failedCount: number
  status: number
  error?: string
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

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
}): Promise<PushDispatchResult> {
  const debugId = `push_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      const error = 'Missing Supabase credentials for push notification'
      console.error(`[push:${debugId}] ${error}`)
      return {
        ok: false,
        debugId,
        sentCount: 0,
        attemptedCount: 0,
        failedCount: 0,
        status: 500,
        error,
      }
    }

    console.log(`[push:${debugId}] Dispatching notification`, {
      restaurantId,
      title,
      body,
      url,
    })

    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        restaurant_id: restaurantId,
        title,
        body,
        url,
        icon,
        debug_id: debugId,
      }),
    })
    clearTimeout(id)

    const responseText = await response.text()
    let data: Record<string, unknown> = {}

    if (responseText) {
      try {
        data = JSON.parse(responseText) as Record<string, unknown>
      } catch {
        data = { raw: responseText }
      }
    }

    if (!response.ok) {
      const error = asOptionalString(data.error) || responseText || 'Failed to trigger send-push Edge Function'
      console.error(`[push:${debugId}] Failed`, {
        status: response.status,
        error,
        response: data,
      })
      return {
        ok: false,
        debugId,
        sentCount: Number(data?.sentCount ?? 0),
        attemptedCount: Number(data?.attemptedCount ?? 0),
        failedCount: Number(data?.failedCount ?? 0),
        status: response.status,
        error,
      }
    }

    console.log(`[push:${debugId}] Completed`, data)
    return {
      ok: true,
      debugId,
      sentCount: Number(data?.sentCount ?? 0),
      attemptedCount: Number(data?.attemptedCount ?? 0),
      failedCount: Number(data?.failedCount ?? 0),
      status: response.status,
      error: asOptionalString(data.error),
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown push dispatch error'
    console.error(`[push:${debugId}] Error dispatching push notification:`, err)
    return {
      ok: false,
      debugId,
      sentCount: 0,
      attemptedCount: 0,
      failedCount: 0,
      status: 500,
      error,
    }
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
