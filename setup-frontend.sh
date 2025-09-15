#!/bin/bash

# Frontend Setup Script for PNEU SHOP

echo "🔧 Setting up Next.js Frontend for PNEU SHOP..."

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

echo "🔍 Checking for TypeScript errors..."
npx tsc --noEmit

echo "✅ Frontend setup complete!"
echo ""
echo "🚀 To start the Next.js development server:"
echo "   npm run dev"
echo ""
echo "🌐 Frontend will be available at: http://localhost:3000"
echo ""
echo "🔗 Make sure Django backend is running on: http://localhost:8000"