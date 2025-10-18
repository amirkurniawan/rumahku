# 🏠 RumahSubsidi.id

Platform marketplace resmi untuk rumah subsidi di Indonesia yang dioptimasi untuk **performa tinggi, SEO, dan keamanan**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Status](https://img.shields.io/badge/status-production%20ready-success.svg)

---

## 🎯 Fitur Utama

### ⚡ Performance
- ✅ **Caching 5 Menit** - Service Worker + Browser Cache
- ✅ **Lazy Loading** - Images load on demand
- ✅ **Gzip Compression** - Enabled via .htaccess
- ✅ **Optimized Assets** - Minified CSS/JS ready
- ✅ **Fast Loading** - Target < 3 detik

### 🎨 Design
- ✅ **Modern UI/UX** - Clean & professional
- ✅ **Responsive** - Mobile-first approach
- ✅ **Smooth Animations** - Engaging experience
- ✅ **Eye-catching Cards** - Premium design

### 🔒 Security
- ✅ **HTTPS Enforcement** - Force SSL
- ✅ **Security Headers** - A+ rating
- ✅ **CSP Protection** - XSS prevention
- ✅ **Input Sanitization** - All inputs sanitized
- ✅ **No XSS/SQL Injection** - Secure by design

### 🔍 SEO
- ✅ **Meta Tags** - Complete SEO setup
- ✅ **Open Graph** - Social media optimization
- ✅ **Sitemap.xml** - Search engine friendly
- ✅ **Robots.txt** - Crawler instructions
- ✅ **Semantic HTML** - Proper structure

---

## 📁 Struktur Folder
```
rumahsubsidi/
├── index.html              # Homepage
├── search.html             # Search page with map
├── detail.html             # Property detail page
├── error.html              # Error page (404, 500)
├── robots.txt              # SEO robots
├── sitemap.xml             # XML sitemap
├── manifest.json           # PWA manifest
├── .htaccess              # Apache config
├── README.md              # This file
│
├── css/
│   └── style.css          # Main stylesheet
│
├── js/
│   ├── script.js          # Homepage JS
│   ├── search.js          # Search page JS
│   ├── detail.js          # Detail page JS
│   └── sw.js              # Service Worker
│
└── assets/
    ├── icons/             # PWA icons (buat sendiri)
    └── images/            # Static images
```

---

## 🚀 Quick Start

### 1. Download/Clone Project
```bash
# Clone repository
git clone https://github.com/yourusername/rumahsubsidi.git
cd rumahsubsidi
```

### 2. Setup Google Maps API Key

**PENTING!** Edit `search.html` pada baris ~217:
```html
<!-- SEBELUM -->
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap"></script>

<!-- SESUDAH (ganti dengan API key Anda) -->
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAbc123...&callback=initMap"></script>
```

**Cara mendapatkan API key:**
1. Buka https://console.cloud.google.com/
2. Create new project
3. Enable **Maps JavaScript API**
4. Create credentials → API Key
5. Copy paste ke `search.html`

### 3. Buat PWA Icons

Buat folder `assets/icons/` dan tambahkan icon:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)

**Tools untuk generate:**
- https://realfavicongenerator.net/
- https://www.favicon-generator.org/

### 4. Test di Localhost

**Opsi A: Live Server (VS Code)**
```bash
# Install extension "Live Server" di VS Code
# Klik kanan index.html → Open with Live Server
# Atau tekan Alt + L + O
```

**Opsi B: NPM http-server**
```bash
npx http-server -p 8080 -c-1
# Buka http://localhost:8080
```

**Opsi C: Python**
```bash
# Python 3
python -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

---

## 🌐 Deployment

### Persiapan Deploy

1. **Ganti Google Maps API Key** ✅
2. **Buat PWA Icons** (192x192, 512x512) ✅
3. **Test di localhost** ✅
4. **Beli domain & hosting** 
5. **Install SSL certificate**

### Upload ke Server

**Via FTP/SFTP:**
1. Connect ke server menggunakan FileZilla
2. Upload semua files ke `public_html/` atau `www/`
3. Set permissions:
   - Folders: 755
   - Files: 644

**Via Git:**
```bash
# Di server
cd /var/www/
git clone https://github.com/yourusername/rumahsubsidi.git
chmod -R 755 rumahsubsidi/
```

### Install SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# For Apache
sudo certbot --apache -d rumahsubsidi.id -d www.rumahsubsidi.id

# For Nginx
sudo certbot --nginx -d rumahsubsidi.id -d www.rumahsubsidi.id

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 🧪 Testing

### Performance Testing

**Google PageSpeed Insights:**
```
https://pagespeed.web.dev/
Target: Mobile > 90, Desktop > 95
```

**GTmetrix:**
```
https://gtmetrix.com/
Target: Grade A, Performance > 90%
```

### Security Testing

**Security Headers:**
```
https://securityheaders.com/
Target: A+ rating
```

**SSL Labs:**
```
https://www.ssllabs.com/ssltest/
Target: A+ rating
```

### SEO Testing

**Google Search Console:**
1. Add property: https://search.google.com/search-console
2. Verify ownership
3. Submit sitemap: `https://rumahsubsidi.id/sitemap.xml`

---

## 📊 Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| PageSpeed Mobile | > 90 | Google PageSpeed |
| PageSpeed Desktop | > 95 | Google PageSpeed |
| Load Time | < 3s | GTmetrix |
| Security Headers | A+ | SecurityHeaders.com |
| SSL Rating | A+ | SSL Labs |
| SEO Score | > 95 | Lighthouse |

---

## 🔧 Configuration

### Cache Strategy (5 Minutes)

**HTML:** 5 minutes
```apache
ExpiresByType text/html "access plus 5 minutes"
```

**CSS/JS:** 1 hour
```apache
ExpiresByType text/css "access plus 1 hour"
```

**Images:** 1 week
```apache
ExpiresByType image/jpeg "access plus 1 week"
```

### Service Worker

Cache duration: **5 minutes**

Edit `js/sw.js` untuk mengubah:
```javascript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
```

---

## 🐛 Troubleshooting

### Problem: Map tidak muncul
**Solution:** Pastikan Google Maps API key sudah diganti di `search.html`

### Problem: Property cards tidak muncul
**Solution:** Cek browser console (F12), kemungkinan API sikumbang.tapera.go.id down

### Problem: .htaccess tidak bekerja
**Solution:**
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Problem: Service Worker error
**Solution:** Service Worker hanya jalan di HTTPS atau localhost. Di production dengan HTTPS akan otomatis jalan.

---

## 📱 Browser Support

### Desktop
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ❌ Internet Explorer (Not supported)

### Mobile
- ✅ iOS Safari 14+
- ✅ Chrome Mobile 90+
- ✅ Samsung Internet 14+

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License.
```
MIT License

Copyright (c) 2025 RumahSubsidi.id

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 👥 Team

**Developer:** Your Name  
**Email:** info@rumahsubsidi.id  
**Website:** https://rumahsubsidi.id

---

## 🙏 Acknowledgments

- **Tapera Indonesia** - API data provider
- **Google Maps** - Maps integration
- **Font Awesome** - Icons
- **Claude AI** - Development assistance

---

## 📞 Support

**Technical Issues:**
- Email: tech@rumahsubsidi.id
- GitHub Issues: https://github.com/yourusername/rumahsubsidi/issues

**General Inquiries:**
- Email: info@rumahsubsidi.id
- Phone: 1500-123

---

## 🗺️ Roadmap

### v1.1.0 (Q1 2025)
- [ ] User authentication
- [ ] Save favorites feature
- [ ] Email notifications
- [ ] Advanced filtering

### v1.2.0 (Q2 2025)
- [ ] Payment gateway integration
- [ ] Admin dashboard
- [ ] Analytics dashboard

### v2.0.0 (Q3 2025)
- [ ] AI-powered recommendations
- [ ] Virtual property tours
- [ ] Mobile app (React Native)

---

## 📸 Screenshots

### Homepage
![Homepage](https://via.placeholder.com/800x400?text=Homepage+Screenshot)

### Search Page with Map
![Search](https://via.placeholder.com/800x400?text=Search+Page+Screenshot)

### Detail Page
![Detail](https://via.placeholder.com/800x400?text=Detail+Page+Screenshot)

---

**Made with ❤️ for affordable housing in Indonesia**

⭐ Star this repo if you find it helpful!

---

**Last Updated:** January 2025  
**Version:** 1.0.0