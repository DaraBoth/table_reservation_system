import { createAdminClient } from '@/lib/supabase/admin'
import webpush from 'web-push'

type StoredPushSubscription = {
  endpoint: string
  expirationTime?: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

type PushSubscriptionRow = {
  id: string
  user_id: string | null
  endpoint: string
  subscription: StoredPushSubscription
}

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

function configureWebPush(debugId: string) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys are not configured for push delivery')
  }

  webpush.setVapidDetails('mailto:vongpichdarabot@gmail.com', publicKey, privateKey)
  console.log(`[push:${debugId}] web-push configured`)
}

async function getEligibleSubscriptions(restaurantId: string, debugId: string): Promise<PushSubscriptionRow[]> {
  const supabase = createAdminClient()

  const { data: subscriptionsRaw, error: subscriptionError } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, subscription')
    .eq('restaurant_id', restaurantId)

  if (subscriptionError) {
    throw new Error(subscriptionError.message)
  }

  const subscriptions = (subscriptionsRaw ?? []) as PushSubscriptionRow[]
  if (subscriptions.length === 0) {
    console.log(`[push:${debugId}] No subscriptions found for restaurant ${restaurantId}`)
    return []
  }

  const userIds = subscriptions
    .map((subscription) => subscription.user_id)
    .filter((userId): userId is string => typeof userId === 'string')

  if (userIds.length === 0) {
    console.log(`[push:${debugId}] No valid user IDs found on subscriptions for restaurant ${restaurantId}`)
    return []
  }

  const { data: membershipsRaw, error: membershipError } = await supabase
    .from('account_memberships')
    .select('user_id')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .in('role', ['admin', 'staff'])
    .in('user_id', userIds)

  if (membershipError) {
    throw new Error(membershipError.message)
  }

  const eligibleUserIds = new Set((membershipsRaw ?? []).map((membership) => membership.user_id))
  const eligibleSubscriptions = subscriptions.filter((subscription) => subscription.user_id && eligibleUserIds.has(subscription.user_id))

  console.log(`[push:${debugId}] Eligible subscriptions`, {
    found: subscriptions.length,
    eligible: eligibleSubscriptions.length,
    restaurantId,
  })

  return eligibleSubscriptions
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
    console.log(`[push:${debugId}] Dispatching notification`, {
      restaurantId,
      title,
      body,
      url,
    })

    configureWebPush(debugId)
    const subscriptions = await getEligibleSubscriptions(restaurantId, debugId)

    if (subscriptions.length === 0) {
      return {
        ok: true,
        debugId,
        sentCount: 0,
        attemptedCount: 0,
        failedCount: 0,
        status: 200,
      }
    }

    const supabase = createAdminClient()
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icons/maskable_icon_x192.png',
      data: {
        url: url || '/dashboard',
      },
    })

    const results = await Promise.all(subscriptions.map(async (subscription, index) => {
      try {
        await webpush.sendNotification(subscription.subscription as any, payload)
        console.log(`[push:${debugId}] Sent to subscription ${index}`, {
          subscriptionId: subscription.id,
          endpoint: subscription.endpoint,
        })
        return { ok: true }
      } catch (error) {
        console.error(`[push:${debugId}] Failed subscription ${index}`, error)

        const statusCode = typeof error === 'object' && error && 'statusCode' in error
          ? Number((error as { statusCode?: unknown }).statusCode)
          : undefined

        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', subscription.id)
          console.log(`[push:${debugId}] Removed stale subscription`, {
            subscriptionId: subscription.id,
            endpoint: subscription.endpoint,
          })
        }

        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Failed to send push notification',
        }
      }
    }))

    const sentCount = results.filter((result) => result.ok).length
    const failedCount = results.length - sentCount

    console.log(`[push:${debugId}] Completed`, {
      attemptedCount: results.length,
      sentCount,
      failedCount,
    })

    return {
      ok: failedCount === 0,
      debugId,
      sentCount,
      attemptedCount: results.length,
      failedCount,
      status: failedCount === 0 ? 200 : 207,
      error: failedCount > 0 ? asOptionalString(results.find((result) => !result.ok)?.error) : undefined,
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
    .select('*, physical_tables(table_name)')
    .eq('id', reservationId)
    .single()

  if (error || !res) {
    console.error('[notifyNewBooking] Failed to fetch reservation details', error)
    return
  }

  // Fetch creator name separately to avoid broken join syntax
  let creatorName = 'System'
  if (res.created_by) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', res.created_by)
      .maybeSingle()
    
    if (profile?.full_name) {
      creatorName = profile.full_name
    }
  }

  const tableName = (res.physical_tables as any)?.table_name || '—'
  
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

  if (error || !res) {
    console.error('[notifyArrival] Failed to fetch reservation', error)
    return
  }

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

  if (error || !res) {
    console.error('[notifyCancellation] Failed to fetch reservation', error)
    return
  }

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

  if (error || !res) {
    console.error('[notifyBookingUpdate] Failed to fetch reservation', error)
    return
  }

  const tableName = (res.physical_tables as any)?.table_name || '—'
  
  await dispatchPushNotification({
    restaurantId: res.restaurant_id,
    title: `Booking Updated: ${res.guest_name}`,
    body: `${tableName} | ${res.party_size} People | Status: ${res.status.toUpperCase()}`,
    url: `/dashboard/reservations/${res.id}/edit`,
  })
}
