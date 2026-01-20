# cpta_blog Production Deployment - Cloudflare Tunnel Setup

**Goal:** Deploy blog.computeranything.dev using Cloudflare Tunnel on same VPS as cpta_app

**Estimated Time:** 1-2 hours

---

## Phase 1: Local Preparation

### Git & Code
- [ ] Commit current changes on bugFixes branch
  ```bash
  cd /home/cheloniixd/Desktop/Batcave/COMPUTER_ANYTHING/cpta_blog
  git add .
  git commit -m "fix: add rate limiting to register endpoint and unify auth verification flow"
  ```

- [ ] Merge to main branch
  ```bash
  git checkout main
  git merge bugFixes
  git push origin main
  ```

### Generate Production Secrets
- [ ] Generate REDIS_PASSWORD (save in password manager!)
  ```bash
  openssl rand -hex 32
  ```

- [ ] Generate SECRET_KEY (save in password manager!)
  ```bash
  openssl rand -hex 32
  ```

- [ ] Generate JWT_SECRET_KEY (save in password manager!)
  ```bash
  openssl rand -hex 32
  ```

---

## Phase 2: Cloudflare Tunnel Setup (VPS)

### SSH to VPS
- [ ] SSH to your VPS
  ```bash
  ssh your-user@your-vps-ip
  ```

### Install cloudflared CLI
- [ ] Download and install cloudflared
  ```bash
  wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  sudo dpkg -i cloudflared-linux-amd64.deb
  cloudflared --version
  ```

### Create Tunnel
- [ ] Login to Cloudflare (opens browser)
  ```bash
  cloudflared tunnel login
  # Select domain: computeranything.dev in browser
  ```

- [ ] Create tunnel and save the Tunnel ID
  ```bash
  cloudflared tunnel create cpta-blog-prod
  # SAVE THE TUNNEL ID shown in output!
  ```

- [ ] Verify tunnel created
  ```bash
  cloudflared tunnel list
  # Should show cpta-blog-prod with 0 connections
  ```

### Configure DNS
- [ ] Route DNS through tunnel
  ```bash
  cloudflared tunnel route dns cpta-blog-prod blog.computeranything.dev
  ```

- [ ] Verify in Cloudflare Dashboard
  - Go to Cloudflare → DNS → Records
  - Should see: `blog` CNAME → `<TUNNEL-ID>.cfargotunnel.com` (proxied)

---

## Phase 3: VPS Setup

### Clone Repository
- [ ] Create directory and clone repo
  ```bash
  cd /opt
  sudo mkdir -p cpta_blog
  sudo chown $USER:$USER cpta_blog
  git clone <your-repo-url> cpta_blog
  cd cpta_blog
  git checkout main
  git log -1  # Verify correct commit
  ```

### Create Tunnel Config Directory
- [ ] Create cloudflared-config directory
  ```bash
  cd /opt/cpta_blog
  mkdir -p cloudflared-config
  chmod 700 cloudflared-config
  ```

- [ ] Copy tunnel credentials (replace <TUNNEL-ID>)
  ```bash
  cp ~/.cloudflared/<TUNNEL-ID>.json cloudflared-config/credentials.json
  chmod 600 cloudflared-config/credentials.json
  ```

### Create config.yml
- [ ] Create tunnel configuration file
  ```bash
  cat > cloudflared-config/config.yml << 'EOF'
  tunnel: <TUNNEL-ID>
  credentials-file: /etc/cloudflared/credentials.json

  ingress:
    - hostname: blog.computeranything.dev
      service: http://blog-frontend:80
      originRequest:
        noTLSVerify: false
        connectTimeout: 30s
        httpHostHeader: blog.computeranything.dev
    - service: http_status:404
  EOF
  ```
  **REPLACE `<TUNNEL-ID>` with your actual tunnel ID!**

- [ ] Set permissions
  ```bash
  chmod 600 cloudflared-config/config.yml
  ```

---

## Phase 4: Environment Configuration

### Create backend/.env.production
- [ ] Create backend environment file
  ```bash
  cat > backend/.env.production << 'EOF'
  FLASK_APP=app.py
  FLASK_ENV=production
  SECRET_KEY=<YOUR_GENERATED_SECRET_KEY>

  DATABASE_URL=<YOUR_NEON_POSTGRESQL_URL>

  JWT_SECRET_KEY=<YOUR_GENERATED_JWT_SECRET_KEY>
  JWT_ACCESS_TOKEN_EXPIRES=14400

  RESEND_API_KEY=<YOUR_RESEND_API_KEY>
  MAIL_DEFAULT_SENDER=noreply@notifications.computeranything.dev
  CONTACT_FORM_RECIPIENTS=contact@computeranything.dev

  ADMIN_EMAIL=admin@computeranything.dev

  CF_TURNSTYLE_SECRET_KEY=<YOUR_TURNSTILE_SECRET_KEY>

  REDIS_PASSWORD=<YOUR_GENERATED_REDIS_PASSWORD>
  REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0

  FRONTEND_URL=https://blog.computeranything.dev

  PORT=8000
  EOF
  ```
  **REPLACE all `<YOUR_...>` with actual values!**

- [ ] Set permissions
  ```bash
  chmod 600 backend/.env.production
  ```

### Create root .env.production
- [ ] Create Docker Compose environment file
  ```bash
  cat > .env.production << 'EOF'
  REDIS_PASSWORD=<SAME_REDIS_PASSWORD_AS_BACKEND>
  EOF
  ```
  **MUST match backend/.env.production REDIS_PASSWORD!**

- [ ] Set permissions
  ```bash
  chmod 600 .env.production
  ```

---

## Phase 5: Pre-Deployment Verification

### Verify cpta_app is Running
- [ ] Check cpta_app containers
  ```bash
  cd /opt/cpta_app
  docker compose ps
  # All should show "Up"
  ```

- [ ] Test cpta_app accessibility
  ```bash
  curl -I https://computeranything.dev
  # Should return HTTP/2 200
  ```

### Check Port Availability
- [ ] Verify port 8080 is free
  ```bash
  sudo netstat -tlnp | grep 8080
  # Should be empty (no output)
  ```

### Verify Configuration Files
- [ ] Check all config files exist
  ```bash
  cd /opt/cpta_blog
  ls -la cloudflared-config/config.yml
  ls -la cloudflared-config/credentials.json
  ls -la backend/.env.production
  ls -la .env.production
  # All should show 600 permissions
  ```

---

## Phase 6: Docker Deployment

### Build Containers
- [ ] Build Docker images
  ```bash
  cd /opt/cpta_blog
  docker compose -f docker-compose.prod.yml build --no-cache
  ```

### Start Services
- [ ] Start all containers
  ```bash
  docker compose -f docker-compose.prod.yml up -d
  ```

- [ ] Verify containers are running
  ```bash
  docker compose -f docker-compose.prod.yml ps
  ```
  **Expected: 4 containers (cloudflared, redis, backend, frontend) all "Up"**

### Check Logs
- [ ] View container logs
  ```bash
  docker compose -f docker-compose.prod.yml logs -f --tail=50
  ```
  **Look for:**
  - Cloudflared: "Connection registered" (4 times)
  - Backend: "Listening at: http://0.0.0.0:8000"
  - Frontend: "Configuration complete"
  - Redis: "Ready to accept connections"

### Initialize Database
- [ ] Run database migrations
  ```bash
  docker compose -f docker-compose.prod.yml exec blog-backend flask db upgrade
  ```

---

## Phase 7: Verification & Testing

### Check Tunnel Status
- [ ] Verify tunnel connections
  ```bash
  cloudflared tunnel list
  # Should show 4 CONNECTIONS for cpta-blog-prod
  ```

- [ ] Check Cloudflare Dashboard
  - Go to Zero Trust → Networks → Tunnels
  - Find cpta-blog-prod
  - Status should be: Healthy (green)

### Test Application
- [ ] Test HTTPS access
  ```bash
  curl -I https://blog.computeranything.dev
  # Should return HTTP/2 200
  ```

- [ ] Test API health endpoint
  ```bash
  curl -s https://blog.computeranything.dev/api/health | jq
  # Should return: {"status": "healthy"}
  ```

- [ ] Test in browser
  - Open https://blog.computeranything.dev
  - Verify homepage loads
  - Check SSL certificate (green lock icon)
  - Open DevTools → Console (no errors)

### Verify cpta_app Unaffected
- [ ] Test cpta_app still works
  ```bash
  curl -I https://computeranything.dev
  # Should return HTTP/2 200
  ```

- [ ] Check cpta_app containers
  ```bash
  cd /opt/cpta_app
  docker compose ps
  # All should still be "Up"
  ```

### Run Security Tests
- [ ] Install test dependencies
  ```bash
  cd /opt/cpta_blog/security_tests
  pip3 install requests pytest
  ```

- [ ] Run security test suite
  ```bash
  export BASE_URL="https://blog.computeranything.dev"
  python3 test_rate_limiting.py
  python3 test_xss.py
  python3 test_csrf_protection.py
  python3 test_httponly_cookies.py
  # All tests should PASS
  ```

---

## Phase 8: Post-Deployment

### Cloudflare Security Settings
- [ ] Configure SSL/TLS settings
  - Dashboard → SSL/TLS → Overview
  - Encryption mode: Full (strict)
  - Always Use HTTPS: On
  - HSTS: Enable (6 months)
  - Minimum TLS: 1.2

- [ ] Enable WAF
  - Dashboard → Security → WAF
  - Verify enabled for blog.computeranything.dev

### Setup Monitoring
- [ ] Add health check cron job
  ```bash
  crontab -e
  # Add this line:
  */5 * * * * curl -sf https://blog.computeranything.dev/api/health > /dev/null || echo "blog health check failed at $(date)" >> /var/log/cpta_blog_health.log
  ```

### Document Deployment
- [ ] Save critical info in password manager
  - Tunnel ID: `<tunnel-id>`
  - Tunnel Name: cpta-blog-prod
  - Domain: blog.computeranything.dev
  - Deployment Date: `<date>`
  - Git Commit: `<commit-hash>`
  - All secrets (REDIS_PASSWORD, SECRET_KEY, JWT_SECRET_KEY)

---

## Phase 9: Final Verification

### Success Criteria Checklist
- [ ] ✅ Tunnel shows 4/4 connections (healthy)
- [ ] ✅ DNS resolves blog.computeranything.dev
- [ ] ✅ HTTPS loads with valid certificate
- [ ] ✅ API health returns {"status": "healthy"}
- [ ] ✅ Homepage renders correctly
- [ ] ✅ All security tests pass
- [ ] ✅ Rate limiting works
- [ ] ✅ cpta_app still accessible
- [ ] ✅ No port conflicts
- [ ] ✅ All containers healthy
- [ ] ✅ No errors in logs

---

## Rollback Plan (If Needed)

### Emergency Shutdown
If something goes wrong:
```bash
cd /opt/cpta_blog
docker compose -f docker-compose.prod.yml down

# Verify cpta_app still works
curl -I https://computeranything.dev

# Save logs for investigation
docker compose -f docker-compose.prod.yml logs > /tmp/cpta_blog_logs_$(date +%Y%m%d_%H%M%S).log
```

### Remove DNS (Optional)
- Cloudflare Dashboard → DNS → Records
- Delete or pause the `blog` CNAME record

---

## Useful Commands

### View Logs
```bash
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml logs cloudflared
docker compose -f docker-compose.prod.yml logs blog-backend
```

### Restart Services
```bash
docker compose -f docker-compose.prod.yml restart
docker compose -f docker-compose.prod.yml restart blog-backend
```

### Update Deployment
```bash
cd /opt/cpta_blog
git pull
docker compose -f docker-compose.prod.yml up --build -d
```

### Check Tunnel Status
```bash
cloudflared tunnel list
cloudflared tunnel info cpta-blog-prod
```

---

## 🎉 Deployment Complete!

Once all checkboxes are complete, your blog is live at:
**https://blog.computeranything.dev**

**Both apps running securely:**
- ✅ computeranything.dev (cpta_app) - nginx + Let's Encrypt
- ✅ blog.computeranything.dev (cpta_blog) - Cloudflare Tunnel

**Total cost: $0** 🚀
