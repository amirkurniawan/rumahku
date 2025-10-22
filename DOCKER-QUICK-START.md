# Docker Quick Start - Rumahku

## 📦 Build Images

```bash
# Backend API
docker build -f Dockerfile.api -t rumahku-api .

# Frontend Web
docker build -f Dockerfile.web -t rumahku-web .
```

---

## 🚀 Run Containers

```bash
# Backend API - Port 6001
docker run -d --name rumahku-api -p 6001:6001 --restart unless-stopped rumahku-api

# Frontend Web - Port 6003
docker run -d --name rumahku-web -p 6003:6003 --restart unless-stopped rumahku-web
```

---

## ✅ Verifikasi

```bash
# Check containers running
docker ps

# Test akses
curl http://localhost:6001
curl http://localhost:6003

# Lihat logs
docker logs rumahku-api
docker logs rumahku-web
```

---

## 🔄 Update & Restart

```bash
# API
docker stop rumahku-api && docker rm rumahku-api
docker build -f Dockerfile.api -t rumahku-api .
docker run -d --name rumahku-api -p 6001:6001 --restart unless-stopped rumahku-api

# Web
docker stop rumahku-web && docker rm rumahku-web
docker build -f Dockerfile.web -t rumahku-web .
docker run -d --name rumahku-web -p 6003:6003 --restart unless-stopped rumahku-web
```

---

## 🛑 Stop & Remove

```bash
# Stop
docker stop rumahku-api rumahku-web

# Remove
docker rm rumahku-api rumahku-web

# Remove images
docker rmi rumahku-api rumahku-web
```

---

## 🎯 All-in-One Commands

### Build & Run Semua

```bash
docker build -f Dockerfile.api -t rumahku-api . && \
docker build -f Dockerfile.web -t rumahku-web . && \
docker run -d --name rumahku-api -p 6001:6001 --restart unless-stopped rumahku-api && \
docker run -d --name rumahku-web -p 6003:6003 --restart unless-stopped rumahku-web
```

### Stop & Clean Semua

```bash
docker stop rumahku-api rumahku-web && \
docker rm rumahku-api rumahku-web
```

---

**That's it!** 🎉
