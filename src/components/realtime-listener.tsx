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

    console.log('📡 Real-time: Initializing listeners for restaurant:', restaurantId)

    const channel = supabase.channel(`db-changes-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations', filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          console.log('🔄 Real-time: Reservation change detected!', payload)
          router.refresh()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'physical_tables', filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          console.log('🔄 Real-time: Table status updated!', payload)
          router.refresh()
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, router, restaurantId])

  return null // Headless component
}
