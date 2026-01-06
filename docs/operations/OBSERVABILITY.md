# Observability & Monitoring

Complete monitoring guide: health checks, logs, and alerts to keep your production blog running smoothly.

---

## Overview

### Monitoring Strategy

Your production blog has **automated health monitoring**:

1. **Automated Health Checks** (GitHub Actions)
   - Runs daily at 10:00 AM UTC
   - Checks all services via SSH
   - Alerts via Discord if anything is down

2. **VPS Monitoring** (Your hosting provider)
   - CPU, memory, disk usage
   - Bandwidth and network stats
   - Real-time server metrics

3. **Application Logs** (Docker)
   - Backend, frontend, Redis logs
   - Access via SSH

---

## Health Check Monitoring

### What Gets Checked

The monitoring script (`deployment/monitoring.sh`) verifies:

1. **Docker Containers**
   - All containers running (`blog-backend`, `blog-frontend`, `cloudflared`, `redis`)
   - No containers in "Exited" or "Restarting" state

2. **Backend API**
   - Health endpoint responding
   - Returns `{"status": "healthy"}`

3. **Frontend**
   - Accessible and serving content
   - No error pages

4. **Cloudflare Tunnel**
   - Tunnel container running
   - HTTPS access working

5. **Redis Cache**
   - Accepting connections
   - Rate limiting operational

### Schedule

- **Automated:** Daily at 10:00 AM UTC via GitHub Actions
- **Manual:** Run anytime from GitHub Actions tab

### How It Works

```
Daily at 10:00 AM UTC:
1. GitHub Actions triggers workflow
2. SSH connection to VPS
3. Runs deployment/monitoring.sh
4. Checks all services
5. If ALL healthy → No notification (silent)
6. If ANY down → Discord alert with @everyone ping
```

---

## Discord Notifications

### Setup Discord Webhook

1. In Discord, go to your server
2. Create or select alert channel
3. Click gear icon → "Integrations" → "Create Webhook"
4. Name: `Blog Production Monitor`
5. Copy the webhook URL
6. In GitHub: Settings → Secrets → Actions
7. New secret: `DISCORD_WEBHOOK_URL`
8. Paste webhook URL → "Add secret"

### Notification Examples

#### All Services Healthy (Manual Run Only)

```
✅ All Services Healthy

Production health check passed

Time: YYYY-MM-DD HH:MM:SS UTC
Backend: ✅ Responding
Frontend: ✅ Accessible
Cloudflared: ✅ Running
Redis: ✅ Connected
Containers: ✅ All running

Blog - Health Monitor
```

**Note:** Daily automated runs do NOT send this to prevent spam.

#### Services Down (Immediate Alert)

```
🚨 Production Health Check Failed
@everyone

One or more services are not responding

Time: YYYY-MM-DD HH:MM:SS UTC

⚠️ Immediate Action Required:
1. Check Docker containers
2. Check logs
3. Verify services are running
4. Check server resources

Blog - Health Monitor
```

---

## Viewing Logs

### Via SSH

```bash
# View all container logs
cd /opt/cpta_blog
docker compose -f docker-compose.prod.yml logs -f

# View specific container
docker logs blog_backend_prod -f --tail 100
docker logs blog_frontend_prod -f --tail 100
docker logs blog_cloudflared_prod -f --tail 100
docker logs blog_redis_prod -f --tail 100

# Search logs for errors
docker logs blog_backend_prod --since 1h | grep -i error
docker logs blog_backend_prod --since 1h | grep -i exception
```

### Save Logs to File

```bash
docker logs blog_backend_prod --since 24h > /tmp/backend-logs.txt
```

---

## Manual Health Checks

### Option 1: Via GitHub Actions

1. GitHub → Actions → "Health Check Monitoring"
2. Click "Run workflow"
3. Select branch: `main`
4. View results in Discord and GitHub logs

### Option 2: SSH to VPS

```bash
# Run monitoring script
cd /opt/cpta_blog
bash deployment/monitoring.sh

# Check exit code
echo $?  # 0 = healthy, 1 = unhealthy
```

### Option 3: Quick Manual Checks

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Check backend health
curl http://localhost:8000/api/health

# Check Redis
docker exec blog_redis_prod redis-cli ping
```

---

## Troubleshooting

### Health Check Failing

**Backend not responding:**
```bash
# Check backend logs
docker logs blog_backend_prod --tail 50

# Check if container is running
docker compose -f docker-compose.prod.yml ps blog-backend

# Restart backend
docker compose -f docker-compose.prod.yml restart blog-backend
```

**Frontend not accessible:**
```bash
# Check frontend logs
docker logs blog_frontend_prod --tail 50

# Restart frontend
docker compose -f docker-compose.prod.yml restart blog-frontend
```

**Redis not responding:**
```bash
# Check Redis logs
docker logs blog_redis_prod --tail 50

# Test Redis connection
docker exec blog_redis_prod redis-cli ping

# Restart Redis
docker compose -f docker-compose.prod.yml restart redis
```

**All containers stopped:**
```bash
# Check Docker is running
sudo systemctl status docker

# Start Docker if needed
sudo systemctl start docker

# Restart all containers
cd /opt/cpta_blog
docker compose -f docker-compose.prod.yml up -d
```

### Discord Notifications Not Sending

**Verify webhook works:**
```bash
curl -H "Content-Type: application/json" \
     -d '{"content": "Test notification"}' \
     YOUR_WEBHOOK_URL
```

**Check GitHub secret:**
- GitHub → Settings → Secrets → Actions
- Verify `DISCORD_WEBHOOK_URL` exists

---

## Monitoring Best Practices

### Regular Checks

- ✅ Review GitHub Actions history weekly
- ✅ Check VPS metrics for trends
- ✅ Review Docker logs for errors
- ✅ Monitor disk space usage

### Set Thresholds

- ✅ CPU > 80% sustained = investigate
- ✅ Memory > 90% = potential issue
- ✅ Disk > 85% = cleanup needed
- ✅ Health check failures > 2 consecutive = urgent

### Response Plan

**If you get a Discord alert:**

1. **Acknowledge:** Respond in Discord
2. **SSH to VPS:** Check what's wrong
3. **Review logs:** `docker logs blog_backend_prod --tail 100`
4. **Check resources:** `htop`, `df -h`
5. **Restart if needed:** `docker compose restart`
6. **Document:** Note what happened

### Prevent Issues

- Keep disk space below 80%
- Monitor for memory leaks
- Review error logs weekly
- Update dependencies monthly
- Run health checks before deployments

---

## Metrics to Watch

### Critical (Act Immediately)

- 🚨 Health check failures
- 🚨 Disk space > 90%
- 🚨 All containers stopped
- 🚨 Database connection errors

### Warning (Investigate Soon)

- ⚠️ CPU > 80% sustained
- ⚠️ Memory > 85%
- ⚠️ Increased error rates in logs
- ⚠️ Slow response times

### Informational (Monitor)

- 📊 Normal traffic patterns
- 📊 Average response times
- 📊 Bandwidth usage
- 📊 Cloudflare Tunnel status

---

## Quick Reference

```bash
# Manual health check
cd /opt/cpta_blog
bash deployment/monitoring.sh

# Check container status
docker compose -f docker-compose.prod.yml ps

# View logs
docker logs blog_backend_prod -f --tail 100

# Check backend health
curl http://localhost:8000/api/health

# Check system resources
htop
df -h

# Restart all services
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart blog-backend
```

---

**See also:**
- [Backups](./BACKUPS.md) - Backup strategy with Google Drive
- [GitHub Actions](../ci-cd/GITHUB_ACTIONS.md) - All CI/CD workflows
- [Production Guide](../setup/PRODUCTION.md) - Deployment guide

---

**Last Updated:** January 2026
