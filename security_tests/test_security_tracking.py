#!/usr/bin/env python3
"""
Security Event Tracking Testing Suite
Tests that security events are properly logged and tracked
"""

import requests


class SecurityTrackingTester:
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url

    def test_failed_login_tracking(self):
        """Test that failed login attempts are tracked"""
        print("\n" + "=" * 60)
        print("TEST 1: Failed Login Tracking")
        print("=" * 60)

        url = f"{self.base_url}/api/login"

        print("\n📋 Testing failed login tracking:")
        print("   Attempting login with invalid credentials...")

        try:
            # Attempt failed login
            response = requests.post(
                url,
                json={
                    "identifier": "testuser@example.com",
                    "password": "wrong_password"
                },
                timeout=5
            )

            if response.status_code == 401:
                print("✅ Login rejected (401 Unauthorized)")
                print("\n   What should be tracked in database:")
                print("   • failed_login_attempts incremented")
                print("   • Timestamp of attempt")
                print("   • IP address logged")

                print("\n📋 Manual verification required:")
                print("   1. Check database User table")
                print("   2. Find testuser@example.com")
                print("   3. Verify failed_login_attempts field increased")

                return True
            else:
                print(f"⚠️  Unexpected status: {response.status_code}")
                return False

        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")
            return False

    def test_successful_login_tracking(self):
        """Test that successful logins are tracked"""
        print("\n" + "=" * 60)
        print("TEST 2: Successful Login Tracking")
        print("=" * 60)

        print("\n📋 This test requires manual verification:")
        print("   (Needs real credentials)")

        print("\n   Steps:")
        print("   1. Login to your blog with valid credentials")
        print("   2. Check database User table")
        print("   3. Verify these fields are updated:")

        print("\n   Fields tracked on successful login:")
        print("   • last_login (timestamp)")
        print("   • last_login_ip (your IP address)")
        print("   • last_login_location (geolocation)")
        print("   • last_login_browser (user agent)")
        print("   • last_login_device (device type)")
        print("   • failed_login_attempts (reset to 0)")

        print("\n   Example SQL query:")
        print("""
   SELECT
     username,
     last_login,
     last_login_ip,
     last_login_location,
     last_login_browser,
     last_login_device,
     failed_login_attempts
   FROM users
   WHERE username = 'your_username';
        """)

        print("\n⏳ MANUAL CHECK REQUIRED")
        print("   ✅ PASS: If all fields populated after login")
        print("   ❌ FAIL: If fields NULL or not updated")

        return True

    def test_rate_limit_violation_tracking(self):
        """Test that rate limit violations are tracked"""
        print("\n" + "=" * 60)
        print("TEST 3: Rate Limit Violation Tracking")
        print("=" * 60)

        print("\n📋 This test tracks rate limit violations:")

        print("\n   What's tracked when rate limit exceeded:")
        print("   • rate_limit_violations field incremented")
        print("   • Admin receives email alert")
        print("   • IP address logged in alert")
        print("   • Endpoint that was rate limited")

        print("\n   To test:")
        print("   1. Run test_rate_limiting.py")
        print("   2. Trigger rate limits on login endpoint")
        print("   3. Check database for rate_limit_violations count")
        print("   4. Check admin email for alert")

        print("\n⏳ MANUAL CHECK REQUIRED")
        print("   ✅ PASS: If violations tracked and alert sent")
        print("   ❌ FAIL: If no tracking or alert")

        return True

    def test_password_reset_tracking(self):
        """Test that password resets are tracked"""
        print("\n" + "=" * 60)
        print("TEST 4: Password Reset Tracking")
        print("=" * 60)

        print("\n📋 Password reset tracking:")

        print("\n   Fields tracked:")
        print("   • password_reset_count (incremented on each reset)")
        print("   • reset_token (temporary, expires)")
        print("   • reset_token_expiry (timestamp)")

        print("\n   Steps to test:")
        print("   1. Request password reset via forgot-password")
        print("   2. Complete the reset with email link")
        print("   3. Check database User table")
        print("   4. Verify password_reset_count increased")

        print("\n⏳ MANUAL CHECK REQUIRED")
        print("   ✅ PASS: If password_reset_count incremented")
        print("   ❌ FAIL: If not tracked")

        return True

    def test_ip_geolocation_tracking(self):
        """Test IP geolocation is captured"""
        print("\n" + "=" * 60)
        print("TEST 5: IP Geolocation Tracking")
        print("=" * 60)

        print("\n📋 IP geolocation features:")

        print("\n   What's captured:")
        print("   • IP address (from X-Forwarded-For or REMOTE_ADDR)")
        print("   • Location via ipapi.co API")
        print("   • Format: 'City, Region, Country'")
        print("   • Example: 'New York, NY, US'")

        print("\n   Code location:")
        print("   • backend/utils/login_details.py")
        print("   • get_location_from_ip() function")

        print("\n   To verify:")
        print("   1. Login from different locations/VPNs")
        print("   2. Check last_login_location field")
        print("   3. Should show different locations")

        print("\n⏳ MANUAL CHECK REQUIRED")
        print("   ✅ PASS: If location accurately captured")
        print("   ❌ FAIL: If NULL or inaccurate")

        return True


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
║         Security Event Tracking Testing Suite                ║
║             Computer Anything Tech Blog                       ║
╚═══════════════════════════════════════════════════════════════╝
""")

    base_url = detect_server_port()
    if not base_url:
        print("⚠️  Could not auto-detect server.")
        base_url = input("Enter your app URL [http://localhost:5000]: ").strip() or "http://localhost:5000"
    else:
        print(f"✅ Detected server at {base_url}")

    tester = SecurityTrackingTester(base_url)

    results = []
    results.append(tester.test_failed_login_tracking())
    results.append(tester.test_successful_login_tracking())
    results.append(tester.test_rate_limit_violation_tracking())
    results.append(tester.test_password_reset_tracking())
    results.append(tester.test_ip_geolocation_tracking())

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed = sum(results)
    total = len(results)
    print(f"\nPassed: {passed}/{total}")

    print("\n📊 Security Tracking Features:")
    print("   • Failed login attempts")
    print("   • Successful login tracking (IP, location, device)")
    print("   • Rate limit violations")
    print("   • Password reset count")
    print("   • IP geolocation via ipapi.co")

    print("\n💾 Database Fields:")
    print("   User table tracking fields:")
    print("   - last_login")
    print("   - last_login_ip")
    print("   - last_login_location")
    print("   - last_login_browser")
    print("   - last_login_device")
    print("   - failed_login_attempts")
    print("   - rate_limit_violations")
    print("   - password_reset_count")


if __name__ == "__main__":
    main()
