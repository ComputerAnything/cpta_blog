#!/usr/bin/env python3
"""
JWT Token Invalidation Testing Suite
Tests that tokens are properly revoked when password changes
"""

import requests


class TokenInvalidationTester:
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url

    def test_token_invalidation_on_password_change(self):
        """Manual test for token invalidation"""
        print("\n" + "=" * 60)
        print("TEST 1: Token Invalidation on Password Change")
        print("=" * 60)

        print("\n📋 This test requires manual verification:")
        print("   (Automated test needs real credentials)")

        print("\n   Steps:")
        print("   1. Login to your blog in browser")
        print("   2. Open DevTools → Network tab")
        print("   3. Navigate around (verify you're logged in)")
        print("   4. Change your password (Settings or Profile)")
        print("   5. Try to access a protected page")

        print("\n   Expected behavior:")
        print("   • After password change, old token is INVALID")
        print("   • You should be logged out automatically")
        print("   • New requests should return 401 Unauthorized")
        print("   • You'll need to login again")

        print("\n   How it works:")
        print("   • Each user has a token_version field")
        print("   • Password change increments token_version")
        print("   • Old JWT tokens have old version number")
        print("   • Backend rejects tokens with wrong version")

        print("\n⏳ MANUAL CHECK REQUIRED")
        print("   ✅ PASS: If logged out after password change")
        print("   ❌ FAIL: If old session still works")

        return True  # Manual verification needed

    def test_multiple_sessions_invalidated(self):
        """Test that all sessions are invalidated"""
        print("\n" + "=" * 60)
        print("TEST 2: All Sessions Invalidated")
        print("=" * 60)

        print("\n📋 This test requires manual verification:")

        print("\n   Steps:")
        print("   1. Login to blog from Browser A")
        print("   2. Login to blog from Browser B (or incognito)")
        print("   3. Verify both sessions work")
        print("   4. Change password from Browser A")
        print("   5. Check Browser B session")

        print("\n   Expected behavior:")
        print("   • Both Browser A and B are logged out")
        print("   • All existing JWT tokens become invalid")
        print("   • This is important security feature")

        print("\n⏳ MANUAL CHECK REQUIRED")
        print("   ✅ PASS: If both sessions invalidated")
        print("   ❌ FAIL: If any session still works")

        return True  # Manual verification needed

    def test_logout_invalidates_token(self):
        """Test that logout invalidates the token"""
        print("\n" + "=" * 60)
        print("TEST 3: Logout Invalidates Token")
        print("=" * 60)

        print("\n📋 This test requires manual verification:")

        print("\n   Steps:")
        print("   1. Login to your blog")
        print("   2. Open DevTools → Application → Cookies")
        print("   3. Note the access_token_cookie value")
        print("   4. Logout")
        print("   5. Check cookies again")

        print("\n   Expected behavior:")
        print("   • Cookie should be removed after logout")
        print("   • Cannot use old token to make requests")
        print("   • Must login again to get new token")

        print("\n⏳ MANUAL CHECK REQUIRED")
        print("   ✅ PASS: If cookie removed and token invalid")
        print("   ❌ FAIL: If token still works after logout")

        return True  # Manual verification needed


def detect_server_port():
    """Auto-detect which port the server is running on"""
    ports = [5000, 8000]
    for port in ports:
        try:
            url = f"http://localhost:{port}/api/posts"
            response = requests.get(url, timeout=2)
            if response.status_code in [200, 401]:
                return f"http://localhost:{port}"
        except requests.exceptions.RequestException:
            continue
    return None


def main():
    print("""
╔═══════════════════════════════════════════════════════════════╗
║         JWT Token Invalidation Testing Suite                 ║
║             Computer Anything Tech Blog                       ║
╚═══════════════════════════════════════════════════════════════╝
""")

    # Auto-detect server
    base_url = detect_server_port()

    if not base_url:
        print("⚠️  Could not auto-detect server.")
        base_url = input("Enter your app URL [http://localhost:5000]: ").strip() or "http://localhost:5000"
    else:
        print(f"✅ Detected server at {base_url}")

    tester = TokenInvalidationTester(base_url)

    results = []
    results.append(tester.test_token_invalidation_on_password_change())
    results.append(tester.test_multiple_sessions_invalidated())
    results.append(tester.test_logout_invalidates_token())

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    print("\n📊 Results:")
    print("   • Test 1 (Password Change): ⏳ Manual check required")
    print("   • Test 2 (All Sessions): ⏳ Manual check required")
    print("   • Test 3 (Logout): ⏳ Manual check required")

    print("\nℹ️  All tests require manual browser verification")

    print("\n🔐 Security Benefit:")
    print("   Token versioning ensures that when a user changes")
    print("   their password, ALL existing sessions are terminated.")
    print("   This prevents unauthorized access even if a token")
    print("   was stolen before the password change.")


if __name__ == "__main__":
    main()
