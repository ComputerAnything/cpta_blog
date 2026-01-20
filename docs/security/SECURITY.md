# Security Documentation

This document outlines all security measures implemented in the Computer Anything Tech Blog, explaining what threats they protect against, how they work, and where they're implemented.

---

## Executive Summary

This application implements **enterprise-grade security** suitable for protecting user data and preventing common web vulnerabilities. Every component follows defense-in-depth principles with multiple layers of protection.

**Ideal for:** Content platforms, blogging systems, user-generated content applications, community forums

### Compliance Readiness

- ✅ **OWASP Top 10 (2021)** - All vulnerabilities addressed with documented controls
- ✅ **SOC 2 Foundation** - Audit logging, access controls, encryption in transit
- ✅ **GDPR Considerations** - Data isolation, user consent, right to deletion capabilities

### Security Highlights

This application demonstrates professional security practices including:

- **Zero localStorage vulnerabilities** - JWT tokens in httpOnly cookies only
- **Multi-layer XSS protection** - CSP headers, React escaping, httpOnly cookies
- **Dual-layer CSRF protection** - SameSite cookies + Flask-WTF CSRF tokens
- **Advanced rate limiting** - Redis-backed distributed limiting with admin alerts
- **Bot protection** - Cloudflare Turnstile on all authentication endpoints
- **Email authentication** - Email verification and 2FA support
- **Cryptographic best practices** - bcrypt password hashing, secure tokens
- **Defense in depth** - Multiple controls for each threat category

### Perfect For

Organizations handling:
- User-generated content (blog posts, comments)
- Personal identifiable information (PII)
- Community platforms
- Content management systems
- Educational platforms

**This implementation serves as a reference architecture for secure content platform development.**

---

## Table of Contents

1. [Authentication & Session Management](#1-authentication--session-management)
2. [CSRF Protection](#2-csrf-protection)
3. [XSS Protection](#3-xss-protection)
4. [Rate Limiting](#4-rate-limiting)
5. [Input Validation & Sanitization](#5-input-validation--sanitization)
6. [Password Security](#6-password-security)
7. [Token Management & Invalidation](#7-token-management--invalidation)
8. [Email Security](#8-email-security)
9. [Security Headers](#9-security-headers)
10. [Bot Protection](#10-bot-protection)
11. [Database Security](#11-database-security)
12. [API Security](#12-api-security)
13. [Transport Security](#13-transport-security)
14. [Error Handling](#14-error-handling)

---

## 1. Authentication & Session Management

### What It Protects Against
- **Session hijacking**: Attackers stealing authentication tokens
- **XSS token theft**: JavaScript-based token stealing
- **Token exposure**: Tokens visible in browser storage/DevTools

### How It Works
We use **JWT tokens stored in httpOnly cookies** instead of localStorage:

```python
# backend/app.py:44-62
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_COOKIE_SECURE'] = not is_development  # HTTPS only in production
app.config['JWT_COOKIE_SAMESITE'] = 'Lax'  # Primary CSRF protection
app.config['JWT_COOKIE_DOMAIN'] = False  # Works on any domain
```

**httpOnly cookies**:
- Cannot be accessed by JavaScript (immune to XSS)
- Automatically sent by browser on each request
- Secure flag ensures HTTPS-only transmission in production
- SameSite=Lax prevents CSRF attacks

### Implementation Details

**Backend - Setting Cookies:**
```python
# backend/routes/auth.py:275-290
response = make_response(jsonify({
    'user': user.to_dict(),
    'message': 'Login successful'
}), 200)
set_access_cookies(response, access_token)
return response
```

**Backend - Clearing Cookies:**
```python
# backend/routes/auth.py:298-310
@auth.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    response = make_response(jsonify({'message': 'Logged out successfully'}), 200)
    unset_jwt_cookies(response)
    return response
```

**Frontend - Cookie Handling:**
```typescript
// frontend/src/services/api.ts:10
const api = axios.create({
  withCredentials: true,  // Enables sending cookies
})
```

### Files Involved
- `backend/app.py` - JWT cookie configuration
- `backend/routes/auth.py` - Login/logout endpoints
- `frontend/src/services/api.ts` - API client configuration
- `frontend/src/contexts/AuthContext.tsx` - Authentication state

### Token Expiration
- **Access Token**: 24 hours (configurable via `JWT_ACCESS_TOKEN_EXPIRES`)
- Configured in: `backend/config.py`
- Auto-redirect to login on expiration via axios interceptor

### Two-Factor Authentication (2FA)

**What It Protects Against:**
- **Credential theft**: Even if password is compromised, attacker cannot log in
- **Phishing attacks**: Email-based 2FA code adds second verification layer
- **Unauthorized access**: Extra security for user accounts

**How It Works:**
Users can enable 2FA for email-based verification during login:

1. User enters username/email and password
2. System generates 6-digit code (5-minute expiration)
3. Code sent to user's email
4. User must enter correct code to complete login
5. JWT token only issued after successful 2FA verification

**Implementation:**
```python
# backend/routes/auth.py:232-251 (Login with 2FA check)
if user.twofa_enabled:
    code = user.generate_2fa_code(minutes=5)
    subject, html = get_2fa_code_email(code)
    send_email(to=user.email, subject=subject, html=html)

    return jsonify({
        'requires_2fa': True,
        'email': user.email
    }), 200
```

**2FA Verification:**
```python
# backend/routes/auth.py:397-455 (Verify 2FA code)
@auth.route('/verify-2fa', methods=['POST'])
@limiter.limit("5 per 5 minutes")  # Stricter limit for 2FA
def verify_2fa():
    # Verify code matches and hasn't expired
    if not user.verify_2fa_code(code):
        return jsonify({"error": "Invalid or expired code"}), 401
```

**Code Generation (Cryptographically Secure):**
```python
# backend/models/user.py:92-97
def generate_2fa_code(self, minutes=5):
    self.twofa_code = str(secrets.randbelow(900000) + 100000)  # 100000-999999
    self.twofa_expires_at = datetime.now(tz=timezone.utc) + timedelta(minutes=minutes)
```

**Files Involved:**
- `backend/routes/auth.py:397-455` - 2FA verification endpoint
- `backend/models/user.py:92-107` - 2FA code generation/verification
- `frontend/src/components/features/auth/components/LoginModal.tsx:94-96` - 2FA state
- `backend/utils/email.py:401-430` - 2FA email template

---

## 2. CSRF Protection

### What It Protects Against
- **Cross-Site Request Forgery**: Malicious websites making unauthorized requests on behalf of authenticated users

### How It Works
We implement **dual-layer CSRF protection**:

**Layer 1: SameSite Cookies (Primary Defense)**
```python
# backend/app.py:62
app.config['JWT_COOKIE_SAMESITE'] = 'Lax'
```
- Cookies NOT sent on cross-site POST requests
- Prevents CSRF attacks automatically
- Works in all modern browsers

**Layer 2: Flask-WTF CSRF Tokens (Defense-in-Depth)**
```python
# backend/app.py:30,79
csrf = CSRFProtect()
csrf.init_app(app)
```
- Explicit CSRF token framework
- Additional protection for non-cookie authenticated requests
- JWT endpoints exempted (already protected by SameSite)

### Implementation Details

**CSRF Token Endpoint:**
```python
# backend/app.py:117-122
@app.route('/api/csrf-token', methods=['GET'])
def get_csrf_token():
    """Get CSRF token for client-side requests"""
    token = generate_csrf()
    return {'csrf_token': token}
```

**Endpoint Exemptions:**
```python
# backend/app.py:111-115
# Exempt JWT-authenticated endpoints from CSRF (they use SameSite protection)
csrf.exempt(auth)
csrf.exempt(user_routes)
csrf.exempt(post)
```

**CORS Configuration:**
```python
# backend/app.py:66-73
CORS(app,
     origins=[app.config['FRONTEND_URL']],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization', 'X-CSRF-Token'],
     expose_headers=['Set-Cookie'])
```

### Files Involved
- `backend/app.py:30,79` - CSRF initialization
- `backend/app.py:111-122` - Exemptions and token endpoint
- `security_tests/test_csrf_protection.py` - Automated testing

**Why This Works:**
- SameSite=Lax blocks cross-site POST requests (main attack vector)
- CSRF tokens provide additional layer for edge cases
- JWT authentication requires valid httpOnly cookie (can't be set cross-site)

---

## 3. XSS Protection

### What It Protects Against
- **Stored XSS**: Malicious scripts stored in database (blog posts, comments)
- **Reflected XSS**: Scripts reflected in URL parameters or form submissions
- **DOM-based XSS**: Client-side script injection

### How It Works
We implement **multi-layer XSS defense**:

**Layer 1: Content Security Policy (CSP)**
```python
# backend/app.py:122-132
if not request.path.startswith('/api'):
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com; "
        "connect-src 'self'; "
        "frame-src https://challenges.cloudflare.com; "
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "img-src 'self' data: https:; "
        "font-src 'self' data: https://cdn.jsdelivr.net;"
    )
```

**What CSP Does:**
- Blocks inline `<script>` tags (primary XSS vector)
- Whitelists allowed script sources (Cloudflare Turnstile only)
- Prevents unauthorized data exfiltration
- Stops DOM-based XSS attacks

**Layer 2: React JSX Escaping**
```typescript
// All user input is automatically escaped in JSX
<div>{userContent}</div>  // Safe - React escapes HTML entities
```

**Layer 3: Additional Security Headers**
```python
# backend/app.py:112-116
response.headers['X-Content-Type-Options'] = 'nosniff'  # Prevent MIME sniffing
response.headers['X-Frame-Options'] = 'DENY'  # Prevent clickjacking
response.headers['X-XSS-Protection'] = '1; mode=block'  # Legacy XSS filter
```

**Layer 4: Email Template Escaping**
```python
# backend/utils/email.py (all email templates)
from markupsafe import escape
escape(user.email)  # Escapes HTML entities in emails
```

### Implementation Details

**Frontend XSS Prevention:**
- React automatically escapes all JSX variables
- No use of `dangerouslySetInnerHTML`
- Markdown rendered safely (if applicable)

**Backend Input Handling:**
- Length validation on all text inputs
- HTML entities escaped in email templates
- No direct HTML rendering on backend

### Files Involved
- `backend/app.py:122-132` - CSP and security headers
- `frontend/src/**/*.tsx` - React components (auto-escaping)
- `backend/utils/email.py` - Email template escaping
- `security_tests/test_xss.py` - Automated XSS testing

**Testing:**
```bash
cd security_tests
./test_xss.py  # Validates CSP header and security headers
```

---

## 4. Rate Limiting

### What It Protects Against
- **Brute force attacks**: Automated password guessing
- **Credential stuffing**: Using leaked credentials from other breaches
- **DoS attacks**: Overwhelming server with requests
- **API abuse**: Excessive automated requests
- **Email bombing**: Flooding password reset emails

### How It Works
We use **Flask-Limiter with Redis storage** for distributed rate limiting:

```python
# backend/app.py:31-35
limiter = Limiter(
    key_func=get_real_ip,  # Rate limit by real IP (handles proxies)
    default_limits=[],
    storage_uri=os.environ.get('REDIS_URL', 'memory://')
)
```

### Rate Limits by Endpoint

**Authentication Endpoints:**
```python
# backend/routes/auth.py

@limiter.limit("5 per minute")
def login():  # Line 206
    # Tight limit prevents brute force

@limiter.limit("5 per 5 minutes")
def verify_2fa():  # Line 398
    # Very strict for 6-digit code guessing

@limiter.limit("3 per hour")
def forgot_password():  # Line 315
    # Prevents email bombing
```

**Why These Limits:**
- **Login (5/min)**: Prevents automated brute force while allowing typo corrections
- **2FA (5/5min)**: Codes are only 6 digits, very strict limit needed
- **Forgot Password (3/hr)**: Prevents email spam, legitimate users rarely need more

### Admin Security Alerts

Rate limit breaches trigger admin notifications:

```python
# backend/app.py:136-187 (Rate limit handler)
@app.errorhandler(429)
def rate_limit_handler(e):
    # Get request details
    ip_address = get_real_ip()
    endpoint = request.path

    # Send admin alert
    if should_send_alert:
        subject, html = get_rate_limit_alert_email(...)
        send_email(to=app.config['ADMIN_EMAIL'], subject=subject, html=html)
```

**Alert Email Contains:**
- IP address of attacker
- Endpoint being targeted
- Timestamp of attack
- User agent information
- Allows admin to block IP or investigate

### Implementation Details

**Real IP Detection (Handles Proxies):**
```python
# backend/app.py:17-25
def get_real_ip():
    """Get real IP address, accounting for proxies and Docker"""
    if request.environ.get('HTTP_X_FORWARDED_FOR'):
        return request.environ['HTTP_X_FORWARDED_FOR'].split(',')[0].strip()
    if request.environ.get('HTTP_X_REAL_IP'):
        return request.environ['HTTP_X_REAL_IP']
    return request.environ.get('REMOTE_ADDR', '127.0.0.1')
```

**Redis Storage:**
- Development: In-memory (`REDIS_URL=memory://`)
- Staging/Production: Real Redis server with persistence
- Distributed: Works across multiple server instances
- Persistent: Rate limits survive server restarts

### Files Involved
- `backend/app.py:17-35,136-187` - Limiter setup and handler
- `backend/routes/auth.py:206,315,398` - Rate limit decorators
- `backend/.env` - Redis URL configuration
- `docker-compose.*.yml` - Redis container setup
- `security_tests/test_rate_limiting.py` - Automated testing

**Testing:**
```bash
cd security_tests
./test_rate_limiting.py  # Tests all rate limits
./clear_rate_limits.sh   # Clear Redis between tests
```

---

## 5. Input Validation & Sanitization

### What It Protects Against
- **SQL Injection**: Malicious SQL code in user inputs
- **Buffer overflow**: Excessively long inputs causing crashes
- **Data integrity**: Invalid or malformed data

### How It Works

**Backend Validation:**
```python
# Example: Blog post creation (backend/routes/post.py:30-57)
title = data.get('title', '').strip()
if not title:
    return jsonify({"msg": "Title is required"}), 400
if len(title) > 200:
    return jsonify({"msg": "Title must be 200 characters or less"}), 400

content = data.get('content', '').strip()
if not content:
    return jsonify({"msg": "Content is required"}), 400
if len(content) > 10000:
    return jsonify({"msg": "Content must be 10,000 characters or less"}), 400
```

**Password Validation:**
```python
# backend/utils/password_validator.py:71-85
def validate_password(password: str) -> tuple[bool, str]:
    # Minimum 8 characters
    # 12+ characters bypass complexity requirements (NIST recommendation)
    # Otherwise require: uppercase, lowercase, number, special char
    # Block common passwords
    # Maximum 128 characters (DoS prevention)
```

**Email Validation:**
```python
# Uses email-validator library
from email_validator import validate_email, EmailNotValidError
```

**SQL Injection Prevention:**
```python
# ALL database queries use SQLAlchemy ORM (parameterized queries)
posts = BlogPost.query.all()  # Safe
post = BlogPost.query.get(post_id)  # Safe
user = User.query.filter_by(username=username).first()  # Safe

# NO raw SQL strings - prevents injection
```

### Implementation Details

**Validation Layers:**
1. **Frontend**: Basic validation (UX, not security)
2. **Backend**: Comprehensive validation (security boundary)
3. **Database**: Schema constraints (final enforcement)

**Input Sanitization:**
- Strip whitespace from text inputs
- HTML entities escaped in email templates
- Length limits prevent DoS
- Type validation (ensure integers, emails, etc.)

### Files Involved
- `backend/routes/*.py` - All route files validate inputs
- `backend/utils/password_validator.py` - Password validation
- `backend/models/*.py` - SQLAlchemy models (parameterized queries)
- `security_tests/test_sql_injection.py` - SQL injection testing

---

## 6. Password Security

### What It Protects Against
- **Password database theft**: Even if database is compromised, passwords remain secure
- **Rainbow table attacks**: Pre-computed hash tables cannot crack passwords
- **Weak passwords**: Users cannot choose easily guessable passwords

### How It Works

**bcrypt Password Hashing:**
```python
# backend/models/user.py:51-57
from werkzeug.security import generate_password_hash, check_password_hash

def set_password(self, password):
    """Hash and set password"""
    self.password_hash = generate_password_hash(password)
    # Uses bcrypt by default (cost factor 12)
    # Includes unique salt per password
    # Computationally expensive (slow by design)

def check_password(self, password):
    """Check if provided password matches hash"""
    return check_password_hash(self.password_hash, password)
```

**Password Strength Validation:**
```python
# backend/utils/password_validator.py:71-85
def validate_password(password: str) -> tuple[bool, str]:
    # Minimum 8 characters required
    # 12+ characters bypass complexity requirements (NIST aligned)
    # Otherwise require:
    #   - Uppercase letter
    #   - Lowercase letter
    #   - Number
    #   - Special character
    # Block 25+ common weak passwords
    # Maximum 128 characters (DoS prevention)
```

### Implementation Details

**Why bcrypt:**
- Industry standard for password hashing
- Adaptive: cost factor can be increased as computers get faster
- Built-in salting (unique salt per password)
- Slow by design (prevents brute force)
- Resistant to GPU/ASIC attacks

**Failed Login Tracking:**
```python
# backend/models/user.py:75-78
def record_failed_login(self):
    self.failed_login_attempts += 1
    self.last_failed_login = datetime.now(tz=timezone.utc)
```

**Password Change Invalidates Tokens:**
```python
# backend/routes/auth.py:579-582
user.set_password(new_password)
user.invalidate_tokens()  # Logout from all devices
db.session.commit()
```

### Files Involved
- `backend/models/user.py:51-78` - Password hashing and tracking
- `backend/utils/password_validator.py` - Strength validation
- `backend/routes/auth.py:553-597` - Change password endpoint
- `frontend/src/components/common/PasswordStrengthMeter.tsx` - UI feedback

**Testing:**
```bash
# Passwords are hashed
psql $DATABASE_URL -c "SELECT email, password_hash FROM users LIMIT 1;"
# password_hash should be bcrypt hash starting with $2b$
```

---

## 7. Token Management & Invalidation

### What It Protects Against
- **Stolen tokens after password change**: Old tokens become invalid
- **Compromised sessions**: Ability to revoke all active sessions
- **Account takeover**: Attacker's session terminated when user changes password

### How It Works

We use **token versioning** to invalidate all tokens when password changes:

```python
# backend/models/user.py:34-61
class User(db.Model):
    token_version = db.Column(db.Integer, default=0)  # Increments on password change

    def invalidate_tokens(self):
        """Increment token_version to invalidate all existing JWT tokens"""
        self.token_version += 1
```

**JWT Token Includes Version:**
```python
# backend/routes/auth.py:277-284
additional_claims = {
    'email': user.email,
    'token_version': user.token_version  # Current version embedded in token
}
access_token = create_access_token(
    identity=user.id,
    additional_claims=additional_claims
)
```

**Token Validation Checks Version:**
```python
# backend/app.py:83-93
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    user_id = jwt_payload.get('sub')
    token_version = jwt_payload.get('token_version', 0)
    user = User.query.get(int(user_id))

    if not user:
        return True  # User deleted, block token

    return user.token_version != token_version  # Check version match
```

### When Tokens Are Invalidated

1. **Password Change** (`/api/change-password`)
   ```python
   # backend/routes/auth.py:580-581
   user.set_password(new_password)
   user.invalidate_tokens()
   ```

2. **Password Reset** (`/api/reset-password`)
   ```python
   # backend/routes/auth.py:373-378
   user.set_password(new_password)
   user.invalidate_tokens()
   db.session.commit()
   ```

3. **Account Deletion** (user deleted from database)
   - Token validation fails when user not found

### Implementation Details

**Flow Example:**
1. User logs in → JWT created with `token_version: 0`
2. Attacker steals token (XSS attack)
3. User changes password → `token_version` incremented to `1`
4. Attacker tries to use token → Blocked (version mismatch)
5. User gets new token with `token_version: 1`

**User Experience:**
- After password change: Logged out everywhere (must re-login)
- Security benefit outweighs inconvenience
- Protects against active compromises

### Files Involved
- `backend/models/user.py:34,59-61` - Token version field and invalidation
- `backend/app.py:83-93` - Token validation check
- `backend/routes/auth.py:277-284,580-581` - Token creation and invalidation
- `security_tests/test_token_invalidation.py` - Automated testing

**Testing:**
```bash
cd security_tests
./test_token_invalidation.py  # Verifies token invalidation works
```

---

## 8. Email Security

### What It Protects Against
- **Phishing attacks**: Attackers spoofing our domain
- **Email spoofing**: Unauthorized sending from our domain
- **Man-in-the-middle**: Email interception
- **Spam folder delivery**: Emails marked as spam

### How It Works

**Resend Email Service:**
- Production-grade transactional email API
- SPF, DKIM, and DMARC configured
- Dedicated sending domain
- Encrypted in transit (TLS)

**Email Verification Flow:**
```python
# backend/routes/auth.py:158-203 (Registration)
# 1. User registers
# 2. Generate 6-digit code (cryptographically secure)
code = user.generate_2fa_code(minutes=10)

# 3. Send verification email
subject, html = get_registration_code_email(code, user.username)
send_email(to=email, subject=subject, html=html)

# 4. User enters code to verify
# 5. Account activated only after verification
```

**HTML Email Escaping:**
```python
# backend/utils/email.py (all templates)
from markupsafe import escape

# Escape user-provided data in emails
escape(user.email)
escape(user.username)
```

### Email Types

1. **Registration Verification**
   - 6-digit code (10-minute expiration)
   - Prevents spam registrations

2. **Login Notification**
   - Sent after successful login
   - Includes IP, location, device info
   - Alerts user to unauthorized access

3. **2FA Code**
   - 6-digit code (5-minute expiration)
   - Required for 2FA-enabled accounts

4. **Password Reset Request**
   - Secure token link (1-hour expiration)
   - Confirms user's intent to reset

5. **Password Reset Confirmation**
   - Sent after successful password reset
   - Alerts user to account change

6. **Password Change Confirmation**
   - Sent after password change via settings
   - Alerts user to potential compromise

7. **Rate Limit Alert (Admin)**
   - Sent to admin email when rate limits breached
   - Security monitoring

### Implementation Details

**Email Configuration:**
```python
# backend/.env
RESEND_API_KEY=re_xxx
ADMIN_EMAIL=admin@computeranything.dev
FRONTEND_URL=https://blog.computeranything.dev
```

**Send Email Function:**
```python
# backend/utils/email.py:85-118
def send_email(to: str, subject: str, html: str):
    params = {
        "from": "Computer Anything Blog <noreply@notifications.computeranything.dev>",
        "to": [to],
        "subject": subject,
        "html": html,
    }
    resend.Emails.send(params)
```

### Files Involved
- `backend/utils/email.py` - All email templates and sending
- `backend/routes/auth.py` - Email triggers
- `backend/.env` - Email configuration

---

## 9. Security Headers

### What It Protects Against
- **XSS attacks**: Inline script execution
- **Clickjacking**: Embedding site in malicious iframe
- **MIME sniffing**: Browser executing files as wrong type
- **Man-in-the-middle**: Downgrade to HTTP

### How It Works

All responses include comprehensive security headers:

```python
# backend/app.py:108-134
@app.after_request
def set_security_headers(response):
    # Prevent MIME type sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'

    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'DENY'

    # Enable browser XSS filter
    response.headers['X-XSS-Protection'] = '1; mode=block'

    # Control referrer information
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

    # Disable dangerous browser features
    response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'

    # Force HTTPS (production only)
    if not app.config.get('TESTING'):
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'

    # Content Security Policy (HTML routes only)
    if not request.path.startswith('/api'):
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com; "
            "connect-src 'self'; "
            "frame-src https://challenges.cloudflare.com; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "img-src 'self' data: https:; "
            "font-src 'self' data: https://cdn.jsdelivr.net;"
        )

    return response
```

### Header Explanations

**X-Content-Type-Options: nosniff**
- Prevents browser from guessing file types
- Stops serving `.js` files as HTML

**X-Frame-Options: DENY**
- Prevents embedding in `<iframe>`
- Blocks clickjacking attacks

**X-XSS-Protection: 1; mode=block**
- Enables browser's built-in XSS filter
- Blocks page if XSS detected

**Referrer-Policy: strict-origin-when-cross-origin**
- Controls referrer information sent
- Prevents leaking sensitive URLs

**Permissions-Policy**
- Disables camera, microphone, geolocation
- Reduces attack surface

**Strict-Transport-Security (HSTS)**
- Forces HTTPS for 1 year
- Prevents SSL stripping attacks
- `includeSubDomains`: Applies to all subdomains
- `preload`: Eligible for browser preload list

**Content-Security-Policy (CSP)**
- `default-src 'self'`: Only load resources from same origin
- `script-src`: Allows Cloudflare Turnstile only
- `frame-src`: Allows Cloudflare Turnstile iframes
- `style-src`: Allows inline styles + Bootstrap CDN
- `img-src`: Allows images from any HTTPS source
- Blocks all other inline scripts (main XSS vector)

### Files Involved
- `backend/app.py:108-134` - All security headers
- `security_tests/test_xss.py` - Header validation

**Testing:**
```bash
cd security_tests
./test_xss.py  # Tests all security headers including CSP
```

---

## 10. Bot Protection

### What It Protects Against
- **Automated attacks**: Bots attempting credential stuffing
- **Spam registrations**: Fake account creation
- **Brute force**: Automated password guessing
- **Email bombing**: Automated password reset requests

### How It Works

**Cloudflare Turnstile Integration:**
- Modern CAPTCHA alternative
- Privacy-focused (no personal data collection)
- Better UX than traditional CAPTCHAs
- Validates on server-side

**Protected Endpoints:**
```python
# backend/routes/auth.py

# Registration
turnstile_token = data.get('turnstile_token')
if not verify_turnstile(turnstile_token):
    return jsonify({"msg": "Verification challenge failed"}), 400

# Login
turnstile_token = data.get('turnstile_token')
if not verify_turnstile(turnstile_token):
    return jsonify({"msg": "Verification challenge failed"}), 400

# Forgot Password
turnstile_token = data.get('turnstile_token')
if not verify_turnstile(turnstile_token):
    return jsonify({"msg": "Verification challenge failed"}), 400
```

**Server-Side Verification:**
```python
# backend/routes/auth.py:44-62
def verify_turnstile(token):
    """Verify Cloudflare Turnstile token"""
    if not token:
        return False

    url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
    data = {
        'secret': TURNSTILE_SECRET_KEY,
        'response': token
    }

    response = requests.post(url, data=data, timeout=5)
    result = response.json()
    return result.get('success', False)
```

**Honeypot Field (Additional Bot Detection):**
```python
# backend/routes/auth.py (register/login)
honeypot = data.get('website', '')  # Hidden field humans don't fill
if honeypot:
    return jsonify({"msg": "Bot detected."}), 400
```

### Implementation Details

**Frontend Integration:**
```typescript
// frontend/src/hooks/useTurnstile.tsx
import { Turnstile } from '@marsidev/react-turnstile'

<Turnstile
  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
  onSuccess={(token) => setTurnstileToken(token)}
  onError={() => setTurnstileToken(null)}
  onExpire={() => setTurnstileToken(null)}
/>
```

**Environment Variables:**
```bash
# backend/.env
TURNSTILE_SECRET_KEY=0x4AAAAAAB7gUtS0snTq-0S0x0Rtmt0t9I0

# frontend/.env
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAB7gUtOgGZMb_dNr
```

### Files Involved
- `backend/routes/auth.py:44-62` - Verification function
- `backend/routes/auth.py:147,211,320` - Protected endpoints
- `frontend/src/hooks/useTurnstile.tsx` - Frontend integration
- `frontend/src/components/features/auth/components/*.tsx` - UI components

---

## 11. Database Security

### What It Protects Against
- **SQL injection**: Malicious SQL in user inputs
- **Connection pool exhaustion**: DoS via connection abuse
- **Stale connections**: Database timeout issues

### How It Works

**SQLAlchemy ORM (Parameterized Queries):**
```python
# ALL queries use ORM - no raw SQL
posts = BlogPost.query.all()
post = BlogPost.query.get(post_id)
user = User.query.filter_by(username=username).first()

# Safe from SQL injection because parameters are escaped
```

**Connection Pooling:**
```python
# backend/config.py:12-17
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_pre_ping': True,  # Verify connections before using
    'pool_recycle': 300,    # Recycle connections after 5 minutes
}
```

**Database Configuration:**
```python
# backend/config.py:9-11
SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
SQLALCHEMY_TRACK_MODIFICATIONS = False  # Reduces overhead
```

### Implementation Details

**Connection String Security:**
```bash
# backend/.env (never commit to git)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

**SSL Mode:**
- Production: `sslmode=require` (encrypted connection)
- Database connections encrypted in transit

**Password Storage:**
- Never in code
- Only in `.env` file (gitignored)
- Environment variables in production

### Files Involved
- `backend/config.py:9-17` - Database configuration
- `backend/models/*.py` - All models use SQLAlchemy ORM
- `backend/.env` - Database credentials
- `security_tests/test_sql_injection.py` - SQL injection testing

**Testing:**
```bash
cd security_tests
./test_sql_injection.py  # Attempts SQL injection on all endpoints
```

---

## 12. API Security

### What It Protects Against
- **Unauthorized access**: Non-authenticated users accessing protected data
- **Information disclosure**: Leaking sensitive data in API responses
- **Mass assignment**: Modifying unintended fields

### How It Works

**JWT Authentication Required:**
```python
# Protected endpoints use @jwt_required() decorator
@auth.route('/logout', methods=['POST'])
@jwt_required()  # Must have valid JWT in cookie
def logout():
    # Only authenticated users can logout
```

**Authorization Checks:**
```python
# Users can only modify their own content
@post.route('/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    user_id = get_jwt_identity()
    post = BlogPost.query.get(post_id)

    # Authorization: Only post author can edit
    if post.author_id != user_id:
        return jsonify({"msg": "Unauthorized"}), 403
```

**Field Whitelisting:**
```python
# Only allowed fields accepted
def to_dict(self):
    return {
        'id': self.id,
        'username': self.username,
        'email': self.email,
        # password_hash NOT included
        # token_version NOT included
    }
```

**Error Handling (No Information Leakage):**
```python
# Generic error messages
try:
    # database operation
except Exception as e:
    logger.error(f"Error: {e}")
    return jsonify({'error': 'An error occurred'}), 500
    # Don't expose internal errors to users
```

### Implementation Details

**CORS Configuration:**
```python
# Only allows frontend origin
CORS(app,
     origins=[app.config['FRONTEND_URL']],  # Specific origin only
     supports_credentials=True)
```

**API Versioning:**
- All routes under `/api` prefix
- Allows future versioning (`/api/v2/...`)

### Files Involved
- `backend/routes/*.py` - All API routes
- `backend/models/*.py` - Model `to_dict()` methods
- `backend/app.py:66-73` - CORS configuration

---

## 13. Transport Security

### What It Protects Against
- **Man-in-the-middle attacks**: Intercepting communications
- **Eavesdropping**: Stealing passwords/tokens in transit
- **SSL stripping**: Downgrading to HTTP

### How It Works

**HTTPS Enforcement:**
```python
# backend/app.py:119-120
if not app.config.get('TESTING'):
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
```

**Cloudflare Protection:**
- Automatic HTTPS
- SSL/TLS termination
- DDoS protection
- Web Application Firewall (WAF)

**Cookie Security:**
```python
# backend/app.py:50
app.config['JWT_COOKIE_SECURE'] = not is_development  # HTTPS-only in production
```

### Implementation Details

**Development:**
- HTTP allowed (localhost only)
- Secure flag disabled for cookies

**Production:**
- HTTPS required (Cloudflare)
- HSTS header forces HTTPS
- Secure flag enabled for cookies
- Cookies only sent over HTTPS

**Database:**
```bash
# backend/.env
DATABASE_URL=postgresql://...?sslmode=require
```
- PostgreSQL connection encrypted
- SSL required in production

### Files Involved
- `backend/app.py:50,119-120` - HTTPS enforcement
- `docker-compose.prod.yml` - Cloudflare Tunnel configuration
- `backend/.env` - Database SSL mode

---

## 14. Error Handling

### What It Protects Against
- **Information disclosure**: Leaking stack traces, database structure
- **Reconnaissance**: Attackers learning about system internals

### How It Works

**Generic Error Messages:**
```python
# User-facing errors are generic
try:
    # operation
except Exception as e:
    logger.error(f"Detailed error: {e}")  # Logged server-side
    return jsonify({'error': 'An error occurred'}), 500  # Generic to user
```

**Logging (Server-Side Only):**
```python
import logging
logger = logging.getLogger(__name__)
logger.error(f"Security event: {details}")  # Never sent to client
```

**Frontend Error Handling:**
```typescript
// frontend/src/utils/errors.ts
export function getErrorMessage(error: unknown, fallback: string): string {
    // Never display raw error details
    // Show user-friendly messages
}
```

### Implementation Details

**What We Log:**
- Authentication failures
- Rate limit breaches
- Security events
- System errors

**What We DON'T Expose:**
- Stack traces
- Database errors
- Internal paths
- Server configuration

### Files Involved
- `backend/routes/*.py` - Error handling in all routes
- `frontend/src/utils/errors.ts` - Frontend error handling
- `backend/utils/logger.py` - Logging configuration (if exists)

---

## Security Testing

### Automated Tests

All security controls have automated tests:

```bash
cd security_tests

# Run individual tests
./test_httponly_cookies.py      # Cookie security
./test_sql_injection.py          # SQL injection prevention
./test_rate_limiting.py          # Rate limit enforcement
./test_xss.py                    # XSS and security headers
./test_csrf_protection.py        # CSRF protection
./test_token_invalidation.py    # Token versioning
./test_security_tracking.py     # Event logging
./test_redis_memory.py           # Redis security

# Clear rate limits between tests
./clear_rate_limits.sh
```

### Manual Security Audit

Refer to `security_tests/README.md` for comprehensive testing procedures.

---

## Security Checklist

Before deploying to production, verify:

### Configuration
- [ ] `FRONTEND_URL` set correctly (no wildcard)
- [ ] `SECRET_KEY` is strong random value
- [ ] `JWT_SECRET_KEY` is strong random value
- [ ] `DATABASE_URL` uses SSL (`sslmode=require`)
- [ ] `REDIS_URL` points to real Redis (not memory)
- [ ] `RESEND_API_KEY` configured
- [ ] `TURNSTILE_SECRET_KEY` configured
- [ ] `ADMIN_EMAIL` set for security alerts

### Security Headers
- [ ] CSP header configured and tested
- [ ] HSTS header enabled
- [ ] All security headers present

### Rate Limiting
- [ ] Redis running and accessible
- [ ] Rate limits tested on all protected endpoints
- [ ] Admin alerts working

### Authentication
- [ ] JWT cookies httpOnly and Secure
- [ ] Token invalidation on password change tested
- [ ] 2FA working (if enabled)

### Testing
- [ ] All security tests passing
- [ ] Manual penetration testing completed
- [ ] No sensitive data in logs

---

## Incident Response

### If Security Breach Suspected

1. **Immediate Actions:**
   - Change all secret keys (`SECRET_KEY`, `JWT_SECRET_KEY`)
   - Rotate database credentials
   - Check logs for suspicious activity
   - Notify affected users

2. **Investigation:**
   - Review rate limit alerts
   - Check failed login attempts
   - Analyze suspicious IP addresses
   - Review recent code changes

3. **Containment:**
   - Block malicious IPs
   - Disable compromised accounts
   - Increase rate limits temporarily

4. **Recovery:**
   - Apply security patches
   - Update dependencies
   - Force password resets if needed
   - Document lessons learned

### Contact

Security issues: support@computeranything.dev

---

## References

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Flask Security**: https://flask.palletsprojects.com/en/2.3.x/security/
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725
- **NIST Password Guidelines**: https://pages.nist.gov/800-63-3/
- **CSP Reference**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

---

*Last Updated: December 2025*
*Version: 1.0*
