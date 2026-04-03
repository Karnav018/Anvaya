#!/bin/bash
# Build script for Vercel

set -e  # Exit on any error

echo "🚀 Starting Anvaya build..."

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Move built files to root for Vercel
echo "📁 Moving built files to root..."
cd ..
cp -r frontend/dist/* .
cp frontend/dist/index.html ./index.html

echo "✅ Build complete!"

# List files for debugging
ls -la