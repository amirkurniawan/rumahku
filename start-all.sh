#!/bin/bash

# RumahSubsidi.id - Start All Services
# This script starts both web server and API proxy server

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         RumahSubsidi.id - Starting All Services          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if env.yaml exists
if [ ! -f "env.yaml" ]; then
    echo "❌ env.yaml not found! Please create it first."
    echo ""
    echo "Copy env.yaml.example to env.yaml and configure it:"
    echo "   cp env.yaml.example env.yaml"
    exit 1
fi

# Generate config.js from env.yaml
echo "🔧 Step 1: Generating config.js from env.yaml..."
node generate-config.js

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate config.js"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start API Server
echo "🔧 Step 2: Starting API Proxy Server..."
bash start-api.sh &
sleep 3

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start Web Server
echo "🔧 Step 3: Starting Web Server..."
bash start-web.sh &
sleep 3

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Extract ports from env.yaml
WEB_PORT=$(grep -A2 "web:" env.yaml | grep "port:" | sed 's/.*port: //' | tr -d ' ')
API_PORT=$(grep -A2 "proxy:" env.yaml | grep "port:" | sed 's/.*port: //' | tr -d ' ')

if [ -z "$WEB_PORT" ]; then WEB_PORT=6000; fi
if [ -z "$API_PORT" ]; then API_PORT=6001; fi

echo "✅ All services started successfully!"
echo ""
echo "📍 Service URLs:"
echo "   🌐 Web Server:  http://localhost:$WEB_PORT"
echo "   🔌 API Server:  http://localhost:$API_PORT"
echo ""
echo "📝 Logs:"
echo "   Web Server:  logs/web-server.log"
echo "   API Server:  logs/api-server.log"
echo ""
echo "🛑 To stop all services, run: ./stop-all.sh"
echo "   or press Ctrl+C (may require running stop-all.sh to cleanup)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait for user to stop (Ctrl+C)
echo "⏳ Services are running... Press Ctrl+C to stop"
wait
