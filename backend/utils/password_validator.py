"""
Password validation utilities for enhanced security.
"""
import re


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password meets security requirements.

    Requirements:
    - Minimum 12 characters (NIST recommended for client portals)
    - OR 8+ chars with: uppercase, lowercase, number, special char

    Returns:
        tuple: (is_valid: bool, error_message: str)
    """
    if not password:
        return False, "Password is required"

    # Check minimum length
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"

    # If 12+ chars, pass (NIST guideline - length is more important than complexity)
    if len(password) >= 12:
        return True, ""

    # If 8-11 chars, require complexity
    has_upper = bool(re.search(r'[A-Z]', password))
    has_lower = bool(re.search(r'[a-z]', password))
    has_digit = bool(re.search(r'\d', password))
    has_special = bool(re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~;]', password))

    missing = []
    if not has_upper:
        missing.append("uppercase letter")
    if not has_lower:
        missing.append("lowercase letter")
    if not has_digit:
        missing.append("number")
    if not has_special:
        missing.append("special character")

    if missing:
        return False, f"Password must contain at least one {', '.join(missing)} (or be 12+ characters)"

    return True, ""


def check_common_passwords(password: str) -> bool:
    """
    Check if password is in common/weak password list.

    Returns:
        bool: True if password is common (weak), False if unique
    """
    # Top 25 most common passwords
    common_passwords = {
        'password', '123456', '12345678', 'qwerty', 'abc123',
        'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
        'baseball', '111111', 'iloveyou', 'master', 'sunshine',
        'ashley', 'bailey', 'passw0rd', 'shadow', '123123',
        '654321', 'superman', 'qazwsx', 'michael', 'football',
        'password1', 'password123', 'admin', 'welcome', 'login'
    }

    return password.lower() in common_passwords


def validate_password(password: str) -> tuple[bool, str]:
    """
    Complete password validation.

    Returns:
        tuple: (is_valid: bool, error_message: str)
    """
    # Check strength requirements
    is_valid, error_msg = validate_password_strength(password)
    if not is_valid:
        return False, error_msg

    # Check against common passwords
    if check_common_passwords(password):
        return False, "This password is too common. Please choose a more unique password."

    # Check max length (prevent DoS attacks)
    if len(password) > 128:
        return False, "Password is too long (max 128 characters)"

    return True, ""
