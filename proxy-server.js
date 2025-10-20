/**
 * Proxy Server untuk Bypass CORS
 * API: https://my.pkp.go.id/cekbantuan
 *
 * Cara menjalankan:
 * 1. Install dependencies: npm install
 * 2. Jalankan server: bash start-api.sh (atau npm run start:api)
 * 3. Port dikonfigurasi di env.yaml (default: 6001)
 * 4. Server URL: lihat di env.yaml server.proxy.baseURL
 */

const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// Load configuration from env.yaml
let CONFIG;
try {
  const envPath = path.join(__dirname, 'env.yaml');
  const envContent = fs.readFileSync(envPath, 'utf8');
  CONFIG = yaml.load(envContent);
  console.log('✅ Configuration loaded from env.yaml');
} catch (error) {
  console.error('❌ Failed to load env.yaml, using defaults');
  console.error('Error:', error.message);
  // Fallback to defaults
  CONFIG = {
    server: {
      proxy: { port: 3000, host: '0.0.0.0' }
    },
    api: {
      sikumbang: {
        baseURL: 'https://sikumbang.tapera.go.id',
        timeout: 30000
      }
    }
  };
}

const app = express();
const PORT = CONFIG.server.proxy.port;
const HOST = CONFIG.server.proxy.host;
const SIKUMBANG_BASE_URL = CONFIG.api.sikumbang.baseURL;
const SIKUMBANG_TIMEOUT = CONFIG.api.sikumbang.timeout;

// Utility: Get timestamp in GMT+7 (Jakarta/Indonesia)
function getTimestampGMT7() {
  const now = new Date();

  // Convert to GMT+7
  const offsetJakarta = 7 * 60; // GMT+7 in minutes
  const localOffset = now.getTimezoneOffset(); // Current offset in minutes
  const jakartaTime = new Date(now.getTime() + (offsetJakarta + localOffset) * 60000);

  // Format: YYYY-MM-DD HH:mm:ss GMT+7
  const year = jakartaTime.getFullYear();
  const month = String(jakartaTime.getMonth() + 1).padStart(2, '0');
  const day = String(jakartaTime.getDate()).padStart(2, '0');
  const hours = String(jakartaTime.getHours()).padStart(2, '0');
  const minutes = String(jakartaTime.getMinutes()).padStart(2, '0');
  const seconds = String(jakartaTime.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} GMT+7`;
}

// Middleware
app.use(cors()); // Allow all origins
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Proxy server for PKP API and Sikumbang is running',
    endpoints: {
      cekSubsidi: 'POST /api/cek-subsidi',
      detailPerumahan: 'GET /api/detail-perumahan/:id'
    }
  });
});

// Proxy endpoint untuk cek subsidi
app.post('/api/cek-subsidi', async (req, res) => {
  const { nik } = req.body;

  if (!nik) {
    return res.status(400).json({
      success: false,
      error: 'NIK is required'
    });
  }

  if (nik.length !== 16) {
    return res.status(400).json({
      success: false,
      error: 'NIK must be 16 digits'
    });
  }

  // Mask NIK untuk privacy (only show first 4 digits)
  const maskedNik = `${nik.substring(0, 4)}${'*'.repeat(12)}`;
  console.log(`[${getTimestampGMT7()}] 🔍 Checking subsidi for NIK: ${maskedNik}`);

  try {
    // Create form data
    const formData = new FormData();
    formData.append('j', '1');
    formData.append('nik', nik);

    // Make request to PKP API
    const response = await axios.post('https://my.pkp.go.id/cekbantuan', formData, {
      headers: {
        ...formData.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 30000, // 30 seconds timeout
      maxRedirects: 5
    });

    console.log(`[${getTimestampGMT7()}] ✅ Success! Got response from PKP API`);

    // Return HTML response
    res.send(response.data);

  } catch (error) {
    console.error(`[${getTimestampGMT7()}] ❌ Error calling PKP API:`, error.message);

    if (error.response) {
      // API returned error response
      console.error(`[${getTimestampGMT7()}] Status:`, error.response.status);
      console.error(`[${getTimestampGMT7()}] Data:`, error.response.data);

      res.status(error.response.status).json({
        success: false,
        error: 'API error',
        details: error.message,
        status: error.response.status
      });
    } else if (error.request) {
      // Request made but no response
      res.status(503).json({
        success: false,
        error: 'No response from PKP API',
        details: error.message
      });
    } else {
      // Something else went wrong
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }
});

// Proxy endpoint untuk detail perumahan
app.get('/api/detail-perumahan/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'ID perumahan is required'
    });
  }

  console.log(`[${getTimestampGMT7()}] 🏠 Fetching detail perumahan: ${id}`);

  try {
    // Fetch HTML page from Sikumbang
    const url = `${SIKUMBANG_BASE_URL}${CONFIG.api.sikumbang.endpoints.detail}/${id}`;
    console.log(`[${getTimestampGMT7()}] 📡 Requesting: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: SIKUMBANG_TIMEOUT
    });

    const html = response.data;

    // Extract window.SIKUMBANG_DATA from HTML
    // Pattern: window.SIKUMBANG_DATA={...}
    const regex = /window\.SIKUMBANG_DATA\s*=\s*({[\s\S]*?});/;
    const match = html.match(regex);

    if (!match || !match[1]) {
      console.error(`[${getTimestampGMT7()}] ❌ window.SIKUMBANG_DATA not found in HTML`);
      return res.status(404).json({
        success: false,
        error: 'Data not found in page',
        details: 'window.SIKUMBANG_DATA tidak ditemukan'
      });
    }

    // Parse JSON data
    const jsonString = match[1];
    const data = JSON.parse(jsonString);

    console.log(`[${getTimestampGMT7()}] ✅ Success! Extracted SIKUMBANG_DATA`);
    console.log(`[${getTimestampGMT7()}] 📊 Data: ${data.namaPerumahan || 'Unknown'}`);

    // Return parsed data
    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error(`[${getTimestampGMT7()}] ❌ Error fetching detail perumahan:`, error.message);

    if (error.response) {
      console.error(`[${getTimestampGMT7()}] Status:`, error.response.status);

      res.status(error.response.status).json({
        success: false,
        error: 'API error',
        details: error.message,
        status: error.response.status
      });
    } else if (error.request) {
      res.status(503).json({
        success: false,
        error: 'No response from Sikumbang',
        details: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }
});

// Start server
app.listen(PORT, HOST, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log(`[${getTimestampGMT7()}] 🚀 Proxy Server Running`);
  console.log(`[${getTimestampGMT7()}] 📍 Environment: ${CONFIG.app.environment}`);
  console.log(`[${getTimestampGMT7()}] 📍 URL: http://localhost:${PORT}`);
  console.log(`[${getTimestampGMT7()}] 🔧 Endpoints:`);
  console.log(`[${getTimestampGMT7()}]    - POST ${CONFIG.proxy.endpoints.nik}`);
  console.log(`[${getTimestampGMT7()}]    - GET  ${CONFIG.proxy.endpoints.detail}/:id`);
  console.log(`[${getTimestampGMT7()}] 🌐 Sikumbang API: ${SIKUMBANG_BASE_URL}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`[${getTimestampGMT7()}] ✅ Ready to handle requests...`);
  console.log(`[${getTimestampGMT7()}] ⚠️  Press Ctrl+C to stop the server`);
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n\n[${getTimestampGMT7()}] 🛑 Shutting down server...`);
  process.exit(0);
});
