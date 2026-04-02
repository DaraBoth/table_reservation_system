'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, BellOff, BellRing } from 'lucide-react'
import { cn } from '@/lib/utils'
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

export function NotificationBell({ restaurantId }: { restaurantId?: string }) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const supabase = createClient()

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
        toast.success('Notifications enabled! You will now receive booking alerts.')
      }
    } catch (err) {
      console.error('Failed to request permission:', err)
    }
  }

  const subscribeUser = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      
      if (!publicVapidKey) return

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      })

      // Sync with Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const userAgent = navigator.userAgent
      let deviceInfo = 'Unknown'
      if (userAgent.match(/iPhone/i)) deviceInfo = 'iPhone'
      else if (userAgent.match(/Android/i)) deviceInfo = 'Android'
      else if (userAgent.match(/Windows/i)) deviceInfo = 'Windows'
      else if (userAgent.match(/Macintosh/i)) deviceInfo = 'Mac'

      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        restaurant_id: restaurantId || null,
        endpoint: subscription.endpoint,
        subscription: subscription as any,
        device_info: deviceInfo,
      }, { onConflict: 'user_id,endpoint' })

      if (error) {
        toast.error('Failed to sync notification settings.')
        console.error('Sync error:', error)
      } else {
        toast.success('This device is now linked to booking alerts!')
      }

    } catch (err) {
      console.error('Subscription failed:', err)
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
          : "text-slate-500 bg-slate-900 border border-slate-800 hover:border-violet-500/50 hover:text-violet-400"
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
