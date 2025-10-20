/**
 * RumahSubsidi.id - Search Page JavaScript
 * Map integration and filtering functionality
 */

// API Configuration (from APP_CONFIG loaded in HTML)
const API_CONFIG = {
  baseURL: APP_CONFIG.api.sikumbang.baseURL,
  endpoints: {
    search: APP_CONFIG.api.sikumbang.endpoints.search,
    provinsi: APP_CONFIG.api.sikumbang.endpoints.provinsi,
    kabupaten: APP_CONFIG.api.sikumbang.endpoints.kabupaten,
    kecamatan: APP_CONFIG.api.sikumbang.endpoints.kecamatan
  },
  cacheTime: APP_CONFIG.cache.ttl
};

// Global variables
let map;
let markers = [];
let filteredProperties = [];
let allProperties = [];
let infoWindows = [];

// Location data storage
let provinsiData = [];
let kabupatenData = [];
let kecamatanData = [];

// Cache Manager
class CacheManager {
  constructor(ttl = 300000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, { data: value, timestamp: Date.now() });
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
}

const cache = new CacheManager(API_CONFIG.cacheTime);

// Utility Functions
function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatRupiah(angka) {
  return "Rp " + formatNumber(angka);
}

// API Functions
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
    if (cacheKey) cache.set(cacheKey, data);

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Initialize Google Maps
function initMap() {
  try {
    const center = { lat: -2.5489, lng: 118.0149 };

    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 5,
      center: center,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] }
      ]
    });

    // Update markers when map is ready (if properties are already loaded)
    google.maps.event.addListenerOnce(map, 'idle', () => {
      console.log('Map loaded, updating markers');
      if (filteredProperties.length > 0) {
        addPropertyMarkers(filteredProperties);
      }
    });
  } catch (error) {
    console.error('Error initializing map:', error);
    // Hide map container if map fails to load
    document.getElementById('mapContainer').style.display = 'none';
    document.getElementById('searchResultsContainer').style.display = 'block';
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.view-btn[data-view="list"]').classList.add('active');
  }
}

// Make initMap available globally for Google Maps callback
window.initMap = initMap;

// Create Marker Icon
function createMarkerIcon(property, tipeSubsidi) {
  const price = tipeSubsidi.harga;
  let color;
  
  if (price < 170000000) {
    color = '#00d97e';
  } else if (price < 185000000) {
    color = '#2c7be5';
  } else {
    color = '#e63757';
  }

  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 8,
    fillColor: color,
    fillOpacity: 0.9,
    strokeColor: '#ffffff',
    strokeWeight: 2
  };
}

// Add Property Markers
function addPropertyMarkers(properties) {
  // Skip if map is not initialized
  if (!map || typeof google === 'undefined') {
    console.log('Map not available, skipping markers');
    return;
  }

  // Clear existing markers
  markers.forEach(marker => marker.setMap(null));
  markers = [];
  infoWindows.forEach(iw => iw.close());
  infoWindows = [];

  const bounds = new google.maps.LatLngBounds();

  properties.forEach(property => {
    const tipeSubsidi = property.tipeRumah.find(tipe => tipe.status === 'subsidi');
    if (!tipeSubsidi || !property.koordinatPerumahan) return;

    const coords = property.koordinatPerumahan.split(',').map(c => parseFloat(c.trim()));
    if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) return;

    const position = { lat: coords[0], lng: coords[1] };

    const marker = new google.maps.Marker({
      position: position,
      map: map,
      title: property.namaPerumahan,
      icon: createMarkerIcon(property, tipeSubsidi),
      animation: google.maps.Animation.DROP
    });

    const infoWindow = new google.maps.InfoWindow({
      content: createInfoWindowContent(property, tipeSubsidi)
    });

    marker.addListener('click', () => {
      infoWindows.forEach(iw => iw.close());
      infoWindow.open(map, marker);
    });

    markers.push(marker);
    infoWindows.push(infoWindow);
    bounds.extend(position);
  });

  if (markers.length > 0) {
    map.fitBounds(bounds);
    if (map.getZoom() > 15) map.setZoom(15);
  }
}

// Create Info Window Content
function createInfoWindowContent(property, tipeSubsidi) {
  return `
    <div style="padding: 10px; max-width: 250px;">
      <img src="${sanitizeInput(property.foto[0])}" 
           alt="${sanitizeInput(property.namaPerumahan)}"
           style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${sanitizeInput(property.namaPerumahan)}</h3>
      <p style="margin: 0 0 5px 0; font-size: 16px; color: #2c7be5; font-weight: bold;">${formatRupiah(tipeSubsidi.harga)}</p>
      <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">
        <i class="fas fa-map-marker-alt"></i> ${sanitizeInput(property.wilayah.kelurahan)}, ${sanitizeInput(property.wilayah.kecamatan)}
      </p>
      <p style="margin: 0 0 10px 0; font-size: 12px; color: #666;">
        <i class="fas fa-home"></i> Sisa Unit: ${property.jumlahUnit}
      </p>
      <a href="detail?id=${encodeURIComponent(property.idLokasi)}"
         style="display: block; text-align: center; padding: 6px 12px; background: #2c7be5; color: white; border-radius: 4px; font-size: 12px; text-decoration: none;">
        Lihat Detail
      </a>
    </div>
  `;
}

// Load Properties
async function loadProperties(kodeWilayah = null) {
  try {
    // Build API URL with optional kodeWilayah filter
    let apiUrl = `${API_CONFIG.endpoints.search}?selectedSearch=wilayah&skalaPerumahan=semua&sort=terbaru&searchBy=nama-perumahan&page=1&limit=100`;

    if (kodeWilayah) {
      apiUrl += `&kodeWilayah=${kodeWilayah}`;
      console.log(`🔍 Loading properties for kodeWilayah: ${kodeWilayah}`);
    }

    console.log(`🌐 API URL: ${API_CONFIG.baseURL}${apiUrl}`);

    const cacheKey = kodeWilayah ? `search_${kodeWilayah}` : 'search_properties';

    const data = await apiCall(apiUrl, cacheKey);

    // Check if response has valid structure
    if (!data) {
      console.warn('⚠️ No response from API');
      allProperties = [];
      filteredProperties = [];
      updateResults();
      updateResultsCount();
      showNotification('Tidak ada data dari server', 'warning');
      return;
    }

    // Handle case where data.data doesn't exist or is not an array
    if (!data.data || !Array.isArray(data.data)) {
      console.warn('⚠️ Invalid data structure from API:', data);
      allProperties = [];
      filteredProperties = [];
      updateResults();
      updateResultsCount();
      showNotification('Data Tidak Ditemukan', 'warning');
      return;
    }

    console.log(`📊 Loaded ${data.data.length} properties from API`);

    // Filter only active properties with subsidi type
    allProperties = data.data.filter(p =>
      p.aktivasi && p.tipeRumah.some(t => t.status === 'subsidi')
    );

    console.log(`✅ After filtering: ${allProperties.length} active subsidi properties`);

    // Handle empty results
    if (allProperties.length === 0) {
      console.log('ℹ️ No properties found for this area');
      showNotification('Tidak ada properti subsidi di wilayah ini', 'info');
    }

    filteredProperties = [...allProperties];

    addPropertyMarkers(filteredProperties);
    updateResults();
    updateResultsCount();
  } catch (error) {
    console.error('❌ Error loading properties:', error);
    console.error('Error details:', error.message, error.stack);

    // Reset to empty state
    allProperties = [];
    filteredProperties = [];
    updateResults();
    updateResultsCount();

    showNotification('Gagal memuat data properti. Silakan coba lagi.', 'error');
  }
}

// Apply Filters
async function applyFilters(formData) {
  const filters = {
    provinsi: formData.get('provinsi'),
    kabupaten: formData.get('kabupaten'),
    kecamatan: formData.get('kecamatan'),
    hargaMin: parseInt(formData.get('hargaMin')) || 0,
    hargaMax: parseInt(formData.get('hargaMax')) || Infinity,
    unit: parseInt(formData.get('unit')) || 0
  };

  console.log('🔍 Applying filters:', filters);

  // Determine which kodeWilayah to use (priority: kecamatan > kabupaten > provinsi)
  let kodeWilayah = null;
  let locationName = null;

  if (filters.kecamatan) {
    kodeWilayah = filters.kecamatan;
    const kecamatan = kecamatanData.find(k => k.kodeWilayah === filters.kecamatan);
    locationName = kecamatan?.namaWilayah || 'Kecamatan';
    console.log('📍 Using kecamatan filter:', locationName, kodeWilayah);
  } else if (filters.kabupaten) {
    kodeWilayah = filters.kabupaten;
    const kabupaten = kabupatenData.find(k => k.kodeWilayah === filters.kabupaten);
    locationName = kabupaten?.namaWilayah || 'Kabupaten';
    console.log('📍 Using kabupaten filter:', locationName, kodeWilayah);
  } else if (filters.provinsi) {
    kodeWilayah = filters.provinsi;
    const provinsi = provinsiData.find(p => p.kodeWilayah === filters.provinsi);
    locationName = provinsi?.namaWilayah || 'Provinsi';
    console.log('📍 Using provinsi filter:', locationName, kodeWilayah);
  }

  // Load properties from API with kodeWilayah filter
  await loadProperties(kodeWilayah);

  // Apply additional client-side filters (price and unit)
  filteredProperties = allProperties.filter(property => {
    const tipeSubsidi = property.tipeRumah.find(t => t.status === 'subsidi');
    if (!tipeSubsidi) return false;

    // Price filters
    if (tipeSubsidi.harga < filters.hargaMin) return false;
    if (tipeSubsidi.harga > filters.hargaMax) return false;

    // Unit filter
    if (property.jumlahUnit < filters.unit) return false;

    return true;
  });

  console.log(`✅ Filtered to ${filteredProperties.length} properties`);

  // Update display
  addPropertyMarkers(filteredProperties);
  updateResults();
  updateResultsCount();

  // Show filter indicator if location filter is active
  showFilterIndicator(locationName, filters);
}

// Show Filter Indicator
function showFilterIndicator(locationName, filters) {
  // Remove existing indicator
  const existingIndicator = document.querySelector('.filter-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }

  // Build filter summary
  const filterSummary = [];

  if (locationName) {
    filterSummary.push(`📍 <strong>${locationName}</strong>`);
  }

  if (filters.hargaMin > 0) {
    filterSummary.push(`Harga min: ${formatRupiah(filters.hargaMin)}`);
  }

  if (filters.hargaMax < Infinity) {
    filterSummary.push(`Harga max: ${formatRupiah(filters.hargaMax)}`);
  }

  if (filters.unit > 0) {
    filterSummary.push(`Min ${filters.unit}+ unit`);
  }

  // Only show if there are active filters
  if (filterSummary.length === 0) return;

  const indicator = document.createElement('div');
  indicator.className = 'filter-indicator';
  indicator.style.cssText = `
    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
    border-left: 4px solid #2c7be5;
    padding: 1rem 1.5rem;
    margin-bottom: 1rem;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  `;

  indicator.innerHTML = `
    <div>
      <strong>🔍 Filter Aktif:</strong> ${filterSummary.join(' | ')}
    </div>
    <button onclick="clearAllFilters()" style="
      background: #2c7be5;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    ">
      ✕ Hapus Semua Filter
    </button>
  `;

  const container = document.querySelector('.results-summary');
  if (container) {
    container.parentElement.insertBefore(indicator, container);
  }
}

// Clear All Filters
window.clearAllFilters = function() {
  const form = document.getElementById('searchFiltersForm');
  form.reset();

  // Reload all properties without filters
  loadProperties(null);

  // Remove indicator
  const indicator = document.querySelector('.filter-indicator');
  if (indicator) {
    indicator.remove();
  }
};

// Update Results Display
function updateResults() {
  const container = document.getElementById('searchResults');
  container.innerHTML = '';

  if (filteredProperties.length === 0) {
    container.innerHTML = '<p class="loading">Tidak ada properti yang sesuai dengan filter Anda.</p>';
    return;
  }

  filteredProperties.forEach(property => {
    const tipeSubsidi = property.tipeRumah.find(t => t.status === 'subsidi');
    if (!tipeSubsidi) return;

    const card = createPropertyCard(property, tipeSubsidi);
    container.appendChild(card);
  });
}

// Create Property Card
function createPropertyCard(property, tipeSubsidi) {
  const card = document.createElement('article');
  card.className = 'property-card';

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
        <a href="detail?id=${encodeURIComponent(property.idLokasi)}" 
           class="btn btn-primary">
          Detail
        </a>
      </div>
    </div>
  `;

  return card;
}

// Update Results Count
function updateResultsCount() {
  const countElement = document.getElementById('resultsCount');
  countElement.textContent = `Menampilkan ${filteredProperties.length} dari ${allProperties.length} properti`;
}

// Load Provinsi
async function loadProvinsi() {
  const select = document.getElementById('searchProvinsi');
  try {
    const data = await apiCall(API_CONFIG.endpoints.provinsi, 'provinsi_list');
    data.sort((a, b) => a.namaWilayah.localeCompare(b.namaWilayah));

    // Store data globally
    provinsiData = data;

    data.forEach(prov => {
      const option = document.createElement('option');
      option.value = prov.kodeWilayah; // Store kodeWilayah instead of name
      option.textContent = sanitizeInput(prov.namaWilayah);
      option.dataset.nama = prov.namaWilayah;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading provinsi:', error);
  }
}

// Load Kabupaten
async function loadKabupaten(kodeProvinsi) {
  const select = document.getElementById('searchKabupaten');

  // Clear existing options
  select.innerHTML = '<option value="">Semua Kabupaten/Kota</option>';

  // Clear kecamatan
  const kecamatanSelect = document.getElementById('searchKecamatan');
  kecamatanSelect.innerHTML = '<option value="">Semua Kecamatan</option>';

  if (!kodeProvinsi) {
    kabupatenData = [];
    kecamatanData = [];
    return;
  }

  try {
    const apiUrl = `${API_CONFIG.endpoints.kabupaten}/${kodeProvinsi}`;
    const data = await apiCall(apiUrl, `kabupaten_${kodeProvinsi}`);

    if (!data || data.length === 0) {
      console.log('No kabupaten found for provinsi:', kodeProvinsi);
      return;
    }

    data.sort((a, b) => a.namaWilayah.localeCompare(b.namaWilayah));

    // Store data globally
    kabupatenData = data;

    data.forEach(kab => {
      const option = document.createElement('option');
      option.value = kab.kodeWilayah;
      option.textContent = sanitizeInput(kab.namaWilayah);
      option.dataset.nama = kab.namaWilayah;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading kabupaten:', error);
  }
}

// Load Kecamatan
async function loadKecamatan(kodeKabupaten) {
  const select = document.getElementById('searchKecamatan');

  // Clear existing options
  select.innerHTML = '<option value="">Semua Kecamatan</option>';

  if (!kodeKabupaten) {
    kecamatanData = [];
    return;
  }

  try {
    const apiUrl = `${API_CONFIG.endpoints.kecamatan}/${kodeKabupaten}`;
    const data = await apiCall(apiUrl, `kecamatan_${kodeKabupaten}`);

    if (!data || data.length === 0) {
      console.log('No kecamatan found for kabupaten:', kodeKabupaten);
      return;
    }

    data.sort((a, b) => a.namaWilayah.localeCompare(b.namaWilayah));

    // Store data globally
    kecamatanData = data;

    data.forEach(kec => {
      const option = document.createElement('option');
      option.value = kec.kodeWilayah;
      option.textContent = sanitizeInput(kec.namaWilayah);
      option.dataset.nama = kec.namaWilayah;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading kecamatan:', error);
  }
}

// Show Notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem;
    background: ${type === 'error' ? '#e63757' : '#00d97e'};
    color: white; border-radius: 0.5rem; z-index: 9999;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Load provinsi data first
  await loadProvinsi();

  // Check URL parameters for incoming filters (from index.html)
  const urlParams = new URLSearchParams(window.location.search);
  const kodeWilayah = urlParams.get('kodeWilayah');
  const namaWilayah = urlParams.get('nama');

  if (kodeWilayah) {
    console.log(`🔍 Search page loaded with filter: ${namaWilayah} (${kodeWilayah})`);

    // Pre-select the provinsi/kabupaten in the form if it matches
    const provinsiSelect = document.getElementById('searchProvinsi');
    const matchingProvinsi = provinsiData.find(p => p.kodeWilayah === kodeWilayah);

    if (matchingProvinsi) {
      // It's a provinsi code
      provinsiSelect.value = kodeWilayah;
    } else {
      // It might be a kabupaten code - try to find parent provinsi
      // For now, just load with the filter
      console.log('Detected kabupaten/kecamatan filter from URL');
    }

    // Load properties with URL filter
    await loadProperties(kodeWilayah);

    // Show filter indicator
    showFilterIndicator(namaWilayah, {
      hargaMin: 0,
      hargaMax: Infinity,
      unit: 0
    });
  } else {
    // Load all properties
    await loadProperties();
  }

  // Setup cascading dropdowns
  const provinsiSelect = document.getElementById('searchProvinsi');
  const kabupatenSelect = document.getElementById('searchKabupaten');
  const kecamatanSelect = document.getElementById('searchKecamatan');

  provinsiSelect.addEventListener('change', async (e) => {
    const kodeProvinsi = e.target.value;
    console.log('Provinsi changed:', kodeProvinsi);

    // Load kabupaten for selected provinsi
    await loadKabupaten(kodeProvinsi);
  });

  kabupatenSelect.addEventListener('change', async (e) => {
    const kodeKabupaten = e.target.value;
    console.log('Kabupaten changed:', kodeKabupaten);

    // Load kecamatan for selected kabupaten
    await loadKecamatan(kodeKabupaten);
  });

  // Form submit handler (now async)
  const form = document.getElementById('searchFiltersForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    await applyFilters(formData);
  });

  // Reset filters
  document.getElementById('resetFilters').addEventListener('click', async () => {
    // Clear URL parameters
    window.history.replaceState({}, '', 'search.html');

    // Reload all properties without filters
    await loadProperties(null);

    // Remove filter indicator
    const indicator = document.querySelector('.filter-indicator');
    if (indicator) {
      indicator.remove();
    }
  });

  // View toggle
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      const view = this.dataset.view;
      const mapContainer = document.getElementById('mapContainer');
      const resultsContainer = document.getElementById('searchResultsContainer');

      if (view === 'map') {
        mapContainer.style.display = 'block';
        resultsContainer.style.display = 'none';
      } else {
        mapContainer.style.display = 'none';
        resultsContainer.style.display = 'block';
      }
    });
  });
});