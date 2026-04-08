import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
})

const requestSchema = z.object({
  restaurantId: z.string().uuid().optional(),
  subscription: subscriptionSchema,
  deviceInfo: z.string().optional(),
  deviceToken: z.string().uuid().optional(),
})


export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
    }

    const json = await request.json()
    const parsed = requestSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request' }, { status: 400 })
    }

    if (parsed.data.restaurantId) {
      const { data: membership } = await supabase
        .from('account_memberships')
        .select('restaurant_id')
        .eq('user_id', user.id)
        .eq('restaurant_id', parsed.data.restaurantId)
        .eq('is_active', true)
        .maybeSingle()

      if (!membership?.restaurant_id) {
        return NextResponse.json({ ok: false, error: 'Unauthorized for this restaurant' }, { status: 403 })
      }
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        restaurant_id: parsed.data.restaurantId || null,
        endpoint: parsed.data.subscription.endpoint,
        subscription: parsed.data.subscription,
        device_token: parsed.data.deviceToken || null,
      }, {
        onConflict: 'user_id,device_token',
      })



    if (error) {
      console.error('[push:subscribe] Failed to upsert subscription', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }

    console.log('[push:subscribe] Subscription synced', {
      userId: user.id,
      restaurantId: parsed.data.restaurantId || null,
      endpoint: parsed.data.subscription.endpoint,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to register push subscription'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}