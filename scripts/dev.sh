#!/bin/bash

# 🔥 Start Firebase Emulators + Dev Server
# This script starts both Firebase emulators and the Vite dev server

echo "🔥 Starting Development Environment"
echo "===================================="

# Check if firebase is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not installed"
    echo "Run: npm install -g firebase-tools"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found"
    echo "Creating from .env.example..."
    cp .env.example .env
    echo "✅ Please edit .env with your Firebase credentials"
fi

# Start emulators in background
echo ""
echo "🚀 Starting Firebase Emulators..."
firebase emulators:start &
EMULATOR_PID=$!

# Wait for emulators to start
sleep 5

# Start Vite dev server
echo ""
echo "⚡ Starting Vite Dev Server..."
npm run dev &
VITE_PID=$!

echo ""
echo "===================================="
echo "✅ Development Environment Running"
echo "===================================="
echo ""
echo "📱 Frontend:  http://localhost:5173"
echo "🔥 Emulator UI: http://localhost:4000"
echo "🔥 Firestore:   http://localhost:8080"
echo "⚡ Functions:   http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Handle Ctrl+C
trap "echo '\n\n🛑 Stopping services...'; kill $EMULATOR_PID $VITE_PID; exit 0" INT

# Wait
wait
