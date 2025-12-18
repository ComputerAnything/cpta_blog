"""Utility functions for extracting login details (browser, device, location)"""
from flask import current_app
import requests
from user_agents import parse


def parse_user_agent(user_agent_string):
    """
    Parse User-Agent string to extract browser and device information.

    Args:
        user_agent_string: The User-Agent header from the request

    Returns:
        tuple: (browser_info, device_info)
               browser_info: "Chrome 120.0" or "Safari 17.2"
               device_info: "Desktop" or "Mobile (iPhone)" or "Tablet (iPad)"
    """
    if not user_agent_string:
        return "Unknown Browser", "Unknown Device"

    try:
        user_agent = parse(user_agent_string)

        # Browser info: "Browser Version"
        browser_name = user_agent.browser.family or "Unknown"
        browser_version = user_agent.browser.version_string or ""
        browser_info = f"{browser_name} {browser_version}".strip()

        # Device info
        if user_agent.is_mobile:
            device_name = user_agent.device.family if user_agent.device.family != "Other" else "Mobile"
            device_info = f"Mobile ({device_name})"
        elif user_agent.is_tablet:
            device_name = user_agent.device.family if user_agent.device.family != "Other" else "Tablet"
            device_info = f"Tablet ({device_name})"
        elif user_agent.is_pc:
            os_name = user_agent.os.family or "Desktop"
            device_info = f"Desktop ({os_name})"
        else:
            device_info = "Unknown Device"

        return browser_info, device_info

    except Exception as e:
        current_app.logger.error(f"Failed to parse user agent: {e!r}")
        return "Unknown Browser", "Unknown Device"


def get_location_from_ip(ip_address):
    """
    Get approximate location from IP address using ipapi.co free service.

    Args:
        ip_address: IP address string

    Returns:
        str: "City, Country" or "Unknown Location"
    """
    # Don't geolocate local/private IPs
    if not ip_address or ip_address in ['127.0.0.1', 'localhost', '::1']:
        return "Local/Development"

    # Skip private IP ranges
    if ip_address.startswith(('10.', '172.', '192.168.')):
        return "Private Network"

    try:
        # Use ipapi.co free tier (no API key needed, 1000 requests/day)
        response = requests.get(
            f"https://ipapi.co/{ip_address}/json/",
            timeout=3  # Quick timeout to not slow down login
        )

        if response.status_code == 200:
            data = response.json()
            city = data.get('city', '')
            country = data.get('country_name', '')

            if city and country:
                return f"{city}, {country}"
            if country:
                return country
            return "Unknown Location"
        current_app.logger.warning(f"Geolocation API returned {response.status_code} for IP {ip_address}")
        return "Unknown Location"

    except requests.exceptions.Timeout:
        current_app.logger.warning(f"Geolocation timeout for IP {ip_address}")
        return "Unknown Location"
    except Exception as e:
        current_app.logger.error(f"Geolocation error for IP {ip_address}: {e!r}")
        return "Unknown Location"
