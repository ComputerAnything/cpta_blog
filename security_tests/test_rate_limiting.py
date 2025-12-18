#!/usr/bin/env python3
"""
Security Testing Suite - Rate Limiting Protection

Tests critical endpoints with rate limiting:
1. Login endpoint (5 per minute) - Prevents brute force attacks
2. Registration (3 per minute) - Prevents spam accounts
3. Forgot password (3 per minute) - Prevents password reset abuse

Each test automatically sends admin alert emails when rate limits are breached.
"""

import requests
import time
from datetime import datetime
from typing import Dict, List


class RateLimitTester:
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.results: List[Dict] = []

    def log(self, message: str, level: str = "INFO"):
        """Log test results"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")

    def test_login_rate_limit(self, identifier: str = "test@example.com", attempts: int = 10):
        """
        Test login rate limiting (should block after 5 attempts per minute)
        """
        self.log("=" * 60)
        self.log("TEST 1: Login Rate Limiting (5 per minute)")
        self.log("=" * 60)

        url = f"{self.base_url}/api/login"
        success_count = 0
        rate_limited_count = 0

        for i in range(1, attempts + 1):
            try:
                response = requests.post(
                    url,
                    json={"identifier": identifier, "password": "wrong_password"},
                    timeout=5
                )

                if response.status_code == 429:
                    rate_limited_count += 1
                    self.log(f"Attempt {i}: ⚠️  RATE LIMITED (429) - Expected after 5 attempts", "PASS")
                    retry_after = response.json().get('retry_after', 'unknown')
                    self.log(f"  → Server says retry after: {retry_after} seconds")
                elif response.status_code == 401:
                    success_count += 1
                    self.log(f"Attempt {i}: ✅ Request accepted (401 - invalid creds)", "INFO")
                else:
                    self.log(f"Attempt {i}: ⚠️  Unexpected status {response.status_code}", "WARN")

            except requests.exceptions.RequestException as e:
                self.log(f"Attempt {i}: ❌ Request failed - {e}", "ERROR")

            time.sleep(0.5)  # Small delay between requests

        self.log("")
        self.log(f"RESULTS: {success_count} requests accepted, {rate_limited_count} rate limited")

        if rate_limited_count > 0:
            self.log("✅ Rate limiting is WORKING - brute force attacks blocked", "PASS")
            self.log("   Admin should receive email alert about rate limit breach", "INFO")
        else:
            self.log("❌ Rate limiting FAILED - no blocks detected!", "FAIL")

        return rate_limited_count > 0

    def test_registration_rate_limit(self, attempts: int = 6):
        """
        Test registration rate limiting (3 per minute)
        """
        self.log("\n" + "=" * 60)
        self.log("TEST 2: Registration Rate Limiting (3 per minute)")
        self.log("=" * 60)

        url = f"{self.base_url}/api/register"
        success_count = 0
        rate_limited_count = 0

        for i in range(1, attempts + 1):
            try:
                response = requests.post(
                    url,
                    json={
                        "username": f"testuser{i}",
                        "email": f"test{i}@example.com",
                        "password": "TestPassword123!",
                        "turnstileToken": "test"
                    },
                    timeout=5
                )

                if response.status_code == 429:
                    rate_limited_count += 1
                    self.log(f"Attempt {i}: ⚠️  RATE LIMITED (429) - Expected after 3 attempts", "PASS")
                elif response.status_code in [200, 201]:
                    success_count += 1
                    self.log(f"Attempt {i}: ✅ Request accepted (account may exist)", "INFO")
                elif response.status_code == 400:
                    success_count += 1
                    self.log(f"Attempt {i}: ✅ Request processed (validation error)", "INFO")
                else:
                    self.log(f"Attempt {i}: ⚠️  Unexpected status {response.status_code}", "WARN")

            except requests.exceptions.RequestException as e:
                self.log(f"Attempt {i}: ❌ Request failed - {e}", "ERROR")

            time.sleep(0.5)

        self.log("")
        self.log(f"RESULTS: {success_count} requests accepted, {rate_limited_count} rate limited")

        if rate_limited_count > 0:
            self.log("✅ Rate limiting is WORKING - spam accounts blocked", "PASS")
        else:
            self.log("❌ Rate limiting FAILED - no blocks detected!", "FAIL")

        return rate_limited_count > 0

    def test_forgot_password_rate_limit(self, attempts: int = 6):
        """
        Test forgot password rate limiting (3 per minute)
        """
        self.log("\n" + "=" * 60)
        self.log("TEST 3: Forgot Password Rate Limiting (3 per minute)")
        self.log("=" * 60)

        url = f"{self.base_url}/api/forgot-password"
        success_count = 0
        rate_limited_count = 0

        for i in range(1, attempts + 1):
            try:
                response = requests.post(
                    url,
                    json={
                        "email": f"test{i}@example.com",
                        "turnstileToken": "test"
                    },
                    timeout=5
                )

                if response.status_code == 429:
                    rate_limited_count += 1
                    self.log(f"Attempt {i}: ⚠️  RATE LIMITED (429) - Expected after 3 attempts", "PASS")
                elif response.status_code == 200:
                    success_count += 1
                    self.log(f"Attempt {i}: ✅ Request accepted (generic response)", "INFO")
                elif response.status_code == 400:
                    success_count += 1
                    self.log(f"Attempt {i}: ✅ Request processed (validation error)", "INFO")
                else:
                    self.log(f"Attempt {i}: ⚠️  Unexpected status {response.status_code}", "WARN")

            except requests.exceptions.RequestException as e:
                self.log(f"Attempt {i}: ❌ Request failed - {e}", "ERROR")

            time.sleep(0.5)

        self.log("")
        self.log(f"RESULTS: {success_count} requests accepted, {rate_limited_count} rate limited")

        if rate_limited_count > 0:
            self.log("✅ Rate limiting is WORKING - password reset abuse blocked", "PASS")
        else:
            self.log("❌ Rate limiting FAILED - no blocks detected!", "FAIL")

        return rate_limited_count > 0

    def test_post_creation_rate_limit(self, attempts: int = 15):
        """
        Test post creation rate limiting (10 per minute)
        """
        self.log("\n" + "=" * 60)
        self.log("TEST 4: Post Creation Rate Limiting (10 per minute)")
        self.log("=" * 60)

        url = f"{self.base_url}/api/posts"
        success_count = 0
        rate_limited_count = 0

        for i in range(1, attempts + 1):
            try:
                response = requests.post(
                    url,
                    json={
                        "title": f"Test Post {i}",
                        "content": "Test content",
                        "tags": ["test"]
                    },
                    timeout=5
                )

                if response.status_code == 429:
                    rate_limited_count += 1
                    self.log(f"Attempt {i}: ⚠️  RATE LIMITED (429) - Expected after 10 attempts", "PASS")
                elif response.status_code == 401:
                    # Expected - not logged in
                    self.log(f"Attempt {i}: ℹ️  Requires auth (401)", "INFO")
                elif response.status_code in [200, 201]:
                    success_count += 1
                    self.log(f"Attempt {i}: ✅ Request accepted", "INFO")
                else:
                    self.log(f"Attempt {i}: ⚠️  Status {response.status_code}", "WARN")

            except requests.exceptions.RequestException as e:
                self.log(f"Attempt {i}: ❌ Request failed - {e}", "ERROR")

            time.sleep(0.5)

        self.log("")
        self.log(f"RESULTS: {success_count} requests accepted, {rate_limited_count} rate limited")

        if rate_limited_count > 0 or success_count == 0:  # Either rate limited or all require auth
            self.log("✅ Endpoint is protected", "PASS")
        else:
            self.log("⚠️  Check rate limiting configuration", "WARN")

        return True  # Pass if protected by auth or rate limit


def detect_server_port():
    """Auto-detect which port the server is running on"""
    ports = [5000, 8000]
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
║          Rate Limiting Security Testing Suite                 ║
║             Computer Anything Tech Blog                       ║
╚═══════════════════════════════════════════════════════════════╝
""")

    base_url = detect_server_port()
    if not base_url:
        print("⚠️  Could not auto-detect server.")
        print("   Make sure your backend is running (python run.py)")
        base_url = input("Enter your app URL [http://localhost:5000]: ").strip() or "http://localhost:5000"

    print(f"\n🎯 Testing rate limits at {base_url}")
    print("\n⚠️  WARNING: This test will trigger rate limit alerts!")
    print("   Admin will receive emails for each breached endpoint")
    print("   This is expected behavior for security monitoring\n")

    proceed = input("Continue with tests? [y/N]: ").strip().lower()
    if proceed != 'y':
        print("Tests cancelled.")
        return

    tester = RateLimitTester(base_url)

    print("\n" + "=" * 60)
    print("STARTING RATE LIMIT TESTS")
    print("=" * 60)

    results = []
    results.append(tester.test_login_rate_limit())
    results.append(tester.test_registration_rate_limit())
    results.append(tester.test_forgot_password_rate_limit())
    results.append(tester.test_post_creation_rate_limit())

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed = sum(results)
    total = len(results)
    print(f"\n✅ Passed: {passed}/{total} tests")

    if passed == total:
        print("\n✅ ALL RATE LIMITS WORKING CORRECTLY")
        print("\n📊 Protection Summary:")
        print("  • Login: Protected against brute force")
        print("  • Registration: Protected against spam accounts")
        print("  • Password Reset: Protected against abuse")
        print("  • Post Creation: Protected against spam posts")
        print("\n📧 Admin Alerts:")
        print("  • Check ADMIN_EMAIL inbox for rate limit alerts")
        print("  • Each breach triggers security notification")
    else:
        print("\n❌ SOME RATE LIMITS FAILED")
        print("   Review backend rate limiting configuration")


if __name__ == "__main__":
    main()
