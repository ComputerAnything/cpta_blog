# Backup & Restore Guide

Complete backup strategy with automated Google Drive uploads, Discord notifications, and disaster recovery procedures.

---

## Overview

### Three Layers of Protection

1. **Neon's Built-in Backups** (Free Tier)
   - 7-day point-in-time recovery
   - Automatic, managed by Neon
   - Good for quick database-only restores

2. **Local VPS Backups**
   - Daily automated backups via GitHub Actions
   - Stored at `/opt/backups/cpta_blog/` on VPS
   - 30-day retention

3. **Google Drive Cloud Backups** ✨
   - Automated uploads to Google Drive
   - True disaster recovery (survives VPS failure)
   - Stored in `blog_backups/` folder
   - 30-day retention

---

## What Gets Backed Up

Every backup creates a `.tar.gz` archive containing:

### 1. PostgreSQL Database ⏭️ **SKIPPED BY DEFAULT**
- **Why:** Neon provides automatic 7-day point-in-time recovery
- **When to include:** Monthly archives or before major migrations
- **Size:** ~1-5 MB compressed

### 2. Redis Data
- Rate limiting counters
- Cache data
- Persistence files

### 3. Configuration Files
- Environment variables
- Docker Compose configuration
- Cloudflare Tunnel config

### 4. Application Logs
- Last 24 hours from all services

### 5. Git Metadata
- Commit hash and info

**Total backup size:** ~2-10 MB per backup

---

## Automated Backups

**Schedule:** Daily at 2:00 AM UTC via GitHub Actions

**What happens:**
1. SSH to VPS
2. Run backup script with `--upload` flag
3. Upload to Google Drive (`blog_backups/` folder)
4. Clean up backups older than 30 days
5. Send Discord notification

**View history:**
- GitHub Actions → "Automated Production Backup"
- Google Drive → `blog_backups/` folder
- Discord alerts channel

---

## Manual Backups

### Via GitHub Actions (Recommended)

1. Go to **Actions** → "Automated Production Backup"
2. Click **"Run workflow"**
3. Optional settings:
   - ☐ **Include database backup** (uses Neon compute)
   - ☐ **Keep uncompressed files** (debugging only)
4. Monitor progress and check Discord

### Via SSH

```bash
# Standard backup (database skipped, upload to Google Drive)
bash deployment/backup.sh --upload

# Include database (use sparingly)
bash deployment/backup.sh --include-database --upload

# Local only (no cloud upload)
bash deployment/backup.sh
```

---

## Setup Guide

### 1. Install rclone on VPS

```bash
curl https://rclone.org/install.sh | sudo bash
```

### 2. Configure Google Drive

```bash
rclone config
# Follow prompts to set up Google Drive as "gdrive"
```

### 3. Test Connection

```bash
# List files
rclone lsf gdrive:

# Test upload
echo "test" > /tmp/test.txt
rclone copy /tmp/test.txt gdrive:blog_backups/
rclone lsf gdrive:blog_backups/

# Cleanup
rclone delete gdrive:blog_backups/test.txt
```

### 4. Setup Discord Webhook

1. Discord server → Channel settings → Integrations → Webhooks
2. Create webhook, copy URL
3. GitHub repo → Settings → Secrets → Actions
4. Add secret: `DISCORD_WEBHOOK_URL`

---

## Restoring from Backup

### 1. Download Backup

```bash
# From Google Drive
rclone lsf gdrive:blog_backups/
rclone copy gdrive:blog_backups/YYYYMMDD_HHMMSS.tar.gz /tmp/

# Or use local backup
ls /opt/backups/cpta_blog/*.tar.gz
```

### 2. Extract

```bash
mkdir -p /tmp/restore
tar -xzf /tmp/YYYYMMDD_HHMMSS.tar.gz -C /tmp/restore/
cd /tmp/restore/YYYYMMDD_HHMMSS/
```

### 3. Restore Database (if included)

```bash
gunzip database/database.sql.gz
cat database/database.sql | docker compose -f /opt/cpta_blog/docker-compose.prod.yml exec -T blog-backend bash -c "psql \$DATABASE_URL"
```

### 4. Restore Redis (optional)

```bash
REDIS_CONTAINER=$(docker compose -f /opt/cpta_blog/docker-compose.prod.yml ps -q redis)
docker compose -f /opt/cpta_blog/docker-compose.prod.yml stop redis
docker cp redis/. $REDIS_CONTAINER:/data/
docker compose -f /opt/cpta_blog/docker-compose.prod.yml start redis
```

### 5. Restart Services

```bash
cd /opt/cpta_blog
docker compose -f docker-compose.prod.yml restart
bash deployment/monitoring.sh  # Verify health
```

---

## Discord Notifications

### Success Message

```
✅ Backup Completed Successfully

Time: YYYY-MM-DD HH:MM:SS UTC
Retention: 30 days

📦 Database: ⏭️ Skipped (Neon auto-backup)
💾 Redis: ✅ Backed up
⚙️ Config: ✅ Backed up
📋 Logs: ✅ Last 24h backed up
☁️ Google Drive: ✅ Uploaded & Verified
```

### Failure Alert

```
❌ Backup Failed

⚠️ Action Required:
1. SSH to server and check logs
2. Verify containers running
3. Check disk space
4. Run manual backup
```

---

## Troubleshooting

### Backup Fails

**Container not running:**
```bash
docker compose -f /opt/cpta_blog/docker-compose.prod.yml ps
docker compose -f /opt/cpta_blog/docker-compose.prod.yml up -d
```

**Google Drive upload fails:**
```bash
# Test connection
rclone lsf gdrive:

# Reconfigure if needed
rclone config
```

### Out of Disk Space

```bash
# Check usage
df -h

# Remove old backups
find /opt/backups/cpta_blog -name "*.tar.gz" -mtime +30 -delete
```

---

## Security Notes

**Backups contain sensitive data:**
- Database credentials
- API keys
- JWT secrets

**Protections:**
- Google Drive: Encrypted at rest, private to your account
- VPS: File permissions restricted
- rclone: HTTPS-only transfers

**Best practices:**
- Never commit backups to Git
- Keep webhook URLs secret
- Monitor Drive access regularly

---

## Quick Reference

```bash
# Manual backup
bash deployment/backup.sh --upload

# List backups
rclone lsf gdrive:blog_backups/

# Download backup
rclone copy gdrive:blog_backups/FILENAME.tar.gz /tmp/

# Extract
tar -xzf /tmp/FILENAME.tar.gz -C /tmp/restore/

# Test rclone
rclone lsf gdrive:
```

---

**See also:**
- [Observability](./OBSERVABILITY.md) - Monitoring and alerts
- [GitHub Actions](../ci-cd/GITHUB_ACTIONS.md) - CI/CD workflows
- [Production Guide](../setup/PRODUCTION.md) - Deployment

---

**Last Updated:** January 2026
