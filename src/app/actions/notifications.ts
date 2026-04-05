'use server'

import { createClient } from '@/lib/supabase/server'
import { dispatchPushNotification } from '@/lib/notifications'

export type SendTestNotificationResult = {
  ok: boolean
  debugId?: string
  sentCount?: number
  attemptedCount?: number
  failedCount?: number
  error?: string
}

export async function sendTestNotification(restaurantId: string): Promise<SendTestNotificationResult> {
  if (!restaurantId) {
    return { ok: false, error: 'Restaurant context missing.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Not authenticated.' }
  }

  const { data: membership, error: membershipError } = await supabase
    .from('account_memberships')
    .select('restaurant_id')
    .eq('user_id', user.id)
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (membershipError || !membership?.restaurant_id) {
    return { ok: false, error: 'You do not have access to this restaurant.' }
  }

  const timestamp = new Date().toISOString()
  const result = await dispatchPushNotification({
    restaurantId,
    title: 'Test Notification',
    body: `Triggered at ${timestamp} by ${user.email ?? 'unknown user'}`,
    url: `/dashboard/${restaurantId}`,
  })

  return {
    ok: result.ok,
    debugId: result.debugId,
    sentCount: result.sentCount,
    attemptedCount: result.attemptedCount,
    failedCount: result.failedCount,
    error: result.error,
  }
}