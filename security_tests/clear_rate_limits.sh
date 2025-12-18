#!/bin/bash
# Helper script to clear rate limits from Redis after testing
# Use this after running rate limit security tests

# Get Redis password from .env file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../backend/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env file not found at $ENV_FILE"
    exit 1
fi

REDIS_PASSWORD=$(grep "^REDIS_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2)

if [ -z "$REDIS_PASSWORD" ]; then
    echo "❌ Error: REDIS_PASSWORD not found in .env file"
    echo "   Add REDIS_PASSWORD to your .env file"
    exit 1
fi

echo "🔍 Checking Redis connection..."
if ! docker compose -f ../docker-compose.staging.yml exec -T redis redis-cli -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
    echo "❌ Cannot connect to Redis. Is Docker running?"
    echo "   Try: cd .. && docker compose -f docker-compose.staging.yml up -d"
    exit 1
fi

echo "✅ Connected to Redis"
echo ""

# Show how many keys exist
KEY_COUNT=$(docker compose -f ../docker-compose.staging.yml exec -T redis redis-cli -a "$REDIS_PASSWORD" DBSIZE 2>/dev/null | grep -o '[0-9]*')
echo "📊 Current Redis keys: $KEY_COUNT"
echo ""

# Ask for confirmation
read -p "❓ Clear all rate limits? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "❌ Cancelled"
    exit 0
fi

# Clear Redis database
echo ""
echo "🗑️  Clearing Redis database..."
docker compose -f ../docker-compose.staging.yml exec -T redis redis-cli -a "$REDIS_PASSWORD" FLUSHDB > /dev/null 2>&1

echo ""
echo "✅ Redis cleared successfully!"
echo ""
echo "🎉 All rate limits have been cleared!"
echo "   You can now test your endpoints again."
