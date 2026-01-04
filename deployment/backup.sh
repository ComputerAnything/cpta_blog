#!/bin/bash
# Blog Backup Script - Simplified version for blog-only backups
# Backs up PostgreSQL database and uploads to Google Drive
# Usage: bash backup.sh [--upload] [--retention DAYS]

set -e

# Configuration
BACKUP_ROOT="/opt/backups/blog_app"
APP_DIR="/opt/blog_app"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$DATE"
RETENTION_DAYS=30

# Parse arguments
UPLOAD_TO_CLOUD=false
REASON=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --upload)
            UPLOAD_TO_CLOUD=true
            shift
            ;;
        --retention)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        --reason)
            REASON="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: bash backup.sh [--upload] [--retention DAYS] [--reason 'description']"
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
echo "Blog Backup Script"
echo "=========================================${NC}"
echo "Time: $(date)"
echo "Backup location: $BACKUP_DIR"
if [ -n "$REASON" ]; then
    echo "Reason: $REASON"
fi
echo "Retention: $RETENTION_DAYS days"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Track success
BACKUP_SUCCESS=true

# ============================================================================
# STEP 1: PostgreSQL Database (Neon)
# ============================================================================
echo -e "${YELLOW}[1/2] Backing up PostgreSQL database...${NC}"

# Extract database URL from .env.production
DB_URL=$(grep "^DATABASE_URL=" "$APP_DIR/backend/.env.production" | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DB_URL" ]; then
    echo -e "${RED}✗ DATABASE_URL not found in .env.production${NC}"
    BACKUP_SUCCESS=false
else
    # Check if pg_dump is installed
    if ! command -v pg_dump &> /dev/null; then
        echo -e "${RED}✗ pg_dump not installed${NC}"
        echo "  Install: sudo apt install postgresql-client"
        BACKUP_SUCCESS=false
    else
        # Dump database
        echo "  Exporting database..."
        if pg_dump "$DB_URL" > "$BACKUP_DIR/database.sql" 2>/dev/null; then
            # Compress the SQL dump
            gzip "$BACKUP_DIR/database.sql"

            DB_SIZE=$(du -sh "$BACKUP_DIR/database.sql.gz" | cut -f1)
            echo -e "${GREEN}✓ Database backed up and compressed ($DB_SIZE)${NC}"

            # Verify the backup is not empty
            BACKUP_SIZE=$(stat -c%s "$BACKUP_DIR/database.sql.gz" 2>/dev/null || stat -f%z "$BACKUP_DIR/database.sql.gz")
            if [ "$BACKUP_SIZE" -lt 1000 ]; then
                echo -e "${YELLOW}⚠ Warning: Database backup seems too small (< 1KB)${NC}"
                BACKUP_SUCCESS=false
            fi
        else
            echo -e "${RED}✗ Database backup failed${NC}"
            echo "  Check that DATABASE_URL is valid and accessible"
            BACKUP_SUCCESS=false
        fi
    fi
fi
echo ""

# ============================================================================
# STEP 2: Create metadata file
# ============================================================================
echo -e "${YELLOW}[2/2] Creating backup metadata...${NC}"

cat > "$BACKUP_DIR/metadata.txt" << METADATA
Backup Date: $(date -u)
Backup Type: Manual Blog Backup
Reason: ${REASON:-Manual backup}
Retention: ${RETENTION_DAYS} days
Delete After: $(date -u -d "+${RETENTION_DAYS} days" 2>/dev/null || date -u -v+${RETENTION_DAYS}d 2>/dev/null || echo "N/A")
Triggered By: GitHub Actions
Database: PostgreSQL (Neon)
METADATA

echo -e "${GREEN}✓ Metadata created${NC}"
echo ""

# ============================================================================
# STEP 3: Create compressed archive
# ============================================================================
echo -e "${YELLOW}Creating compressed archive...${NC}"

cd "$BACKUP_ROOT"
tar -czf "${DATE}.tar.gz" "$DATE"

ARCHIVE_SIZE=$(du -sh "${DATE}.tar.gz" | cut -f1)
echo -e "${GREEN}✓ Archive created: ${DATE}.tar.gz ($ARCHIVE_SIZE)${NC}"
echo ""

# ============================================================================
# STEP 4: Upload to Google Drive (Optional)
# ============================================================================
if [ "$UPLOAD_TO_CLOUD" = true ]; then
    echo -e "${YELLOW}Uploading to Google Drive...${NC}"

    if command -v rclone &> /dev/null; then
        # Upload to Google Drive (blog backups go to a subfolder)
        if rclone copy "${BACKUP_ROOT}/${DATE}.tar.gz" gdrive:blog_backups/ 2>/dev/null; then
            echo -e "${GREEN}✓ Uploaded to Google Drive (blog_backups/)${NC}"

            # Verify upload
            if rclone lsf gdrive:blog_backups/ | grep -q "${DATE}.tar.gz"; then
                echo -e "${GREEN}✓ Upload verified${NC}"
            else
                echo -e "${YELLOW}⚠ Upload verification failed${NC}"
            fi

            # Clean up old backups in Google Drive based on retention
            echo "  Cleaning old cloud backups (retention: ${RETENTION_DAYS} days)..."
            rclone delete gdrive:blog_backups/ --min-age ${RETENTION_DAYS}d 2>/dev/null || true

            CLOUD_COUNT=$(rclone lsf gdrive:blog_backups/ 2>/dev/null | wc -l)
            echo -e "${GREEN}✓ Google Drive cleanup complete ($CLOUD_COUNT backups in cloud)${NC}"
        else
            echo -e "${RED}✗ Failed to upload to Google Drive${NC}"
            echo "  Check rclone configuration: rclone config"
            BACKUP_SUCCESS=false
        fi
    else
        echo -e "${RED}✗ rclone not installed${NC}"
        echo "  Install: curl https://rclone.org/install.sh | sudo bash"
        echo "  Configure: rclone config (setup Google Drive as 'gdrive')"
        BACKUP_SUCCESS=false
    fi
    echo ""
fi

# ============================================================================
# STEP 5: Cleanup old local backups
# ============================================================================
echo -e "${YELLOW}Cleaning up old local backups...${NC}"

# Remove old backup directories
find "$BACKUP_ROOT" -maxdepth 1 -type d -name "20*" -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null || true

# Remove old compressed archives
find "$BACKUP_ROOT" -maxdepth 1 -type f -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

LOCAL_COUNT=$(ls -1 "$BACKUP_ROOT"/*.tar.gz 2>/dev/null | wc -l)
echo -e "${GREEN}✓ Local cleanup complete ($LOCAL_COUNT backups on disk)${NC}"
echo ""

# ============================================================================
# Summary
# ============================================================================
if [ "$BACKUP_SUCCESS" = true ]; then
    echo -e "${GREEN}========================================="
    echo "✓ Backup Completed Successfully!"
    echo "=========================================${NC}"
    echo "Backup: ${DATE}.tar.gz"
    echo "Size: $ARCHIVE_SIZE"
    echo "Location: $BACKUP_ROOT"
    if [ "$UPLOAD_TO_CLOUD" = true ]; then
        echo "Cloud: Google Drive (blog_backups/)"
    fi
    echo ""
else
    echo -e "${YELLOW}========================================="
    echo "⚠ Backup Completed with Warnings"
    echo "=========================================${NC}"
    echo "Check the messages above for details"
    echo ""
    exit 1
fi

# Show recent backups
echo "Recent backups:"
ls -lht "$BACKUP_ROOT"/*.tar.gz 2>/dev/null | head -n 5 || echo "No backups found"
