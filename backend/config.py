import os
from typing import ClassVar

from dotenv import load_dotenv


load_dotenv()

# Configuration class for the Flask application
class Config:
    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS: ClassVar[dict] = {
        'pool_pre_ping': True,  # Verify connections before using them
        'pool_recycle': 300,    # Recycle connections after 5 minutes
    }

    # Secret key for session management
    SECRET_KEY = os.environ.get('SECRET_KEY')

    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 43200))  # 12 hours default  # noqa: PLW1508

    # Email Configuration (Resend API)
    RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@computeranything.dev')

    # Admin Email (for security alerts)
    ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL')

    # Cloudflare Turnstile
    TURNSTILE_SECRET_KEY = os.environ.get('CF_TURNSTILE_SECRET_KEY')

    # Frontend URL (for CORS and email links)
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://blog.computeranything.dev')

    # Rate Limiting Storage (Redis)
    RATELIMIT_STORAGE_URI = os.environ.get('REDIS_URL', 'memory://')

    # Environment detection
    ENV = os.environ.get('FLASK_ENV', 'development')
    DEBUG = ENV == 'development'
