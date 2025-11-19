#!/bin/bash

# 🔥 Firebase Setup Automation Script
# Este script automatiza o máximo possível do setup do Firebase

set -e  # Exit on error

echo "🔥 Firebase CRM Setup Script"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
echo "📦 Checking Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}Firebase CLI not found. Installing...${NC}"
    npm install -g firebase-tools
    echo -e "${GREEN}✅ Firebase CLI installed${NC}"
else
    echo -e "${GREEN}✅ Firebase CLI already installed${NC}"
fi

# Login to Firebase
echo ""
echo "🔐 Firebase Login"
echo "A browser window will open for authentication..."
firebase login

# List projects
echo ""
echo "📋 Your Firebase Projects:"
firebase projects:list

# Ask for project selection
echo ""
read -p "Enter your Firebase Project ID (or press Enter to create a new one): " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo ""
    read -p "Enter a name for your new Firebase project: " PROJECT_NAME
    echo -e "${YELLOW}Creating new Firebase project...${NC}"
    echo -e "${YELLOW}⚠️  You'll need to create the project manually in the Firebase Console${NC}"
    echo -e "${YELLOW}⚠️  Then run this script again with the project ID${NC}"
    echo ""
    echo "👉 Go to: https://console.firebase.google.com"
    exit 0
fi

# Use the project
echo ""
echo "🎯 Using Firebase project: $PROJECT_ID"
firebase use "$PROJECT_ID"

# Initialize Firebase (if not already initialized)
if [ ! -f ".firebaserc" ]; then
    echo ""
    echo "🚀 Initializing Firebase..."
    firebase init
else
    echo -e "${GREEN}✅ Firebase already initialized${NC}"
fi

# Install Functions dependencies
echo ""
echo "📦 Installing Cloud Functions dependencies..."
cd functions
npm install
cd ..
echo -e "${GREEN}✅ Functions dependencies installed${NC}"

# Create .env file
echo ""
echo "🔧 Setting up environment variables..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env file with your Firebase credentials${NC}"
    echo "   You can get these from: https://console.firebase.google.com"
    echo "   Project Settings > General > Your apps > Web app"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Deploy Firestore rules
echo ""
read -p "Deploy Firestore Security Rules? (y/n): " DEPLOY_RULES
if [ "$DEPLOY_RULES" = "y" ]; then
    echo "🛡️  Deploying Firestore Security Rules..."
    firebase deploy --only firestore:rules
    echo -e "${GREEN}✅ Security Rules deployed${NC}"
fi

# Deploy Firestore indexes
echo ""
read -p "Deploy Firestore Indexes? (y/n): " DEPLOY_INDEXES
if [ "$DEPLOY_INDEXES" = "y" ]; then
    echo "📊 Deploying Firestore Indexes..."
    firebase deploy --only firestore:indexes
    echo -e "${GREEN}✅ Indexes deployed (may take a few minutes to build)${NC}"
fi

# Deploy Storage rules
echo ""
read -p "Deploy Storage Rules? (y/n): " DEPLOY_STORAGE
if [ "$DEPLOY_STORAGE" = "y" ]; then
    echo "📁 Deploying Storage Rules..."
    firebase deploy --only storage
    echo -e "${GREEN}✅ Storage Rules deployed${NC}"
fi

# Build frontend
echo ""
read -p "Build frontend? (y/n): " BUILD_FRONTEND
if [ "$BUILD_FRONTEND" = "y" ]; then
    echo "🏗️  Building frontend..."
    npm install
    npm run build
    echo -e "${GREEN}✅ Frontend built${NC}"
fi

# Deploy Functions
echo ""
read -p "Deploy Cloud Functions? (y/n) [Requires Blaze Plan]: " DEPLOY_FUNCTIONS
if [ "$DEPLOY_FUNCTIONS" = "y" ]; then
    echo "⚡ Deploying Cloud Functions..."
    firebase deploy --only functions
    echo -e "${GREEN}✅ Functions deployed${NC}"
fi

# Deploy Hosting
echo ""
read -p "Deploy to Firebase Hosting? (y/n): " DEPLOY_HOSTING
if [ "$DEPLOY_HOSTING" = "y" ]; then
    echo "🌐 Deploying to Firebase Hosting..."
    firebase deploy --only hosting
    echo -e "${GREEN}✅ Hosting deployed${NC}"
    echo ""
    echo "🎉 Your app is live at:"
    firebase hosting:sites:list
fi

# Summary
echo ""
echo "=============================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=============================="
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env file with your Firebase credentials"
echo "2. Create your first user at /login (signup)"
echo "3. Make that user admin in Firestore Console:"
echo "   Firestore → users → [user_id] → role: 'admin'"
echo ""
echo "📚 Documentation:"
echo "   - DEPLOYMENT.md  - Full deployment guide"
echo "   - WORKFLOWS.md   - Workflow system guide"
echo "   - ARCHITECTURE.md - System architecture"
echo ""
echo "🚀 Happy coding!"
