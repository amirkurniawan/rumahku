/**
 * RumahSubsidi.id - Main JavaScript
 * Optimized for Performance & Security
 */

// Use configuration from APP_CONFIG (loaded from config.js)
const CACHE_CONFIG = {
  DEFAULT_TTL_MS: APP_CONFIG.cache.ttl,
  MAX_CACHE_SIZE: 100,                 // Maximum number of cached items
  CLEAR_INTERVAL_MS: 10 * 60 * 1000   // 10 minutes - Auto clear old cache
};

// API Configuration (from APP_CONFIG)
const API_CONFIG = {
  baseURL: APP_CONFIG.api.sikumbang.baseURL,
  proxyURL: APP_CONFIG.server.proxy.baseURL,
  endpoints: {
    search: APP_CONFIG.api.sikumbang.endpoints.search,
    provinsi: APP_CONFIG.api.sikumbang.endpoints.provinsi,
    kabupaten: APP_CONFIG.api.sikumbang.endpoints.kabupaten,
    detail: APP_CONFIG.proxy.endpoints.detail
  },
  cacheTime: APP_CONFIG.cache.ttl
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

// Geolocation state
let userLocation = null;
let userProvinsiCode = null;
let provinsiListData = [];

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

    // Store provinsi data globally for geolocation matching
    provinsiListData = data;
    console.log(`📊 Loaded ${data.length} provinces for matching`);

    data.sort((a, b) => a.namaWilayah.localeCompare(b.namaWilayah));

    select.innerHTML = '<option value="">Pilih Provinsi</option>';

    data.forEach((province) => {
      const option = document.createElement("option");
      option.value = province.kodeWilayah;
      option.textContent = sanitizeInput(province.namaWilayah);
      select.appendChild(option);
    });

    console.log("✅ Provinces loaded successfully");
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

// ========== GEOLOCATION SERVICE ==========

// Request user location permission and get coordinates
async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.log('❌ Geolocation not supported');
      reject(new Error('Geolocation not supported'));
      return;
    }

    console.log('📍 Requesting location permission...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        console.log(`✅ Location obtained: ${userLocation.latitude}, ${userLocation.longitude}`);
        resolve(userLocation);
      },
      (error) => {
        console.log(`❌ Location permission denied or error: ${error.message}`);
        reject(error);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
}

// Reverse geocode: Convert lat/long to provinsi name using Nominatim API
async function reverseGeocode(lat, lon) {
  try {
    console.log(`🌍 Reverse geocoding: ${lat}, ${lon}`);

    const response = await fetch(
      `${APP_CONFIG.api.nominatim.baseURL}/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
      {
        headers: {
          'User-Agent': APP_CONFIG.api.nominatim.userAgent
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding API error');
    }

    const data = await response.json();
    console.log('🗺️ Geocoding result:', data);
    console.log('🗺️ Address data:', data.address);

    // Extract provinsi (state) from address
    // Nominatim uses different field names for different countries
    // For Indonesia, try multiple possible fields
    const provinsi = data.address?.state ||
                     data.address?.province ||
                     data.address?.region ||
                     data.address?.state_district ||
                     data.address?.ISO3166_2_lvl4 ||
                     null;

    if (provinsi) {
      console.log(`✅ Detected provinsi: ${provinsi}`);
      return provinsi;
    }

    // Fallback: Try to extract from display_name
    // Format usually: "Street, City, State, Postcode, Country"
    if (data.display_name) {
      console.log('🔄 Trying to extract from display_name:', data.display_name);

      // Split by comma and look for province-like patterns
      const parts = data.display_name.split(',').map(p => p.trim());

      // Common Indonesian provinces (try to match)
      const provinces = [
        'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur',
        'Banten', 'Yogyakarta', 'Bali', 'Sumatera Utara', 'Sumatera Barat',
        'Sumatera Selatan', 'Riau', 'Kepulauan Riau', 'Jambi', 'Bengkulu',
        'Lampung', 'Bangka Belitung', 'Kalimantan Barat', 'Kalimantan Tengah',
        'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
        'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara',
        'Gorontalo', 'Sulawesi Barat', 'Maluku', 'Maluku Utara', 'Papua', 'Papua Barat'
      ];

      for (const part of parts) {
        for (const prov of provinces) {
          if (part.toLowerCase().includes(prov.toLowerCase()) ||
              prov.toLowerCase().includes(part.toLowerCase())) {
            console.log(`✅ Detected provinsi from display_name: ${prov}`);
            return prov;
          }
        }
      }
    }

    console.error('❌ No provinsi field found in address:', Object.keys(data.address || {}));
    console.error('❌ Available fields:', data.address);
    return null;
  } catch (error) {
    console.error('❌ Reverse geocoding failed:', error);
    return null;
  }
}

// Match provinsi name with get-provinsi data to get kodeWilayah
function matchProvinsiCode(provinsiName) {
  if (!provinsiName || !provinsiListData.length) {
    return null;
  }

  // Normalize provinsi name for matching
  const normalizedName = provinsiName.toUpperCase().trim();

  console.log(`🔍 Matching provinsi: "${normalizedName}"`);
  console.log(`📊 Available provinces:`, provinsiListData.map(p => p.namaWilayah));

  // Try exact match first
  let match = provinsiListData.find(p =>
    p.namaWilayah.toUpperCase().trim() === normalizedName
  );

  // Try partial match if exact match fails
  if (!match) {
    match = provinsiListData.find(p =>
      p.namaWilayah.toUpperCase().includes(normalizedName) ||
      normalizedName.includes(p.namaWilayah.toUpperCase())
    );
  }

  if (match) {
    console.log(`✅ Matched: ${match.namaWilayah} → ${match.kodeWilayah}`);
    return match.kodeWilayah;
  }

  console.log(`❌ No match found for: ${normalizedName}`);
  return null;
}

// Auto-detect location and set provinsi code
async function autoDetectLocation() {
  try {
    // Check if already detected
    if (userProvinsiCode) {
      console.log('✅ Location already detected, skipping...');
      return userProvinsiCode;
    }

    // Check localStorage for cached location
    const cachedCode = localStorage.getItem('userProvinsiCode');
    const cachedTimestamp = localStorage.getItem('userProvinsiCodeTimestamp');
    const oneDay = 24 * 60 * 60 * 1000;

    if (cachedCode && cachedTimestamp) {
      const age = Date.now() - parseInt(cachedTimestamp);
      if (age < oneDay) {
        console.log(`✅ Using cached location: ${cachedCode}`);
        userProvinsiCode = cachedCode;
        return cachedCode;
      }
    }

    // Get user coordinates
    const location = await getUserLocation();

    // Reverse geocode to get provinsi name
    const provinsiName = await reverseGeocode(location.latitude, location.longitude);

    if (!provinsiName) {
      console.log('❌ Could not determine provinsi from coordinates');
      return null;
    }

    // Match with get-provinsi data
    const kodeWilayah = matchProvinsiCode(provinsiName);

    if (kodeWilayah) {
      userProvinsiCode = kodeWilayah;

      // Cache in localStorage
      localStorage.setItem('userProvinsiCode', kodeWilayah);
      localStorage.setItem('userProvinsiCodeTimestamp', Date.now().toString());

      console.log(`✅ User provinsi detected: ${provinsiName} (${kodeWilayah})`);
      return kodeWilayah;
    }

    return null;
  } catch (error) {
    console.log('ℹ️ Auto-detect location skipped or failed:', error.message);
    return null;
  }
}

// ========== END GEOLOCATION SERVICE ==========

// Load Properties (with optional kodeWilayah filter from geolocation)
async function loadProperties(kodeWilayah = null) {
  const grid = document.getElementById("propertiesGrid");
  if (!grid) return;

  try {
    let data;

    // Load with location filter if available
    if (kodeWilayah) {
      const apiUrl = `${API_CONFIG.endpoints.search}?selectedSearch=wilayah&skalaPerumahan=semua&kodeWilayah=${kodeWilayah}&sort=terbaru&searchBy=nama-perumahan&page=1&limit=18`;
      console.log(`📍 Loading properties for location: ${kodeWilayah}`);
      data = await apiCall(apiUrl, `home_properties_${kodeWilayah}`);
    } else {
      data = await getSikumbangData();
    }

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

    if (subsidizedProperties.length === 0) {
      grid.innerHTML = '<p class="loading">Tidak ada properti yang tersedia di lokasi Anda saat ini.</p>';
      return;
    }

    console.log(`✅ Loaded ${subsidizedProperties.length} properties`);
    grid.innerHTML = '';

    subsidizedProperties.forEach((property) => {
      const tipeSubsidi = property.tipeRumah.find((tipe) => tipe.status === "subsidi");
      if (!tipeSubsidi) return;

      const card = createPropertyCard(property, tipeSubsidi);
      grid.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading properties:', error);
    grid.innerHTML = '<p class="loading">Gagal memuat data properti.</p>';
  }
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
        <a href="detail?id=${encodeURIComponent(property.idLokasi)}"
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
      e.preventDefault(); // Prevent default form submission

      const provinsiSelect = document.getElementById('provinsi');
      const kabupatenSelect = document.getElementById('kabupaten');

      const provinsiCode = provinsiSelect.value;
      const kabupatenCode = kabupatenSelect.value;

      // Validation
      if (!provinsiCode && !kabupatenCode) {
        showNotification('Silakan pilih provinsi atau kabupaten', 'error');
        return;
      }

      // Determine which kodeWilayah to use
      // Priority: kabupaten > provinsi (more specific wins)
      const kodeWilayah = kabupatenCode || provinsiCode;

      // Get selected text for display
      const selectedText = kabupatenCode
        ? kabupatenSelect.options[kabupatenSelect.selectedIndex].text
        : provinsiSelect.options[provinsiSelect.selectedIndex].text;

      // Redirect to search.html with kodeWilayah parameter
      const searchUrl = `search.html?kodeWilayah=${encodeURIComponent(kodeWilayah)}&nama=${encodeURIComponent(selectedText)}`;
      console.log('Redirecting to:', searchUrl);
      window.location.href = searchUrl;
    });
  }
}

// Show location indicator when auto-detect succeeds
function showLocationIndicator(kodeWilayah) {
  const provinsi = provinsiListData.find(p => p.kodeWilayah === kodeWilayah);
  if (!provinsi) return;

  const indicator = document.createElement('div');
  indicator.id = 'locationIndicator';
  indicator.className = 'location-indicator';
  indicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 20px;
    border-radius: 30px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    animation: slideIn 0.5s ease-out;
  `;

  indicator.innerHTML = `
    <i class="fas fa-map-marker-alt" style="color: #ffd700;"></i>
    <span>📍 Menampilkan untuk <strong>${sanitizeInput(provinsi.namaWilayah)}</strong></span>
    <button onclick="clearLocationFilter()" style="
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 4px 12px;
      border-radius: 15px;
      cursor: pointer;
      font-size: 12px;
      margin-left: 5px;
    ">
      ✕ Hapus
    </button>
  `;

  // Add CSS animation
  if (!document.getElementById('locationIndicatorStyles')) {
    const style = document.createElement('style');
    style.id = 'locationIndicatorStyles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(indicator);
}

// Clear location filter and reload all properties
window.clearLocationFilter = function() {
  localStorage.removeItem('userProvinsiCode');
  localStorage.removeItem('userProvinsiCodeTimestamp');
  userProvinsiCode = null;

  const indicator = document.getElementById('locationIndicator');
  if (indicator) {
    indicator.remove();
  }

  console.log('🔄 Reloading all properties...');
  loadProperties(null);
};

// Initialize Application
async function init() {
  console.log('🚀 Initializing RumahSubsidi.id...');

  try {
    // Step 1: Load provinsi data first (needed for geolocation matching)
    await loadProvinsi();

    // Step 2: Try to auto-detect user location
    const detectedKodeWilayah = await autoDetectLocation();

    // Step 3: Load everything in parallel
    await Promise.all([
      loadStatistics(),
      loadProperties(detectedKodeWilayah) // Pass detected location if available
    ]);

    // Step 4: Setup event listeners
    setupEventListeners();

    // Step 5: Show location indicator if location was detected
    if (detectedKodeWilayah) {
      showLocationIndicator(detectedKodeWilayah);
    }

    console.log('✅ Application initialized successfully');
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