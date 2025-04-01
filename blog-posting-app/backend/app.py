from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)

# Import models to ensure they are registered with Flask-Migrate
from models import User, BlogPost

# Import routes
from routes import *

if __name__ == '__main__':
    app.run(debug=True)
