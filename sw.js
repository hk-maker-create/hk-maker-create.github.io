self.addEventListener('push', function(event) {
  const data = event.data ? event.data.text() : 'Expiry Tracker Notification';
  const options = {
    body: data,
    icon: './icon.png',
    badge: './icon.png'
  };
  event.waitUntil(
    self.registration.showNotification('Expiry Tracker', options)
  );
});
