#!/bin/bash

# RumahSubsidi.id - Start API Proxy Server
# This script starts the proxy server for API requests

# Load config from env.yaml
if [ ! -f "env.yaml" ]; then
    echo "❌ env.yaml not found! Please create it first."
    exit 1
fi

# Generate config.js from env.yaml (in case it's not generated yet)
echo "🔧 Ensuring config.js is up to date..."
node generate-config.js > /dev/null 2>&1

# Extract port from env.yaml
PORT=$(grep -A2 "proxy:" env.yaml | grep "port:" | sed 's/.*port: //' | tr -d ' ')

if [ -z "$PORT" ]; then
    echo "⚠️  Port not found in env.yaml, using default 3000"
    PORT=3000
fi

echo ""
echo "🚀 Starting Proxy API Server..."
echo "   Port: $PORT"
echo "   URL: http://localhost:$PORT"
echo ""
echo "📝 Logs will be saved to: logs/api-server.log"
echo "   Press Ctrl+C to stop the server"
echo ""

# Create logs directory if not exists
mkdir -p logs

# Start proxy-server in background and save PID
node proxy-server.js 2>&1 | tee logs/api-server.log &
API_PID=$!

# Save PID to file
echo $API_PID > .api-server.pid

echo "✅ API Server started with PID: $API_PID"
echo "   To stop: kill $API_PID or run ./stop-all.sh"
echo ""

# Wait for server to start
sleep 2

# Check if server is running
if ps -p $API_PID > /dev/null; then
    echo "✅ API Server is running!"
else
    echo "❌ Failed to start API Server"
    exit 1
fi
