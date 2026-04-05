'use client'

import { useEffect } from 'react'

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

      const registration = await navigator.serviceWorker.ready
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
      const serviceWorkerRegistration = registration ?? await navigator.serviceWorker.ready
      
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
    const userAgent = navigator.userAgent
    let deviceInfo = 'Unknown Device'
    if (userAgent.match(/iPhone/i)) deviceInfo = 'iPhone'
    else if (userAgent.match(/Android/i)) deviceInfo = 'Android Device'
    else if (userAgent.match(/Macintosh/i)) deviceInfo = 'Mac'
    else if (userAgent.match(/Windows/i)) deviceInfo = 'Windows PC'

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
