/**
 * RumahSubsidi.id - Main JavaScript
 * Optimized for Performance & Security
 */

// API Configuration
const API_CONFIG = {
  baseURL: 'https://sikumbang.tapera.go.id',
  endpoints: {
    search: '/ajax/lokasi/search',
    provinsi: '/ajax/wilayah/get-provinsi',
    kabupaten: '/ajax/wilayah/get-kabupaten'
  },
  cacheTime: 5 * 60 * 1000 // 5 minutes
};

// Cache Manager
class CacheManager {
  constructor(ttl = 300000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new CacheManager(API_CONFIG.cacheTime);

// Security: Input Sanitization
function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// Format Number
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Format Rupiah
function formatRupiah(angka) {
  return "Rp " + formatNumber(angka);
}

// API Call with Caching
async function apiCall(endpoint, cacheKey = null) {
  if (cacheKey) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`Cache hit: ${cacheKey}`);
      return cachedData;
    }
  }

  try {
    const response = await fetch(API_CONFIG.baseURL + endpoint);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (cacheKey) {
      cache.set(cacheKey, data);
      console.log(`Cache stored: ${cacheKey}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Load Provinsi
async function loadProvinsi() {
  const select = document.getElementById("provinsi");
  if (!select) return;

  try {
    const data = await apiCall(API_CONFIG.endpoints.provinsi, 'provinsi_list');
    
    data.sort((a, b) => a.namaWilayah.localeCompare(b.namaWilayah));

    select.innerHTML = '<option value="">Pilih Provinsi</option>';

    data.forEach((province) => {
      const option = document.createElement("option");
      option.value = province.kodeWilayah;
      option.textContent = sanitizeInput(province.namaWilayah);
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading provinsi:", error);
    select.innerHTML = '<option value="">Gagal memuat data</option>';
    showNotification('Gagal memuat data provinsi. Silakan refresh halaman.', 'error');
  }
}

// Load Kabupaten
async function loadKabupaten(provinsiCode) {
  const select = document.getElementById("kabupaten");
  if (!select) return;

  select.innerHTML = '<option value="">Memuat data...</option>';

  if (!provinsiCode) {
    select.innerHTML = '<option value="">Pilih Kabupaten/Kota</option>';
    return;
  }

  try {
    const cacheKey = `kabupaten_${provinsiCode}`;
    const data = await apiCall(
      `${API_CONFIG.endpoints.kabupaten}/${provinsiCode}`,
      cacheKey
    );

    data.sort((a, b) => a.namaWilayah.localeCompare(b.namaWilayah));

    select.innerHTML = '<option value="">Pilih Kabupaten/Kota</option>';

    data.forEach((kabupaten) => {
      const option = document.createElement("option");
      option.value = kabupaten.kodeWilayah;
      option.textContent = sanitizeInput(kabupaten.namaWilayah);
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading kabupaten:", error);
    select.innerHTML = '<option value="">Gagal memuat data</option>';
  }
}

// Get Sikumbang Data
async function getSikumbangData() {
  try {
    const data = await apiCall(
      `${API_CONFIG.endpoints.search}?sort=terdekat&page=1&limit=18`,
      'sikumbang_data'
    );
    return data;
  } catch (error) {
    console.error('Error fetching Sikumbang data:', error);
    return null;
  }
}

// Load Statistics
async function loadStatistics() {
  const data = await getSikumbangData();
  
  if (data && data.count) {
    animateValue('countUnitSubsidi', 0, data.count.countUnitSubsidi, 2000);
    animateValue('countUnitReady', 0, data.count.countUnitReady, 2000);
    animateValue('countPengembang', 0, data.count.countPengembang, 2000);
    animateValue('totalLokasi', 0, data.count.totalLokasi, 2000);
  }
}

// Animate Number Counter
function animateValue(id, start, end, duration) {
  const element = document.getElementById(id);
  if (!element) return;

  const range = end - start;
  const increment = end > start ? 1 : -1;
  const stepTime = Math.abs(Math.floor(duration / range));
  let current = start;

  const timer = setInterval(() => {
    current += increment * Math.ceil(range / 100);
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = formatNumber(current);
  }, stepTime);
}

// Load Properties
async function loadProperties() {
  const grid = document.getElementById("propertiesGrid");
  if (!grid) return;

  const data = await getSikumbangData();
  
  if (!data || !data.data) {
    grid.innerHTML = '<p class="loading">Gagal memuat data properti.</p>';
    return;
  }

  const subsidizedProperties = data.data.filter((property) => {
    return (
      property.tipeRumah.some((tipe) => tipe.status === "subsidi") &&
      property.aktivasi
    );
  });

  grid.innerHTML = '';

  subsidizedProperties.forEach((property) => {
    const tipeSubsidi = property.tipeRumah.find((tipe) => tipe.status === "subsidi");
    if (!tipeSubsidi) return;

    const card = createPropertyCard(property, tipeSubsidi);
    grid.appendChild(card);
  });
}

// Create Property Card
function createPropertyCard(property, tipeSubsidi) {
  const card = document.createElement("article");
  card.className = "property-card";
  card.setAttribute("data-id", property.idLokasi);

  card.innerHTML = `
    <img src="${sanitizeInput(property.foto[0])}" 
         alt="${sanitizeInput(property.namaPerumahan)}" 
         class="property-image"
         loading="lazy">
    <div class="property-content">
      <div class="property-price">${formatRupiah(tipeSubsidi.harga)}</div>
      <h3 class="property-title">${sanitizeInput(property.namaPerumahan)}</h3>
      <div class="property-location">
        <i class="fas fa-map-marker-alt"></i>
        ${sanitizeInput(property.wilayah.kelurahan)}, ${sanitizeInput(property.wilayah.kecamatan)}, ${sanitizeInput(property.wilayah.kabupaten)}
      </div>
      <div class="property-features">
        <div class="feature">
          <i class="fas fa-bed"></i> ${tipeSubsidi.kamarTidur} Kamar
        </div>
        <div class="feature">
          <i class="fas fa-bath"></i> ${tipeSubsidi.kamarMandi} Kamar Mandi
        </div>
        <div class="feature">
          <i class="fas fa-ruler-combined"></i> ${tipeSubsidi.luasBangunan} m²
        </div>
      </div>
      <div class="property-footer">
        <div class="developer">${sanitizeInput(property.pengembang.nama)}</div>
        <a href="detail.html?id=${encodeURIComponent(property.idLokasi)}" 
           class="btn btn-primary">
          Detail
        </a>
      </div>
    </div>
  `;

  return card;
}

// Show Notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${type === 'error' ? '#e63757' : '#00d97e'};
    color: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    z-index: 9999;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Setup Event Listeners
function setupEventListeners() {
  const provinsiSelect = document.getElementById("provinsi");
  if (provinsiSelect) {
    provinsiSelect.addEventListener("change", function() {
      loadKabupaten(this.value);
    });
  }

  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
    });
  });

  const searchForm = document.getElementById('heroSearchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      const provinsi = document.getElementById('provinsi').value;
      const kabupaten = document.getElementById('kabupaten').value;
      
      if (!provinsi && !kabupaten) {
        e.preventDefault();
        showNotification('Silakan pilih provinsi atau kabupaten', 'error');
      }
    });
  }
}

// Initialize Application
async function init() {
  console.log('Initializing RumahSubsidi.id...');
  
  try {
    await Promise.all([
      loadProvinsi(),
      loadStatistics(),
      loadProperties()
    ]);

    setupEventListeners();

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Initialization error:', error);
    showNotification('Terjadi kesalahan saat memuat halaman', 'error');
  }
}

// Run on DOM Content Loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);