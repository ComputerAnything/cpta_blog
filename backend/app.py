import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config
from flask_mail import Mail
from flask import send_from_directory, abort


# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(levelname)s: %(message)s')

# cors
CORS(app)

# Initialize database and migration
db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)

# SMTP configuration
mail = Mail(app)

# Import routes
from routes import *
app.register_blueprint(routes) # Register the blueprint

# Serve static files from the React app
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    # Only serve index.html for non-API, non-static, non-upload routes
    if path.startswith('api') or path.startswith('static') or path.startswith('uploads'):
        return abort(404)
    return send_from_directory('../frontend/build', 'index.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('../frontend/build/static', filename)

if __name__ == '__main__':
    app.run(debug=True)
