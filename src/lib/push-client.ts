export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function getDeviceInfo() {
  const userAgent = navigator.userAgent

  if (userAgent.match(/iPhone/i)) return 'iPhone'
  if (userAgent.match(/Android/i)) return 'Android'
  if (userAgent.match(/Macintosh/i)) return 'Mac'
  if (userAgent.match(/Windows/i)) return 'Windows'

  return 'Unknown Device'
}

export function getOrCreateDeviceToken() {
  if (typeof window === 'undefined') return 'server-side'
  
  const key = 'tb-device-token'
  let token = localStorage.getItem(key)
  
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem(key, token)
  }
  
  return token
}


export async function ensurePushServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser')
  }

  const existingRegistration = await navigator.serviceWorker.getRegistration()
  if (existingRegistration) {
    console.log('[push] Reusing existing service worker registration', {
      scope: existingRegistration.scope,
    })
    return existingRegistration
  }

  console.log('[push] Registering service worker /sw.js')
  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  console.log('[push] Service worker registered', {
    scope: registration.scope,
  })

  return registration
}

export async function resetPushRegistration() {
  if (!('serviceWorker' in navigator)) {
    return
  }

  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) {
    return
  }

  const existingSubscription = await registration.pushManager.getSubscription()
  if (existingSubscription) {
    console.log('[push] Unsubscribing existing browser subscription', {
      endpoint: existingSubscription.endpoint,
    })
    await existingSubscription.unsubscribe()
  }

  console.log('[push] Unregistering service worker', {
    scope: registration.scope,
  })
  await registration.unregister()
}