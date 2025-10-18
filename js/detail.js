/**
 * RumahSubsidi.id - Detail Page JavaScript
 * Property detail display and interaction
 */

// API Configuration
const API_CONFIG = {
  baseURL: 'https://sikumbang.tapera.go.id',
  endpoints: {
    search: '/ajax/lokasi/search'
  },
  cacheTime: 5 * 60 * 1000
};

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
  if (!input) return '-';
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

// API Call
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
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    if (cacheKey) cache.set(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Get Property by ID
async function getPropertyById(propertyId) {
  try {
    const data = await apiCall(
      `${API_CONFIG.endpoints.search}?sort=terdekat&page=1&limit=100`,
      'all_properties'
    );

    if (!data || !data.data) {
      throw new Error('No data received');
    }

    const property = data.data.find(p => p.idLokasi === propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    return property;
  } catch (error) {
    console.error('Error getting property:', error);
    throw error;
  }
}

// Load Property Detail
async function loadPropertyDetail(propertyId) {
  try {
    const property = await getPropertyById(propertyId);
    const tipeSubsidi = property.tipeRumah.find(t => t.status === 'subsidi');

    if (!tipeSubsidi) {
      throw new Error('No subsidy type found');
    }

    // Update Page Title
    document.title = `${sanitizeInput(property.namaPerumahan)} - ${formatRupiah(tipeSubsidi.harga)} - RumahSubsidi.id`;

    // Update Basic Info
    document.getElementById('detailTitle').textContent = sanitizeInput(property.namaPerumahan);
    document.getElementById('detailLocation').textContent = 
      `${sanitizeInput(property.wilayah.kelurahan)}, ${sanitizeInput(property.wilayah.kecamatan)}, ${sanitizeInput(property.wilayah.kabupaten)}`;
    document.getElementById('detailPrice').textContent = formatRupiah(tipeSubsidi.harga);

    // Update Gallery
    updateGallery(property);

    // Update Description
    updateDescription(property, tipeSubsidi);

    // Update Specifications
    updateSpecifications(property, tipeSubsidi);

    // Update Detail Specs
    updateDetailSpecs(tipeSubsidi);

    // Update Location
    updateLocation(property);

    // Update Contact Info
    updateContactInfo(property);

    // Update Developer Info
    updateDeveloperInfo(property);

  } catch (error) {
    console.error('Error loading property detail:', error);
    showError('Properti tidak ditemukan atau terjadi kesalahan.');
  }
}

// Update Gallery
function updateGallery(property) {
  const mainImage = document.getElementById('mainImage');
  const thumbnailContainer = document.getElementById('thumbnailContainer');

  if (property.foto && property.foto.length > 0) {
    mainImage.src = sanitizeInput(property.foto[0]);
    mainImage.alt = sanitizeInput(property.namaPerumahan);
    thumbnailContainer.innerHTML = '';

    property.foto.forEach((foto, index) => {
      const thumbnail = document.createElement('img');
      thumbnail.src = sanitizeInput(foto);
      thumbnail.alt = `${sanitizeInput(property.namaPerumahan)} - Foto ${index + 1}`;
      thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
      thumbnail.loading = 'lazy';
      
      thumbnail.addEventListener('click', () => {
        mainImage.src = sanitizeInput(foto);
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        thumbnail.classList.add('active');
      });

      thumbnailContainer.appendChild(thumbnail);
    });
  }
}

// Update Description
function updateDescription(property, tipeSubsidi) {
  const description = document.getElementById('propertyDescription');
  description.textContent = `${sanitizeInput(property.namaPerumahan)} adalah perumahan subsidi ${property.jenisPerumahan.toLowerCase()} yang terletak di ${sanitizeInput(property.wilayah.kelurahan)}, ${sanitizeInput(property.wilayah.kecamatan)}, ${sanitizeInput(property.wilayah.kabupaten)}, ${sanitizeInput(property.wilayah.provinsi)}. Perumahan ini dikembangkan oleh ${sanitizeInput(property.pengembang.nama)} dan memiliki ${property.jumlahUnit} unit rumah subsidi yang tersedia.`;
}

// Update Specifications
function updateSpecifications(property, tipeSubsidi) {
  const specsGrid = document.getElementById('specsGrid');
  specsGrid.innerHTML = '';

  const specs = [
    { label: 'Tipe Rumah', value: sanitizeInput(tipeSubsidi.nama) },
    { label: 'Luas Bangunan', value: `${tipeSubsidi.luasBangunan} m²` },
    { label: 'Luas Tanah', value: `${tipeSubsidi.luasTanah} m²` },
    { label: 'Kamar Tidur', value: tipeSubsidi.kamarTidur },
    { label: 'Kamar Mandi', value: tipeSubsidi.kamarMandi },
    { label: 'Jumlah Lantai', value: tipeSubsidi.jumlahLantai },
    { label: 'Jenis Perumahan', value: sanitizeInput(property.jenisPerumahan) },
    { label: 'Sisa Unit', value: property.jumlahUnit }
  ];

  specs.forEach(spec => {
    const specItem = document.createElement('div');
    specItem.className = 'spec-item';
    specItem.innerHTML = `
      <span class="spec-label">${spec.label}</span>
      <span class="spec-value">${spec.value}</span>
    `;
    specsGrid.appendChild(specItem);
  });
}

// Update Detail Specs
function updateDetailSpecs(tipeSubsidi) {
  const detailSpecs = document.getElementById('detailSpecs');
  detailSpecs.innerHTML = `
    <div class="spec-item" style="margin-bottom: 1rem;">
      <span class="spec-label">Spesifikasi Atap</span>
      <span class="spec-value">${sanitizeInput(tipeSubsidi.spesifikasiAtap)}</span>
    </div>
    <div class="spec-item" style="margin-bottom: 1rem;">
      <span class="spec-label">Spesifikasi Dinding</span>
      <span class="spec-value">${sanitizeInput(tipeSubsidi.spesifikasiDinding)}</span>
    </div>
    <div class="spec-item" style="margin-bottom: 1rem;">
      <span class="spec-label">Spesifikasi Lantai</span>
      <span class="spec-value">${sanitizeInput(tipeSubsidi.spesifikasiLantai)}</span>
    </div>
    <div class="spec-item" style="margin-bottom: 1rem;">
      <span class="spec-label">Spesifikasi Pondasi</span>
      <span class="spec-value">${sanitizeInput(tipeSubsidi.spesifikasiPondasi)}</span>
    </div>
  `;
}

// Update Location
function updateLocation(property) {
  document.getElementById('detailProvinsi').textContent = sanitizeInput(property.wilayah.provinsi);
  document.getElementById('detailKabupaten').textContent = sanitizeInput(property.wilayah.kabupaten);
  document.getElementById('detailKecamatan').textContent = sanitizeInput(property.wilayah.kecamatan);
  document.getElementById('detailKelurahan').textContent = sanitizeInput(property.wilayah.kelurahan);
}

// Update Contact Info
function updateContactInfo(property) {
  const contactInfo = document.getElementById('contactInfo');
  contactInfo.innerHTML = '';

  if (property.kantorPemasaran && property.kantorPemasaran.length > 0) {
    const kantor = property.kantorPemasaran[0];

    const contactItems = [
      { icon: 'fas fa-map-marker-alt', label: 'Alamat', value: kantor.alamat },
      { icon: 'fas fa-phone', label: 'Telepon', value: kantor.noTelp },
      { icon: 'fas fa-envelope', label: 'Email', value: kantor.email }
    ];

    contactItems.forEach(item => {
      if (item.value) {
        const contactItem = document.createElement('div');
        contactItem.className = 'contact-item';
        contactItem.innerHTML = `
          <div class="contact-icon">
            <i class="${item.icon}"></i>
          </div>
          <div>
            <div class="spec-label">${item.label}</div>
            <div class="spec-value">${sanitizeInput(item.value)}</div>
          </div>
        `;
        contactInfo.appendChild(contactItem);
      }
    });
  }
}

// Update Developer Info
function updateDeveloperInfo(property) {
  document.getElementById('developerName').textContent = sanitizeInput(property.pengembang.nama);
  document.getElementById('developerAsosiasi').textContent = sanitizeInput(property.pengembang.asosiasi);
}

// Show Error
function showError(message) {
  const container = document.querySelector('.detail-page .container');
  container.innerHTML = `
    <div style="text-align: center; padding: 4rem 2rem;">
      <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #e63757; margin-bottom: 1rem;"></i>
      <h2 style="color: var(--dark); margin-bottom: 1rem;">Oops! Terjadi Kesalahan</h2>
      <p style="color: var(--gray); margin-bottom: 2rem;">${message}</p>
      <a href="search.html" class="btn btn-primary">Kembali ke Pencarian</a>
    </div>
  `;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('id');

  if (!propertyId) {
    showError('ID properti tidak ditemukan di URL.');
    return;
  }

  loadPropertyDetail(propertyId);
});