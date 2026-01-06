#!/bin/bash
# Automated Backup Script for Blog Production Data
# Backs up Redis data, configuration files, and optionally Neon PostgreSQL database
# Usage: bash backup.sh [--upload] [--keep-uncompressed] [--include-database]
#
# NOTE: Database backups are DISABLED by default to save Neon compute hours.
# Neon provides automatic 7-day point-in-time recovery. Use --include-database
# only when you need an independent backup (e.g., before major migrations).

set -e

# Configuration
BACKUP_ROOT="/opt/backups/cpta_blog"
APP_DIR="/opt/cpta_blog"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$DATE"
RETENTION_DAYS=30

# Parse arguments
UPLOAD_TO_CLOUD=false
KEEP_UNCOMPRESSED=false
INCLUDE_DATABASE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --upload)
            UPLOAD_TO_CLOUD=true
            shift
            ;;
        --keep-uncompressed)
            KEEP_UNCOMPRESSED=true
            shift
            ;;
        --include-database)
            INCLUDE_DATABASE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: bash backup.sh [--upload] [--keep-uncompressed] [--include-database]"
            exit 1
            ;;
    esac
done

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================="
echo "Blog - Backup Script"
echo "=========================================${NC}"
echo "Time: $(date)"
echo "Backup location: $BACKUP_DIR"
echo ""

# Create backup directory structure
mkdir -p "$BACKUP_DIR"/{database,redis,config,logs}

# Track what was backed up successfully
BACKUP_SUCCESS=true

# ============================================================================
# STEP 1: PostgreSQL Database (Neon)
# ============================================================================
if [ "$INCLUDE_DATABASE" = true ]; then
    echo -e "${YELLOW}[1/6] Backing up PostgreSQL database (Neon)...${NC}"

    BACKEND_CONTAINER=$(docker compose -f $APP_DIR/docker-compose.prod.yml ps -q blog-backend 2>/dev/null)
    if [ -z "$BACKEND_CONTAINER" ]; then
        echo -e "${RED}✗ Backend container not running${NC}"
        echo "  Cannot backup database without backend container"
        BACKUP_SUCCESS=false
    else
        # Check if DATABASE_URL is set
        DB_URL_CHECK=$(docker compose -f $APP_DIR/docker-compose.prod.yml exec -T blog-backend bash -c 'echo $DATABASE_URL' 2>/dev/null | head -1)

        if [ -z "$DB_URL_CHECK" ]; then
            echo -e "${RED}✗ DATABASE_URL not set in backend container${NC}"
            BACKUP_SUCCESS=false
        else
            # Dump database using pg_dump from backend container
            echo "  Exporting database..."
            if docker compose -f $APP_DIR/docker-compose.prod.yml exec -T blog-backend bash -c "pg_dump \$DATABASE_URL" > "$BACKUP_DIR/database/database.sql" 2>/dev/null; then
                # Compress the SQL dump
                gzip "$BACKUP_DIR/database/database.sql"

                DB_SIZE=$(du -sh "$BACKUP_DIR/database/database.sql.gz" | cut -f1)
                echo -e "${GREEN}✓ Database backed up and compressed ($DB_SIZE)${NC}"

                # Verify the backup is not empty
                if [ $(stat -f%z "$BACKUP_DIR/database/database.sql.gz" 2>/dev/null || stat -c%s "$BACKUP_DIR/database/database.sql.gz") -lt 1000 ]; then
                    echo -e "${YELLOW}⚠ Warning: Database backup seems too small (< 1KB)${NC}"
                    BACKUP_SUCCESS=false
                fi
            else
                echo -e "${RED}✗ Database backup failed${NC}"
                BACKUP_SUCCESS=false
            fi
        fi
    fi
    echo ""
else
    echo -e "${BLUE}[1/6] Skipping PostgreSQL database backup (use --include-database to enable)${NC}"
    echo -e "  ${BLUE}ℹ  Neon provides automatic 7-day point-in-time recovery${NC}"
    echo -e "  ${BLUE}ℹ  Access backups at: https://console.neon.tech${NC}"
    echo ""
fi

# ============================================================================
# STEP 2: Redis Data
# ============================================================================
echo -e "${YELLOW}[2/6] Backing up Redis data...${NC}"

REDIS_CONTAINER=$(docker compose -f $APP_DIR/docker-compose.prod.yml ps -q redis 2>/dev/null)
if [ -z "$REDIS_CONTAINER" ]; then
    echo -e "${YELLOW}⚠ Redis container not running${NC}"
    echo "  Redis data will not be backed up"
else
    # Load Redis password from env
    REDIS_PASSWORD=$(grep REDIS_PASSWORD $APP_DIR/backend/.env 2>/dev/null | cut -d '=' -f2 | tr -d '"' || echo "")

    if [ -z "$REDIS_PASSWORD" ]; then
        echo -e "${YELLOW}⚠ REDIS_PASSWORD not found in .env${NC}"
    fi

    # Trigger Redis save
    echo "  Triggering Redis SAVE..."
    if [ -n "$REDIS_PASSWORD" ]; then
        docker exec $REDIS_CONTAINER redis-cli -a "$REDIS_PASSWORD" SAVE > /dev/null 2>&1 || echo "  Warning: Could not trigger Redis SAVE"
    else
        docker exec $REDIS_CONTAINER redis-cli SAVE > /dev/null 2>&1 || echo "  Warning: Could not trigger Redis SAVE"
    fi

    # Copy Redis persistence files
    if docker cp $REDIS_CONTAINER:/data/. "$BACKUP_DIR/redis/" 2>/dev/null; then
        REDIS_SIZE=$(du -sh "$BACKUP_DIR/redis" 2>/dev/null | cut -f1)
        echo -e "${GREEN}✓ Redis data backed up ($REDIS_SIZE)${NC}"
    else
        echo -e "${YELLOW}⚠ Could not copy Redis data files${NC}"
    fi
fi
echo ""

# ============================================================================
# STEP 3: Configuration Files
# ============================================================================
echo -e "${YELLOW}[3/6] Backing up configuration files...${NC}"

# Backend .env (production)
if [ -f "$APP_DIR/backend/.env" ]; then
    cp "$APP_DIR/backend/.env" "$BACKUP_DIR/config/backend.env"
    echo "  ✓ Backend .env"
fi

# Frontend .env (production)
if [ -f "$APP_DIR/frontend/.env.production" ]; then
    cp "$APP_DIR/frontend/.env.production" "$BACKUP_DIR/config/frontend.env"
    echo "  ✓ Frontend .env.production"
fi

# Docker Compose
if [ -f "$APP_DIR/docker-compose.prod.yml" ]; then
    cp "$APP_DIR/docker-compose.prod.yml" "$BACKUP_DIR/config/"
    echo "  ✓ docker-compose.prod.yml"
fi

# Cloudflare Tunnel config (blog uses Cloudflare instead of nginx)
if [ -f "$APP_DIR/deployment/cloudflared/config.yml" ]; then
    mkdir -p "$BACKUP_DIR/config/cloudflared"
    cp "$APP_DIR/deployment/cloudflared/config.yml" "$BACKUP_DIR/config/cloudflared/" 2>/dev/null || true
    echo "  ✓ Cloudflare Tunnel config"
fi

# Git commit reference
cd $APP_DIR
git rev-parse HEAD > "$BACKUP_DIR/config/git_commit.txt" 2>/dev/null || true
git log -1 --pretty=format:"%H%n%an%n%ae%n%ai%n%s" > "$BACKUP_DIR/config/git_info.txt" 2>/dev/null || true
echo "  ✓ Git commit info"

echo -e "${GREEN}✓ Configuration files backed up${NC}"
echo ""

# ============================================================================
# STEP 4: Application Logs
# ============================================================================
echo -e "${YELLOW}[4/6] Backing up application logs (last 24h)...${NC}"

# Backend logs
BACKEND_CONTAINER=$(docker compose -f $APP_DIR/docker-compose.prod.yml ps -q blog-backend 2>/dev/null)
if [ ! -z "$BACKEND_CONTAINER" ]; then
    docker logs $BACKEND_CONTAINER --since 24h > "$BACKUP_DIR/logs/backend.log" 2>&1 || true
    echo "  ✓ Backend logs (24h)"
fi

# Frontend logs
FRONTEND_CONTAINER=$(docker compose -f $APP_DIR/docker-compose.prod.yml ps -q blog-frontend 2>/dev/null)
if [ ! -z "$FRONTEND_CONTAINER" ]; then
    docker logs $FRONTEND_CONTAINER --since 24h > "$BACKUP_DIR/logs/frontend.log" 2>&1 || true
    echo "  ✓ Frontend logs (24h)"
fi

# Cloudflared logs
CLOUDFLARED_CONTAINER=$(docker compose -f $APP_DIR/docker-compose.prod.yml ps -q cloudflared 2>/dev/null)
if [ ! -z "$CLOUDFLARED_CONTAINER" ]; then
    docker logs $CLOUDFLARED_CONTAINER --since 24h > "$BACKUP_DIR/logs/cloudflared.log" 2>&1 || true
    echo "  ✓ Cloudflared logs (24h)"
fi

# Redis logs
REDIS_CONTAINER=$(docker compose -f $APP_DIR/docker-compose.prod.yml ps -q redis 2>/dev/null)
if [ ! -z "$REDIS_CONTAINER" ]; then
    docker logs $REDIS_CONTAINER --since 24h > "$BACKUP_DIR/logs/redis.log" 2>&1 || true
    echo "  ✓ Redis logs (24h)"
fi

echo -e "${GREEN}✓ Logs backed up${NC}"
echo ""

# ============================================================================
# STEP 5: Compress Backup
# ============================================================================
echo -e "${YELLOW}[5/6] Compressing backup...${NC}"

cd "$BACKUP_ROOT"
tar -czf "${DATE}.tar.gz" "$DATE" 2>/dev/null

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -sh "${DATE}.tar.gz" | cut -f1)
    echo -e "${GREEN}✓ Backup compressed ($BACKUP_SIZE)${NC}"

    # Remove uncompressed backup unless --keep-uncompressed flag
    if [ "$KEEP_UNCOMPRESSED" = false ]; then
        rm -rf "$DATE"
        echo "  ✓ Uncompressed files removed"
    else
        echo "  ✓ Uncompressed files kept (--keep-uncompressed)"
    fi
else
    echo -e "${RED}✗ Compression failed${NC}"
    BACKUP_SUCCESS=false
fi
echo ""

# ============================================================================
# STEP 6: Cleanup Old Backups
# ============================================================================
echo -e "${YELLOW}[6/6] Removing old backups (older than $RETENTION_DAYS days)...${NC}"

# Remove old compressed backups
find "$BACKUP_ROOT" -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

# Remove old uncompressed backups (if any)
find "$BACKUP_ROOT" -maxdepth 1 -type d -name "20*" -mtime +$RETENTION_DAYS -exec rm -rf {} + 2>/dev/null || true

REMAINING_BACKUPS=$(find "$BACKUP_ROOT" -name "*.tar.gz" -type f | wc -l)
echo -e "${GREEN}✓ Old backups removed ($REMAINING_BACKUPS backups remaining)${NC}"
echo ""

# ============================================================================
# Backup Verification
# ============================================================================
echo -e "${YELLOW}Verifying backup integrity...${NC}"

if [ -f "${BACKUP_ROOT}/${DATE}.tar.gz" ]; then
    if tar -tzf "${BACKUP_ROOT}/${DATE}.tar.gz" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backup archive verified (can be extracted)${NC}"
    else
        echo -e "${RED}✗ Backup archive is corrupted${NC}"
        BACKUP_SUCCESS=false
    fi
else
    echo -e "${RED}✗ Backup file not found${NC}"
    BACKUP_SUCCESS=false
fi
echo ""

# ============================================================================
# Optional: Upload to Cloud Storage
# ============================================================================
if [ "$UPLOAD_TO_CLOUD" = true ]; then
    echo -e "${YELLOW}Uploading to Google Drive...${NC}"

    if command -v rclone &> /dev/null; then
        if rclone copy "${BACKUP_ROOT}/${DATE}.tar.gz" gdrive:blog_backups/ 2>/dev/null; then
            echo -e "${GREEN}✓ Uploaded to Google Drive (blog_backups/)${NC}"

            # Clean up old backups in Google Drive (older than 30 days)
            rclone delete gdrive:blog_backups/ --min-age 30d 2>/dev/null || true

            CLOUD_COUNT=$(rclone lsf gdrive:blog_backups/ 2>/dev/null | wc -l)
            echo -e "${GREEN}✓ Google Drive cleanup complete ($CLOUD_COUNT backups in cloud)${NC}"
        else
            echo -e "${RED}✗ Failed to upload to Google Drive${NC}"
            BACKUP_SUCCESS=false
        fi
    else
        echo -e "${RED}✗ rclone not installed${NC}"
        echo "  Install: curl https://rclone.org/install.sh | sudo bash"
        BACKUP_SUCCESS=false
    fi
    echo ""
fi

# ============================================================================
# Summary
# ============================================================================
if [ "$BACKUP_SUCCESS" = true ]; then
    echo -e "${GREEN}========================================="
    echo "✓ Backup Completed Successfully!"
    echo "=========================================${NC}"
else
    echo -e "${YELLOW}========================================="
    echo "⚠ Backup Completed with Warnings"
    echo "=========================================${NC}"
fi

echo ""
echo "📦 Backup Details:"
echo "  File: ${BACKUP_ROOT}/${DATE}.tar.gz"
echo "  Size: $BACKUP_SIZE"
echo "  Created: $(date)"
echo "  Retention: $RETENTION_DAYS days"
echo ""
echo "📋 What was backed up:"
if [ "$INCLUDE_DATABASE" = true ]; then
    echo "  ✓ PostgreSQL database (Neon) - compressed SQL dump"
else
    echo "  ⏭️ PostgreSQL database (SKIPPED - use --include-database to enable)"
fi
echo "  ✓ Redis data (rate limiting, cache)"
echo "  ✓ Configuration files (.env, docker-compose, cloudflared)"
echo "  ✓ Application logs (last 24 hours)"
echo "  ✓ Git commit reference"
if [ "$UPLOAD_TO_CLOUD" = true ]; then
    echo "  ✓ Uploaded to Google Drive (blog_backups/)"
fi
echo ""
echo "🔄 To restore from this backup:"
echo "  1. Extract: tar -xzf ${BACKUP_ROOT}/${DATE}.tar.gz -C /tmp/"
if [ "$INCLUDE_DATABASE" = true ]; then
    echo "  2. Restore database: gunzip < /tmp/$DATE/database/database.sql.gz | psql \$DATABASE_URL"
fi
echo "  3. Restore Redis: docker cp /tmp/$DATE/redis/. redis_container:/data/"
echo "  4. Restore config: cp /tmp/$DATE/config/* to appropriate locations"
echo ""
echo "📖 For detailed restore instructions, see: docs/operations/BACKUPS.md"
echo ""

exit 0
