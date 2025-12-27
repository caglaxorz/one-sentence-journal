#!/bin/bash

# One Sentence Journal - Quick Security Setup Script
# Run this after implementing all security changes

echo "🔐 One Sentence Journal - Security Setup"
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "📝 ACTION REQUIRED:"
    echo "   Open .env and add your Firebase credentials"
    echo "   Get them from: Firebase Console → Project Settings → General"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "⚠️  Firebase CLI not found"
    echo "   Install it with: npm install -g firebase-tools"
    echo ""
else
    echo "✅ Firebase CLI installed"
    echo ""
    
    # Optionally deploy Firestore rules
    read -p "Deploy Firestore security rules now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Deploying Firestore rules..."
        firebase deploy --only firestore:rules
        echo ""
    fi
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Configure .env with your Firebase credentials"
echo "   2. Deploy Firestore rules: firebase deploy --only firestore:rules"
echo "   3. Enable Firestore Database in Firebase Console"
echo "   4. Test locally: npm run dev"
echo "   5. Build for production: npm run build"
echo ""
echo "📖 Read SECURITY_SETUP.md for detailed instructions"
echo ""
