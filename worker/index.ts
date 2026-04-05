/// <reference lib="webworker" />

export type {};
declare const self: ServiceWorkerGlobalScope;

// 🔔 1. RECEIVE THE NOTIFICATION (The "Push" Event)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    console.log('Push received:', data);

    const title = data.title || 'TableBook Update';
    const options = {
      body: data.body || 'New update available.',
      icon: data.icon || '/icons/maskable_icon_x192.png',
      badge: '/icons/maskable_icon_x72.png',
      data: {
        url: data.data?.url || '/dashboard'
      },
      vibrate: [100, 50, 100],
      requireInteraction: true
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Error in Service Worker push listener:', err);
  }
});

// 🖱️ 2. HANDLE THE CLICK (Deep-linking)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client && 'navigate' in client) {
          return client.focus().then((c) => c.navigate(targetUrl));
        }
      }
      // Otherwise, open a fresh window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Standard PWA housekeeping
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 📦 3. AGGRESSIVE CACHING FOR ASSETS (Faster loading on mobile)
const CACHE_NAME = 'bookjm-assets-v1';

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Cache First for Images and Fonts
  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) return networkResponse;
          
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. Stale While Revalidate for JS and CSS
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});
