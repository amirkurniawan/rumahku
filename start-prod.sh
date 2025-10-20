#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║    RumahSubsidi.id - Starting PRODUCTION Environment     ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Check if running on server
if [ ! -f "env.prod.yaml" ]; then
    echo "❌ env.prod.yaml not found!"
    echo "   This script is for production server only."
    echo "   For development, use: npm run start:dev"
    exit 1
fi

# Set environment variable for prod
export ENV=prod

# Generate config.js from env.prod.yaml
echo "🔧 Step 1: Generating config.js from env.prod.yaml..."
node generate-config.js prod

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate config"
    exit 1
fi

# Start API Server (prod mode - bind to 127.0.0.1)
echo ""
echo "🔧 Step 2: Starting API Proxy Server (PRODUCTION)..."
echo "   Binding to: 127.0.0.1:6001 (internal only)"
ENV=prod bash start-api.sh &
sleep 3

# Start Web Server (prod mode - bind to 127.0.0.1)
echo ""
echo "🔧 Step 3: Starting Web Server (PRODUCTION)..."
echo "   Binding to: 127.0.0.1:6003 (internal only)"
ENV=prod bash start-web.sh &
sleep 3

WEB_PORT=$(grep -A2 "web:" env.prod.yaml | grep "port:" | sed 's/.*port: *//' | sed 's/ *#.*//' | tr -d ' ')
API_PORT=$(grep -A2 "proxy:" env.prod.yaml | grep "port:" | sed 's/.*port: *//' | sed 's/ *#.*//' | tr -d ' ')

echo ""
echo "✅ All PRODUCTION services started successfully!"
echo ""
echo "📍 Internal Service URLs:"
echo "   🌐 Web Server:  http://127.0.0.1:$WEB_PORT (internal)"
echo "   🔌 API Server:  http://127.0.0.1:$API_PORT (internal)"
echo ""
echo "📍 Public URL (via Nginx):"
echo "   🌐 https://rumah.alvian.web.id"
echo ""
echo "📝 Logs:"
echo "   Web Server:  logs/web-server.log"
echo "   API Server:  logs/api-server.log"
echo ""
echo "🔒 Security:"
echo "   ✅ Services bind to 127.0.0.1 (localhost only)"
echo "   ✅ Accessed via Nginx reverse proxy on port 6002"
echo "   ✅ NOT directly accessible from internet"
echo ""
echo "🛑 To stop all services, run: ./stop-all.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏳ Services are running... Press Ctrl+C to stop"
