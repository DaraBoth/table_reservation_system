'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function RealtimeListener({ restaurantId }: { restaurantId?: string }) {
  const router = useRouter()
  // With NEXT_PUBLIC_ prefixes, the client evaluates environment variables natively without props.
  const supabase = createClient()

  useEffect(() => {
    // We only listen if they are attached to a restaurant ID
    if (!restaurantId) return

    const tablesChannel = supabase.channel('public:physical_tables')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'physical_tables', filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          // Tell Next.js to quietly re-evaluate and fetch the current route again!
          router.refresh()
        }
      )
      .subscribe()

    const reservationsChannel = supabase.channel('public:reservations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations', filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(tablesChannel)
      supabase.removeChannel(reservationsChannel)
    }
  }, [supabase, router, restaurantId])

  return null // Headless component
}
