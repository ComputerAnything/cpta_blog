# Blog App Upgrade Plan - Cloudflare Tunnel Architecture
## Complete Isolation from cpta_app

**Architecture**: Cloudflare Tunnel (Zero changes to cpta_app)
**Estimated Total Time**: 10-12 hours (spread over 2-3 days)
**Difficulty**: Moderate
**Goal**: Enterprise-grade infrastructure with 100% isolation from cpta_app

---

## 🎯 Architecture Overview

### **CRITICAL: Zero Impact on cpta_app**

```
cpta_app (COMPLETELY UNCHANGED):
  Internet → Cloudflare → Ports 80/443 → UFW → cpta_nginx → cpta_app

blog_app (NEW, ISOLATED):
  Internet → Cloudflare → Tunnel (encrypted) → cloudflared → blog_nginx → blog_app
                                                    ↓
                                        No public ports, localhost only
```

**Key Benefits:**
- ✅ **ZERO changes to cpta_app** (not even aware blog exists)
- ✅ **100% isolation** (no shared nginx, networks, or components)
- ✅ **Better security** (blog has no exposed ports)
- ✅ **Free** (Cloudflare Tunnels included in free plan)
- ✅ **Easy removal** (stop tunnel, delete containers, done)

---

## 📊 Current vs Target State

### Current State (Grade: C-)
- ✅ Basic Flask backend
- ✅ React frontend (Vite)
- ⚠️ Single monolithic Dockerfile
- ⚠️ Basic docker-compose.yml (port 8002)
- ⚠️ No staging environment
- ⚠️ No rate limiting
- ⚠️ No CI/CD pipeline
- ⚠️ Manual deployments
- ⚠️ No comprehensive security

### Target State (Grade: A+)
- ✅ Clean Flask backend architecture
- ✅ Separate frontend/backend containers
- ✅ Three environments (dev, staging, production)
- ✅ Rate limiting with Redis
- ✅ Cloudflare Tunnel (no port exposure)
- ✅ GitHub Actions CI/CD
- ✅ Automated deployments
- ✅ Enterprise security hardening
- ✅ Complete isolation from cpta_app
- ✅ Comprehensive documentation

---

## 🎯 Implementation Phases

### Phase 1: Environment Setup (2-3 hours)
**Goal**: Proper .env structure for all environments

#### 1.1 Update .gitignore

Add to `.gitignore`:
```bash
# Environment files
.env.staging
**/.env.staging
.env.production
**/.env.production

# Cloudflare Tunnel credentials
cloudflared-config/
**/*.json
```

#### 1.2 Create Environment Templates

**File**: `backend/.env.example`
```bash
# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/blog_dev

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173

# Email (Resend)
RESEND_API_KEY=re_xxx

# Rate Limiting (Redis)
REDIS_URL=redis://:password@localhost:6379/0

# Bot Protection (Optional)
TURNSTILE_SECRET_KEY=your_turnstile_secret
```

**File**: `frontend/.env.example`
```bash
# API URL
VITE_API_URL=http://localhost:5000

# Bot Protection (if used)
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
```

#### 1.3 Create Actual Environment Files

**Don't commit these!** Create locally:

```bash
# Development (local)
cp backend/.env.example backend/.env.development
cp frontend/.env.example frontend/.env.development

# Staging (localhost Docker)
cp backend/.env.example backend/.env.staging
cp frontend/.env.example frontend/.env.staging

# Production (VPS only - don't create locally)
# Will create on VPS: backend/.env.production
```

**Update each with appropriate values**:
- `.env.development`: localhost URLs, dev database
- `.env.staging`: localhost:8001, staging database
- `.env.production`: production URLs, prod database (on VPS)

---

### Phase 2: Backend Enhancements (3-4 hours)
**Goal**: Add rate limiting, security features

#### 2.1 Update requirements.txt

Add missing dependencies:

```bash
# Add to backend/requirements.txt
flask-limiter==3.5.0    # Rate limiting
redis==5.0.1            # Redis client for rate limiting
```

Install:
```bash
cd backend
pip install -r requirements.txt
```

#### 2.2 Add Rate Limiting to app.py

Update `backend/app.py`:

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

def get_real_ip():
    """Get real IP address, accounting for proxies and Docker."""
    if request.environ.get('HTTP_X_FORWARDED_FOR'):
        return request.environ['HTTP_X_FORWARDED_FOR'].split(',')[0].strip()
    if request.environ.get('HTTP_X_REAL_IP'):
        return request.environ['HTTP_X_REAL_IP']
    return request.environ.get('REMOTE_ADDR', '127.0.0.1')

# Add in create_app() before initializing other extensions:
limiter = Limiter(
    key_func=get_real_ip,
    default_limits=[],  # No default limits
    storage_uri=os.environ.get('REDIS_URL', 'memory://')
)

# In create_app():
limiter.init_app(app)
```

#### 2.3 Add Rate Limits to Routes

Update `backend/routes/auth.py` (or similar):

```python
from backend.app import limiter  # Import limiter

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")  # 5 login attempts per minute
def login():
    # ... existing code
    pass

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("3 per hour")  # 3 registrations per hour
def register():
    # ... existing code
    pass
```

#### 2.4 Update config.py for Environments

```python
import os
from dotenv import load_dotenv

# Determine which .env file to load based on environment
env_file = os.environ.get('FLASK_ENV', 'development')
env_path = os.path.join(os.path.dirname(__file__), f'.env.{env_file}')

# Fall back to .env if specific file doesn't exist
if not os.path.exists(env_path):
    env_path = os.path.join(os.path.dirname(__file__), '.env')

load_dotenv(dotenv_path=env_path)

class Config:
    # Existing config...

    # Add Redis for rate limiting
    REDIS_URL = os.environ.get('REDIS_URL', 'memory://')

    # Add environment detection
    ENV = os.environ.get('FLASK_ENV', 'development')
    DEBUG = ENV == 'development'
```

---

### Phase 3: Docker Multi-Container Setup (3-4 hours)
**Goal**: Separate containers, network segmentation

#### 3.1 Create Backend Dockerfile

**File**: `backend/Dockerfile`
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY . ./backend/

# Environment setup
ENV PYTHONPATH=/app/backend
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD curl -f http://localhost:8000/api/health || exit 1

# Run with Gunicorn
CMD ["sh", "-c", "gunicorn --workers 2 --threads 4 --worker-class gthread -b 0.0.0.0:8000 --timeout 120 backend.app:app"]
```

#### 3.2 Create Frontend Dockerfile

**File**: `frontend/Dockerfile`
```dockerfile
# Stage 1: Build React app
FROM node:20 AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --silent

# Copy source
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

#### 3.3 Create Frontend nginx.conf

**File**: `frontend/nginx.conf`
```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://blog-backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 3.4 Create docker-compose.staging.yml

**File**: `docker-compose.staging.yml`
```yaml
# Staging environment - localhost:8001 for testing before production
services:
  # Reverse proxy (internal only)
  nginx-proxy:
    image: nginx:alpine
    container_name: blog_nginx_staging
    restart: always
    ports:
      - "127.0.0.1:8001:80"  # Only accessible from localhost
    volumes:
      - ./deployment/nginx/staging-proxy.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - blog-frontend
    networks:
      - proxy_network

  # Redis for rate limiting
  redis:
    image: redis:7-alpine
    container_name: blog_redis_staging
    restart: always
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD:-changeme}
      --maxmemory 128mb
      --maxmemory-policy allkeys-lru
    networks:
      - backend_network
    expose:
      - "6379"

  # Backend API
  blog-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: blog_backend_staging
    env_file:
      - ./backend/.env.staging
    restart: always
    depends_on:
      - redis
    environment:
      - FLASK_ENV=staging
      - REDIS_URL=redis://:${REDIS_PASSWORD:-changeme}@redis:6379/0
    networks:
      - frontend_network
      - backend_network
    expose:
      - "8000"
    # Security hardening
    read_only: true
    tmpfs:
      - /tmp
      - /app/backend/__pycache__:uid=1000,gid=1000
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE

  # Frontend (nginx serving React)
  blog-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: blog_frontend_staging
    restart: always
    depends_on:
      - blog-backend
    networks:
      - proxy_network
      - frontend_network
    expose:
      - "80"
    # Security hardening
    read_only: true
    tmpfs:
      - /var/cache/nginx
      - /var/run
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
      - CHOWN
      - SETUID
      - SETGID

networks:
  proxy_network:
    driver: bridge

  frontend_network:
    driver: bridge
    internal: false

  backend_network:
    driver: bridge
    internal: true
```

#### 3.5 Create docker-compose.prod.yml

**File**: `docker-compose.prod.yml`
```yaml
# Production environment - deployed on VPS with Cloudflare Tunnel
# ZERO changes to cpta_app - completely isolated
services:
  # Cloudflare Tunnel (replaces port exposure)
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: blog_cloudflared_prod
    restart: always
    command: tunnel run
    volumes:
      - ./cloudflared-config:/etc/cloudflared:ro
    networks:
      - proxy_network
    depends_on:
      - blog-frontend
    # No ports exposed - tunnel connects outbound to Cloudflare

  # Redis for rate limiting
  redis:
    image: redis:7-alpine
    container_name: blog_redis_prod
    restart: always
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD}
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --save 60 1000
      --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - backend_network
    expose:
      - "6379"
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

  # Backend API
  blog-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: blog_backend_prod
    env_file:
      - ./backend/.env.production
    restart: always
    depends_on:
      - redis
    environment:
      - FLASK_ENV=production
      - PYTHONUNBUFFERED=1
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
    networks:
      - frontend_network
      - backend_network
    expose:
      - "8000"
    # Security hardening
    read_only: true
    tmpfs:
      - /tmp
      - /app/backend/__pycache__:uid=1000,gid=1000
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 256M
          cpus: '0.25'

  # Frontend (nginx serving React)
  blog-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: blog_frontend_prod
    restart: always
    depends_on:
      - blog-backend
    networks:
      - proxy_network
      - frontend_network
    # Listen on localhost only - accessed via Cloudflare Tunnel
    ports:
      - "127.0.0.1:8080:80"
    # Security hardening
    read_only: true
    tmpfs:
      - /var/cache/nginx
      - /var/run
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
      - CHOWN
      - SETUID
      - SETGID
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.5'

networks:
  # All blog networks - completely isolated from cpta_app
  proxy_network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.30.0.0/24

  frontend_network:
    driver: bridge
    internal: false
    ipam:
      config:
        - subnet: 172.31.0.0/24

  backend_network:
    driver: bridge
    internal: true
    ipam:
      config:
        - subnet: 172.32.0.0/24

volumes:
  redis_data:
    driver: local
```

---

### Phase 4: Cloudflare Tunnel Setup (2-3 hours)
**Goal**: Secure tunnel without port exposure

#### 4.1 Install cloudflared on VPS

**On your VPS (SSH in):**

```bash
# Download cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64

# Install
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# Verify installation
cloudflared --version
```

#### 4.2 Authenticate with Cloudflare

```bash
# Login to Cloudflare (opens browser)
cloudflared tunnel login

# This creates: ~/.cloudflared/cert.pem
# Verify:
ls -la ~/.cloudflared/
```

#### 4.3 Create Tunnel

```bash
# Create tunnel named "blog-tunnel"
cloudflared tunnel create blog-tunnel

# Output will show:
# - Tunnel ID: <UUID>
# - Credentials file: ~/.cloudflared/<UUID>.json

# Save the tunnel ID for next steps
```

#### 4.4 Configure Tunnel

**File**: `cloudflared-config/config.yml` (in your blog repo)

```yaml
tunnel: blog-tunnel
credentials-file: /etc/cloudflared/credentials.json

ingress:
  # Route blog subdomain to local blog frontend
  - hostname: blog.computeranything.dev
    service: http://blog_frontend_prod:80

  # Catch-all rule (required)
  - service: http_status:404
```

#### 4.5 Copy Credentials to Repo

```bash
# On VPS, create directory for tunnel config
cd /opt/blog_app
mkdir -p cloudflared-config

# Copy credentials
sudo cp ~/.cloudflared/<UUID>.json cloudflared-config/credentials.json

# Set permissions
sudo chmod 600 cloudflared-config/credentials.json
sudo chown cheloniixd:cheloniixd cloudflared-config/credentials.json

# Copy config
cp /path/to/config.yml cloudflared-config/config.yml
```

#### 4.6 Configure DNS

```bash
# Route DNS to tunnel
cloudflared tunnel route dns blog-tunnel blog.computeranything.dev

# This creates a CNAME record:
# blog.computeranything.dev → <UUID>.cfargotunnel.com
```

#### 4.7 Test Tunnel (Before Docker)

```bash
# Start tunnel manually to test
cloudflared tunnel run blog-tunnel

# In another terminal, test:
curl http://localhost:8080
# Should connect to blog frontend (once containers running)
```

---

### Phase 5: Deployment Scripts (1-2 hours)
**Goal**: Automated deployment

#### 5.1 Create Deployment Directory Structure

```bash
mkdir -p deployment/nginx
```

#### 5.2 Create Nginx Staging Proxy Config

**File**: `deployment/nginx/staging-proxy.conf`
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
    gzip on;

    server {
        listen 80;
        server_name localhost;

        # Security headers
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        location / {
            proxy_pass http://blog_frontend_staging:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

#### 5.3 Create Deployment Script

**File**: `deployment/deploy.sh`
```bash
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
```

Make executable:
```bash
chmod +x deployment/deploy.sh
```

---

### Phase 6: CI/CD Pipeline (1-2 hours)
**Goal**: GitHub Actions for automated deployment

#### 6.1 Create GitHub Actions Workflows

**File**: `.github/workflows/deploy-production.yml`
```yaml
name: Deploy Blog to Production

on:
  workflow_dispatch:
    inputs:
      confirmation:
        description: 'Type "deploy" to confirm'
        required: true
        type: string

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.event.inputs.confirmation == 'deploy'

    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_IP }}
          username: cheloniixd
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/blog_app
            bash deployment/deploy.sh

      - name: Verify Deployment
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_IP }}
          username: cheloniixd
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            sleep 20
            curl -f https://blog.computeranything.dev/ || exit 1
            echo "✅ Blog is live via Cloudflare Tunnel!"
```

**File**: `.github/workflows/security-tests.yml`
```yaml
name: Security Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  security-scan:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install safety bandit

      - name: Run safety check
        run: safety check -r backend/requirements.txt
        continue-on-error: true

      - name: Run bandit security scan
        run: bandit -r backend/ -f json -o bandit-report.json
        continue-on-error: true
```

---

### Phase 7: Documentation (1 hour)
**Goal**: Comprehensive setup guides

#### 7.1 Create Development Guide

**File**: `docs/setup/DEVELOPMENT.md`
```markdown
# Development Environment Setup

## Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL (or use external DB)
- Redis (via Docker)

## Quick Start

1. **Clone repository**
   ```bash
   git clone https://github.com/ComputerAnything/cpta_blog.git
   cd cpta_blog
   ```

2. **Backend setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt

   # Copy and configure environment
   cp .env.example .env.development
   # Edit .env.development with your values

   # Database migrations
   flask db upgrade

   # Run backend
   python run.py
   ```

3. **Frontend setup** (new terminal)
   ```bash
   cd frontend
   npm install

   # Copy and configure environment
   cp .env.example .env.development
   # Edit .env.development with your values

   # Run frontend
   npm run dev
   ```

4. **Redis** (new terminal)
   ```bash
   docker run -d -p 6379:6379 redis:alpine redis-server --requirepass changeme
   ```

Your app is now running at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API: http://localhost:5000/api
```

#### 7.2 Create Production Guide

**File**: `docs/setup/PRODUCTION.md`
```markdown
# Production Deployment with Cloudflare Tunnel

## Prerequisites
- VPS access (cheloniixd@YOUR_VPS_IP)
- Cloudflare account with computeranything.dev
- GitHub secrets configured
- Cloudflare Tunnel setup complete

## Initial Setup (One-Time)

### 1. Install cloudflared on VPS

```bash
ssh cheloniixd@YOUR_VPS_IP

# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared
cloudflared --version
```

### 2. Authenticate with Cloudflare

```bash
# Login (opens browser)
cloudflared tunnel login

# Verify cert created
ls -la ~/.cloudflared/cert.pem
```

### 3. Create Tunnel

```bash
# Create tunnel
cloudflared tunnel create blog-tunnel

# Note the Tunnel ID and credentials file location
# Example output:
# Tunnel credentials written to /root/.cloudflared/<UUID>.json
```

### 4. Clone Repository

```bash
cd /opt
sudo git clone https://github.com/ComputerAnything/cpta_blog.git blog_app
sudo chown -R cheloniixd:cheloniixd blog_app
cd blog_app
```

### 5. Configure Tunnel

```bash
# Create config directory
mkdir -p cloudflared-config

# Copy credentials
cp ~/.cloudflared/<UUID>.json cloudflared-config/credentials.json
chmod 600 cloudflared-config/credentials.json
```

Create `cloudflared-config/config.yml`:
```yaml
tunnel: blog-tunnel
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: blog.computeranything.dev
    service: http://blog_frontend_prod:80
  - service: http_status:404
```

### 6. Route DNS

```bash
cloudflared tunnel route dns blog-tunnel blog.computeranything.dev
```

### 7. Create Production Environment Files

```bash
# Backend
cp backend/.env.example backend/.env.production
nano backend/.env.production
# Update with production values

# Frontend
cp frontend/.env.example frontend/.env.production
nano frontend/.env.production
# Update with production values
```

### 8. Deploy

```bash
bash deployment/deploy.sh
```

## Automated Deployment (Recommended)

1. Go to GitHub Actions
2. Select "Deploy Blog to Production"
3. Click "Run workflow"
4. Type "deploy" to confirm
5. Monitor deployment progress

## Verify Deployment

```bash
# Check containers
docker ps | grep blog

# Check tunnel
docker logs blog_cloudflared_prod

# Test blog
curl https://blog.computeranything.dev/
```

## Isolation Verification

```bash
# Verify blog can't access cpta_app backend
docker exec blog_backend_prod ping cpta_backend
# Should fail (different networks)

# Verify blog has no public ports
sudo netstat -tulpn | grep 8080
# Should show 127.0.0.1:8080 only (localhost)

# Verify cpta_app still working
curl https://computeranything.dev/health
```

## Troubleshooting

### Tunnel not connecting

```bash
# Check cloudflared logs
docker logs blog_cloudflared_prod

# Verify credentials
ls -la cloudflared-config/credentials.json

# Test tunnel manually
cloudflared tunnel run blog-tunnel
```

### Blog not accessible

```bash
# Check DNS propagation
dig blog.computeranything.dev

# Check containers
docker ps

# Check frontend logs
docker logs blog_frontend_prod
```

### cpta_app affected

**This should NEVER happen** - blog is completely isolated.

If cpta_app has issues:
1. Check it's not your deployment
2. Verify no changes to `/opt/cpta_app/`
3. Check UFW rules: `sudo ufw status`
```

---

## 📝 Implementation Checklist

### Day 1 (4-5 hours)
- [ ] Phase 1: Environment Setup (2-3 hours)
- [ ] Phase 2: Backend Enhancements (2-3 hours)
- [ ] Test locally with rate limiting

### Day 2 (3-4 hours)
- [ ] Phase 3: Docker Multi-Container (3-4 hours)
- [ ] Test staging environment locally: `docker compose -f docker-compose.staging.yml up`
- [ ] Verify all containers healthy
- [ ] Test rate limiting in staging

### Day 3 (3-4 hours)
- [ ] Phase 4: Cloudflare Tunnel Setup (2-3 hours)
- [ ] Phase 5: Deployment Scripts (1 hour)
- [ ] Phase 6: CI/CD Pipeline (1 hour)
- [ ] Phase 7: Documentation (1 hour)
- [ ] Deploy to production
- [ ] Verify isolation from cpta_app

**Total**: 10-12 hours

---

## 🔒 Security Verification Checklist

After deployment, verify:

### Blog Isolation
- [ ] Blog has no public ports: `sudo netstat -tulpn | grep blog`
- [ ] Blog can't ping cpta_backend: `docker exec blog_backend_prod ping cpta_backend`
- [ ] Blog on different networks: `docker network inspect blog_app_backend_network`

### cpta_app Unchanged
- [ ] cpta_app still accessible: `curl https://computeranything.dev/health`
- [ ] No changes to cpta_app files: `ls -la /opt/cpta_app/`
- [ ] UFW rules unchanged: `sudo ufw status numbered`
- [ ] SSH still works: `ssh -i ~/.ssh/key cheloniixd@VPS_IP`

### Tunnel Security
- [ ] Credentials secured: `ls -la cloudflared-config/credentials.json` (600 permissions)
- [ ] Tunnel connected: `docker logs blog_cloudflared_prod`
- [ ] DNS resolving: `dig blog.computeranything.dev`

### General Security
- [ ] fail2ban still active: `sudo fail2ban-client status sshd`
- [ ] No secrets in git: `git log -p | grep -i "password\|secret\|key"`
- [ ] Rate limiting works: Test 6+ login attempts
- [ ] Health checks passing: `docker ps` (all healthy)

---

## 🚨 Rollback Procedure

If anything goes wrong:

```bash
# Stop blog completely
cd /opt/blog_app
docker compose -f docker-compose.prod.yml down

# Remove tunnel
cloudflared tunnel delete blog-tunnel

# Verify cpta_app still working
curl https://computeranything.dev/health

# Blog is now completely removed, zero impact on cpta_app
```

---

## 📊 Success Criteria

You'll know it's done when:

1. **Three working environments**:
   - Development: 4 terminals, localhost
   - Staging: docker-compose.staging.yml, localhost:8001
   - Production: VPS, blog.computeranything.dev (via tunnel)

2. **Complete isolation**:
   - Blog can't access cpta_app containers
   - cpta_app unaware blog exists
   - Different networks (172.30-32.x.x vs 172.20-22.x.x)

3. **Zero changes to cpta_app**:
   - No modified files in `/opt/cpta_app/`
   - Same nginx config
   - Same UFW rules
   - Same everything

4. **Tunnel working**:
   - Blog accessible via https://blog.computeranything.dev
   - No public ports exposed
   - Tunnel connected and healthy

5. **CI/CD working**:
   - GitHub Actions deploys successfully
   - Health checks pass
   - No manual SSH needed

---

## 🎯 Key Differences from Original Plan

**CHANGED:**
- ❌ No shared nginx with cpta_app
- ❌ No modifications to cpta_app files
- ❌ No shared proxy_network
- ✅ Cloudflare Tunnel instead
- ✅ 100% isolation
- ✅ No port exposure

**KEPT:**
- ✅ Multi-container Docker setup
- ✅ Rate limiting with Redis
- ✅ Security hardening (read-only, cap drops)
- ✅ Staging environment
- ✅ CI/CD pipeline
- ✅ Environment-based configs

---

**Ready to start?** Tomorrow, begin with Phase 1 and work through sequentially. Test each phase before moving to the next!
