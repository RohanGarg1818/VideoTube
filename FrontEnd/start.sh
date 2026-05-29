#!/bin/bash

# VideoTube Frontend & Backend Starter Script
# This script ensures the frontend runs on 8080 and backend on 8000

echo "==============================================="
echo "VideoTube Frontend Setup"
echo "==============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the FrontEnd directory."
    exit 1
fi

# Kill any existing processes on ports 8080 and 8000
echo "Cleaning up existing processes..."
lsof -i :8080 -t | xargs kill -9 2>/dev/null || true
lsof -i :8000 -t | xargs kill -9 2>/dev/null || true

sleep 1

echo ""
echo "Starting Frontend on port 8080..."
echo "Backend should be running on port 8000"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the dev server
npm run dev

echo ""
