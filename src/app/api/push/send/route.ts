import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { dispatchPushNotification } from '@/lib/notifications'

export const runtime = 'nodejs'

const requestSchema = z.object({
  restaurantId: z.string().uuid(),
  title: z.string().min(1),
  body: z.string().min(1),
  url: z.string().optional(),
  icon: z.string().optional(),
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

    const { data: membership } = await supabase
      .from('account_memberships')
      .select('restaurant_id, role')
      .eq('user_id', user.id)
      .eq('restaurant_id', parsed.data.restaurantId)
      .eq('is_active', true)
      .maybeSingle()

    if (!membership || !['admin', 'superadmin', 'staff'].includes(membership.role)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized for this restaurant' }, { status: 403 })
    }

    const result = await dispatchPushNotification({
      restaurantId: parsed.data.restaurantId,
      title: parsed.data.title,
      body: parsed.data.body,
      url: parsed.data.url,
      icon: parsed.data.icon,
    })

    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send push notification'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}