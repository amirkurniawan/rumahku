/**
 * RumahSubsidi.id - Main JavaScript
 * Optimized for Performance & Security
 */

// Cache Configuration
const CACHE_CONFIG = {
  DEFAULT_TTL_MS: 5 * 60 * 1000,      // 5 minutes - Time To Live for cache
  MAX_CACHE_SIZE: 100,                 // Maximum number of cached items
  CLEAR_INTERVAL_MS: 10 * 60 * 1000   // 10 minutes - Auto clear old cache
};

// API Configuration
const API_CONFIG = {
  baseURL: 'https://sikumbang.tapera.go.id',
  endpoints: {
    search: '/ajax/lokasi/search',
    provinsi: '/ajax/wilayah/get-provinsi',
    kabupaten: '/ajax/wilayah/get-kabupaten'
  },
  cacheTime: CACHE_CONFIG.DEFAULT_TTL_MS
};

// Cache Manager
class CacheManager {
  constructor(ttl = CACHE_CONFIG.DEFAULT_TTL_MS) {
    this.cache = new Map();
    this.ttl = ttl;
    this.maxSize = CACHE_CONFIG.MAX_CACHE_SIZE;

    // Auto-clear expired cache periodically
    this.startAutoClear();
  }

  set(key, value) {
    // Check cache size limit
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      console.log(`Cache full, removed oldest: ${firstKey}`);
    }

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
    console.log('Cache cleared');
  }

  // Auto-clear expired entries
  startAutoClear() {
    setInterval(() => {
      const now = Date.now();
      let clearedCount = 0;

      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.ttl) {
          this.cache.delete(key);
          clearedCount++;
        }
      }

      if (clearedCount > 0) {
        console.log(`Auto-cleared ${clearedCount} expired cache entries`);
      }
    }, CACHE_CONFIG.CLEAR_INTERVAL_MS);
  }
}

const cache = new CacheManager();

// Security: Input Sanitization
function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// Centralized Error Handler
class ErrorHandler {
  static handle(error, context = 'Unknown') {
    // Log error dengan context untuk debugging
    console.error(`[${context}] Error:`, error);

    // Get user-friendly message
    const userMessage = this.getUserMessage(error, context);

    // Show notification to user
    showNotification(userMessage, 'error');

    // Optional: Send error to monitoring service (uncomment jika diperlukan)
    // this.logToServer(error, context);

    return userMessage;
  }

  static getUserMessage(error, context) {
    // Map technical errors ke user-friendly messages
    const errorMessages = {
      'LoadProvinsi': 'Gagal memuat data provinsi. Silakan refresh halaman.',
      'LoadKabupaten': 'Gagal memuat data kabupaten. Silakan pilih provinsi lagi.',
      'LoadProperties': 'Gagal memuat data properti. Silakan coba lagi.',
      'LoadStatistics': 'Gagal memuat statistik.',
      'NetworkError': 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
      'TimeoutError': 'Request timeout. Server terlalu lama merespon.',
      'APIError': 'Terjadi kesalahan pada server. Silakan coba lagi nanti.'
    };

    // Check for specific error types
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      return errorMessages.NetworkError;
    }

    if (error.message?.includes('timeout')) {
      return errorMessages.TimeoutError;
    }

    if (error.message?.includes('HTTP error')) {
      return errorMessages.APIError;
    }

    // Return context-specific message or generic error
    return errorMessages[context] || `Terjadi kesalahan: ${error.message}`;
  }

  // Optional: Log errors to server for monitoring
  static async logToServer(error, context) {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        context: context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      // Uncomment jika ada endpoint untuk error logging
      // await fetch('/api/log-error', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // });

      console.log('Error logged:', errorData);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }
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
    // IMPORTANT: Use 'reload' to bypass browser disk cache
    // This prevents using cached 301/302 redirect responses
    const response = await fetch(API_CONFIG.baseURL + endpoint, {
      cache: 'reload',  // Always fetch fresh from server
      redirect: 'follow'  // Follow redirects automatically
    });

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
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
    select.innerHTML = '<option value="">Gagal memuat data</option>';
    ErrorHandler.handle(error, 'LoadProvinsi');
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
    select.innerHTML = '<option value="">Gagal memuat data</option>';
    ErrorHandler.handle(error, 'LoadKabupaten');
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

// Create optimized image element with multiple formats
function createOptimizedImage(src, alt) {
  const imageUrl = sanitizeInput(src);
  const altText = sanitizeInput(alt);

  // Convert image URL to support multiple formats
  // Note: Only works if server supports format conversion
  const baseUrl = imageUrl;

  return `
    <picture>
     
     
      <source srcset="${baseUrl}" type="image/jpg" onerror="this.remove()">
      <img src="${imageUrl}"
           alt="${altText}"
           class="property-image"
           loading="lazy"
           decoding="async">
    </picture>
  `;
}

// Create Property Card
function createPropertyCard(property, tipeSubsidi) {
  const card = document.createElement("article");
  card.className = "property-card";
  card.setAttribute("data-id", property.idLokasi);

  card.innerHTML = `
    ${createOptimizedImage(property.foto[0], property.namaPerumahan)}
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
    ErrorHandler.handle(error, 'Initialization');
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