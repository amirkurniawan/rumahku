#!/bin/bash

# RumahSubsidi.id - Start API Proxy Server
# This script starts the proxy server for API requests

# Get environment from ENV variable, default to 'yaml' (uses env.yaml)
ENV=${ENV:-yaml}
ENV_FILE="env.${ENV}.yaml"

# If ENV is 'yaml', use env.yaml directly
if [ "$ENV" = "yaml" ]; then
    ENV_FILE="env.yaml"
fi

# Load config from environment file
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ $ENV_FILE not found!"
    echo "   Set ENV variable: export ENV=dev or export ENV=prod"
    exit 1
fi

# Generate config.js from environment file (in case it's not generated yet)
echo "🔧 Ensuring config.js is up to date..."
if [ "$ENV" = "yaml" ]; then
    node generate-config.js > /dev/null 2>&1
else
    node generate-config.js $ENV > /dev/null 2>&1
fi

# Extract port from environment file (strip inline comments)
PORT=$(grep -A2 "proxy:" "$ENV_FILE" | grep "port:" | sed 's/.*port: *//' | sed 's/ *#.*//' | tr -d ' ')

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
