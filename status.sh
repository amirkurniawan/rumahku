#!/bin/bash

# RumahSubsidi.id - Check Status of All Services
# This script checks if web server and API server are running

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         RumahSubsidi.id - Service Status Check           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Load configuration
if [ ! -f "env.yaml" ]; then
    echo "⚠️  env.yaml not found!"
    echo ""
    WEB_PORT=6000
    API_PORT=6001
else
    # Extract ports from env.yaml
    WEB_PORT=$(grep -A2 "web:" env.yaml | grep "port:" | sed 's/.*port: //' | tr -d ' ')
    API_PORT=$(grep -A2 "proxy:" env.yaml | grep "port:" | sed 's/.*port: //' | tr -d ' ')

    if [ -z "$WEB_PORT" ]; then WEB_PORT=6000; fi
    if [ -z "$API_PORT" ]; then API_PORT=6001; fi
fi

echo "📊 Configuration:"
echo "   Web Server Port:  $WEB_PORT"
echo "   API Server Port:  $API_PORT"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to check port status
check_port() {
    local PORT=$1
    local NAME=$2

    # Check if port is in use (Windows compatible)
    if command -v netstat > /dev/null; then
        PORT_PID=$(netstat -ano | grep ":$PORT" | grep "LISTENING" | awk '{print $NF}' | head -1)

        if [ ! -z "$PORT_PID" ]; then
            echo "✅ $NAME is RUNNING"
            echo "   Port: $PORT"
            echo "   PID:  $PORT_PID"

            # Try to get process name (Windows)
            if command -v tasklist > /dev/null; then
                PROCESS_NAME=$(tasklist //FI "PID eq $PORT_PID" //FO CSV //NH 2>/dev/null | cut -d',' -f1 | tr -d '"')
                if [ ! -z "$PROCESS_NAME" ]; then
                    echo "   Process: $PROCESS_NAME"
                fi
            fi

            # Check if there's a PID file
            if [ "$NAME" = "Web Server" ] && [ -f ".web-server.pid" ]; then
                SAVED_PID=$(cat .web-server.pid)
                if [ "$PORT_PID" != "$SAVED_PID" ]; then
                    echo "   ⚠️  Warning: PID mismatch (saved: $SAVED_PID, actual: $PORT_PID)"
                fi
            fi

            if [ "$NAME" = "API Server" ] && [ -f ".api-server.pid" ]; then
                SAVED_PID=$(cat .api-server.pid)
                if [ "$PORT_PID" != "$SAVED_PID" ]; then
                    echo "   ⚠️  Warning: PID mismatch (saved: $SAVED_PID, actual: $PORT_PID)"
                fi
            fi

            return 0
        else
            echo "❌ $NAME is NOT RUNNING"
            echo "   Port: $PORT (not in use)"

            # Check if PID file exists but process is dead
            if [ "$NAME" = "Web Server" ] && [ -f ".web-server.pid" ]; then
                SAVED_PID=$(cat .web-server.pid)
                echo "   ⚠️  Found stale PID file: $SAVED_PID"
                echo "   Run ./stop-all.sh to cleanup"
            fi

            if [ "$NAME" = "API Server" ] && [ -f ".api-server.pid" ]; then
                SAVED_PID=$(cat .api-server.pid)
                echo "   ⚠️  Found stale PID file: $SAVED_PID"
                echo "   Run ./stop-all.sh to cleanup"
            fi

            return 1
        fi
    else
        echo "⚠️  Cannot check $NAME status (netstat not found)"
        return 2
    fi
}

# Check Web Server
check_port $WEB_PORT "Web Server"
WEB_STATUS=$?

echo ""

# Check API Server
check_port $API_PORT "API Server"
API_STATUS=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check logs
echo "📝 Recent Logs:"
echo ""

if [ -f "logs/web-server.log" ]; then
    echo "   Web Server Log (last 3 lines):"
    tail -3 logs/web-server.log | sed 's/^/      /'
    echo ""
else
    echo "   ⚠️  No web server log found"
    echo ""
fi

if [ -f "logs/api-server.log" ]; then
    echo "   API Server Log (last 3 lines):"
    tail -3 logs/api-server.log | sed 's/^/      /'
    echo ""
else
    echo "   ⚠️  No API server log found"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
echo "📌 Summary:"

if [ $WEB_STATUS -eq 0 ] && [ $API_STATUS -eq 0 ]; then
    echo "   ✅ All services are RUNNING"
    echo ""
    echo "   🌐 Web: http://localhost:$WEB_PORT"
    echo "   🔌 API: http://localhost:$API_PORT"
    echo ""
    echo "   To stop: ./stop-all.sh"
    exit 0
elif [ $WEB_STATUS -eq 0 ] || [ $API_STATUS -eq 0 ]; then
    echo "   ⚠️  Some services are RUNNING, some are NOT"
    echo ""
    if [ $WEB_STATUS -eq 0 ]; then
        echo "   ✅ Web: http://localhost:$WEB_PORT"
    else
        echo "   ❌ Web: Not running"
    fi
    if [ $API_STATUS -eq 0 ]; then
        echo "   ✅ API: http://localhost:$API_PORT"
    else
        echo "   ❌ API: Not running"
    fi
    echo ""
    echo "   To start all: ./start-all.sh"
    exit 1
else
    echo "   ❌ All services are NOT RUNNING"
    echo ""
    echo "   To start: ./start-all.sh"
    exit 1
fi
