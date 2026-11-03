document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  checkExpiryAlerts();
});

async function enableNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Push notifications are not supported on this browser.');
    return;
  }
  try {
    const reg = await navigator.serviceWorker.register('./sw.js');
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      alert('Notification permission granted! You will be alerted about expiring items.');
      checkExpiryAlerts();
    } else {
      alert('Permission denied.');
    }
  } catch (error) {
    console.error('Error enabling notifications:', error);
  }
}

function checkExpiryAlerts() {
  if (Notification.permission !== 'granted') return;

  const products = JSON.parse(localStorage.getItem('expiry_products') || '[]');
  const today = new Date();
  today.setHours(0,0,0,0);

  let urgentItems = [];

  products.forEach(p => {
    const expDate = new Date(p.date);
    expDate.setHours(0,0,0,0);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) {
      urgentItems.push(p.name);
    }
  });

  if (urgentItems.length > 0) {
    const title = '⚠️ Expiry Alert!';
    const body = `${urgentItems.length} item(s) are expiring within a week or have expired: ${urgentItems.slice(0, 3).join(', ')}`;
    
    // Trigger a native browser notification directly
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, {
        body: body,
        tag: 'expiry-alert'
      });
    });
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
  const nameInput = document.getElementById('product-name');
  nameInput.value = '';
  document.getElementById('expiry-date').value = '';

  if (barcode) {
    nameInput.placeholder = 'Looking up product...';
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      if (data.status === 1 && data.product && data.product.product_name) {
        nameInput.value = data.product.product_name;
      } else {
        nameInput.placeholder = 'Product not found (Enter name here)';
      }
    } catch (err) {
      console.error('API lookup failed:', err);
      nameInput.placeholder = 'Enter product name manually';
    }
  } else {
    nameInput.placeholder = 'Product Name';
  }
}

function showHomeView() {
  stopScanner();
  document.getElementById('scanner-view').classList.remove('active');
  document.getElementById('add-view').classList.remove('active');
  document.getElementById('home-view').classList.add('active');
  loadProducts();
  checkExpiryAlerts();
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

  if (!name || !date) {
    alert('Please enter a product name and expiry date.');
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
    listContainer.innerHTML = '<p style="color: #6b7280; padding: 20px 0;">No items tracked yet.</p>';
    return;
  }

  const today = new Date();
  today.setHours(0,0,0,0);

  listContainer.innerHTML = products.map(p => {
    const expDate = new Date(p.date);
    expDate.setHours(0,0,0,0);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let statusClass = 'safe';
    let badgeText = `Expires in ${diffDays} days`;

    if (diffDays < 0) {
      statusClass = 'red';
      badgeText = `Expired ${Math.abs(diffDays)} days ago`;
    } else if (diffDays === 0) {
      statusClass = 'red';
      badgeText = 'Expires Today!';
    } else if (diffDays <= 7) {
      statusClass = 'red';
      badgeText = `Expires in ${diffDays} days (1 Week)`;
    } else if (diffDays <= 14) {
      statusClass = 'amber';
      badgeText = `Expires in ${diffDays} days (2 Weeks)`;
    } else if (diffDays <= 30) {
      statusClass = 'yellow';
      badgeText = `Expires in ${diffDays} days (1 Month)`;
    } else {
      statusClass = 'safe';
      badgeText = `Expires in ${diffDays} days`;
    }

    return `
      <div class="item-card ${statusClass}">
        <div class="item-info">
          <h4>${p.name}</h4>
          <p>📅 ${p.date} ${p.barcode ? '<br><small>Barcode: ' + p.barcode + '</small>' : ''}</p>
          <span class="badge ${statusClass}">${badgeText}</span>
        </div>
        <button class="delete-btn" onclick="deleteProduct(${p.id})">Delete</button>
      </div>
    `;
  }).join('');
}

function deleteProduct(id) {
  if (confirm('Are you sure you want to delete this product?')) {
    let products = JSON.parse(localStorage.getItem('expiry_products') || '[]');
    products = products.filter(p => p.id !== id);
    localStorage.setItem('expiry_products', JSON.stringify(products));
    loadProducts();
    checkExpiryAlerts();
  }
}
