'use client'

import { useEffect } from 'react'
import { ensurePushServiceWorker, getDeviceInfo, urlBase64ToUint8Array } from '@/lib/push-client'

export function NotificationManager({ restaurantId }: { restaurantId?: string }) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }

    void initNotifications()
  }, [])

  const initNotifications = async () => {
    try {
      if (Notification.permission !== 'granted') {
        return
      }

      const registration = await ensurePushServiceWorker()
      const existingSubscription = await registration.pushManager.getSubscription()

      if (existingSubscription) {
        await syncSubscriptionWithSupabase(existingSubscription)
        return
      }

      await subscribeUser(registration)
    } catch (err) {
      console.error('Failed to init notifications:', err)
    }
  }

  const subscribeUser = async (registration?: ServiceWorkerRegistration) => {
    try {
      const serviceWorkerRegistration = registration ?? await ensurePushServiceWorker()
      
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicVapidKey) {
        console.error('VAPID Public Key missing from environment.')
        return
      }

      const subscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      })

      await syncSubscriptionWithSupabase(subscription)
    } catch (err) {
      console.error('Failed to subscribe user:', err)
    }
  }

  const syncSubscriptionWithSupabase = async (subscription: PushSubscription) => {
    const deviceInfo = getDeviceInfo()

    console.log('[push] Auto-sync calling /api/push/subscribe', {
      restaurantId,
      endpoint: subscription.endpoint,
      deviceInfo,
    })

    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        restaurantId,
        subscription,
        deviceInfo,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error syncing push subscription:', errorText)
      return
    }

    console.log('Push subscription synced with API.')
  }

  return null // Headless manager
}
