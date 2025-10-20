#!/bin/bash

# RumahSubsidi.id - Stop All Services
# This script stops both web server and API proxy server

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         RumahSubsidi.id - Stopping All Services          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

STOPPED_COUNT=0

# Stop Web Server
if [ -f ".web-server.pid" ]; then
    WEB_PID=$(cat .web-server.pid)
    echo "🛑 Stopping Web Server (PID: $WEB_PID)..."

    if ps -p $WEB_PID > /dev/null 2>&1; then
        kill $WEB_PID 2>/dev/null
        sleep 1

        # Force kill if still running
        if ps -p $WEB_PID > /dev/null 2>&1; then
            echo "   ⚠️  Force killing Web Server..."
            kill -9 $WEB_PID 2>/dev/null
        fi

        echo "   ✅ Web Server stopped"
        STOPPED_COUNT=$((STOPPED_COUNT + 1))
    else
        echo "   ⚠️  Web Server not running (PID: $WEB_PID not found)"
    fi

    rm .web-server.pid
else
    echo "⚠️  No Web Server PID file found"
fi

echo ""

# Stop API Server
if [ -f ".api-server.pid" ]; then
    API_PID=$(cat .api-server.pid)
    echo "🛑 Stopping API Server (PID: $API_PID)..."

    if ps -p $API_PID > /dev/null 2>&1; then
        kill $API_PID 2>/dev/null
        sleep 1

        # Force kill if still running
        if ps -p $API_PID > /dev/null 2>&1; then
            echo "   ⚠️  Force killing API Server..."
            kill -9 $API_PID 2>/dev/null
        fi

        echo "   ✅ API Server stopped"
        STOPPED_COUNT=$((STOPPED_COUNT + 1))
    else
        echo "   ⚠️  API Server not running (PID: $API_PID not found)"
    fi

    rm .api-server.pid
else
    echo "⚠️  No API Server PID file found"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Additional cleanup: Kill any http-server or node proxy-server processes
echo "🔍 Checking for orphaned processes..."

# Find and kill http-server processes
HTTP_PIDS=$(ps aux | grep "http-server" | grep -v grep | awk '{print $2}')
if [ ! -z "$HTTP_PIDS" ]; then
    echo "   Found orphaned http-server processes: $HTTP_PIDS"
    echo "   Cleaning up..."
    echo $HTTP_PIDS | xargs kill -9 2>/dev/null
    STOPPED_COUNT=$((STOPPED_COUNT + 1))
fi

# Find and kill proxy-server processes
PROXY_PIDS=$(ps aux | grep "proxy-server.js" | grep -v grep | awk '{print $2}')
if [ ! -z "$PROXY_PIDS" ]; then
    echo "   Found orphaned proxy-server processes: $PROXY_PIDS"
    echo "   Cleaning up..."
    echo $PROXY_PIDS | xargs kill -9 2>/dev/null
    STOPPED_COUNT=$((STOPPED_COUNT + 1))
fi

echo ""

# Extract ports from env.yaml for additional cleanup
if [ -f "env.yaml" ]; then
    WEB_PORT=$(grep -A2 "web:" env.yaml | grep "port:" | sed 's/.*port: //' | tr -d ' ')
    API_PORT=$(grep -A2 "proxy:" env.yaml | grep "port:" | sed 's/.*port: //' | tr -d ' ')

    if [ -z "$WEB_PORT" ]; then WEB_PORT=6000; fi
    if [ -z "$API_PORT" ]; then API_PORT=6001; fi

    echo "🔍 Checking ports..."

    # Check if ports are still in use (Windows compatible)
    if command -v netstat > /dev/null; then
        WEB_PORT_PID=$(netstat -ano | grep ":$WEB_PORT" | grep "LISTENING" | awk '{print $NF}' | head -1)
        API_PORT_PID=$(netstat -ano | grep ":$API_PORT" | grep "LISTENING" | awk '{print $NF}' | head -1)

        if [ ! -z "$WEB_PORT_PID" ]; then
            echo "   ⚠️  Port $WEB_PORT still in use by PID: $WEB_PORT_PID"
            echo "   Run: taskkill //PID $WEB_PORT_PID //F"
        else
            echo "   ✅ Port $WEB_PORT is free"
        fi

        if [ ! -z "$API_PORT_PID" ]; then
            echo "   ⚠️  Port $API_PORT still in use by PID: $API_PORT_PID"
            echo "   Run: taskkill //PID $API_PORT_PID //F"
        else
            echo "   ✅ Port $API_PORT is free"
        fi
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $STOPPED_COUNT -gt 0 ]; then
    echo "✅ Stopped $STOPPED_COUNT service(s)"
else
    echo "ℹ️  No running services found"
fi

echo ""
echo "To start services again, run: ./start-all.sh"
echo ""
