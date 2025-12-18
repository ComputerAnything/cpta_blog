"""Utility functions for the application."""
from .email import send_email, send_rate_limit_alert
from .login_details import get_location_from_ip, parse_user_agent
from .password_validator import validate_password


__all__ = [
    'send_email',
    'send_rate_limit_alert',
    'validate_password',
    'parse_user_agent',
    'get_location_from_ip'
]
