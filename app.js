async function enableNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Push notifications are not supported on this browser.');
    return;
  }
  try {
    await navigator.serviceWorker.register('./sw.js');
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

function showScannerView() {
  document.getElementById('home-view').classList.remove('active');
  document.getElementById('scanner-view').classList.add('active');
  startScanner();
}

function showHomeView() {
  document.getElementById('scanner-view').classList.remove('active');
  document.getElementById('home-view').classList.add('active');
}

let html5QrCode = null;

function startScanner() {
  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("reader");
  }
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  html5QrCode.start(
    { facingMode: "environment" },
    config,
    (decodedText) => {
      document.getElementById('result').innerText = "Scanned Barcode: " + decodedText;
      html5QrCode.stop().catch(err => console.error(err));
    },
    (errorMessage) => {
      // scanning
    }
  ).catch((err) => {
    alert("Camera access failed: " + err);
  });
}
