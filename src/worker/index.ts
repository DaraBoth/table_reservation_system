/// <reference lib="webworker" />

export type {};
declare const self: ServiceWorkerGlobalScope;

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'New Notification';
    const body = data.body || 'You have a new update in TableBook.';
    const icon = data.icon || '/icons/icon-192x192.png';
    const badge = '/icons/icon-192x192.png'; 
    const tag = data.tag || 'tablebook-notification'; 

    const options: NotificationOptions = {
      body,
      icon,
      badge,
      tag,
      data: data.data || {},
      vibrate: [200, 100, 200],
      requireInteraction: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Error handling push event:', err);
  }
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client && 'navigate' in client && (client as WindowClient).url.includes('/dashboard')) {
          return (client as WindowClient).focus().then((focusedClient) => focusedClient.navigate(urlToOpen));
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
