# Computer Anything Tech Blog - Documentation

Comprehensive documentation for the Computer Anything Tech Blog platform.

---

## 📚 Documentation Index

### Getting Started
- **[Development Guide](setup/DEVELOPMENT.md)** - Local development setup and daily workflow
- **[Production Deployment](setup/PRODUCTION.md)** - Deploying to production with Docker

### Security
- **[Security Documentation](security/SECURITY.md)** - Complete security architecture and controls
  - Authentication & Session Management
  - CSRF & XSS Protection
  - Rate Limiting
  - Password Security
  - Security Headers (CSP, HSTS, etc.)
  - And more...

### Testing
- **[Security Tests](../security_tests/README.md)** - Automated security testing suite
  - SQL Injection tests
  - XSS protection tests
  - CSRF protection tests
  - Rate limiting tests
  - Token invalidation tests
  - And more...

---

## 🚀 Quick Links

### Development

```bash
# Start development servers (3 terminals)
docker compose -f docker-compose.staging.yml up redis  # Terminal 1
source venv/bin/activate && cd backend && python run.py  # Terminal 2
cd frontend && npm run dev  # Terminal 3
```

**Frontend:** http://localhost:5173
**Backend API:** http://localhost:5000/api

### Security Testing

```bash
cd security_tests
./test_xss.py                    # Tests CSP and security headers
./test_csrf_protection.py        # Tests dual-layer CSRF protection
./test_rate_limiting.py          # Tests Flask-Limiter + Redis
./test_httponly_cookies.py       # Tests JWT cookie security
```

---

## 🔐 Security Highlights

This application implements **enterprise-grade security**:

- ✅ **Zero localStorage** - JWT in httpOnly cookies only
- ✅ **Multi-layer XSS** - CSP headers + React escaping
- ✅ **Dual CSRF** - SameSite cookies + Flask-WTF tokens
- ✅ **Advanced rate limiting** - Redis-backed with admin alerts
- ✅ **Bot protection** - Cloudflare Turnstile on auth endpoints
- ✅ **Password security** - bcrypt hashing, NIST-aligned validation
- ✅ **Token invalidation** - Tokens revoked on password change
- ✅ **Security headers** - CSP, HSTS, X-Frame-Options, and more

**Security Score:** ~90/100 (enterprise-grade)

See [Security Documentation](security/SECURITY.md) for complete details.

---

## 📊 Architecture

### Technology Stack

**Frontend:**
- React 18 + TypeScript
- Vite (dev server & build tool)
- React Router (navigation)
- Styled Components (CSS-in-JS)
- Axios (API client)
- Bootstrap (UI framework)

**Backend:**
- Flask (Python web framework)
- SQLAlchemy (ORM)
- Flask-JWT-Extended (authentication)
- Flask-Limiter (rate limiting)
- Flask-WTF (CSRF protection)
- Gunicorn (production WSGI server)

**Infrastructure:**
- PostgreSQL (Neon - managed database)
- Redis (rate limiting storage)
- Nginx (reverse proxy)
- Docker + Docker Compose
- Cloudflare Tunnel (HTTPS, DDoS protection)

**Services:**
- Resend (transactional email)
- Cloudflare Turnstile (bot protection)

### Project Structure

```
cpta_blog/
├── backend/
│   ├── app.py                 # Flask app factory
│   ├── config.py              # Configuration
│   ├── models/                # Database models
│   ├── routes/                # API endpoints
│   ├── utils/                 # Utilities (email, validation)
│   └── migrations/            # Database migrations
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── contexts/          # React contexts (auth, etc.)
│   │   ├── services/          # API client
│   │   ├── utils/             # Utilities
│   │   └── theme/             # Styling
│   └── public/                # Static assets
│
├── security_tests/            # Security testing suite
├── docs/                      # Documentation (you are here!)
└── docker-compose.*.yml       # Docker configurations
```

---

## 🎯 Use Cases

This platform is ideal for:

- **Content Platforms** - Blog publishing and management
- **Community Forums** - User-generated content with moderation
- **Educational Platforms** - Course content and discussions
- **Internal Knowledge Bases** - Company blogs and documentation
- **Portfolio Sites** - Professional blog with authentication

---

## 🛡️ OWASP Top 10 Coverage

This application addresses all OWASP Top 10 (2021) vulnerabilities:

1. **Broken Access Control** - JWT authentication, authorization checks
2. **Cryptographic Failures** - bcrypt passwords, HTTPS, secure cookies
3. **Injection** - SQLAlchemy ORM (parameterized queries)
4. **Insecure Design** - Defense-in-depth architecture
5. **Security Misconfiguration** - Comprehensive security headers
6. **Vulnerable Components** - Regular dependency updates
7. **Authentication Failures** - Strong passwords, 2FA, rate limiting
8. **Data Integrity Failures** - Input validation, CSRF protection
9. **Logging Failures** - Security event logging
10. **SSRF** - Input validation, no user-controlled URLs

See [Security Documentation](security/SECURITY.md) for implementation details.

---

## 📞 Support

- **Security Issues:** support@computeranything.dev
- **Bug Reports:** GitHub Issues
- **Feature Requests:** GitHub Issues

---

## 📝 License

See LICENSE file for details.

---

*Documentation Last Updated: December 2025*
*Application Version: 1.0*
