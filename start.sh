#!/bin/bash

echo "=========================================="
echo "  OpsAssistant AI - SME Manufacturing"
echo "  AI-Powered Operations Assistant"
echo "=========================================="
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Start backend
echo "Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================="
echo "  Servers are starting..."
echo ""
echo "  Backend:  http://localhost:8080"
echo "  Frontend: http://localhost:3002"
echo ""
echo "  Press Ctrl+C to stop all servers"
echo "=========================================="

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
