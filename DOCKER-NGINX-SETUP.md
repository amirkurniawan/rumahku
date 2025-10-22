# 🐳 Docker Nginx Setup Guide untuk CasaOS Linux Mint

Panduan lengkap untuk deploy Nginx menggunakan Docker di server CasaOS Linux Mint.

---

## 📋 Prerequisites

### 1. **Docker Engine**
```bash
# Check Docker version (harus v20.10 atau lebih baru)
docker --version

# Jika belum ada, install:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. **Docker Compose Plugin**
```bash
# Check Docker Compose
docker compose version

# Harus sudah include di Docker Engine modern
```

### 3. **Port Requirements**
- Port **6002**: Nginx (public-facing) - untuk Cloudflare
- Port **6001**: API Server (internal) - di host
- Port **6003**: Web Server (internal) - di host
- Port **80**: Tetap untuk CasaOS

---

## 🚀 Quick Start

### 1. **Upload Files ke Server**

Upload files berikut ke server (misal: `/home/user/rumahku/`):

```bash
rumahku/
├── docker-compose.nginx.yml
├── nginx.conf
├── deploy-nginx.sh
├── logs/                    # akan dibuat otomatis
└── ... (application files)
```

### 2. **Make Script Executable**

```bash
cd /home/user/rumahku
chmod +x deploy-nginx.sh
```

### 3. **Run Deployment Script**

```bash
./deploy-nginx.sh
```

Script akan otomatis:
- ✅ Check Docker installation
- ✅ Check port availability
- ✅ Create directories
- ✅ Pull Nginx image
- ✅ Validate config
- ✅ Start container
- ✅ Run health check

---

## 📁 File Structure

### **docker-compose.nginx.yml**

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: rumahku-nginx
    restart: unless-stopped
    ports:
      - "6002:80"  # Host port 6002 → Container port 80
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./logs:/var/log/nginx
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - rumahku-network
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  rumahku-network:
    driver: bridge
```

**Key Points:**
- `host.docker.internal:host-gateway` - Allows container to access host services
- `6002:80` - Maps host port 6002 to container port 80
- `restart: unless-stopped` - Auto-restart on server reboot
- Log rotation (max 10MB, keep 3 files)

### **nginx.conf**

Reverse proxy configuration:
- `/api/*` → `host.docker.internal:6001` (API server)
- `/*` → `host.docker.internal:6003` (Web server)
- Cloudflare real IP detection
- Gzip compression
- Security headers
- Static file caching

---

## 🛠️ Manual Commands

### **Start Container**

```bash
docker compose -f docker-compose.nginx.yml up -d
```

### **Stop Container**

```bash
docker compose -f docker-compose.nginx.yml down
```

### **Restart Container**

```bash
docker compose -f docker-compose.nginx.yml restart
```

### **View Logs**

```bash
# Follow logs
docker compose -f docker-compose.nginx.yml logs -f

# Last 100 lines
docker compose -f docker-compose.nginx.yml logs --tail=100

# Specific service
docker logs rumahku-nginx -f
```

### **Check Status**

```bash
# All containers
docker ps

# Specific container
docker ps --filter "name=rumahku-nginx"

# Detailed inspect
docker inspect rumahku-nginx
```

### **Execute Commands Inside Container**

```bash
# Enter container shell
docker exec -it rumahku-nginx sh

# Test nginx config
docker exec rumahku-nginx nginx -t

# Reload nginx
docker exec rumahku-nginx nginx -s reload
```

---

## 🔧 Configuration Management

### **Update Nginx Configuration**

```bash
# 1. Edit nginx.conf
nano nginx.conf

# 2. Validate configuration
docker run --rm -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro nginx:alpine nginx -t

# 3. Reload Nginx (without downtime)
docker exec rumahku-nginx nginx -s reload

# OR restart container
docker compose -f docker-compose.nginx.yml restart
```

### **Update Docker Compose**

```bash
# 1. Edit docker-compose.nginx.yml
nano docker-compose.nginx.yml

# 2. Recreate container
docker compose -f docker-compose.nginx.yml up -d --force-recreate
```

---

## 🌐 Architecture Overview

```
Internet (Cloudflare SSL)
         ↓
   Port 6002 (Nginx Docker)
         ↓
    ┌────────┴────────┐
    ↓                 ↓
127.0.0.1:6003   127.0.0.1:6001
(Web Server)      (API Server)
  http-server       proxy-server.js
```

**Flow:**
1. Client → Cloudflare (HTTPS)
2. Cloudflare → Server IP:6002 (HTTP)
3. Nginx Container (port 80 internal)
4. Nginx → Host services via `host.docker.internal`
   - API requests → port 6001
   - Static files → port 6003

---

## 🔍 Troubleshooting

### **Port 6002 Already in Use**

```bash
# Find what's using the port
sudo ss -tulnp | grep :6002

# Kill the process
sudo kill -9 <PID>

# OR change port in docker-compose.nginx.yml
ports:
  - "6004:80"  # Change 6002 to 6004
```

### **Container Won't Start**

```bash
# Check logs
docker logs rumahku-nginx

# Check nginx config syntax
docker run --rm -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro nginx:alpine nginx -t

# Check Docker events
docker events &
docker compose -f docker-compose.nginx.yml up
```

### **Cannot Access Backend Services (6001, 6003)**

```bash
# Test from inside container
docker exec rumahku-nginx ping host.docker.internal

# Should respond with host IP
# If not, check Docker version (needs v20.10+)

# Alternative: Use host IP directly in nginx.conf
upstream web_server {
    server 192.168.1.100:6003;  # Replace with actual host IP
}
```

### **Logs Not Showing**

```bash
# Check log directory permissions
ls -la logs/

# If empty, check container logs
docker logs rumahku-nginx

# Check nginx error log
docker exec rumahku-nginx cat /var/log/nginx/error.log
```

### **Health Check Failing**

```bash
# Test health endpoint
curl http://localhost:6002/nginx-health

# Should return: "nginx healthy"

# If timeout, check if nginx is running
docker exec rumahku-nginx ps aux | grep nginx
```

---

## 📊 Monitoring

### **Check Resource Usage**

```bash
# Container stats
docker stats rumahku-nginx

# Disk usage
docker system df

# Detailed info
docker inspect rumahku-nginx
```

### **Access Logs**

```bash
# Nginx access log
tail -f logs/access.log

# Nginx error log
tail -f logs/error.log

# Docker container logs
docker logs -f rumahku-nginx
```

---

## 🔐 Security Best Practices

### 1. **Firewall Configuration**

```bash
# Allow port 6002 only from Cloudflare IPs
sudo ufw allow from 173.245.48.0/20 to any port 6002
sudo ufw allow from 103.21.244.0/22 to any port 6002
# ... (add all Cloudflare IP ranges)

# OR allow from anywhere (less secure)
sudo ufw allow 6002/tcp
```

### 2. **Cloudflare Settings**

- **SSL/TLS Mode**: Full (strict) - Requires SSL on origin
- **Always Use HTTPS**: Enable
- **Automatic HTTPS Rewrites**: Enable
- **Minimum TLS Version**: 1.2

### 3. **Nginx Headers**

Already configured in `nginx.conf`:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`

### 4. **Backend Binding**

Production backend services should bind to `127.0.0.1` (localhost only):

```yaml
# env.prod.yaml
server:
  web:
    host: "127.0.0.1"  # NOT 0.0.0.0
  proxy:
    host: "127.0.0.1"
```

---

## 🔄 Maintenance

### **Update Nginx Image**

```bash
# Pull latest image
docker pull nginx:alpine

# Recreate container
docker compose -f docker-compose.nginx.yml up -d --force-recreate
```

### **Backup Configuration**

```bash
# Backup important files
tar -czf rumahku-nginx-backup-$(date +%Y%m%d).tar.gz \
    docker-compose.nginx.yml \
    nginx.conf \
    logs/
```

### **Clean Up Old Logs**

```bash
# Manual cleanup
rm logs/*.log.1 logs/*.log.2

# OR use logrotate (recommended)
sudo nano /etc/logrotate.d/rumahku-nginx
```

---

## 🆘 Quick Reference

| Task | Command |
|------|---------|
| Deploy | `./deploy-nginx.sh` |
| Start | `docker compose -f docker-compose.nginx.yml up -d` |
| Stop | `docker compose -f docker-compose.nginx.yml down` |
| Restart | `docker compose -f docker-compose.nginx.yml restart` |
| Logs | `docker logs -f rumahku-nginx` |
| Shell | `docker exec -it rumahku-nginx sh` |
| Test Config | `docker exec rumahku-nginx nginx -t` |
| Reload | `docker exec rumahku-nginx nginx -s reload` |
| Health Check | `curl http://localhost:6002/nginx-health` |

---

## 📞 Support

Jika ada masalah:
1. Check logs: `docker logs rumahku-nginx`
2. Validate config: `docker exec rumahku-nginx nginx -t`
3. Check port: `sudo ss -tulnp | grep 6002`
4. Check backend: `curl http://localhost:6001` dan `curl http://localhost:6003`

---

**Last Updated:** 2025-10-20
**Docker Version:** 28.5.1
**CasaOS Compatible:** Yes ✅
