// public/sw.js (version 3.0)
// This is our new, simplified, hand-written service worker.

// On install, activate immediately
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event fired. Activating immediately.')
  event.waitUntil(self.skipWaiting())
})

// On activate, take control of all clients
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event fired. Claiming clients.')
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.')
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`)

  let data
  try {
    data = event.data.json()
  } catch (e) {
    console.error('[Service Worker] Failed to parse push data as JSON.')
    data = {
      title: 'New Update',
      body: event.data.text(),
      url: '/',
    }
  }

  const title = data.title || 'New Intelligence Alert'
  const options = {
    body: data.body || 'New content has been added.',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'view_event', title: 'View Event' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  console.log(
    '[Service Worker] Showing notification with options:',
    JSON.stringify(options)
  )
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.', event.action)
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href

  event.notification.close()

  if (event.action === 'dismiss') {
    console.log('[Service Worker] Dismiss action handled.')
    return
  }

  event.waitUntil(
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        if (clientList.length > 0) {
          let client = clientList[0]
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i]
            }
          }
          return client.focus().then((c) => c.navigate(urlToOpen))
        }
        return self.clients.openWindow(urlToOpen)
      })
  )
})
