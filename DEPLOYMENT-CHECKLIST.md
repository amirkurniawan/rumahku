# 📋 Deployment Checklist - RUMAGO.id

Checklist lengkap untuk deploy RUMAGO.id di CasaOS Linux Mint dengan Nginx Docker.

---

## 🎯 Pre-Deployment Checklist

### 1. Server Requirements
- [ ] Server: CasaOS Linux Mint
- [ ] RAM: Minimum 2GB (recommended 4GB)
- [ ] Storage: Minimum 10GB free space
- [ ] Internet: Stable connection
- [ ] Docker: Version 20.10+ installed
- [ ] User: Have sudo access

### 2. Domain & DNS
- [ ] Domain: rumah.alvian.web.id terdaftar
- [ ] Cloudflare account: Setup and active
- [ ] DNS A Record: Pointing to server IP
- [ ] SSL Certificate: Cloudflare SSL/TLS configured

### 3. Firewall & Network
- [ ] Port 6002: Open for Cloudflare IPs
- [ ] Port 80: Reserved for CasaOS (don't touch!)
- [ ] Port 6001, 6003: Internal only (blocked from internet)

### 4. Local Development
- [ ] Code tested locally: `npm run start:dev`
- [ ] All features working
- [ ] No console errors
- [ ] Modal login/register working
- [ ] API endpoints tested

---

## 📦 Step 1: Prepare Files

### Upload to Server

```bash
# Create project directory
mkdir -p ~/rumahku
cd ~/rumahku

# Upload via SCP or SFTP
# Files needed:
```

- [ ] `docker-compose.nginx.yml`
- [ ] `nginx.conf`
- [ ] `deploy-nginx.sh`
- [ ] `test-nginx.sh`
- [ ] `env.prod.yaml`
- [ ] `env.dev.yaml`
- [ ] `package.json`
- [ ] `proxy-server.js`
- [ ] All `/js` files
- [ ] All `/css` files
- [ ] All `/components` files
- [ ] All `/assets` files
- [ ] `index.html`, `search.html`, `detail.html`

### Set Permissions

```bash
cd ~/rumahku
chmod +x deploy-nginx.sh
chmod +x test-nginx.sh
chmod +x start-prod.sh
chmod +x stop-all.sh
chmod +x status.sh
```

- [ ] All `.sh` files are executable

---

## 🐳 Step 2: Deploy Nginx Docker

### Run Deployment Script

```bash
cd ~/rumahku
./deploy-nginx.sh
```

**Expected output:**
```
✅ Docker found
✅ Docker Compose found
✅ Port 6002 is available
✅ Nginx configuration is valid
✅ Container is running!
✅ Deployment Successful!
```

### Verify Deployment

```bash
# Check container status
docker ps | grep rumahku-nginx

# Should show:
# rumahku-nginx   Up X minutes   0.0.0.0:6002->80/tcp
```

- [ ] Nginx container running
- [ ] Port 6002 mapped correctly
- [ ] No error in logs: `docker logs rumahku-nginx`

---

## 🚀 Step 3: Deploy Backend Services

### Install Dependencies

```bash
cd ~/rumahku

# Install Node.js dependencies (if not done)
npm install
```

- [ ] `node_modules` folder created
- [ ] No installation errors

### Generate Production Config

```bash
npm run config:prod
```

**Expected output:**
```
✅ env.prod.yaml loaded successfully
✅ config.js generated successfully
```

- [ ] `js/config.js` created/updated
- [ ] Contains production URLs

### Start Production Services

```bash
npm run start:prod
```

**Expected output:**
```
✅ API Server started
✅ Web Server started
📍 Web Server:  http://localhost:6003 (internal)
📍 API Server:  http://localhost:6001 (internal)
```

- [ ] API server running (port 6001)
- [ ] Web server running (port 6003)
- [ ] Both binding to `127.0.0.1` (secure!)

### Check Service Status

```bash
npm run status
```

- [ ] Both services show "RUNNING"
- [ ] PIDs are active
- [ ] Ports correctly bound

---

## 🧪 Step 4: Testing

### Run Nginx Test Script

```bash
./test-nginx.sh
```

**Should pass:**
- [ ] Docker daemon
- [ ] Container running
- [ ] Port 6002 listening
- [ ] Nginx syntax valid
- [ ] Health endpoint (200)
- [ ] Web server accessible (via Nginx)
- [ ] API server accessible (via Nginx)

### Manual Tests

```bash
# Test 1: Health endpoint
curl http://localhost:6002/nginx-health
# Should return: "nginx healthy"

# Test 2: Web page
curl -I http://localhost:6002/
# Should return: HTTP/1.1 200 OK

# Test 3: API endpoint
curl -X POST http://localhost:6002/api/cek-subsidi \
  -H "Content-Type: application/json" \
  -d '{"nik":"1234567890123456"}'
# Should return JSON response
```

- [ ] All manual tests passed

---

## 🌐 Step 5: Cloudflare Configuration

### DNS Settings

Login to Cloudflare Dashboard:

- [ ] DNS Type: **A**
- [ ] Name: **rumah** (or @)
- [ ] IPv4: **Your Server IP**
- [ ] Proxy status: **Proxied** (orange cloud)
- [ ] TTL: **Auto**

### SSL/TLS Settings

Go to SSL/TLS → Overview:

- [ ] Encryption mode: **Flexible** or **Full**
- [ ] Always Use HTTPS: **On**
- [ ] Automatic HTTPS Rewrites: **On**
- [ ] Minimum TLS Version: **1.2**

### Firewall Rules (Optional)

Create rule to allow only Cloudflare IPs:

```
(ip.src ne cf.ipv4_ranges)
Action: Block
```

- [ ] Firewall rules configured

### Page Rules (Optional)

- [ ] Cache Level: Standard
- [ ] Browser Cache TTL: 4 hours
- [ ] Auto Minify: HTML, CSS, JS

---

## 🔐 Step 6: Security Hardening

### Server Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow port 6002 (Nginx)
sudo ufw allow 6002/tcp

# Enable firewall
sudo ufw enable
```

- [ ] UFW enabled
- [ ] Port 6002 allowed
- [ ] SSH access maintained

### Verify Internal Ports

```bash
# These should ONLY bind to 127.0.0.1
sudo ss -tulnp | grep :6001
sudo ss -tulnp | grep :6003

# Should show: 127.0.0.1:6001 and 127.0.0.1:6003
# NOT 0.0.0.0:6001 or 0.0.0.0:6003
```

- [ ] Port 6001 bound to `127.0.0.1`
- [ ] Port 6003 bound to `127.0.0.1`
- [ ] NOT accessible from internet directly

---

## ✅ Step 7: Final Verification

### Test Public URL

From your browser or external machine:

```bash
# Test from external network
curl -I https://rumah.alvian.web.id

# Should return: HTTP/2 200
```

- [ ] Domain resolves correctly
- [ ] HTTPS working
- [ ] Homepage loads
- [ ] No SSL warnings
- [ ] No mixed content errors

### Test Full User Journey

1. **Homepage**
   - [ ] Opens successfully
   - [ ] Search box works
   - [ ] Stats show correctly

2. **Search Page**
   - [ ] Province dropdown loads
   - [ ] Can select kabupaten
   - [ ] Map shows results
   - [ ] Markers clickable

3. **Detail Page**
   - [ ] Detail page loads from URL
   - [ ] Property info displayed
   - [ ] Map shows location
   - [ ] Images load

4. **Authentication**
   - [ ] Click "Masuk" - modal opens
   - [ ] Click "Daftar" - modal opens
   - [ ] Can select role (Customer/Developer)
   - [ ] Form validation works
   - [ ] Login/Register successful

5. **API Endpoints**
   - [ ] NIK checker works
   - [ ] Detail endpoint returns data
   - [ ] No CORS errors

---

## 📊 Step 8: Monitoring Setup

### Check Logs

```bash
# Nginx logs
tail -f ~/rumahku/logs/access.log
tail -f ~/rumahku/logs/error.log

# Application logs
tail -f ~/rumahku/logs/api-server.log
tail -f ~/rumahku/logs/web-server.log

# Docker logs
docker logs -f rumahku-nginx
```

- [ ] Logs are being written
- [ ] No critical errors
- [ ] Request logs show Cloudflare IPs

### Set Up Auto-Restart

Services sudah configured untuk auto-restart:
- [ ] Nginx: `restart: unless-stopped` ✅
- [ ] Backend: Need to use PM2 or systemd

**Recommended: Install PM2**

```bash
sudo npm install -g pm2

# Start with PM2
pm2 start proxy-server.js --name rumahku-api
pm2 start "http-server -p 6003" --name rumahku-web

# Save PM2 config
pm2 save

# Setup startup
pm2 startup
```

- [ ] PM2 installed (optional but recommended)
- [ ] Services added to PM2
- [ ] PM2 configured for auto-start

---

## 🎉 Deployment Complete!

### Final Checklist

- [ ] ✅ Nginx Docker container running
- [ ] ✅ Backend services (API + Web) running
- [ ] ✅ All tests passing
- [ ] ✅ Domain accessible via HTTPS
- [ ] ✅ Cloudflare configured
- [ ] ✅ Firewall secured
- [ ] ✅ Logs monitored
- [ ] ✅ Auto-restart configured

### Important URLs

| Service | URL | Access |
|---------|-----|--------|
| Public Website | https://rumah.alvian.web.id | Public |
| Nginx Health | http://SERVER_IP:6002/nginx-health | Internal |
| Web Server | http://127.0.0.1:6003 | Server only |
| API Server | http://127.0.0.1:6001 | Server only |

---

## 🆘 Troubleshooting

### If something goes wrong:

1. **Check Nginx container**
   ```bash
   docker ps | grep rumahku-nginx
   docker logs rumahku-nginx
   ```

2. **Check backend services**
   ```bash
   npm run status
   curl http://localhost:6001
   curl http://localhost:6003
   ```

3. **Check ports**
   ```bash
   sudo ss -tulnp | grep -E "6001|6002|6003"
   ```

4. **Restart everything**
   ```bash
   # Stop all
   docker compose -f docker-compose.nginx.yml down
   npm run stop

   # Start all
   npm run start:prod
   docker compose -f docker-compose.nginx.yml up -d
   ```

5. **Check firewall**
   ```bash
   sudo ufw status
   sudo ufw allow 6002/tcp
   ```

---

## 📞 Support Commands

```bash
# View all running processes
ps aux | grep -E "node|nginx"

# Check system resources
htop
df -h
free -m

# Network diagnostics
netstat -tuln
ss -tulnp

# Docker info
docker ps -a
docker stats rumahku-nginx
```

---

**Date Deployed:** _____________

**Deployed By:** _____________

**Server IP:** _____________

**Notes:**
_______________________________
_______________________________
_______________________________

---

✅ **Deployment successful! RUMAGO.id is now live!** 🎉
