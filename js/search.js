/**
 * RumahSubsidi.id - Search Page JavaScript
 * Map integration and filtering functionality
 */

// API Configuration
const API_CONFIG = {
  baseURL: 'https://sikumbang.tapera.go.id',
  endpoints: {
    search: '/ajax/lokasi/search',
    provinsi: '/ajax/wilayah/get-provinsi',
    kabupaten: '/ajax/wilayah/get-kabupaten',
    kecamatan: '/ajax/wilayah/get-kecamatan'
  },
  cacheTime: 5 * 60 * 1000
};

// Global variables
let map;
let markers = [];
let filteredProperties = [];
let allProperties = [];
let infoWindows = [];

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
      <a href="detail.html?id=${encodeURIComponent(property.idLokasi)}" 
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

    const cacheKey = kodeWilayah ? `search_${kodeWilayah}` : 'search_properties';

    const data = await apiCall(apiUrl, cacheKey);

    if (!data || !data.data) {
      throw new Error('No data received');
    }

    console.log(`📊 Loaded ${data.data.length} properties`);

    allProperties = data.data.filter(p =>
      p.aktivasi && p.tipeRumah.some(t => t.status === 'subsidi')
    );

    filteredProperties = [...allProperties];

    addPropertyMarkers(filteredProperties);
    updateResults();
    updateResultsCount();
  } catch (error) {
    console.error('Error loading properties:', error);
    showNotification('Gagal memuat data properti', 'error');
  }
}

// Apply Filters
function applyFilters(formData) {
  const filters = {
    provinsi: formData.get('provinsi'),
    kabupaten: formData.get('kabupaten'),
    kecamatan: formData.get('kecamatan'),
    hargaMin: parseInt(formData.get('hargaMin')) || 0,
    hargaMax: parseInt(formData.get('hargaMax')) || Infinity,
    unit: parseInt(formData.get('unit')) || 0
  };

  filteredProperties = allProperties.filter(property => {
    const tipeSubsidi = property.tipeRumah.find(t => t.status === 'subsidi');
    if (!tipeSubsidi) return false;

    if (filters.provinsi && property.wilayah.provinsi !== filters.provinsi) return false;
    if (filters.kabupaten && property.wilayah.kabupaten !== filters.kabupaten) return false;
    if (filters.kecamatan && property.wilayah.kecamatan !== filters.kecamatan) return false;
    if (tipeSubsidi.harga < filters.hargaMin) return false;
    if (tipeSubsidi.harga > filters.hargaMax) return false;
    if (property.jumlahUnit < filters.unit) return false;

    return true;
  });

  addPropertyMarkers(filteredProperties);
  updateResults();
  updateResultsCount();
}

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
        <a href="detail.html?id=${encodeURIComponent(property.idLokasi)}" 
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
    
    data.forEach(prov => {
      const option = document.createElement('option');
      option.value = prov.namaWilayah;
      option.textContent = sanitizeInput(prov.namaWilayah);
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading provinsi:', error);
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
document.addEventListener('DOMContentLoaded', () => {
  loadProvinsi();

  // Load properties immediately on page load (don't wait for map)
  loadProperties();

  // Form submit handler
  const form = document.getElementById('searchFiltersForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    applyFilters(formData);
  });

  // Reset filters
  document.getElementById('resetFilters').addEventListener('click', () => {
    filteredProperties = [...allProperties];
    addPropertyMarkers(filteredProperties);
    updateResults();
    updateResultsCount();
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

  // Parse URL parameters and filter by kodeWilayah if provided
  const urlParams = new URLSearchParams(window.location.search);
  const kodeWilayah = urlParams.get('kodeWilayah');
  const namaWilayah = urlParams.get('nama');

  if (kodeWilayah) {
    console.log(`🔍 Search page loaded with filter: ${namaWilayah} (${kodeWilayah})`);

    // Show filter indicator
    const filterInfo = document.createElement('div');
    filterInfo.className = 'filter-indicator';
    filterInfo.style.cssText = `
      background: #e3f2fd;
      border-left: 4px solid #2c7be5;
      padding: 1rem;
      margin-bottom: 1rem;
      border-radius: 4px;
    `;
    filterInfo.innerHTML = `
      <strong>🔍 Filter Aktif:</strong> ${namaWilayah}
      <a href="search.html" style="margin-left: 1rem; color: #2c7be5; text-decoration: underline;">Hapus Filter</a>
    `;

    const container = document.getElementById('searchResults');
    if (container) {
      container.parentElement.insertBefore(filterInfo, container);
    }

    // Load properties with filter
    loadProperties(kodeWilayah);
  }
});