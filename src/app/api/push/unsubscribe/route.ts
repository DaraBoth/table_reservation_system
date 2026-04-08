import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const requestSchema = z.object({
  deviceToken: z.string().uuid(),
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

    // Unbind this device from the current user
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('device_token', parsed.data.deviceToken)

    if (error) {
      console.error('[push:unsubscribe] Failed to delete subscription', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }

    console.log('[push:unsubscribe] Subscription removed for logout', {
      userId: user.id,
      deviceToken: parsed.data.deviceToken,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to unregister push subscription'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
