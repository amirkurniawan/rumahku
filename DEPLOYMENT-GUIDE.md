# 🚀 Production Deployment Guide - RumahSubsidi.id

## 📋 Architecture Overview

```
Internet (Port 443)
    ↓
Nginx (Reverse Proxy)
    ├─→ Static Files → http://127.0.0.1:6002 (Web Server)
    └─→ /api/* → http://127.0.0.1:6001 (Proxy Server)
            ↓
        Sikumbang API
```

**Key Security Points:**
- ✅ ONLY port 443 (HTTPS) exposed to internet
- ✅ Web server (6002) and API server (6001) bind to `127.0.0.1` (localhost only)
- ✅ Client browser NEVER directly accesses internal ports
- ✅ All API calls go through Nginx reverse proxy

---

## 🛠️ Step-by-Step Deployment

### **1. Prerequisites**

```bash
# SSH to production server
ssh user@rumah.alvian.web.id

# Install required packages
sudo apt update
sudo apt install nginx nodejs npm git certbot python3-certbot-nginx -y

# Verify installations
nginx -v
node -v
npm -v
```

---

### **2. Setup Application**

```bash
# Clone repository (or upload files)
cd /var/www/
git clone <your-repo> rumahku
cd rumahku

# Install dependencies
npm install

# Copy production config
cp env.production.yaml env.yaml

# Edit env.yaml if needed (verify domain name)
nano env.yaml

# Generate config.js from env.yaml
npm run config
```

---

### **3. Setup Nginx Reverse Proxy**

```bash
# Copy nginx config
sudo cp nginx-production.conf /etc/nginx/sites-available/rumah.alvian.web.id

# Create symlink to enable site
sudo ln -s /etc/nginx/sites-available/rumah.alvian.web.id /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

---

### **4. Setup SSL Certificate (Let's Encrypt)**

```bash
# Get SSL certificate
sudo certbot --nginx -d rumah.alvian.web.id

# Certbot will automatically:
# - Get certificate
# - Update nginx config with SSL
# - Setup auto-renewal

# Verify auto-renewal
sudo certbot renew --dry-run

# Check certificate
sudo certbot certificates
```

---

### **5. Start Application Services**

```bash
cd /var/www/rumahku

# Start both services
npm run start

# Or start individually:
# npm run start:web    # Start web server
# npm run start:api    # Start proxy server

# Check status
npm run status
```

**Expected Output:**
```
✅ Web Server is RUNNING
   Port: 6002
   Binding: 127.0.0.1 (localhost only)

✅ API Server is RUNNING
   Port: 6001
   Binding: 127.0.0.1 (localhost only)
```

---

### **6. Setup Process Manager (PM2)**

**For production, use PM2 to keep services running:**

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'rumahku-api',
      script: 'proxy-server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/pm2-api-error.log',
      out_file: './logs/pm2-api-out.log',
      log_file: './logs/pm2-api-combined.log',
      time: true
    }
  ]
};
EOF

# Stop manual processes first
npm run stop

# Start with PM2
pm2 start ecosystem.config.js

# For web server (http-server), start separately
pm2 start http-server --name "rumahku-web" -- -p 6002 -a 127.0.0.1

# Save PM2 config
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Copy the command it outputs and run it

# Monitor services
pm2 status
pm2 logs
pm2 monit
```

---

### **7. Firewall Configuration**

```bash
# Allow only HTTP and HTTPS (NOT 6001 or 6002!)
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable

# Verify firewall rules
sudo ufw status

# Expected output:
# To                         Action      From
# --                         ------      ----
# Nginx Full                 ALLOW       Anywhere
# OpenSSH                    ALLOW       Anywhere
```

---

### **8. Verify Deployment**

```bash
# Test from server (internal)
curl http://127.0.0.1:6002  # Web server
curl http://127.0.0.1:6001  # API server

# Test from browser (external)
# 1. Open: https://rumah.alvian.web.id
# 2. Open DevTools (F12) → Network tab
# 3. Check API calls - should be https://rumah.alvian.web.id/api/*
# 4. Should NOT see localhost:6001 or :6002 anywhere!

# Test API endpoint
curl https://rumah.alvian.web.id/api/detail-perumahan/TGR1110102025T001

# Test health check
curl https://rumah.alvian.web.id/health
```

---

### **9. Monitoring & Logs**

```bash
# Nginx logs
sudo tail -f /var/log/nginx/rumah.alvian.web.id_access.log
sudo tail -f /var/log/nginx/rumah.alvian.web.id_error.log

# Application logs
tail -f logs/api-server.log
tail -f logs/web-server.log

# PM2 logs
pm2 logs rumahku-api
pm2 logs rumahku-web

# System resource usage
pm2 monit
```

---

### **10. Maintenance Commands**

```bash
# Restart services
pm2 restart all

# Stop services
pm2 stop all

# Update application
cd /var/www/rumahku
git pull
npm install
npm run config  # Regenerate config.js
pm2 restart all

# Reload nginx (after config changes)
sudo nginx -t && sudo systemctl reload nginx

# Renew SSL certificate (auto-renews, but manual trigger if needed)
sudo certbot renew
```

---

## 🔒 Security Checklist

- [x] **Ports 6001 & 6002 bind to 127.0.0.1 only** (not 0.0.0.0)
- [x] **Firewall only allows ports 80, 443, and 22**
- [x] **SSL/TLS certificate installed**
- [x] **Nginx security headers configured**
- [x] **No direct access to internal services from internet**
- [x] **env.yaml not committed to git** (in .gitignore)
- [x] **PM2 process manager for auto-restart**
- [x] **Regular log monitoring setup**

---

## 🧪 Testing Checklist

- [ ] Homepage loads: https://rumah.alvian.web.id
- [ ] Search page works: https://rumah.alvian.web.id/search.html
- [ ] Detail page works: https://rumah.alvian.web.id/detail.html?id=XXX
- [ ] API calls work (check DevTools Network tab)
- [ ] No CORS errors in console
- [ ] No references to localhost:6001 or :6002 in browser
- [ ] SSL certificate valid (green lock icon)
- [ ] Page load time acceptable (< 3 seconds)

---

## ❓ Troubleshooting

### Problem: "ERR_CONNECTION_REFUSED" in browser

**Check:**
```bash
# Is Nginx running?
sudo systemctl status nginx

# Are services running?
pm2 status

# Check Nginx error logs
sudo tail -50 /var/log/nginx/error.log
```

### Problem: API calls fail (404 or 502)

**Check:**
```bash
# Test proxy server directly
curl http://127.0.0.1:6001

# Check proxy server logs
tail -50 logs/api-server.log

# Verify Nginx upstream
sudo nginx -t
```

### Problem: SSL certificate issues

**Check:**
```bash
# Verify certificate
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Force renewal (if needed)
sudo certbot renew --force-renewal
```

---

## 📞 Support

For issues, check:
1. Application logs: `tail -f logs/*.log`
2. Nginx logs: `sudo tail -f /var/log/nginx/*.log`
3. PM2 status: `pm2 status && pm2 logs`
4. Browser console: F12 → Console & Network tabs

---

**Last Updated:** 2025-10-20
