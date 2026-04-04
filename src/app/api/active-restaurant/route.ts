import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { setActiveRestaurantId } from '@/lib/restaurant-context'

export async function POST(request: Request) {
  try {
    const { restaurantId } = await request.json()

    if (!restaurantId || typeof restaurantId !== 'string') {
      return NextResponse.json({ error: 'Invalid restaurantId' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from('account_memberships')
      .select('restaurant_id')
      .eq('user_id', user.id)
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .maybeSingle()

    if (!membership?.restaurant_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await setActiveRestaurantId(restaurantId)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to switch restaurant' }, { status: 500 })
  }
}
