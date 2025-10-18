# 🔒 Security Policy - RumahSubsidi.id

## Keamanan Website

Website ini dibangun dengan fokus pada **keamanan maksimal**. Berikut adalah implementasi security yang diterapkan:

---

## 🛡️ Security Features

### 1. HTTPS Enforcement
- ✅ Force HTTPS via `.htaccess`
- ✅ HSTS header enabled
- ✅ Redirect HTTP → HTTPS otomatis

### 2. Security Headers

**Implemented Headers:**
```apache
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000
Referrer-Policy: strict-origin-when-cross-origin
```

**Test di:** https://securityheaders.com/

### 3. Input Sanitization

Semua user input di-sanitize menggunakan:
```javascript
function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}
```

**Protection terhadap:**
- ✅ XSS (Cross-Site Scripting)
- ✅ HTML Injection
- ✅ Script Injection

### 4. Content Security Policy (CSP)

Menggunakan meta tag CSP untuk mencegah XSS attacks.

**Whitelist:**
- Scripts: `'self'`, Google Maps, CDN
- Styles: `'self'`, CDN
- Images: `'self'`, HTTPS sources
- API: Sikumbang Tapera only

### 5. File Protection

**Protected files:**
```apache
<FilesMatch "(^\.htaccess|^\.env|^\.git)">
    Require all denied
</FilesMatch>
```

**Disabled:**
- ✅ Directory listing
- ✅ Server signature
- ✅ PHP execution di upload folder (jika ada)

---

## 🚨 Known Limitations

### 1. Google Maps API Key
⚠️ **IMPORTANT:** API key di `search.html` harus di-restrict!

**Cara restrict:**
1. Buka Google Cloud Console
2. Credentials → Edit API key
3. Application restrictions → HTTP referrers
4. Add: `rumahsubsidi.id/*`

### 2. External API
Website menggunakan API dari:
- `https://sikumbang.tapera.go.id`

**Risk:** Jika API down atau berubah, website bisa error.

**Mitigation:** 
- Cache 5 menit
- Error handling
- Fallback message

### 3. Client-Side Only
Website ini **100% client-side**, tidak ada backend/database.

**Implications:**
- ✅ Tidak ada SQL Injection risk
- ✅ Tidak ada server-side vulnerability
- ⚠️ Semua data dari external API

---

## 🔍 Security Checklist

### Before Deploy
- [ ] Ganti Google Maps API key
- [ ] Restrict API key (HTTP referrers only)
- [ ] Install valid SSL certificate
- [ ] Test security headers (A+ rating)
- [ ] Verify .htaccess working
- [ ] Test HTTPS enforcement
- [ ] Check CSP not blocking anything

### After Deploy
- [ ] Run security scan
- [ ] Test SSL (A+ rating)
- [ ] Monitor error logs
- [ ] Setup uptime monitoring
- [ ] Regular security updates

---

## 🐛 Reporting Security Issues

**JANGAN post security issues di public GitHub issues!**

**Laporkan via:**
- Email: security@rumahsubsidi.id
- Subject: `[SECURITY] Vulnerability Report`

**Kami akan respond dalam 48 jam.**

---

## 📊 Security Testing

### Recommended Tools

**Headers:**
```
https://securityheaders.com/
Target: A+ rating
```

**SSL/TLS:**
```
https://www.ssllabs.com/ssltest/
Target: A+ rating
```

**Vulnerability Scan:**
```
https://observatory.mozilla.org/
Target: 90+ score
```

---

## 🔄 Security Updates

### Update Schedule
- **Weekly:** Check for security news
- **Monthly:** Update dependencies (if any)
- **Quarterly:** Security audit
- **Yearly:** Penetration testing

### Latest Updates
- **2025-01-15:** Initial security implementation
- **2025-01-15:** Security headers configured
- **2025-01-15:** Input sanitization added

---

## 📋 Security Best Practices

### For Developers

1. **Never commit sensitive data**
```bash
   # Add to .gitignore
   .env
   *.key
   *.pem
   config/secrets.json
```

2. **Always sanitize user input**
```javascript
   // GOOD
   element.textContent = userInput;
   
   // BAD
   element.innerHTML = userInput;
```

3. **Use HTTPS everywhere**
   - No mixed content
   - No HTTP resources
   - Force SSL redirect

4. **Keep dependencies updated**
```bash
   npm audit
   npm update
```

### For Users

1. **Use strong passwords** (jika ada user system nanti)
2. **Enable 2FA** (jika tersedia)
3. **Don't share credentials**
4. **Report suspicious activity**

---

## ⚖️ Compliance

### GDPR Compliance (jika applicable)
- ✅ No personal data collected
- ✅ No cookies (except essential)
- ✅ No tracking (except analytics)

### Indonesian Data Protection
- ✅ Data hosted in Indonesia (jika applicable)
- ✅ Comply with UU ITE
- ✅ Privacy policy ready

---

## 📞 Security Contacts

**Security Team:**
- Email: security@rumahsubsidi.id
- Emergency: +62-xxx-xxxx-xxxx

**Bug Bounty:**
- Coming soon

---

**Last Security Audit:** January 15, 2025  
**Next Scheduled Audit:** April 15, 2025  
**Security Rating:** A+ (Target)

---

**Stay Safe! 🔒**