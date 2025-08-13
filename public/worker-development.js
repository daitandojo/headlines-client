/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
// worker/index.js (version 1.5)
// The invalid `"use client";` directive has been removed.

self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('[Service Worker] Failed to parse push data as JSON.');
    data = {
      title: 'New Update',
      body: event.data.text(),
      url: '/'
    };
  }
  const title = data.title || 'New Intelligence Alert';
  const options = {
    body: data.body || 'New content has been added.',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    sound: '/sounds/notification.mp3',
    data: {
      url: data.url || '/'
    },
    actions: [{
      action: 'view_event',
      title: 'View Event'
    }, {
      action: 'dismiss',
      title: 'Dismiss'
    }]
  };
  console.log('[Service Worker] Showing notification with options:', JSON.stringify(options));
  event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click Received.', event.action);
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  // Close the notification.
  event.notification.close();

  // If the action is 'dismiss', we do nothing further.
  if (event.action === 'dismiss') {
    console.log('[Service Worker] Dismiss action handled.');
    return;
  }

  // For the 'view_event' action or a click on the notification body,
  // focus an existing window or open a new one.
  event.waitUntil(self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(clientList => {
    if (clientList.length > 0) {
      let client = clientList[0];
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].focused) {
          client = clientList[i];
        }
      }
      return client.focus().then(c => c.navigate(urlToOpen));
    }
    return self.clients.openWindow(urlToOpen);
  }));
});
/******/ })()
;