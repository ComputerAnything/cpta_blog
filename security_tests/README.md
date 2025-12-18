# Security Tests

Automated security tests for validating protection against common vulnerabilities.

## Overview

This directory contains specialized security tests separate from the main application tests. These tests validate that security controls are working correctly and the application is protected against OWASP Top 10 vulnerabilities.

## Test Files

| File | Purpose | Validates |
|------|---------|-----------|
| `test_sql_injection.py` | SQL injection protection | SQLAlchemy ORM prevents SQL injection |
| `test_xss.py` | Cross-site scripting prevention | React escapes user input, CSP headers |
| `test_csrf_protection.py` | CSRF token validation | SameSite cookies prevent CSRF |
| `test_rate_limiting.py` | Rate limit enforcement | Flask-Limiter blocks excessive requests |
| `test_httponly_cookies.py` | Secure cookie configuration | JWT tokens in httpOnly cookies |
| `test_token_invalidation.py` | JWT token revocation | Tokens invalidated on password change |
| `test_security_tracking.py` | Security event logging | Failed logins and violations are logged |
| `test_redis_memory.py` | Redis security | Rate limit storage works correctly |

## Prerequisites

### 1. Activate Virtual Environment

All tests require the virtual environment to be activated:

```bash
# From project root
source venv/bin/activate
```

### 2. Start Staging Environment (Recommended)

Security tests are designed to run against the staging environment:

```bash
# From project root
docker compose -f docker-compose.staging.yml up -d
```

This starts:
- Backend server (Flask API)
- PostgreSQL database
- Redis (for rate limiting)
- Frontend (React app)

### 3. Alternative: Local Development Server

You can also test against local development:

```bash
cd backend
python run.py
```

**Note**: Some tests (like Redis memory tests) require Docker staging environment.

---

## Running Tests

### Interactive Python Scripts (Recommended)

Most tests are interactive scripts that test against your running server:

```bash
# Activate venv first
source venv/bin/activate

# Navigate to security_tests
cd security_tests

# Run individual tests
./test_httponly_cookies.py
./test_sql_injection.py
./test_rate_limiting.py
./test_xss.py
./test_csrf_protection.py
./test_token_invalidation.py
./test_security_tracking.py
./test_redis_memory.py
```

### Or run with python explicitly:

```bash
python test_httponly_cookies.py
python test_sql_injection.py
# etc...
```

### Clear Rate Limits Between Tests

After running rate limit tests, clear Redis:

```bash
./clear_rate_limits.sh
```

## Test Descriptions

### SQL Injection Protection

**File**: `test_sql_injection.py`

Tests that the application is protected against SQL injection attacks:
- ✅ Parameterized queries via SQLAlchemy ORM
- ✅ Special characters properly escaped
- ✅ No raw SQL string concatenation

**Example attacks tested**:
```python
# Login with SQL injection attempt
email = "admin' OR '1'='1"
password = "anything"
# Should be rejected, not bypass authentication
```

---

### Cross-Site Scripting (XSS)

**File**: `test_xss.py`

Tests that user input is properly sanitized:
- ✅ React automatically escapes JSX variables
- ✅ Content-Security-Policy headers set
- ✅ X-XSS-Protection header enabled
- ✅ User-controlled data doesn't execute as code

**Example attacks tested**:
```javascript
content = "<script>alert('XSS')</script>"
// Should be rendered as text, not executed
```

---

### CSRF Protection

**File**: `test_csrf_protection.py`

Tests CSRF token validation:
- ✅ SameSite=Lax cookies prevent CSRF
- ✅ JWT authentication doesn't rely on cookies alone
- ✅ State-changing operations require valid tokens

**What's tested**:
- Login, registration, password changes
- Blog post creation, editing, deletion
- Comment and vote operations

---

### Rate Limiting

**File**: `test_rate_limiting.py`

Tests that rate limits are enforced:
- ✅ Login attempts limited to 5/minute
- ✅ Registration limited to 3/minute
- ✅ Password reset limited to 3/minute
- ✅ API endpoints have appropriate limits
- ✅ 429 status code returned when limit exceeded

**Limits tested**:
```
/api/login:          5 per minute
/api/register:       3 per minute
/api/forgot-password: 3 per minute
/api/posts:          10 per minute
```

---

### HttpOnly Cookies

**File**: `test_httponly_cookies.py`

Tests secure cookie configuration:
- ✅ JWT tokens stored in httpOnly cookies
- ✅ Secure flag set in production (HTTPS only)
- ✅ SameSite=Lax prevents CSRF
- ✅ Cookies not accessible via JavaScript

---

### Token Invalidation

**File**: `test_token_invalidation.py`

Tests that JWT tokens are revoked when needed:
- ✅ Tokens invalidated after password change
- ✅ Old tokens rejected after user logs out
- ✅ Token version tracking works correctly

**Security benefit**: If user changes password, all existing sessions are terminated.

---

### Security Event Logging

**File**: `test_security_tracking.py`

Tests that security events are properly logged:
- ✅ Failed login attempts logged
- ✅ Rate limit violations tracked
- ✅ Login IP and location tracked
- ✅ Suspicious activity flagged

---

### Redis Memory Security

**File**: `test_redis_memory.py`

Tests Redis configuration for rate limiting:
- ✅ Redis properly stores rate limit data
- ✅ Memory limits enforced
- ✅ LRU eviction policy configured
- ✅ Rate limit counters work correctly

---

## When to Run Security Tests

### Before Every Deployment

```bash
pytest security_tests/ -v
```

All tests must pass before deploying to production.

### After Security-Related Changes

Run relevant tests after modifying:
- Authentication logic
- Rate limiting configuration
- CORS settings
- JWT token handling
- Database queries
- User input handling

---

## Test Environment

Security tests can run in two modes:

### 1. Interactive Tests (Against Running Server)
Most tests are interactive scripts that test your running development server:
- Run against http://localhost:5000 by default
- Auto-detect server port
- Require backend server running
- Test real API endpoints

### 2. Unit Tests (Isolated)
Some tests use pytest fixtures:
- In-memory SQLite database
- Mock Redis (in-memory)
- Isolated Flask test client
- No external API calls

---

## Adding New Security Tests

### 1. Create Test File

```python
# security_tests/test_new_vulnerability.py
#!/usr/bin/env python3
"""
New Vulnerability Testing Suite
"""
import requests


class NewVulnerabilityTester:
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url

    def test_protection(self):
        """Test that attack is prevented"""
        print("\n" + "=" * 60)
        print("TEST: Protection Against Attack")
        print("=" * 60)

        # Attempt attack
        response = requests.post(
            f"{self.base_url}/api/endpoint",
            json={'malicious': 'payload'}
        )

        # Verify protection
        if response.status_code == 400:
            print("✅ Attack blocked")
            return True
        else:
            print("❌ Vulnerable!")
            return False


def main():
    tester = NewVulnerabilityTester()
    results = [tester.test_protection()]

    passed = sum(results)
    print(f"\n✅ Passed: {passed}/{len(results)}")


if __name__ == "__main__":
    main()
```

### 2. Document Test

Add entry to this README with:
- What vulnerability it tests
- What protection it validates
- Example attack scenario

### 3. Make Executable

```bash
chmod +x security_tests/test_new_vulnerability.py
```

---

## Security Test Results

### Expected Results

All security tests should **PASS** in production:

```
✅ test_sql_injection.py - No SQL injection vulnerabilities
✅ test_xss.py - XSS attacks blocked
✅ test_csrf_protection.py - CSRF protection working
✅ test_rate_limiting.py - Rate limits enforced
✅ test_httponly_cookies.py - Secure cookies configured
✅ test_token_invalidation.py - Token revocation works
✅ test_security_tracking.py - Security events logged
✅ test_redis_memory.py - Redis rate limiting works
```

### Failures

If any security test fails:
1. **DO NOT deploy to production**
2. Investigate the failure immediately
3. Fix the security issue
4. Re-run all security tests
5. Only deploy after all tests pass

---

## Security Testing Best Practices

1. **Run tests before every deployment**
2. **Never skip failing security tests**
3. **Add tests for new security features**
4. **Review test coverage regularly**
5. **Keep tests updated with new threats**

---

## OWASP Top 10 Coverage

| Vulnerability | Tested | Protection |
|---------------|--------|------------|
| A01 Broken Access Control | ✅ | JWT authentication, route protection |
| A02 Cryptographic Failures | ✅ | HTTPS only, secure cookies, bcrypt hashing |
| A03 Injection | ✅ | SQLAlchemy ORM, parameterized queries |
| A04 Insecure Design | ✅ | Rate limiting, input validation |
| A05 Security Misconfiguration | ✅ | Security headers, secure defaults |
| A06 Vulnerable Components | ⚠️ | Dependencies checked (manual process) |
| A07 Identification Failures | ✅ | Strong password policy, email verification |
| A08 Software Integrity Failures | ✅ | Code review, git commits |
| A09 Logging Failures | ✅ | Security events logged |
| A10 Server-Side Request Forgery | ✅ | No user-controlled URLs |

---

## Utilities

### Clear Rate Limits

Reset Redis rate limit counters:

```bash
./clear_rate_limits.sh
```

Use this after running rate limit tests to reset counters.

---

## Reporting Security Issues

If you discover a security vulnerability:
1. **DO NOT** open a public GitHub issue
2. Email: contact@computeranything.dev
3. Include: Description, steps to reproduce, impact
4. Wait for response before public disclosure

---

**Last Updated**: December 2024
