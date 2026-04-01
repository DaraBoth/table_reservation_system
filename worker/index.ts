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
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
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
