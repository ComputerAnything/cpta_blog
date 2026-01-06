#!/bin/bash
# Blog Health Check Script - Lightweight version for blog monitoring
# Checks container health, disk space, and blog accessibility
# Usage: bash monitoring.sh

# Note: Do NOT use 'set -e' - this is a monitoring script
# It should report all checks, not exit early on failures

APP_DIR="/opt/cpta_blog"
COMPOSE_FILE="docker-compose.prod.yml"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Thresholds (less strict than cpta_app - it's just a blog!)
DISK_THRESHOLD=85
MEMORY_THRESHOLD=90

echo -e "${BLUE}========================================="
echo "Blog Health Check"
echo "=========================================${NC}"
echo "Time: $(date)"
echo ""

# Track overall health
HEALTH_OK=true

# ============================================================================
# 1. Check Docker Containers
# ============================================================================
echo -e "${YELLOW}[1/3] Docker Services:${NC}"
if [ -f "$APP_DIR/$COMPOSE_FILE" ]; then
    cd $APP_DIR

    # Get container status
    RUNNING=$(docker compose -f $COMPOSE_FILE ps --services --filter "status=running" | wc -l)
    TOTAL=$(docker compose -f $COMPOSE_FILE ps --services | wc -l)

    echo "Containers: $RUNNING/$TOTAL running"
    echo ""

    # Show detailed status
    docker compose -f $COMPOSE_FILE ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
    echo ""

    # Check each service
    SERVICES=$(docker compose -f $COMPOSE_FILE ps --services)
    for service in $SERVICES; do
        STATUS=$(docker compose -f $COMPOSE_FILE ps $service --format "{{.Status}}")
        if echo "$STATUS" | grep -q "Up"; then
            if echo "$STATUS" | grep -q "healthy"; then
                echo -e "${GREEN}✓ $service: healthy${NC}"
            elif echo "$STATUS" | grep -q "unhealthy"; then
                echo -e "${RED}✗ $service: unhealthy${NC}"
                HEALTH_OK=false
            else
                echo -e "${YELLOW}⚠ $service: running (no health check)${NC}"
            fi
        else
            echo -e "${RED}✗ $service: not running${NC}"
            HEALTH_OK=false
        fi
    done

    if [ "$RUNNING" -ne "$TOTAL" ]; then
        HEALTH_OK=false
    fi
else
    echo -e "${RED}✗ Docker Compose file not found${NC}"
    HEALTH_OK=false
fi
echo ""

# ============================================================================
# 2. Check Disk Space
# ============================================================================
echo -e "${YELLOW}[2/3] Disk Space:${NC}"
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')

if [ "$DISK_USAGE" -gt "$DISK_THRESHOLD" ]; then
    echo -e "${RED}✗ Root partition: ${DISK_USAGE}% (threshold: ${DISK_THRESHOLD}%)${NC}"
    HEALTH_OK=false
else
    echo -e "${GREEN}✓ Root partition: ${DISK_USAGE}%${NC}"
fi

# Show disk usage details
df -h / | grep -E '(Filesystem|/$)'
echo ""

# Check backup directory size
if [ -d "/opt/backups/cpta_blog" ]; then
    BACKUP_SIZE=$(du -sh /opt/backups/cpta_blog 2>/dev/null | cut -f1)
    BACKUP_COUNT=$(ls -1 /opt/backups/cpta_blog/*.tar.gz 2>/dev/null | wc -l)
    echo "Backups: $BACKUP_COUNT files ($BACKUP_SIZE)"
fi
echo ""

# ============================================================================
# 3. Check Blog Accessibility
# ============================================================================
echo -e "${YELLOW}[3/3] Blog Accessibility:${NC}"

# Check if blog responds (via Cloudflare Tunnel)
BLOG_URL="https://blog.computeranything.dev"

if curl -f -s -m 10 "$BLOG_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Blog is accessible: $BLOG_URL${NC}"

    # Check response time
    RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$BLOG_URL" 2>/dev/null)
    echo "  Response time: ${RESPONSE_TIME}s"
else
    echo -e "${RED}✗ Blog is not accessible: $BLOG_URL${NC}"
    echo "  Check Cloudflare Tunnel status"
    HEALTH_OK=false
fi
echo ""

# ============================================================================
# Optional: Memory Check (lightweight - only if needed)
# ============================================================================
# Uncomment if you want memory monitoring:
# echo -e "${YELLOW}Memory Usage:${NC}"
# MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')
# if [ "$MEMORY_USAGE" -gt "$MEMORY_THRESHOLD" ]; then
#     echo -e "${RED}✗ Memory: ${MEMORY_USAGE}% (threshold: ${MEMORY_THRESHOLD}%)${NC}"
#     HEALTH_OK=false
# else
#     echo -e "${GREEN}✓ Memory: ${MEMORY_USAGE}%${NC}"
# fi
# free -h | grep Mem
# echo ""

# ============================================================================
# Summary
# ============================================================================
echo -e "${BLUE}=========================================${NC}"
if [ "$HEALTH_OK" = true ]; then
    echo -e "${GREEN}✓ All health checks passed${NC}"
    echo -e "${BLUE}=========================================${NC}"
    exit 0
else
    echo -e "${RED}✗ Some health checks failed${NC}"
    echo -e "${BLUE}=========================================${NC}"
    echo ""
    echo "Recommended actions:"
    echo "  1. Check container logs: docker compose -f $COMPOSE_FILE logs"
    echo "  2. Restart services if needed: docker compose -f $COMPOSE_FILE restart"
    echo "  3. Check Cloudflare Tunnel: docker compose -f $COMPOSE_FILE logs cloudflared"
    exit 1
fi
