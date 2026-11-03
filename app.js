async function enableNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Push notifications are not supported on this browser.');
    return;
  }
  try {
    const registration = await navigator.serviceWorker.registr('./sw.js');
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      alert('Notification permission granted!');
    } else {
      alert('Notification permission denied or dismissed.');
    }
  } catch (error) {
    console.error('Error enabling notifications:', error);
  }
}

function openScanner() {
  const readerElement = document.getElementById('reader');
  readerElement.style.display = 'block';
  const html5QrCode = new Html5QrCode("reader");
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };
  html5QrCode.start(
    { facingMode: "environment" },
    config,
    (decodedText) => {
      document.getElementById('result').innerText = "Scanned Barcode: " + decodedText;
      html5QrCode.stop();
    },
    (errorMessage) => {}
  ).catch((err) => {
    alert("Camera access failed: " + err);
  });
}