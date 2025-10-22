#!/bin/bash

#######################################################
# RUMAGO.id - Nginx Docker Deployment Script
# For CasaOS Linux Mint Server
#######################################################

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         RUMAGO.id - Nginx Docker Deployment             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: Running as root. Consider using sudo instead.${NC}"
fi

# Step 1: Check Docker
echo -e "${BLUE}━━━ Step 1: Checking Docker Installation ━━━${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found!${NC}"
    echo "Please install Docker first:"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sudo sh get-docker.sh"
    exit 1
fi

echo -e "${GREEN}✅ Docker found:${NC}"
docker --version

# Step 2: Check Docker Compose
echo ""
echo -e "${BLUE}━━━ Step 2: Checking Docker Compose ━━━${NC}"
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found!${NC}"
    echo "Docker Compose plugin is required for Docker Engine v2.0+"
    exit 1
fi

echo -e "${GREEN}✅ Docker Compose found:${NC}"
docker compose version

# Step 3: Check port 6002
echo ""
echo -e "${BLUE}━━━ Step 3: Checking Port 6002 ━━━${NC}"
if ss -tuln | grep -q ":6002 "; then
    echo -e "${YELLOW}⚠️  Port 6002 is already in use!${NC}"
    echo "Processes using port 6002:"
    ss -tulnp | grep ":6002 "
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ Port 6002 is available${NC}"
fi

# Step 4: Check required files
echo ""
echo -e "${BLUE}━━━ Step 4: Checking Required Files ━━━${NC}"

FILES=(
    "docker-compose.nginx.yml"
    "nginx.conf"
)

for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing file: $file${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Found: $file${NC}"
done

# Step 5: Create logs directory
echo ""
echo -e "${BLUE}━━━ Step 5: Creating Directories ━━━${NC}"
mkdir -p logs
chmod 755 logs
echo -e "${GREEN}✅ Logs directory created${NC}"

# Step 6: Pull latest Nginx image
echo ""
echo -e "${BLUE}━━━ Step 6: Pulling Nginx Image ━━━${NC}"
docker pull nginx:alpine
echo -e "${GREEN}✅ Nginx image pulled${NC}"

# Step 7: Stop existing container (if any)
echo ""
echo -e "${BLUE}━━━ Step 7: Stopping Existing Container ━━━${NC}"
if docker ps -a --format '{{.Names}}' | grep -q "^rumahku-nginx$"; then
    echo "Stopping existing rumahku-nginx container..."
    docker compose -f docker-compose.nginx.yml down
    echo -e "${GREEN}✅ Existing container stopped${NC}"
else
    echo -e "${YELLOW}ℹ️  No existing container found${NC}"
fi

# Step 8: Validate nginx.conf
echo ""
echo -e "${BLUE}━━━ Step 8: Validating Nginx Configuration ━━━${NC}"
docker run --rm -v "$(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro" nginx:alpine nginx -t
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors!${NC}"
    exit 1
fi

# Step 9: Start Nginx container
echo ""
echo -e "${BLUE}━━━ Step 9: Starting Nginx Container ━━━${NC}"
docker compose -f docker-compose.nginx.yml up -d

# Wait for container to be ready
echo "Waiting for container to start..."
sleep 3

# Step 10: Check container status
echo ""
echo -e "${BLUE}━━━ Step 10: Checking Container Status ━━━${NC}"
if docker ps --format '{{.Names}}' | grep -q "^rumahku-nginx$"; then
    echo -e "${GREEN}✅ Container is running!${NC}"
    echo ""
    docker ps --filter "name=rumahku-nginx" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo -e "${RED}❌ Container failed to start!${NC}"
    echo "Checking logs..."
    docker compose -f docker-compose.nginx.yml logs
    exit 1
fi

# Step 11: Health check
echo ""
echo -e "${BLUE}━━━ Step 11: Running Health Check ━━━${NC}"
sleep 2
if curl -sf http://localhost:6002/nginx-health > /dev/null; then
    echo -e "${GREEN}✅ Nginx health check passed!${NC}"
    echo "Response: $(curl -s http://localhost:6002/nginx-health)"
else
    echo -e "${YELLOW}⚠️  Health check endpoint not responding${NC}"
    echo "This is normal if backend servers (6001, 6003) are not running yet."
fi

# Step 12: Summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ✅ Deployment Successful!                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}📍 Nginx Details:${NC}"
echo "   Container: rumahku-nginx"
echo "   Port: 6002 → 80"
echo "   Image: nginx:alpine"
echo ""
echo -e "${GREEN}🌐 Access URLs:${NC}"
echo "   Local: http://localhost:6002"
echo "   Health: http://localhost:6002/nginx-health"
echo "   Public: https://rumah.alvian.web.id (via Cloudflare)"
echo ""
echo -e "${GREEN}📝 Important Next Steps:${NC}"
echo "   1. Start backend services:"
echo "      npm run start:prod"
echo ""
echo "   2. Configure Cloudflare:"
echo "      - Point DNS A record to your server IP"
echo "      - Set SSL/TLS to 'Flexible' or 'Full'"
echo "      - Allow port 6002 in firewall"
echo ""
echo "   3. Monitor logs:"
echo "      docker compose -f docker-compose.nginx.yml logs -f"
echo ""
echo -e "${GREEN}🛠️  Useful Commands:${NC}"
echo "   View logs:    docker compose -f docker-compose.nginx.yml logs -f"
echo "   Restart:      docker compose -f docker-compose.nginx.yml restart"
echo "   Stop:         docker compose -f docker-compose.nginx.yml down"
echo "   Status:       docker ps | grep rumahku-nginx"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
