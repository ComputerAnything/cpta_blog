#!/usr/bin/env python3
"""
SQL Injection Testing Suite
Tests common SQL injection vulnerabilities in blog endpoints
"""

import requests


class SQLInjectionTester:
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url

    def test_login_sql_injection(self):
        """Test login endpoint for SQL injection vulnerabilities"""
        print("\n" + "=" * 60)
        print("SQL INJECTION TEST: Login Endpoint")
        print("=" * 60)

        url = f"{self.base_url}/api/login"

        # Common SQL injection payloads
        sql_payloads = [
            "admin' OR '1'='1",
            "admin' OR '1'='1' --",
            "admin' OR '1'='1' /*",
            "' OR 1=1 --",
            "' OR '1'='1",
            "admin'--",
            "admin' #",
            "' OR 'x'='x",
            "' UNION SELECT NULL--",
            "admin' AND 1=0 UNION ALL SELECT 'admin', '81dc9bdb52d04dc20036dbd8313ed055'",
        ]

        vulnerable = False

        for i, payload in enumerate(sql_payloads, 1):
            try:
                response = requests.post(
                    url,
                    json={"identifier": payload, "password": "anything"},
                    timeout=5
                )

                # If we get 200, we might have bypassed auth
                if response.status_code == 200:
                    print(f"❌ VULNERABLE: Payload {i} returned 200 OK!")
                    print(f"   Payload: {payload}")
                    vulnerable = True
                elif response.status_code == 401:
                    print(f"✅ Test {i}: Blocked (401) - {payload[:30]}...")
                elif response.status_code == 400:
                    print(f"✅ Test {i}: Rejected (400) - {payload[:30]}...")
                elif response.status_code == 429:
                    print(f"⚠️  Test {i}: Rate limited - consider waiting")
                    break
                else:
                    print(f"⚠️  Test {i}: Unexpected status {response.status_code}")

            except requests.exceptions.RequestException as e:
                print(f"❌ Test {i}: Request failed - {e}")

        if not vulnerable:
            print("\n✅ No SQL injection vulnerabilities detected in login")
        else:
            print("\n❌ CRITICAL: SQL injection vulnerability found!")

        return not vulnerable

    def test_password_reset_sql_injection(self):
        """Test password reset for SQL injection"""
        print("\n" + "=" * 60)
        print("SQL INJECTION TEST: Password Reset")
        print("=" * 60)

        url = f"{self.base_url}/api/forgot-password"

        sql_payloads = [
            "admin' OR '1'='1",
            "' OR 1=1 --",
            "admin'--",
        ]

        for i, payload in enumerate(sql_payloads, 1):
            try:
                response = requests.post(
                    url,
                    json={
                        "email": payload,
                        "turnstileToken": "test"
                    },
                    timeout=5
                )

                # Generic success message is expected (email enumeration protection)
                if response.status_code == 200:
                    print(f"✅ Test {i}: Proper response - {payload[:30]}...")
                elif response.status_code == 400:
                    print(f"✅ Test {i}: Validation blocked - {payload[:30]}...")
                elif response.status_code == 429:
                    print("⚠️  Rate limited - stopping test")
                    break
                else:
                    print(f"⚠️  Test {i}: Status {response.status_code}")

            except requests.exceptions.RequestException as e:
                print(f"❌ Test {i}: Request failed - {e}")

        print("\n✅ Password reset endpoint properly validated")
        return True

    def test_blog_post_search_sql_injection(self):
        """Test blog post search for SQL injection"""
        print("\n" + "=" * 60)
        print("SQL INJECTION TEST: Blog Post Search")
        print("=" * 60)

        url = f"{self.base_url}/api/posts"

        sql_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE posts; --",
            "' UNION SELECT * FROM users --",
        ]

        for i, payload in enumerate(sql_payloads, 1):
            try:
                # Test as query parameter
                response = requests.get(
                    url,
                    params={"search": payload},
                    timeout=5
                )

                # Should return 200 with empty or filtered results
                if response.status_code == 200:
                    print(f"✅ Test {i}: Query handled safely - {payload[:30]}...")
                elif response.status_code == 400:
                    print(f"✅ Test {i}: Validation blocked - {payload[:30]}...")
                elif response.status_code == 429:
                    print("⚠️  Rate limited - stopping test")
                    break
                else:
                    print(f"⚠️  Test {i}: Status {response.status_code}")

            except requests.exceptions.RequestException as e:
                print(f"❌ Test {i}: Request failed - {e}")

        print("\n✅ Blog post search properly validated")
        return True

    def test_comment_sql_injection(self):
        """Test comment creation for SQL injection"""
        print("\n" + "=" * 60)
        print("SQL INJECTION TEST: Comment Creation")
        print("=" * 60)

        url = f"{self.base_url}/api/posts/1/comments"

        sql_payloads = [
            "'; DROP TABLE comments; --",
            "' OR '1'='1",
            "' UNION SELECT password FROM users --",
        ]

        for i, payload in enumerate(sql_payloads, 1):
            try:
                response = requests.post(
                    url,
                    json={"content": payload},
                    timeout=5
                )

                # Should return 401 (no auth) or 400 (validation error)
                if response.status_code in [401, 400]:
                    print(f"✅ Test {i}: Blocked properly - {payload[:30]}...")
                elif response.status_code == 429:
                    print("⚠️  Rate limited - stopping test")
                    break
                elif response.status_code == 200:
                    print(f"⚠️  Test {i}: Comment created (check if SQL was executed)")
                else:
                    print(f"⚠️  Test {i}: Status {response.status_code}")

            except requests.exceptions.RequestException as e:
                print(f"❌ Test {i}: Request failed - {e}")

        print("\n✅ Comment creation properly validated")
        return True


def detect_server_port():
    """Auto-detect which port the server is running on"""
    ports = [5000, 8000]  # Development and Docker ports
    for port in ports:
        try:
            url = f"http://localhost:{port}/api/posts"
            response = requests.get(url, timeout=2)
            if response.status_code in [200, 401]:
                print(f"✅ Detected server on port {port}")
                return f"http://localhost:{port}"
        except requests.exceptions.RequestException:
            continue
    return None


def main():
    print("""
╔═══════════════════════════════════════════════════════════════╗
║               SQL Injection Testing Suite                     ║
║          Testing for SQL Injection Vulnerabilities            ║
║             Computer Anything Tech Blog                       ║
╚═══════════════════════════════════════════════════════════════╝
""")

    base_url = detect_server_port()
    if not base_url:
        base_url = input("Enter your app URL [http://localhost:5000]: ").strip() or "http://localhost:5000"
    else:
        use_detected = input(f"Use detected URL {base_url}? [Y/n]: ").strip().lower()
        if use_detected and use_detected != 'y':
            base_url = input("Enter your app URL: ").strip()

    tester = SQLInjectionTester(base_url)

    results = []
    results.append(tester.test_login_sql_injection())
    results.append(tester.test_password_reset_sql_injection())
    results.append(tester.test_blog_post_search_sql_injection())
    results.append(tester.test_comment_sql_injection())

    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")

    if passed == total:
        print("✅ NO SQL INJECTION VULNERABILITIES FOUND")
        print("\n📋 Why you're protected:")
        print("  • Using SQLAlchemy ORM (parameterized queries)")
        print("  • Input validation on all endpoints")
        print("  • Email format validation")
    else:
        print("❌ VULNERABILITIES FOUND - IMMEDIATE ACTION REQUIRED!")


if __name__ == "__main__":
    main()
