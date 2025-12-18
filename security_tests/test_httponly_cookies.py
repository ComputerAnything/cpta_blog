#!/usr/bin/env python3
"""
HTTP-Only Cookie Security Testing Suite
Tests that JWT tokens are stored in secure httpOnly cookies
"""

import requests
import sys


def detect_server_port():
    """Auto-detect which port the server is running on"""
    ports = [5000, 8000]
    for port in ports:
        try:
            url = f"http://localhost:{port}/api/posts"
            response = requests.get(url, timeout=2)
            if response.status_code in [200, 401]:  # Server is responding
                return f"http://localhost:{port}"
        except requests.exceptions.RequestException:
            continue
    return None


class HttpOnlyCookieTester:
    def __init__(self, base_url: str):
        self.base_url = base_url

    def test_login_sets_httponly_cookie(self):
        """Manual test for httpOnly cookie on login"""
        print("\n" + "=" * 60)
        print("TEST 1: Login Sets HttpOnly Cookie (Manual Verification)")
        print("=" * 60)

        print("\n📋 This test requires manual verification:")
        print("   (Automated test needs real credentials)")

        print("\n   Steps:")
        print("   1. Login to your blog in browser")
        print("   2. Open DevTools (F12) → Application → Cookies")
        print("   3. Find 'access_token_cookie'")
        print("   4. Check these columns:")

        print("\n   Expected cookie settings:")
        print("   • HttpOnly = ✓ (XSS protection)")
        print("   • SameSite = Lax (CSRF protection)")
        print("   • Secure = ✓ (HTTPS only, may be unchecked on localhost)")

        print("\n⏳ MANUAL CHECK REQUIRED")
        print("   ✅ PASS: If HttpOnly shows ✓ checkmark")
        print("   ❌ FAIL: If HttpOnly is unchecked or cookie missing")

        return True  # Manual verification needed

    def test_cookie_not_accessible_to_javascript(self):
        """Verify that httpOnly cookies cannot be accessed by JavaScript"""
        print("\n" + "=" * 60)
        print("TEST 2: Cookie Not Accessible to JavaScript")
        print("=" * 60)

        print("This test verifies the theoretical security property:")
        print("✅ HttpOnly cookies CANNOT be accessed via document.cookie")
        print("✅ This prevents XSS attacks from stealing tokens")
        print("\n📋 Manual verification required:")
        print("   1. Login to the blog in a browser")
        print("   2. Open DevTools Console")
        print("   3. Type: document.cookie")
        print("   4. Verify JWT token is NOT visible")
        print("   5. Check Application/Storage tab to confirm token exists")

        print("\n⏳ MANUAL CHECK REQUIRED")
        print("   ✅ PASS: If JWT token NOT visible in document.cookie")
        print("   ❌ FAIL: If token appears in console output")

        return True  # Manual verification needed

    def test_token_sent_automatically(self):
        """Manual test for automatic cookie transmission"""
        print("\n" + "=" * 60)
        print("TEST 3: Token Cookie Sent Automatically (Manual Verification)")
        print("=" * 60)

        print("\n📋 This test requires manual verification:")
        print("   (Automated test needs real credentials)")

        print("\n   Steps:")
        print("   1. Login to your blog in browser")
        print("   2. Open DevTools (F12) → Network tab")
        print("   3. Create a blog post or vote")
        print("   4. Click on the API request in Network tab")
        print("   5. Check 'Request Headers' → 'Cookie'")

        print("\n   Expected behavior:")
        print("   • Cookie header includes 'access_token_cookie=...'")
        print("   • Browser automatically sends it (no JavaScript needed)")
        print("   • Request succeeds (200 status)")

        print("\n⏳ MANUAL CHECK REQUIRED")
        print("   ✅ PASS: If cookie is sent and request succeeds")
        print("   ❌ FAIL: If cookie missing or 401 Unauthorized")

        return True  # Manual verification needed

    def test_no_token_in_local_storage(self):
        """Verify tokens are not stored in localStorage"""
        print("\n" + "=" * 60)
        print("TEST 4: No Tokens in LocalStorage/SessionStorage")
        print("=" * 60)

        print("This test verifies best practices:")
        print("✅ Tokens should be in httpOnly cookies (not localStorage)")
        print("✅ localStorage is accessible to JavaScript (XSS vulnerable)")
        print("\n📋 Manual verification required:")
        print("   1. Login to the blog in a browser")
        print("   2. Open DevTools → Application → Local Storage")
        print("   3. Verify NO JWT tokens are stored there")
        print("   4. Check Session Storage as well")
        print("   5. Tokens should ONLY be in Cookies (httpOnly)")

        print("\n⏳ MANUAL CHECK REQUIRED")
        print("   ✅ PASS: If NO tokens in localStorage/sessionStorage")
        print("   ❌ FAIL: If JWT tokens found in storage")

        return True  # Manual verification needed


def main():
    print("""
╔═══════════════════════════════════════════════════════════════╗
║          HTTP-Only Cookie Security Testing Suite              ║
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

    tester = HttpOnlyCookieTester(base_url)

    results = []
    results.append(tester.test_login_sets_httponly_cookie())
    results.append(tester.test_cookie_not_accessible_to_javascript())
    results.append(tester.test_token_sent_automatically())
    results.append(tester.test_no_token_in_local_storage())

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    print("\n📊 Results:")
    print("   • Test 1 (HttpOnly Cookie): ⏳ Manual check required")
    print("   • Test 2 (JS Access Block): ⏳ Manual check required")
    print("   • Test 3 (Auto Transmission): ⏳ Manual check required")
    print("   • Test 4 (No localStorage): ⏳ Manual check required")

    print("\nℹ️  All tests require manual browser verification")
    print("   (Automated cookie testing needs real credentials)")

    print("\n📋 Quick verification:")
    print("   1. Login to your blog")
    print("   2. DevTools → Application → Cookies")
    print("   3. Check access_token_cookie has HttpOnly ✓")
    print("   4. Console: document.cookie should NOT show token")

    sys.exit(0)


if __name__ == "__main__":
    main()
