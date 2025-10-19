# Setup Proxy Server untuk CEK NIK Subsidi

## 📋 Mengapa Butuh Proxy Server?

API `https://my.pkp.go.id/cekbantuan` tidak mengizinkan akses langsung dari browser (CORS policy). Untuk mengatasinya, kita perlu proxy server yang berjalan di backend.

---

## 🚀 Cara Setup dan Menjalankan

### 1. Install Dependencies

Buka terminal di folder project, lalu jalankan:

```bash
npm install
```

Ini akan menginstall:
- `express` - Web framework untuk Node.js
- `cors` - Middleware untuk handle CORS
- `axios` - HTTP client untuk request ke API
- `form-data` - Untuk membuat form data

### 2. Jalankan Proxy Server

```bash
npm run proxy
```

**ATAU**

```bash
node proxy-server.js
```

Anda akan melihat output seperti ini:

```
═══════════════════════════════════════════════════
  🚀 Proxy Server Running
  📍 URL: http://localhost:3000
  🔧 API Endpoint: http://localhost:3000/api/cek-subsidi
═══════════════════════════════════════════════════

Ready to handle requests...
Press Ctrl+C to stop the server
```

### 3. Jalankan Website

**Di terminal BARU** (jangan tutup terminal proxy), jalankan website:

```bash
npm run dev
```

**ATAU** buka dengan Live Server di VS Code.

### 4. Test Fitur CEK NIK

1. Buka website di browser
2. Klik tombol **"CEK NIK"**
3. Masukkan NIK (contoh: `3203012503770011`)
4. Klik **Submit**

---

## 🔧 Troubleshooting

### Error: "Proxy server belum berjalan"

**Penyebab:** Proxy server belum dijalankan atau berhenti.

**Solusi:**
1. Buka terminal baru
2. Jalankan: `npm run proxy`
3. Pastikan server running di port 3000
4. Coba lagi submit NIK

### Error: "Port 3000 already in use"

**Penyebab:** Port 3000 sudah digunakan aplikasi lain.

**Solusi 1 - Ubah Port:**
1. Buka file `proxy-server.js`
2. Ubah `const PORT = 3000;` menjadi `const PORT = 3001;`
3. Buka file `js/nik-checker.js`
4. Ubah URL `http://localhost:3000/api/cek-subsidi` menjadi `http://localhost:3001/api/cek-subsidi`
5. Restart proxy server

**Solusi 2 - Kill Process:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Error: "Cannot find module 'express'"

**Penyebab:** Dependencies belum terinstall.

**Solusi:**
```bash
npm install
```

---

## 📁 File-file Penting

- `proxy-server.js` - Kode proxy server
- `js/nik-checker.js` - Frontend yang memanggil proxy
- `package.json` - Dependencies configuration

---

## 🔍 Cara Kerja

```
Browser (Frontend)
    ↓
    | fetch('http://localhost:3000/api/cek-subsidi')
    ↓
Proxy Server (Node.js)
    ↓
    | POST to https://my.pkp.go.id/cekbantuan
    ↓
PKP API
    ↓
    | HTML Response dengan table #example1
    ↓
Proxy Server
    ↓
    | Return HTML ke browser
    ↓
Browser
    ↓
    | Parse HTML, extract table data
    ↓
Show Popup (Eligible/Not Eligible)
```

---

## 📊 Response Format

### Eligible Response:
Popup hijau dengan:
- ✅ Icon centang
- Judul "Selamat! Anda Eligible"
- Table dengan data dari API
- Tombol tutup

### Not Eligible Response:
Popup merah dengan:
- ❌ Icon silang
- Judul "Tidak Eligible"
- Pesan error
- Auto close 10 detik

---

## 🛡️ Security Notes

⚠️ **PENTING:** Proxy server ini untuk development saja!

Untuk production:
1. Deploy proxy ke server yang aman (Heroku, Railway, Vercel, dll)
2. Tambahkan authentication/API key
3. Rate limiting untuk mencegah abuse
4. Logging dan monitoring
5. HTTPS wajib!

---

## 📞 Support

Jika ada masalah, cek:
1. Apakah proxy server running? (terminal harus tetap terbuka)
2. Apakah port 3000 tidak bentrok?
3. Apakah `npm install` sudah dijalankan?
4. Lihat console browser untuk error details

---

## 🎉 Ready!

Sekarang fitur CEK NIK sudah siap digunakan!

**Perintah Lengkap:**

Terminal 1 (Proxy):
```bash
npm run proxy
```

Terminal 2 (Website):
```bash
npm run dev
```

Buka browser → Test CEK NIK → Enjoy! 🚀
