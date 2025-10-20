# Configuration Management - RumahSubsidi.id

## 📋 Overview

This project uses a centralized configuration system with `env.yaml` that automatically generates JavaScript config files for both server and browser.

## 🗂️ Files Structure

```
├── env.yaml                    # Main configuration file (NEVER commit to git!)
├── env.yaml.example            # Template for env.yaml
├── generate-config.js          # Script to convert env.yaml → js/config.js
├── js/config.js                # Auto-generated (from env.yaml)
├── proxy-server.js             # Reads config from env.yaml
├── start-all.sh                # Start both web & API servers
├── start-web.sh                # Start web server only
├── start-api.sh                # Start API proxy server only
├── stop-all.sh                 # Stop all running servers
└── status.sh                   # Check status of all services
```

## 🚀 Quick Start

### 1. Setup Configuration

```bash
# Copy example config
cp env.yaml.example env.yaml

# Edit env.yaml with your settings
nano env.yaml  # or use your favorite editor
```

### 2. Generate Config File

```bash
# Generate js/config.js from env.yaml
npm run config

# or
node generate-config.js
```

### 3. Start Application

```bash
# Start everything (web server + API server)
npm start

# or manually
bash start-all.sh
```

### 4. Stop Application

```bash
# Stop all services
npm run stop

# or manually
bash stop-all.sh
```

## ⚙️ Configuration Options

Edit `env.yaml` to configure:

### Application Info
```yaml
app:
  name: "RumahSubsidi.id"
  version: "1.0.0"
  environment: "development"  # development | production
```

### Server Ports
```yaml
server:
  web:
    port: 5000
    baseURL: "http://localhost:5000"
  proxy:
    port: 3000
    baseURL: "http://localhost:3000"
```

### API Configuration
```yaml
api:
  sikumbang:
    baseURL: "https://sikumbang.tapera.go.id"
    timeout: 30000
  nominatim:
    baseURL: "https://nominatim.openstreetmap.org"
    userAgent: "RumahSubsidi.id/1.0"
```

### Cache Settings
```yaml
cache:
  ttl: 300000  # 5 minutes in milliseconds
  geolocation:
    ttl: 86400000  # 24 hours
```

## 📝 NPM Scripts

```bash
npm run config      # Generate config.js from env.yaml
npm start           # Start all services (web + API)
npm run start:web   # Start web server only
npm run start:api   # Start API server only
npm run stop        # Stop all services
npm run status      # Check status of all services
npm run build       # Generate config + build
```

## 🔧 How It Works

### 1. Configuration Flow

```
┌─────────────┐
│  env.yaml   │ (You edit this)
└──────┬──────┘
       │
       ↓ (run: node generate-config.js)
┌─────────────┐
│js/config.js │ (Auto-generated JavaScript)
└──────┬──────┘
       │
       ├─→ Browser (index.html, search.html, detail.html)
       └─→ Server (proxy-server.js reads env.yaml directly)
```

### 2. Browser Usage

All HTML files load `js/config.js` FIRST:

```html
<!-- Load Configuration First -->
<script src="js/config.js"></script>

<!-- Then your app scripts -->
<script src="js/script.js"></script>
```

In JavaScript files, use `APP_CONFIG`:

```javascript
// Access configuration
const apiURL = APP_CONFIG.api.sikumbang.baseURL;
const proxyURL = APP_CONFIG.server.proxy.baseURL;
const cacheTTL = APP_CONFIG.cache.ttl;
```

### 3. Server Usage

`proxy-server.js` reads `env.yaml` directly:

```javascript
const CONFIG = yaml.load(fs.readFileSync('env.yaml', 'utf8'));
const PORT = CONFIG.server.proxy.port;
```

## 🔐 Security

**IMPORTANT:**

- ✅ `env.yaml` is in `.gitignore` - NEVER commit it!
- ✅ Use `env.yaml.example` as template for team members
- ✅ Add sensitive data (API keys, secrets) to `env.yaml` only
- ✅ `js/config.js` is auto-generated - don't edit manually

## 🌍 Production Deployment

For production, update `env.yaml`:

```yaml
app:
  environment: "production"

server:
  web:
    baseURL: "https://rumahsubsidi.id"
  proxy:
    baseURL: "https://api.rumahsubsidi.id"
```

Then regenerate config:

```bash
npm run build
```

## 📊 Monitoring Logs

Logs are saved in `logs/` directory:

```bash
# View web server logs
tail -f logs/web-server.log

# View API server logs
tail -f logs/api-server.log
```

## 🐛 Troubleshooting

### Check service status

```bash
# Check if services are running
npm run status

# Output shows:
# - Which services are running/stopped
# - Port numbers and PIDs
# - Recent log entries
# - URLs to access services
```

### Config not updating?

```bash
# Regenerate config
npm run config

# Restart servers
npm run stop
npm start
```

### Port already in use?

```bash
# Check which services are running
npm run status

# Stop all services
npm run stop

# Or manually kill
netstat -ano | findstr ":6000"
netstat -ano | findstr ":6001"
taskkill //PID <PID_NUMBER> //F
```

### Scripts not executable?

```bash
# Make scripts executable (Git Bash/Linux/Mac)
chmod +x *.sh
```

## 📚 Additional Resources

- Main README: [README.md](README.md)
- Proxy Setup: [PROXY-SETUP.md](PROXY-SETUP.md)
- Changelog: [CHANGELOG.md](CHANGELOG.md)

---

**Last Updated:** 2025-10-20
