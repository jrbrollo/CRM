#!/bin/bash

# 🚀 Full Deployment Script
# Builds and deploys everything to Firebase

set -e

echo "🚀 Firebase Full Deployment"
echo "============================"

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase"
    echo "Run: firebase login"
    exit 1
fi

# Get current project
PROJECT=$(firebase use | grep "active project" | awk '{print $NF}')
echo ""
echo "📋 Current project: $PROJECT"
read -p "Continue with this project? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Cancelled."
    exit 0
fi

# Build frontend
echo ""
echo "🏗️  Building frontend..."
npm run build

# Build functions
echo ""
echo "⚡ Building functions..."
cd functions
npm run build
cd ..

# Deploy everything
echo ""
echo "🚀 Deploying to Firebase..."
firebase deploy

# Show deployment info
echo ""
echo "============================"
echo "✅ Deployment Complete!"
echo "============================"
echo ""
echo "🌐 Your app is live!"
echo ""
firebase hosting:sites:list
echo ""
echo "📊 Check status:"
echo "   firebase functions:list"
echo "   firebase hosting:sites:list"
echo ""
echo "📝 View logs:"
echo "   firebase functions:log"
echo ""
