# 🔧 Environment Configuration Guide

RumahSubsidi.id now supports **separate configurations** for Development and Production environments.

---

## 📁 Configuration Files

### **Available Configs:**

| File | Purpose | Committed to Git? | Used By |
|------|---------|-------------------|---------|
| `env.dev.yaml` | Development config | ✅ Yes (template) | Local development |
| `env.prod.yaml` | Production config | ✅ Yes (template) | Production server |
| `env.prod.local.yaml` | Prod config (local testing) | ✅ Yes (template) | Testing prod locally |
| `env.yaml.example` | General example | ✅ Yes | Documentation |
| `env.yaml` | Local override | ❌ No (gitignored) | Optional override |

---

## 🚀 Usage

### **Development (Local Machine):**

```bash
# Generate config for development
npm run config:dev

# Start development servers
npm run start:dev

# Or manually:
node generate-config.js dev
bash start-dev.sh
```

**Development Settings:**
- Web Server: `http://localhost:6002`
- API Server: `http://localhost:6001`
- Binding: `0.0.0.0` (accessible from any interface)
- Environment: `development`

---

### **Production (Server with Nginx Docker):**

```bash
# Generate config for production
npm run config:prod

# Start production servers
npm run start:prod

# Or manually:
node generate-config.js prod
bash start-prod.sh
```

**Production Settings:**
- Web Server: `http://127.0.0.1:6003` (internal)
- API Server: `http://127.0.0.1:6001` (internal)
- Public URL: `https://rumah.alvian.web.id`
- Binding: `127.0.0.1` (localhost only, secure)
- Environment: `production`

**Production Architecture:**
```
Internet → Cloudflare → Nginx Docker (port 6002)
                            ↓
                ┌───────────┴──────────┐
                ↓                      ↓
         127.0.0.1:6003          127.0.0.1:6001
         (Web Server)            (API Server)
```

---

### **Production (Local Testing):**

Use this when you want to **test production configuration** on your **local laptop** before deploying to the server.

```bash
# Generate config for production local testing
npm run config:prod.local

# Start production servers (local testing mode)
npm run start:prod.local

# Or manually:
node generate-config.js prod.local
bash start-prod-local.sh
```

**Production Local Settings:**
- Web Server: `http://localhost:6003` (accessible locally)
- API Server: `http://localhost:6001` (accessible locally)
- Binding: `0.0.0.0` (accessible from local machine)
- Environment: `production`
- **Use Case:** Testing production config before server deployment

**Key Differences from `env.prod.yaml`:**
```diff
# env.prod.yaml (for server):
- host: "127.0.0.1"  # Only localhost
- baseURL: "https://rumah.alvian.web.id"

# env.prod.local.yaml (for local testing):
+ host: "0.0.0.0"  # Allow local access
+ baseURL: "http://localhost:6003"
```

**⚠️ Important:** `env.prod.local.yaml` is **NOT for production server deployment**! It's only for testing production settings on your local machine.

---

## 🔄 Switching Environments

### **From Dev to Prod:**
```bash
# Stop dev servers
npm run stop

# Generate prod config
npm run config:prod

# Start prod servers
npm run start:prod
```

### **From Prod to Dev:**
```bash
# Stop prod servers
npm run stop

# Generate dev config
npm run config:dev

# Start dev servers
npm run start:dev
```

---

## 🛠️ Customization

### **Temporary Override (Not Committed):**

Create `env.yaml` for local-only overrides:

```bash
cp env.dev.yaml env.yaml
nano env.yaml  # Edit as needed
npm run config  # Will use env.yaml
```

This file is **gitignored** and won't be committed.

---

### **Per-Environment Local Override:**

Create environment-specific local overrides:

```bash
cp env.dev.yaml env.dev.local.yaml
nano env.dev.local.yaml  # Your local changes
node generate-config.js dev.local
```

Pattern: `env.*.local.yaml` files are **gitignored**.

---

## 📋 Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm run config` | Generate config from `env.yaml` (default) |
| `npm run config:dev` | Generate config from `env.dev.yaml` |
| `npm run config:prod` | Generate config from `env.prod.yaml` |
| `npm run config:prod.local` | Generate config from `env.prod.local.yaml` |
| `npm run start:dev` | Start development environment |
| `npm run start:prod` | Start production environment (server only) |
| `npm run start:prod.local` | Start production config (local testing) |
| `npm run build:dev` | Build for development |
| `npm run build:prod` | Build for production |
| `npm run build:prod.local` | Build for production (local testing) |
| `npm run stop` | Stop all services |
| `npm run status` | Check service status |

---

## 🔐 Security Best Practices

### **Development:**
- ✅ Bind to `0.0.0.0` for local testing
- ✅ Use `localhost` URLs
- ✅ Can commit config to git

### **Production:**
- ✅ Bind to `127.0.0.1` (localhost only)
- ✅ Use HTTPS public domain
- ✅ Never expose internal ports to internet
- ✅ Use Nginx reverse proxy
- ✅ Update sensitive values in production (don't commit production secrets)

---

## 🐳 Docker Setup (Production Only)

**Start Nginx Docker Container:**

```bash
# From project root
docker-compose -f docker-compose.nginx.yml up -d

# Check status
docker-compose -f docker-compose.nginx.yml ps

# View logs
docker-compose -f docker-compose.nginx.yml logs -f

# Stop
docker-compose -f docker-compose.nginx.yml down
```

**Test Nginx Health:**
```bash
curl http://localhost:6002/nginx-health
```

---

## ❓ Troubleshooting

### **Production mode not working on local laptop?**

If `npm run start:prod` fails to work on your local machine:

**Problem:** Production config binds to `127.0.0.1` which may cause issues on local testing.

**Solution:** Use the prod.local configuration instead:

```bash
# Stop all services first
npm run stop

# Use prod.local for local testing
npm run start:prod.local

# This will:
# - Bind to 0.0.0.0 (accessible locally)
# - Use localhost URLs instead of production domain
# - Run on same ports as production (6003, 6001)
```

**When to use each:**
- `npm run start:dev` → Regular development (ports 6002, 6001)
- `npm run start:prod.local` → Test production config locally (ports 6003, 6001)
- `npm run start:prod` → Production server deployment only (127.0.0.1 binding)

---

### **Config not updating?**

```bash
# Regenerate config
npm run config:dev  # or config:prod or config:prod.local

# Check generated config
cat js/config.js | head -20

# Restart services
npm run stop
npm run start:dev
```

### **Port conflicts?**

```bash
# Check what's using the port
netstat -ano | findstr "6001"  # Windows
sudo netstat -tulpn | grep 6001  # Linux

# Kill process if needed
taskkill //PID <PID> //F  # Windows
kill <PID>  # Linux
```

### **Docker can't access host services?**

Make sure `host.docker.internal` works:

```bash
# Test from inside container
docker exec rumahku-nginx ping host.docker.internal

# If doesn't work, use host IP instead in nginx.conf
```

---

## 📚 Related Files

- [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) - Full production deployment guide
- [nginx.conf](nginx.conf) - Nginx reverse proxy configuration
- [docker-compose.nginx.yml](docker-compose.nginx.yml) - Docker compose for Nginx
- [CONFIG-README.md](CONFIG-README.md) - Configuration system documentation

---

**Last Updated:** 2025-10-20
