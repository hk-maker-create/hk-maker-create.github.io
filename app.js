if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(function(reg) {
      console.log('Service Worker registered successfully:', reg.scope);
    })
    .catch(function(err) {
      console.log('Service Worker registration failed:', err);
    });
}

function enableNotifications() {
  if ('Notification' in window) {
    Notification.requestPermission().then(function(permission) {
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        navigator.serviceWorker.ready.then(function(registration) {
          registration.showNotification('Expiry Tracker', {
            body: 'Notifications are enabled!',
            icon: './icon.png'
          });
        });
      }
    });
  }
}
