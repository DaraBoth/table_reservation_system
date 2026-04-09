'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ensurePushServiceWorker, getDeviceInfo, getOrCreateDeviceToken, resetPushRegistration, urlBase64ToUint8Array } from '@/lib/push-client'


export function NotificationBell({ restaurantId }: { restaurantId?: string }) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setPermission('unsupported')
      } else {
        setPermission(Notification.permission)
      }
    }
  }, [])

  const handleToggle = async () => {
    if (permission === 'unsupported') {
      toast.error('Push notifications are not supported on this browser.')
      return
    }

    if (permission === 'denied') {
      toast.error('Notifications are blocked. Please enable them in your browser settings.')
      return
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === 'granted') {
        await subscribeUser()
      }
    } catch (err) {
      console.error('Failed to request permission:', err)
    }
  }

  const subscribeUser = async () => {
    try {
      const registration = await ensurePushServiceWorker()
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!publicVapidKey) {
        console.error('[push] Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY')
        toast.error('Push notifications are not configured.')
        return
      }

      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        console.log('[push] Creating new push subscription')
        const applicationServerKey = urlBase64ToUint8Array(publicVapidKey)
        console.log('[push] VAPID key diagnostics', {
          keyChars: publicVapidKey.length,
          keyBytes: applicationServerKey.length,
        })

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        })
      } else {
        console.log('[push] Reusing existing push subscription', {
          endpoint: subscription.endpoint,
        })
      }

      const deviceInfo = getDeviceInfo()
      const deviceToken = getOrCreateDeviceToken()

      console.log('[push] Calling /api/push/subscribe', {
        restaurantId,
        endpoint: subscription.endpoint,
        deviceInfo,
        deviceToken,
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
          deviceToken,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        toast.error('Failed to sync notification settings.')
        console.error('Sync error:', errorText)
      } else {
        console.log('[push] /api/push/subscribe completed successfully')
        toast.success('This device is now linked to booking alerts!')
      }

    } catch (err) {
      console.error('Subscription failed:', err)

      if (err instanceof DOMException && err.name === 'AbortError') {
        console.warn('[push] Resetting service worker registration after AbortError')
        try {
          await resetPushRegistration()
        } catch (resetError) {
          console.error('[push] Failed to reset push registration', resetError)
        }
      }

      // Check for Brave browser to give a specific error message
      const isBrave = (navigator as any).brave && await (navigator as any).brave.isBrave?.()
      if (isBrave) {
        toast.error("Brave blocks notifications by default. Enable 'Use Google services for push messaging' in brave://settings/privacy.", {
          duration: 8000,
        })
      } else {
        toast.error(err instanceof Error ? err.message : 'Push subscription failed.')
      }
    }
  }

  if (permission === 'unsupported') return null

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "relative w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90",
        permission === 'granted'
          ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
          : "text-muted-foreground bg-card border border-border hover:border-violet-500/50 hover:text-violet-400"
      )}
      title={permission === 'granted' ? 'Notifications Active' : 'Enable Notifications'}
    >
      {permission === 'granted' ? (
        <BellRing className="w-4 h-4" />
      ) : permission === 'denied' ? (
        <BellOff className="w-4 h-4" />
      ) : (
        <Bell className="w-4 h-4" />
      )}

      {/* Indicator dot */}
      {permission !== 'granted' && (
        <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
      )}
    </button>
  )
}
