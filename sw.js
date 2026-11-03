self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Expiry Tracker', body: 'Items need your attention!' };
  const options = {
    body: data.body,
    icon: './icon.png',
    badge: './badge.png'
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});
