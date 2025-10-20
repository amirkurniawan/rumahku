#!/bin/bash

# RumahSubsidi.id - Start Web Server
# This script starts the http-server for serving static files

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

# Generate config.js from environment file
if [ "$ENV" = "yaml" ]; then
    echo "🔧 Generating config.js from env.yaml..."
    node generate-config.js
else
    echo "🔧 Generating config.js from $ENV_FILE..."
    node generate-config.js $ENV
fi

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate config.js"
    exit 1
fi

# Extract port from environment file (strip inline comments)
PORT=$(grep -A2 "web:" "$ENV_FILE" | grep "port:" | sed 's/.*port: *//' | sed 's/ *#.*//' | tr -d ' ')

if [ -z "$PORT" ]; then
    echo "⚠️  Port not found in env.yaml, using default 5000"
    PORT=5000
fi

echo ""
echo "🚀 Starting Web Server..."
echo "   Port: $PORT"
echo "   URL: http://localhost:$PORT"
echo ""
echo "📝 Logs will be saved to: logs/web-server.log"
echo "   Press Ctrl+C to stop the server"
echo ""

# Create logs directory if not exists
mkdir -p logs

# Start http-server in background and save PID
npx http-server -p $PORT -c-1 2>&1 | tee logs/web-server.log &
WEB_PID=$!

# Save PID to file
echo $WEB_PID > .web-server.pid

echo "✅ Web Server started with PID: $WEB_PID"
echo "   To stop: kill $WEB_PID or run ./stop-all.sh"
echo ""

# Wait for server to start
sleep 2

# Check if server is running
if ps -p $WEB_PID > /dev/null; then
    echo "✅ Web Server is running!"
else
    echo "❌ Failed to start Web Server"
    exit 1
fi
