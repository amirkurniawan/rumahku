/**
 * RumahSubsidi.id - Detail Page JavaScript
 * Property detail display and interaction
 */

// API Configuration
const API_CONFIG = {
  baseURL: 'https://sikumbang.tapera.go.id',
  proxyURL: 'http://localhost:3000',
  endpoints: {
    search: '/ajax/lokasi/search',
    detail: '/api/detail-perumahan' // Proxy endpoint
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

// Get Property by ID (via Proxy - for complete data)
async function getPropertyById(propertyId) {
  console.log('getPropertyById called with:', propertyId);

  try {
    console.log('Calling Proxy API for detail...');

    // Use proxy endpoint to get complete data from Sikumbang
    const response = await fetch(`${API_CONFIG.proxyURL}${API_CONFIG.endpoints.detail}/${propertyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Proxy Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Proxy Error:', errorData);
      throw new Error(errorData?.details || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Proxy Response received:', {
      success: result.success,
      hasData: !!result.data
    });

    if (!result.success || !result.data) {
      console.error('❌ Proxy returned unsuccessful response:', result);
      throw new Error('No data received from proxy');
    }

    console.log('🔍 Full property data:', result.data);
    console.log('📊 Property summary:', {
      namaPerumahan: result.data.namaPerumahan,
      tipesCount: result.data.tipes?.length || 0,
      fotosCount: result.data.fotos?.length || 0,
      hasKelurahan: !!result.data.kelurahan,
      hasKabupaten: !!result.data.kabupaten,
      dataKeys: Object.keys(result.data).join(', ')
    });

    return result.data;
  } catch (error) {
    console.error('Error in getPropertyById:', error);

    // Check if proxy server is running
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error('⚠️ Proxy server belum berjalan!\n\nSilakan jalankan: node proxy-server.js');
    }

    throw error;
  }
}

// Load Property Detail
async function loadPropertyDetail(propertyId) {
  console.log('=== DETAIL.JS DEBUG START ===');
  console.log('Property ID:', propertyId);
  console.log('Timestamp:', new Date().toISOString());

  try {
    console.log('Step 1: Fetching property data...');
    const property = await getPropertyById(propertyId);
    console.log('Step 2: Property found:', property ? 'YES' : 'NO');

    if (!property) {
      console.error('Property is null or undefined!');
      throw new Error('Property not found');
    }

    console.log('Step 3: Property data:', {
      namaPerumahan: property.namaPerumahan,
      tipesCount: property.tipes?.length || 0,
      fotosCount: property.fotos?.length || 0
    });

    // Note: Sikumbang uses "tipes" not "tipeRumah"
    const tipeSubsidi = property.tipes?.find(t => t.status === 'subsidi');
    console.log('Step 4: Subsidy type found:', tipeSubsidi ? 'YES' : 'NO');

    if (!tipeSubsidi) {
      console.error('No subsidy type found in tipes:', property.tipes);
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
    console.error('=== ERROR IN LOAD PROPERTY DETAIL ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== END ERROR ===');
    showError('Properti tidak ditemukan atau terjadi kesalahan.');
  }

  console.log('=== DETAIL.JS DEBUG END ===');
}

// Update Gallery (with fotoTampak and fotoDenah)
function updateGallery(property) {
  const mainImage = document.getElementById('mainImage');
  const thumbnailContainer = document.getElementById('thumbnailContainer');
  const baseURL = API_CONFIG.baseURL;

  // Collect all photos: foto object + fotoTampak + fotoDenah from subsidy type
  const allPhotos = [];

  // Add photos from foto object (fotoGerbang, fotoTengah, fotoContoh)
  if (property.foto) {
    if (property.foto.fotoGerbang) {
      const url = property.foto.fotoGerbang.startsWith('http')
        ? property.foto.fotoGerbang
        : `${baseURL}${property.foto.fotoGerbang}`;
      allPhotos.push({ url, type: 'gerbang', label: 'Foto Gerbang' });
    }
    if (property.foto.fotoTengah) {
      const url = property.foto.fotoTengah.startsWith('http')
        ? property.foto.fotoTengah
        : `${baseURL}${property.foto.fotoTengah}`;
      allPhotos.push({ url, type: 'tengah', label: 'Foto Tengah' });
    }
    if (property.foto.fotoContoh) {
      const url = property.foto.fotoContoh.startsWith('http')
        ? property.foto.fotoContoh
        : `${baseURL}${property.foto.fotoContoh}`;
      allPhotos.push({ url, type: 'contoh', label: 'Foto Contoh' });
    }
  }

  // Add fotoTampak and fotoDenah from subsidy type
  const tipeSubsidi = property.tipes?.find(t => t.status === 'subsidi');
  if (tipeSubsidi) {
    if (tipeSubsidi.fotoTampak) {
      const url = tipeSubsidi.fotoTampak.startsWith('http')
        ? tipeSubsidi.fotoTampak
        : `${baseURL}${tipeSubsidi.fotoTampak}`;
      allPhotos.push({ url, type: 'tampak', label: 'Foto Tampak' });
    }
    if (tipeSubsidi.fotoDenah) {
      const url = tipeSubsidi.fotoDenah.startsWith('http')
        ? tipeSubsidi.fotoDenah
        : `${baseURL}${tipeSubsidi.fotoDenah}`;
      allPhotos.push({ url, type: 'denah', label: 'Denah Rumah' });
    }
  }

  console.log('Total photos:', allPhotos.length);

  if (allPhotos.length > 0) {
    // Set main image
    mainImage.src = sanitizeInput(allPhotos[0].url);
    mainImage.alt = sanitizeInput(property.namaPerumahan);
    thumbnailContainer.innerHTML = '';

    // Create thumbnails
    allPhotos.forEach((photo, index) => {
      const thumbnail = document.createElement('img');
      thumbnail.src = sanitizeInput(photo.url);

      // Add descriptive alt text
      const altText = `${sanitizeInput(property.namaPerumahan)} - ${photo.label}`;
      thumbnail.alt = altText;

      thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
      thumbnail.loading = 'lazy';

      thumbnail.addEventListener('click', () => {
        mainImage.src = sanitizeInput(photo.url);
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        thumbnail.classList.add('active');
      });

      thumbnailContainer.appendChild(thumbnail);
    });
  } else {
    // No photos available
    mainImage.src = '/images/placeholder.jpg';
    mainImage.alt = 'No image available';
  }
}

// Update Description
function updateDescription(property, tipeSubsidi) {
  const description = document.getElementById('propertyDescription');
  const jenisPerumahan = property.jenisPerumahan === 0 ? 'rumah tapak' : 'rusun';
  const jumlahUnit = property.count?.subsidi || 0;

  description.textContent = `${sanitizeInput(property.namaPerumahan)} adalah perumahan subsidi ${jenisPerumahan} yang terletak di ${sanitizeInput(property.wilayah.kelurahan)}, ${sanitizeInput(property.wilayah.kecamatan)}, ${sanitizeInput(property.wilayah.kabupaten)}, ${sanitizeInput(property.wilayah.provinsi)}. Perumahan ini dikembangkan oleh ${sanitizeInput(property.pengembang.nama)} dan memiliki ${jumlahUnit} unit rumah subsidi yang tersedia.`;
}

// Update Specifications
function updateSpecifications(property, tipeSubsidi) {
  const specsGrid = document.getElementById('specsGrid');
  specsGrid.innerHTML = '';

  const jenisPerumahan = property.jenisPerumahan === 0 ? 'Rumah Tapak' : 'Rusun';
  const sisaUnit = property.count?.subsidi || 0;

  const specs = [
    { label: 'Tipe Rumah', value: sanitizeInput(tipeSubsidi.nama) },
    { label: 'Luas Bangunan', value: `${tipeSubsidi.luasBangunan} m²` },
    { label: 'Luas Tanah', value: `${tipeSubsidi.luasTanah} m²` },
    { label: 'Kamar Tidur', value: tipeSubsidi.kamarTidur },
    { label: 'Kamar Mandi', value: tipeSubsidi.kamarMandi },
    { label: 'Jumlah Lantai', value: tipeSubsidi.jumlahLantai },
    { label: 'Jenis Perumahan', value: jenisPerumahan },
    { label: 'Sisa Unit', value: sisaUnit }
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

  if (property.kantors && property.kantors.length > 0) {
    const kantor = property.kantors[0];

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
  document.getElementById('developerName').textContent = sanitizeInput(property.pengembang?.nama || '-');
  document.getElementById('developerAsosiasi').textContent = sanitizeInput(property.pengembang?.asosiasi?.nama || '-');
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