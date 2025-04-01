import os

# To configure the Flask application, we can create a config class and include the necessary settings.
# To get the SQLALCHEMY_DATABASE_URI, 
class Config:
    SQLALCHEMY_DATABASE_URI =
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your_secret_key'
