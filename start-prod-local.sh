#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  RumahSubsidi.id - Starting PRODUCTION (Local Testing)   ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Check if env.prod.local.yaml exists
if [ ! -f "env.prod.local.yaml" ]; then
    echo "❌ env.prod.local.yaml not found!"
    echo "   This script is for testing production config on your local machine."
    echo "   For actual development, use: npm run start:dev"
    echo "   For server deployment, use: npm run start:prod"
    exit 1
fi

# Set environment variable for prod.local
export ENV=prod.local

# Generate config.js from env.prod.local.yaml
echo "🔧 Step 1: Generating config.js from env.prod.local.yaml..."
node generate-config.js prod.local

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate config"
    exit 1
fi

# Start API Server (prod.local mode)
echo ""
echo "🔧 Step 2: Starting API Proxy Server (PRODUCTION - LOCAL TESTING)..."
echo "   Binding to: 0.0.0.0:6001 (accessible from local machine)"
ENV=prod.local bash start-api.sh &
sleep 3

# Start Web Server (prod.local mode)
echo ""
echo "🔧 Step 3: Starting Web Server (PRODUCTION - LOCAL TESTING)..."
echo "   Binding to: 0.0.0.0:6003 (accessible from local machine)"
ENV=prod.local bash start-web.sh &
sleep 3

WEB_PORT=$(grep -A2 "web:" env.prod.local.yaml | grep "port:" | sed 's/.*port: *//' | sed 's/ *#.*//' | tr -d ' ')
API_PORT=$(grep -A2 "proxy:" env.prod.local.yaml | grep "port:" | sed 's/.*port: *//' | sed 's/ *#.*//' | tr -d ' ')

echo ""
echo "✅ All PRODUCTION (Local Testing) services started successfully!"
echo ""
echo "📍 Service URLs (LOCAL TESTING):"
echo "   🌐 Web Server:  http://localhost:$WEB_PORT"
echo "   🔌 API Server:  http://localhost:$API_PORT"
echo ""
echo "📝 Logs:"
echo "   Web Server:  logs/web-server.log"
echo "   API Server:  logs/api-server.log"
echo ""
echo "ℹ️  Environment:"
echo "   This is PRODUCTION config running on LOCAL machine"
echo "   Binds to 0.0.0.0 (all interfaces) for local access"
echo "   Uses localhost URLs instead of production domain"
echo ""
echo "🛑 To stop all services, run: ./stop-all.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏳ Services are running... Press Ctrl+C to stop"
