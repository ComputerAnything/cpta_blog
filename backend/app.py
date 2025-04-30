import os
import logging
from flask import Flask, send_from_directory, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from backend.config import Config
from flask_mail import Mail

# Absolute path to React build directory
REACT_BUILD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../frontend/build')
print("STATIC FOLDER:", REACT_BUILD_DIR)

# Initialize Flask app with React build as static folder
app = Flask(
    __name__,
    static_folder=os.path.join(REACT_BUILD_DIR, 'static'),
    static_url_path='/static'
)
app.config.from_object(Config)

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(levelname)s: %(message)s')

# cors
CORS(app)

# Initialize extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
mail = Mail(app)

# Import and register routes blueprint
from routes import routes
app.register_blueprint(routes)

# Serve images from build/img
@app.route('/img/<path:filename>')
def serve_img(filename):
    img_dir = os.path.join(REACT_BUILD_DIR, 'img')
    return send_from_directory(img_dir, filename)

# Catch-all route for React SPA
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    # Only serve index.html for non-API, non-static, non-img routes
    if path.startswith('api/'):
        return 'Not Found', 404
    return send_file(os.path.join(REACT_BUILD_DIR, 'index.html'))
