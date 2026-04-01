'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function NotificationManager({ restaurantId }: { restaurantId?: string }) {
  const [isSupported, setIsSupported] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Check for browser support
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      initNotifications()
    }
  }, [])

  const initNotifications = async () => {
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.log('Notification permission denied.')
        return
      }

      await subscribeUser()
    } catch (err) {
      console.error('Failed to init notifications:', err)
    }
  }

  const subscribeUser = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicVapidKey) {
        console.error('VAPID Public Key missing from environment.')
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      })

      await syncSubscriptionWithSupabase(subscription)
    } catch (err) {
      console.error('Failed to subscribe user:', err)
    }
  }

  const syncSubscriptionWithSupabase = async (subscription: PushSubscription) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get basic device info for identification
    const userAgent = navigator.userAgent
    let deviceInfo = 'Unknown Device'
    if (userAgent.match(/iPhone/i)) deviceInfo = 'iPhone'
    else if (userAgent.match(/Android/i)) deviceInfo = 'Android Device'
    else if (userAgent.match(/Macintosh/i)) deviceInfo = 'Mac'
    else if (userAgent.match(/Windows/i)) deviceInfo = 'Windows PC'

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        restaurant_id: restaurantId || null,
        endpoint: subscription.endpoint,
        subscription: subscription as any,
        device_info: deviceInfo,
      }, {
        onConflict: 'user_id,endpoint'
      })

    if (error) {
      console.error('Error syncing push subscription:', error)
    } else {
      console.log('Push subscription synced with Supabase.')
    }
  }

  return null // Headless manager
}
