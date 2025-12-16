#!/bin/bash
set -e  # Exit on any error

echo "🚀 Starting blog deployment..."

# Pull latest code
git pull origin main

# Build and deploy with docker-compose
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# Wait for health checks
echo "⏳ Waiting for services to be healthy..."
sleep 15

# Check container status
docker ps | grep blog

# Test tunnel connection
echo "🔍 Testing Cloudflare Tunnel..."
sleep 5
curl -f https://blog.computeranything.dev/ || echo "⚠️ Blog not accessible yet (DNS may still be propagating)"

echo "✅ Deployment complete!"
echo "🔍 Check logs with: docker compose -f docker-compose.prod.yml logs -f"
echo "📊 Check tunnel status: docker logs blog_cloudflared_prod"
