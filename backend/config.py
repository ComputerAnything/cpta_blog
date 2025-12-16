import os

from dotenv import load_dotenv


load_dotenv()

# Configuration class for the Flask application
class Config:
    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {  # noqa: RUF012
        'pool_pre_ping': True,  # Verify connections before using them
        'pool_recycle': 300,    # Recycle connections after 5 minutes
    }

    # Secret key for session management
    SECRET_KEY = os.environ.get('SECRET_KEY')

    # JWT secret key
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')

    # Resend API configuration (emails are sent via Resend API, not SMTP)
    RESEND_API_KEY = os.environ.get('RESEND_API_KEY')

    # Frontend URL (for CORS and email links)
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://blog.computeranything.dev')

    # Redis for rate limiting
    REDIS_URL = os.environ.get('REDIS_URL', 'memory://')

    # Environment detection
    ENV = os.environ.get('FLASK_ENV', 'development')
    DEBUG = ENV == 'development'
