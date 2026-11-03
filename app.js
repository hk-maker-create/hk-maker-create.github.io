async function enableNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Push notifications are not supported on this browser.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('./sw.js');
    console.log('Service Worker registered:', registration);

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      alert('Notification permission granted!');
      registration.showNotification('Expiry Tracker', {
        body: 'Push notifications are now enabled!',
        icon: './icon.png'
      });
    } else if (permission === 'denied') {
      alert('Notification permission was denied in your browser settings.');
    } else {
      alert('Notification permission request was dismissed.');
    }
  } catch (error) {
    console.error('Error enabling notifications:', error);
    alert('Failed to register service worker or enable notifications.');
  }
}
