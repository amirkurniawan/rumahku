#!/bin/bash

#######################################################
# RUMAGO.id - Nginx Testing Script
# Test Nginx container and backend connectivity
#######################################################

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           RUMAGO.id - Nginx Testing Script              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FAILED_TESTS=0
PASSED_TESTS=0

# Helper function to test
test_check() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"

    echo -ne "${BLUE}Testing:${NC} $test_name ... "

    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED_TESTS++))
    fi
}

# Test 1: Docker is running
echo -e "${BLUE}━━━ Docker Tests ━━━${NC}"
test_check "Docker daemon" "docker info"
test_check "Docker Compose" "docker compose version"
echo ""

# Test 2: Container status
echo -e "${BLUE}━━━ Container Tests ━━━${NC}"
test_check "Container exists" "docker ps -a --format '{{.Names}}' | grep -q '^rumahku-nginx$'"
test_check "Container running" "docker ps --format '{{.Names}}' | grep -q '^rumahku-nginx$'"
test_check "Container healthy" "docker inspect rumahku-nginx --format '{{.State.Health.Status}}' | grep -q 'healthy'"
echo ""

# Test 3: Port tests
echo -e "${BLUE}━━━ Port Tests ━━━${NC}"
test_check "Port 6002 listening" "ss -tuln | grep -q ':6002 '"
test_check "Port 6001 listening (API)" "ss -tuln | grep -q ':6001 '"
test_check "Port 6003 listening (Web)" "ss -tuln | grep -q ':6003 '"
echo ""

# Test 4: Nginx config
echo -e "${BLUE}━━━ Nginx Configuration Tests ━━━${NC}"
test_check "Nginx syntax check" "docker exec rumahku-nginx nginx -t"
test_check "Nginx master process" "docker exec rumahku-nginx ps aux | grep -q 'nginx: master'"
echo ""

# Test 5: HTTP endpoints
echo -e "${BLUE}━━━ HTTP Endpoint Tests ━━━${NC}"

# Test health endpoint
echo -ne "${BLUE}Testing:${NC} Health endpoint ... "
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6002/nginx-health 2>/dev/null)
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC} (HTTP $HEALTH_RESPONSE)"
    ((PASSED_TESTS++))
else
    echo -e "${RED}❌ FAIL${NC} (HTTP $HEALTH_RESPONSE)"
    ((FAILED_TESTS++))
fi

# Test web server (via nginx)
echo -ne "${BLUE}Testing:${NC} Web server (via Nginx) ... "
WEB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6002/ 2>/dev/null)
if [ "$WEB_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC} (HTTP $WEB_RESPONSE)"
    ((PASSED_TESTS++))
else
    echo -e "${YELLOW}⚠️  WARN${NC} (HTTP $WEB_RESPONSE) - Backend might not be running"
fi

# Test API endpoint (via nginx)
echo -ne "${BLUE}Testing:${NC} API server (via Nginx) ... "
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:6002/api/cek-subsidi \
    -H "Content-Type: application/json" \
    -d '{"nik":"1234567890123456"}' 2>/dev/null)
if [ "$API_RESPONSE" = "200" ] || [ "$API_RESPONSE" = "400" ]; then
    echo -e "${GREEN}✅ PASS${NC} (HTTP $API_RESPONSE)"
    ((PASSED_TESTS++))
else
    echo -e "${YELLOW}⚠️  WARN${NC} (HTTP $API_RESPONSE) - API might not be running"
fi

echo ""

# Test 6: Direct backend tests
echo -e "${BLUE}━━━ Backend Direct Tests ━━━${NC}"

echo -ne "${BLUE}Testing:${NC} Direct Web server (6003) ... "
DIRECT_WEB=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6003/ 2>/dev/null)
if [ "$DIRECT_WEB" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC} (HTTP $DIRECT_WEB)"
    ((PASSED_TESTS++))
else
    echo -e "${YELLOW}⚠️  WARN${NC} (HTTP $DIRECT_WEB) - Run: npm run start:prod"
fi

echo -ne "${BLUE}Testing:${NC} Direct API server (6001) ... "
DIRECT_API=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:6001/api/cek-subsidi \
    -H "Content-Type: application/json" \
    -d '{"nik":"1234567890123456"}' 2>/dev/null)
if [ "$DIRECT_API" = "200" ] || [ "$DIRECT_API" = "400" ]; then
    echo -e "${GREEN}✅ PASS${NC} (HTTP $DIRECT_API)"
    ((PASSED_TESTS++))
else
    echo -e "${YELLOW}⚠️  WARN${NC} (HTTP $DIRECT_API) - Run: npm run start:prod"
fi

echo ""

# Test 7: DNS resolution (from inside container)
echo -e "${BLUE}━━━ DNS/Network Tests ━━━${NC}"
test_check "host.docker.internal reachable" "docker exec rumahku-nginx ping -c 1 host.docker.internal"
echo ""

# Test 8: Log files
echo -e "${BLUE}━━━ Log File Tests ━━━${NC}"
test_check "Access log exists" "[ -f logs/access.log ]"
test_check "Error log exists" "[ -f logs/error.log ]"

if [ -f logs/access.log ]; then
    LOG_SIZE=$(stat -f%z logs/access.log 2>/dev/null || stat -c%s logs/access.log 2>/dev/null)
    echo -e "${BLUE}Info:${NC} Access log size: ${LOG_SIZE} bytes"
fi

echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Test Summary                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All critical tests passed!${NC}"
    echo ""
    echo "🎉 Nginx is running correctly!"
    echo ""
    echo "Next steps:"
    echo "  1. Ensure backend services are running: npm run start:prod"
    echo "  2. Configure Cloudflare DNS to point to this server"
    echo "  3. Monitor logs: docker logs -f rumahku-nginx"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check container logs: docker logs rumahku-nginx"
    echo "  2. Check nginx config: docker exec rumahku-nginx nginx -t"
    echo "  3. Restart container: docker compose -f docker-compose.nginx.yml restart"
    echo "  4. Check backend services: npm run status"
    exit 1
fi
