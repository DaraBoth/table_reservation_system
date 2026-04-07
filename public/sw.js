self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()
    const title = data.title || 'TableBook Update'
    const options = {
      body: data.body || 'New update available.',
      icon: data.icon || '/icons/maskable_icon_x192.png',
      badge: '/icons/maskable_icon_x72.png',
      data: {
        url: data.data?.url || '/dashboard',
      },
      vibrate: [100, 50, 100],
      requireInteraction: true,
    }

    event.waitUntil(self.registration.showNotification(title, options))
  } catch (error) {
    console.error('Error in Service Worker push listener:', error)
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client && 'navigate' in client) {
          return client.focus().then((focusedClient) => focusedClient.navigate(targetUrl))
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }

      return undefined
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

const CACHE_NAME = 'bookjm-assets-v2'

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only cache http/https schemes (ignore chrome-extension, etc.)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return

  if (request.method !== 'GET') return

  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse

        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) return networkResponse

          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
          return networkResponse
        })
      })
    )
  }
})