#!/bin/bash

# 👑 Create Admin User Script
# Helper script to create the first admin user

echo "👑 Create Admin User"
echo "===================="
echo ""
echo "This script will help you create your first admin user."
echo ""

read -p "Enter email: " EMAIL
read -sp "Enter password: " PASSWORD
echo ""

# Check if firebase is configured
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    echo "Run setup-firebase.sh first"
    exit 1
fi

echo ""
echo "📝 Instructions to create admin user:"
echo ""
echo "1. Go to your deployed app or http://localhost:5173"
echo "2. Click 'Criar Conta' (Create Account)"
echo "3. Use these credentials:"
echo "   Email: $EMAIL"
echo "   Password: [the password you entered]"
echo "4. After signup, go to Firebase Console:"
echo "   https://console.firebase.google.com"
echo "5. Navigate to: Firestore Database"
echo "6. Find the 'users' collection"
echo "7. Find your user document (by email)"
echo "8. Edit the 'role' field to: admin"
echo ""
echo "✅ You can now login as admin!"
echo ""
echo "🔐 Default roles:"
echo "   - admin: Full access (create workflows, users, etc)"
echo "   - planner: Create/edit workflows, contacts, deals"
echo "   - viewer: Read-only access"
echo ""
