#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║      RumahSubsidi.id - Starting DEV Environment          ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Set environment variable for dev
export ENV=dev

# Generate config.js from env.dev.yaml
echo "🔧 Step 1: Generating config.js from env.dev.yaml..."
node generate-config.js dev

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate config"
    exit 1
fi

# Start API Server (dev mode)
echo ""
echo "🔧 Step 2: Starting API Proxy Server (DEV)..."
ENV=dev bash start-api.sh &
sleep 3

# Start Web Server (dev mode)
echo ""
echo "🔧 Step 3: Starting Web Server (DEV)..."
ENV=dev bash start-web.sh &
sleep 3

WEB_PORT=$(grep -A2 "web:" env.dev.yaml | grep "port:" | sed 's/.*port: *//' | sed 's/ *#.*//' | tr -d ' ')
API_PORT=$(grep -A2 "proxy:" env.dev.yaml | grep "port:" | sed 's/.*port: *//' | sed 's/ *#.*//' | tr -d ' ')

echo ""
echo "✅ All DEV services started successfully!"
echo ""
echo "📍 Service URLs (DEVELOPMENT):"
echo "   🌐 Web Server:  http://localhost:$WEB_PORT"
echo "   🔌 API Server:  http://localhost:$API_PORT"
echo ""
echo "📝 Logs:"
echo "   Web Server:  logs/web-server.log"
echo "   API Server:  logs/api-server.log"
echo ""
echo "🛑 To stop all services, run: ./stop-all.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏳ Services are running... Press Ctrl+C to stop"
