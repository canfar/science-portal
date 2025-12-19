#!/bin/bash

# Docker Build Script for Science Portal
# Usage: ./docker-build.sh [dev|prod]

set -e

MODE=${1:-dev}

echo "🐳 Building Science Portal Docker images..."
echo "Mode: $MODE"
echo ""

if [ "$MODE" = "dev" ]; then
    echo "📦 Building development image (Next.js only)..."
    docker build -t science-portal:dev .
    echo "✅ Development image built successfully!"
    echo ""
    echo "To run: docker-compose -f docker-compose.dev.yml up"
elif [ "$MODE" = "prod" ]; then
    echo "📦 Building production images (Next.js + Nginx)..."

    # Build Next.js image
    docker build -t science-portal:latest .
    echo "✅ Next.js image built!"

    # Build Nginx image
    docker build -f Dockerfile.nginx -t science-portal-nginx:latest --target nginx .
    echo "✅ Nginx image built!"
    echo ""
    echo "To run: docker-compose up"
else
    echo "❌ Invalid mode: $MODE"
    echo "Usage: ./docker-build.sh [dev|prod]"
    exit 1
fi

echo ""
echo "📊 Docker images:"
docker images | grep science-portal || echo "No images found"
