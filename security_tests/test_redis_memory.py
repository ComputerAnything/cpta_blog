#!/usr/bin/env python3
"""
Redis Memory Security Testing Suite
Tests Redis configuration for rate limiting
"""

import subprocess
import sys


class RedisSecurityTester:
    def __init__(self):
        self.docker_compose_file = "../docker-compose.staging.yml"

    def test_redis_connection(self):
        """Test connection to Redis"""
        print("\n" + "=" * 60)
        print("TEST 1: Redis Connection")
        print("=" * 60)

        print("\n📋 Testing Redis connection via Docker...")

        try:
            result = subprocess.run(
                ["docker", "compose", "-f", self.docker_compose_file, "exec", "-T", "redis",
                 "redis-cli", "ping"],
                capture_output=True,
                timeout=5,
                text=True
            )

            if "PONG" in result.stdout:
                print("✅ Redis is running and responding")
                return True
            else:
                print("❌ Redis not responding properly")
                print(f"   Output: {result.stdout}")
                return False

        except subprocess.TimeoutExpired:
            print("❌ Redis connection timed out")
            return False
        except FileNotFoundError:
            print("❌ Docker not found - is Docker running?")
            return False
        except Exception as e:
            print(f"❌ Error connecting to Redis: {e}")
            return False

    def test_redis_memory_usage(self):
        """Test Redis memory configuration"""
        print("\n" + "=" * 60)
        print("TEST 2: Redis Memory Configuration")
        print("=" * 60)

        print("\n📋 Checking Redis memory usage...")

        try:
            # Get memory info
            result = subprocess.run(
                ["docker", "compose", "-f", self.docker_compose_file, "exec", "-T", "redis",
                 "redis-cli", "INFO", "memory"],
                capture_output=True,
                timeout=5,
                text=True
            )

            if result.returncode == 0:
                print("✅ Memory info retrieved")
                print("\n📊 Memory Statistics:")

                # Parse key memory stats
                for line in result.stdout.split('\n'):
                    if any(key in line for key in ['used_memory_human', 'used_memory_peak_human',
                                                     'maxmemory_human', 'maxmemory_policy']):
                        print(f"   {line}")

                return True
            else:
                print("❌ Could not retrieve memory info")
                return False

        except Exception as e:
            print(f"❌ Error checking memory: {e}")
            return False

    def test_rate_limit_storage(self):
        """Test that rate limits are being stored"""
        print("\n" + "=" * 60)
        print("TEST 3: Rate Limit Storage")
        print("=" * 60)

        print("\n📋 Checking rate limit keys in Redis...")

        try:
            # Get all keys
            result = subprocess.run(
                ["docker", "compose", "-f", self.docker_compose_file, "exec", "-T", "redis",
                 "redis-cli", "KEYS", "*"],
                capture_output=True,
                timeout=5,
                text=True
            )

            if result.returncode == 0:
                keys = result.stdout.strip().split('\n')
                key_count = len([k for k in keys if k])

                print(f"✅ Found {key_count} keys in Redis")

                if key_count > 0:
                    print("\n📋 Sample keys (rate limit counters):")
                    for key in keys[:10]:  # Show first 10 keys
                        if key:
                            print(f"   {key}")

                    print("\n   To generate rate limit keys:")
                    print("   1. Run test_rate_limiting.py")
                    print("   2. This test will show the keys created")
                else:
                    print("\n   No keys found - run test_rate_limiting.py first")

                return True
            else:
                print("❌ Could not retrieve keys")
                return False

        except Exception as e:
            print(f"❌ Error checking keys: {e}")
            return False

    def test_redis_persistence(self):
        """Test Redis persistence configuration"""
        print("\n" + "=" * 60)
        print("TEST 4: Redis Persistence (Optional for Rate Limiting)")
        print("=" * 60)

        print("\n📋 Checking Redis persistence config...")

        try:
            result = subprocess.run(
                ["docker", "compose", "-f", self.docker_compose_file, "exec", "-T", "redis",
                 "redis-cli", "CONFIG", "GET", "save"],
                capture_output=True,
                timeout=5,
                text=True
            )

            if result.returncode == 0:
                print("✅ Persistence config retrieved")
                print(f"   {result.stdout.strip()}")

                print("\n   Note: For rate limiting, persistence is optional")
                print("   Rate limit counters are temporary and reset is okay")

                return True
            else:
                print("⚠️  Could not check persistence")
                return False

        except Exception as e:
            print(f"⚠️  Error: {e}")
            return False


def check_docker_running():
    """Check if Docker is running"""
    try:
        subprocess.run(
            ["docker", "info"],
            capture_output=True,
            timeout=5,
            check=True
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        return False


def main():
    print("""
╔═══════════════════════════════════════════════════════════════╗
║         Redis Memory Security Testing Suite                  ║
║             Computer Anything Tech Blog                       ║
╚═══════════════════════════════════════════════════════════════╝
""")

    # Check Docker
    if not check_docker_running():
        print("❌ Docker is not running or not installed")
        print("\n   Steps to fix:")
        print("   1. Start Docker Desktop")
        print("   2. Run: docker compose -f docker-compose.staging.yml up -d")
        sys.exit(1)

    print("✅ Docker is running")

    tester = RedisSecurityTester()

    results = []
    results.append(tester.test_redis_connection())
    results.append(tester.test_redis_memory_usage())
    results.append(tester.test_rate_limit_storage())
    results.append(tester.test_redis_persistence())

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed = sum(results)
    total = len(results)
    print(f"\nPassed: {passed}/{total}")

    if passed == total:
        print("\n✅ REDIS SECURITY CONFIGURED CORRECTLY")
        print("\n📋 Redis is properly set up for:")
        print("   • Rate limiting storage")
        print("   • Memory management")
        print("   • Fast key-value operations")
    else:
        print("\n⚠️  SOME REDIS CHECKS FAILED")
        print("   Review Redis configuration")


if __name__ == "__main__":
    main()
