from dotenv import load_dotenv
import os


# Load environment variables from .env file
load_dotenv()

# Configuration class for the Flask application
class Config:
    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'mysql+mysqldb://root:password@localhost:3306/blog_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Secret key for session management
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your_secret_key'
    JWT_SECRET_KEY = 'super-secret'  # Change this to a random secret key

