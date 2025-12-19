# Production Deployment Guide

Guide for deploying the Computer Anything Tech Blog to production.

---

## Production Architecture

- **Frontend:** Static React build served by Nginx
- **Backend:** Flask + Gunicorn (WSGI server)
- **Database:** Neon PostgreSQL (managed)
- **Redis:** Docker container for rate limiting
- **CDN/Proxy:** Cloudflare Tunnel (HTTPS, DDoS protection)
- **Email:** Resend API (transactional emails)

---

## Prerequisites

- VPS server (Ubuntu 20.04+ recommended)
- Domain name configured in Cloudflare
- Neon PostgreSQL database created
- Resend API account
- Cloudflare Turnstile keys

---

## Deployment with Docker Compose

### 1. Clone Repository on Server

```bash
ssh user@your-server
cd /opt
sudo git clone <repository-url>
cd cpta_blog
```

### 2. Configure Environment Variables

Create production environment files:

```bash
# Backend
cd backend
cp .env .env.production
```

Edit `backend/.env.production`:

```bash
FLASK_ENV=production
SECRET_KEY=<strong-random-key>
JWT_SECRET_KEY=<strong-random-key>

DATABASE_URL=postgresql://user:pass@host/db?sslmode=require&channel_binding=require
REDIS_URL=redis://:your-redis-password@redis:6379/0
REDIS_PASSWORD=your-redis-password

RESEND_API_KEY=re_your_key
ADMIN_EMAIL=admin@computeranything.dev
TURNSTILE_SECRET_KEY=0x4AAAA...

FRONTEND_URL=https://blog.computeranything.dev
```

### 3. Build and Deploy

```bash
# Build and start production containers
docker compose -f docker-compose.prod.yml up --build -d

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### 4. Configure Cloudflare Tunnel

```bash
# Create cloudflared-config/config.yml
mkdir cloudflared-config
cat > cloudflared-config/config.yml << EOF
tunnel: your-tunnel-id
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: blog.computeranything.dev
    service: http://blog-frontend:80
  - service: http_status:404
EOF
```

Restart tunnel:
```bash
docker compose -f docker-compose.prod.yml restart cloudflared
```

---

## Security Checklist

Before going live, verify:

- [ ] All secret keys are strong random values
- [ ] DATABASE_URL uses SSL (\`sslmode=require\`)
- [ ] FRONTEND_URL is HTTPS domain (no wildcard)
- [ ] Redis password is strong
- [ ] HSTS header enabled (automatic in production)
- [ ] CSP header configured (automatic)
- [ ] Rate limiting working with real Redis
- [ ] All security tests passing

### Run Security Tests

```bash
# On production server
cd security_tests
python test_xss.py
python test_rate_limiting.py
python test_csrf_protection.py
```

---

## Monitoring

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f blog-backend
docker compose -f docker-compose.prod.yml logs -f blog-frontend
docker compose -f docker-compose.prod.yml logs -f redis
```

### Health Checks

```bash
# Check backend health
curl https://blog.computeranything.dev/api/posts

# Check Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli -a your-password ping
```

---

## Maintenance

### Update Deployment

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose -f docker-compose.prod.yml up --build -d

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### Database Migrations

```bash
# Run migrations on production database
docker compose -f docker-compose.prod.yml exec blog-backend flask db upgrade
```

### Backup Database

Neon PostgreSQL provides automatic backups. To create manual backup:

```bash
# Export from Neon
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# View container logs
docker compose -f docker-compose.prod.yml logs blog-backend

# Restart specific service
docker compose -f docker-compose.prod.yml restart blog-backend
```

### 502 Bad Gateway

- Check backend container is running
- Check backend logs for errors
- Verify FRONTEND_URL in backend .env

### Rate Limiting Not Working

- Ensure Redis container is running
- Check REDIS_URL and REDIS_PASSWORD match
- Test Redis connection

---

## Security Incident Response

If breach suspected:

1. **Immediate:**
   - Rotate all secret keys
   - Change database password
   - Check logs for suspicious activity

2. **Investigation:**
   - Review rate limit alerts
   - Check failed login attempts
   - Analyze IP addresses

3. **Containment:**
   - Block malicious IPs in Cloudflare
   - Force password resets if needed

4. **Documentation:**
   - Document incident timeline
   - Update security procedures

---

*Last Updated: December 2025*
