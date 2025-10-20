import os

from dotenv import load_dotenv


# Load environment variables from the .env file in the project root
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Configuration class for the Flask application
class Config:
    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Secret key for session management
    SECRET_KEY = os.environ.get('SECRET_KEY')

    # JWT secret key
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')

    # Resend API configuration (emails are sent via Resend API, not SMTP)
    RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
