# GitHub Actions Workflows

Complete documentation of all CI/CD workflows, when they run, and what they do.

---

## 📋 Workflow Overview

| Workflow | Triggers | Purpose | Duration |
|----------|----------|---------|----------|
| **CI - Test and Lint** | PRs to main, Manual | Fast feedback: tests + linting | ~1-2 min |
| **Security Scanning** | PRs to main, Weekly (Mon 9AM UTC), Manual | Vulnerability scanning | ~5-10 min |
| **Deploy to Production** | Manual only | SSH deploy to VPS | ~2-5 min |
| **Production Backup** | Daily at 2 AM UTC, Manual | Backup Redis, configs, logs | ~1-3 min |
| **Health Monitoring** | Daily at 10 AM UTC, Manual | Check all services are healthy | ~30 sec |

---

## 1️⃣ CI - Test and Lint (`.github/workflows/ci.yml`)

### When It Runs:
- ✅ When you open a PR to `main`
- ✅ When you push new commits to an open PR
- ✅ Manual trigger (useful for testing on any branch)
- ❌ Does NOT run on push to main (already validated by PR)

### What It Does:

**Backend:**
- Installs Python 3.12 dependencies
- Runs **Ruff** linting (`ruff check .`)
- Runs **pytest** with full test suite
- Uses in-memory SQLite + Redis for testing

**Frontend:**
- Installs Node.js 20 dependencies
- Runs **ESLint** (`npm run lint`)
- Builds frontend (`npm run build`)
- Verifies no TypeScript/build errors

### How to Use:

**Automatic:**
Just create a PR! The workflow runs automatically.

```bash
git checkout -b feature/my-feature
git commit -m "Add feature"
git push origin feature/my-feature
# Create PR on GitHub → CI runs automatically
```

**Manual:**
```
GitHub → Actions → CI - Test and Lint → Run workflow
Select branch → Run workflow
```

### Status:
- ✅ Green checkmark = All tests passed, ready to merge
- ❌ Red X = Tests failed, needs fixing before merge

---

## 2️⃣ Security Scanning (`.github/workflows/security.yml`)

### When It Runs:
- ✅ When you open a PR to `main` (runs alongside CI)
- ✅ Every Monday at 9:00 AM UTC (dependency scan only)
- ✅ Manual trigger (useful for testing on any branch)
- ❌ Does NOT run on merge to main (already validated by PR)

### What It Does:

**Dependency Scan:**
- Python: **Safety** checks `requirements.txt` for known CVEs
- Node.js: **npm audit** checks `package.json` for vulnerabilities

**Secret Scan (PR and Manual only):**
- **TruffleHog** scans for accidentally committed secrets
  - PRs: Scans only the diff (changes in the PR)
  - Manual: Scans entire repository filesystem
- Only fails on **verified** secrets (real working credentials)
- Unverified secrets (examples, docs, expired) show warnings but don't block

**Docker Image Scan (PR and Manual only):**
- **Trivy** scans built Docker images for vulnerabilities
- Checks backend and frontend images
- **Application libraries:** BLOCKS on CRITICAL/HIGH vulnerabilities (must fix)
- **OS packages:** WARNS on vulnerabilities (doesn't block pipeline)
- Results available as downloadable artifacts (30 days retention)

### Issue Creation:
- 🚨 **Automatically creates a GitHub Issue** if vulnerabilities found
- Issue includes:
  - Which scans failed
  - Link to workflow logs
  - Quick fix commands
  - Labeled `security`, `automated`

### How to Use:

**Automatic:**
- Runs on every PR (full scan: dependencies + secrets + docker)
- Runs weekly on Monday 9AM UTC (dependency scan only)

**Manual:**
```
GitHub → Actions → Security Scanning → Run workflow
Select branch → Run workflow
```
- Full scan: dependencies + secrets + docker (same as PRs)

**View Results:**
- Check Actions tab for scan logs
- Check Issues tab for automated security alerts
- Download artifacts for detailed SARIF reports

---

## 3️⃣ Deploy to Production (`.github/workflows/deploy.yml`)

### When It Runs:
- ✅ Manual trigger only (for safety)
- ❌ Never runs automatically

### What It Does:
1. **Validates** deployment confirmation (must type "deploy")
2. **SSH** to VPS using `DEPLOY_SSH_KEY` secret
3. **Pulls** latest code from selected branch
4. **Runs** `deployment/deploy.sh` script:
   - Creates timestamped backup
   - Builds Docker images
   - Runs database migrations
   - Restarts services with `docker-compose.prod.yml`
5. **Verifies** services are healthy with `deployment/monitoring.sh`
6. **Reports** deployment summary

### How to Use:

**Go to:** GitHub → Actions → Deploy to Production → Run workflow

**Required Inputs:**
- **Branch:** `main` (default)
- **Confirmation:** Type `deploy` exactly

**Secrets Required:**
- `DEPLOY_SSH_KEY` - SSH private key for VPS access
- `SERVER_IP` - VPS IP address

### Safety Features:
- Manual trigger only (no auto-deploy)
- Requires typing "deploy" to confirm
- Health checks after deployment
- Rollback instructions on failure

---

## 4️⃣ Automated Production Backup (`.github/workflows/backup.yml`)

### When It Runs:
- ✅ Daily at 2:00 AM UTC (automated)
- ✅ Manual trigger anytime

### What It Does:
1. **SSH** to VPS and runs `deployment/backup.sh --upload`
2. **Backs up** (see complete list in [Backup Documentation](../operations/BACKUPS.md)):
   - ⏭️ PostgreSQL database - **SKIPPED by default** (Neon provides 7-day auto-recovery)
   - ✅ Redis data (rate limiting, cache)
   - ✅ Configuration files (.env, docker-compose, Cloudflare Tunnel)
   - ✅ Application logs (last 24 hours)
   - ✅ Git commit reference
3. **Uploads** entire backup to Google Drive
4. **Cleans up** backups older than 30 days (VPS and Google Drive)
5. **Sends Discord notification** with backup status

**Note:** Database backups are disabled by default to save Neon compute hours. Use `--include-database` flag for manual database backups when needed (e.g., before major migrations).

### How to Use:

**Manual Backup:**
```
GitHub → Actions → Automated Production Backup → Run workflow
```

**Options:**
- ☐ **Include database backup** - For monthly archives or before migrations
- ☐ **Keep uncompressed files** - For debugging (uses extra disk space)

**Discord Notifications:**
- ✅ Success: Shows backup details and Google Drive upload confirmation
- ❌ Failure: Alert with troubleshooting steps

**For complete setup guide:** See [Backup Documentation](../operations/BACKUPS.md)

---

## 5️⃣ Health Check Monitoring (`.github/workflows/monitoring.yml`)

### When It Runs:
- ✅ Daily at 10:00 AM UTC (automated)
- ✅ Manual trigger anytime

### What It Does:
1. **SSH** to VPS and runs `deployment/monitoring.sh`
2. **Checks:**
   - Backend API responding at `/api/health`
   - Frontend accessible
   - Cloudflare Tunnel working
   - Redis accepting connections
   - All Docker containers running
3. **Sends Discord notification ONLY if services are down**

### How to Use:

**Manual Health Check:**
```
GitHub → Actions → Health Check Monitoring → Run workflow
```

**Notification Behavior:**
- 🔕 Healthy (scheduled): No notification (prevents spam)
- ✅ Healthy (manual): Success notification
- 🚨 Unhealthy: Immediate Discord alert with `@everyone` ping

**Discord alerts include:**
- Which service(s) are down
- Timestamp
- Immediate troubleshooting steps

---

## 🎯 Typical Development Workflow

### Feature Development:
```
1. Create feature branch
   git checkout -b feature/new-feature

2. Make changes, commit
   git commit -m "Add feature"

3. Push branch
   git push origin feature/new-feature

4. Create PR on GitHub
   → CI runs automatically (tests + lint)
   → Security scans run automatically (dependencies + secrets + docker)

5. Review CI and security results
   ✅ Green = good to merge
   ❌ Red = fix issues, push again

6. Merge PR
   → No workflows run on merge (already validated by PR)
```

### Production Deployment:
```
1. Verify PR merged to main
2. Verify all PR checks passed (CI + security)
3. Actions → Deploy to Production → Run workflow
4. Type "deploy" to confirm
5. Monitor deployment logs
6. Verify production is healthy
```

---

## 🔔 Notifications

### Email Notifications:
- ✅ GitHub sends email when workflows **fail**
- ✅ Scheduled security scans email on failure
- ✅ Configure: GitHub Settings → Notifications → Actions

### Discord Notifications:
- ✅ Backup status (daily at 2 AM UTC)
- ✅ Health check failures (immediate alerts)
- ✅ Setup: See [Backup](../operations/BACKUPS.md) and [Observability](../operations/OBSERVABILITY.md) docs

### Issue Notifications:
- ✅ GitHub Issue created when security scans find vulnerabilities
- ✅ Issues labeled `security`, `automated`
- ✅ Watch repository to get notified

---

## 🛠️ Maintenance Scripts

All located in `deployment/` directory:

- **`deploy.sh`** - Main deployment script (backup → build → migrate → restart)
- **`monitoring.sh`** - Health checks and service status
- **`backup.sh`** - Manual backup script

---

## 📊 Monitoring & Logs

### View Workflow Logs:
```bash
# On GitHub: Actions tab → Select workflow run → View logs

# On VPS via SSH:
cd /opt/cpta_blog
docker compose -f docker-compose.prod.yml logs -f
```

### Check Service Status:
```bash
docker compose -f docker-compose.prod.yml ps
bash deployment/monitoring.sh
```

---

## 🚨 Troubleshooting

### CI Failing:
- **Linting errors:** Run `ruff check . --fix` (backend) or `npm run lint:fix` (frontend)
- **Test failures:** Run `pytest -v` locally to debug
- **Build errors:** Run `npm run build` locally

### Security Scan Failing:
- **Check the GitHub Issue** created automatically
- **Review workflow logs** for specific vulnerabilities
- **Update dependencies:**
  ```bash
  cd backend && pip install --upgrade <package>
  cd frontend && npm update && npm audit fix
  ```
- **Re-run scan** to verify fixes

### Deployment Failing:
- **Check workflow logs** in Actions tab
- **SSH to server** and check docker logs
- **Review deployment script** for errors

---

## 📈 Best Practices

✅ **Always create PRs** - Don't push directly to main
✅ **Fix CI failures immediately** - Don't merge broken code
✅ **Review security issues weekly** - Check Issues tab
✅ **Test locally first** - Use `docker-compose` before deploying
✅ **Monitor deployments** - Watch workflow logs during deploy
✅ **Keep dependencies updated** - Run security scans regularly

---

## 🔗 Quick Links

- **GitHub Actions Docs:** https://docs.github.com/actions
- **Security Tab:** Security tab in your repository
- **Issues:** Filter by `label:security` to see security alerts

---

**Questions?** See the main docs:
- [README](../README.md) - Project overview
- [DEVELOPMENT](../setup/DEVELOPMENT.md) - Local development setup
- [PRODUCTION](../setup/PRODUCTION.md) - Production deployment guide
- [BACKUPS](../operations/BACKUPS.md) - Backup and restore procedures
- [OBSERVABILITY](../operations/OBSERVABILITY.md) - Monitoring and alerts
