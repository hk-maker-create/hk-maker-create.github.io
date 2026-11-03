document.addEventListener('DOMContentLoaded', loadProducts);

async function enableNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Push notifications are not supported on this browser.');
    return;
  }
  try {
    await navigator.serviceWorker.register('./sw.js');
    const permission = await Notification.requestPermission();
    alert(permission === 'granted' ? 'Notification permission granted!' : 'Permission denied.');
  } catch (error) {
    console.error('Error enabling notifications:', error);
  }
}

function showScannerView() {
  document.getElementById('home-view').classList.remove('active');
  document.getElementById('scanner-view').classList.add('active');
  startScanner();
}

async function showAddView(barcode = '') {
  document.getElementById('home-view').classList.remove('active');
  document.getElementById('scanner-view').classList.remove('active');
  document.getElementById('add-view').classList.add('active');
  
  document.getElementById('product-barcode').value = barcode;
  document.getElementById('product-name').value = 'Looking up product...';
  document.getElementById('expiry-date').value = '';

  if (barcode) {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      if (data.status === 1 && data.product && data.product.product_name) {
        document.getElementById('product-name').value = data.product.product_name;
      } else {
        document.getElementById('product-name').value = '';
        document.getElementById('product-name').placeholder = 'Product not found (Enter manually)';
      }
    } catch (err) {
      console.error('API lookup failed:', err);
      document.getElementById('product-name').value = '';
      document.getElementById('product-name').placeholder = 'Product Name';
    }
  } else {
    document.getElementById('product-name').value = '';
    document.getElementById('product-name').placeholder = 'Product Name';
  }
}

function showHomeView() {
  stopScanner();
  document.getElementById('scanner-view').classList.remove('active');
  document.getElementById('add-view').classList.remove('active');
  document.getElementById('home-view').classList.add('active');
  loadProducts();
}

let html5QrCode = null;

function startScanner() {
  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("reader");
  }
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    (decodedText) => {
      stopScanner();
      showAddView(decodedText);
    },
    (errorMessage) => {}
  ).catch((err) => {
    alert("Camera access failed: " + err);
  });
}

function stopScanner() {
  if (html5QrCode && html5QrCode.isScanning) {
    html5QrCode.stop().catch(err => console.error(err));
  }
}

function saveProduct() {
  const name = document.getElementById('product-name').value.trim();
  const barcode = document.getElementById('product-barcode').value.trim();
  const date = document.getElementById('expiry-date').value;

  if (!name || !date || name === 'Looking up product...') {
    alert('Please enter a valid product name and expiry date.');
    return;
  }

  const products = JSON.parse(localStorage.getItem('expiry_products') || '[]');
  products.push({ id: Date.now(), name, barcode, date });
  localStorage.setItem('expiry_products', JSON.stringify(products));

  showHomeView();
}

function loadProducts() {
  const products = JSON.parse(localStorage.getItem('expiry_products') || '[]');
  const listContainer = document.getElementById('item-list');
  
  if (products.length === 0) {
    listContainer.innerHTML = '<p style="color: #777;">No items tracked yet.</p>';
    return;
  }

  listContainer.innerHTML = products.map(p => `
    <div class="item-card">
      <div class="item-info">
        <h4>${p.name}</h4>
        <p>Expires: ${p.date} ${p.barcode ? '<br><small>Barcode: ' + p.barcode + '</small>' : ''}</p>
      </div>
      <button class="delete-btn" onclick="deleteProduct(${p.id})">Delete</button>
    </div>
  `).join('');
}

function deleteProduct(id) {
  let products = JSON.parse(localStorage.getItem('expiry_products') || '[]');
  products = products.filter(p => p.id !== id);
  localStorage.setItem('expiry_products', JSON.stringify(products));
  loadProducts();
}
