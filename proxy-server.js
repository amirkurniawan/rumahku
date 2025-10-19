/**
 * Proxy Server untuk Bypass CORS
 * API: https://my.pkp.go.id/cekbantuan
 *
 * Cara menjalankan:
 * 1. Install dependencies: npm install express cors axios form-data
 * 2. Jalankan server: node proxy-server.js
 * 3. Server akan berjalan di http://localhost:3000
 */

const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Allow all origins
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'Proxy server for PKP API is running',
    endpoints: {
      cekSubsidi: 'POST /api/cek-subsidi'
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

  console.log(`Checking subsidi for NIK: ${nik}`);

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

    console.log('Success! Got response from PKP API');

    // Return HTML response
    res.send(response.data);

  } catch (error) {
    console.error('Error calling PKP API:', error.message);

    if (error.response) {
      // API returned error response
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);

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

// Start server
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log(`  🚀 Proxy Server Running`);
  console.log(`  📍 URL: http://localhost:${PORT}`);
  console.log(`  🔧 API Endpoint: http://localhost:${PORT}/api/cek-subsidi`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Ready to handle requests...');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down server...');
  process.exit(0);
});
