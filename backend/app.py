import logging
import os

from config import Config
from flask import Flask, request, send_file, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect, generate_csrf


# Docker container path
REACT_BUILD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend/build')
# Local development path
# REACT_BUILD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../frontend/build')

def get_real_ip():
    """Get real IP address, accounting for proxies and Docker."""
    if request.environ.get('HTTP_X_FORWARDED_FOR'):
        return request.environ['HTTP_X_FORWARDED_FOR'].split(',')[0].strip()
    if request.environ.get('HTTP_X_REAL_IP'):
        return request.environ['HTTP_X_REAL_IP']
    return request.environ.get('REMOTE_ADDR', '127.0.0.1')

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
csrf = CSRFProtect()
limiter = Limiter(
    key_func=get_real_ip,
    default_limits=[],  # No default limits
    storage_uri=os.environ.get('REDIS_URL', 'memory://')
)

def create_app(testing=False):
    app = Flask(
        __name__,
        static_folder=None,  # Disable automatic static file serving
        static_url_path=None
    )
    app.config.from_object(Config)
    if testing:
        app.config["TESTING"] = True
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
        app.config["WTF_CSRF_ENABLED"] = False

    # Configure logging
    logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(levelname)s: %(message)s')
    app.logger.setLevel(logging.INFO)

    # JWT Configuration for httpOnly cookies
    app.config['JWT_TOKEN_LOCATION'] = ['cookies']
    # Only require HTTPS for cookies in production (allow HTTP in development)
    is_development = (
        os.environ.get('FLASK_ENV') == 'development' or
        os.environ.get('DEBUG', '').lower() in ('true', '1', 'yes') or
        app.debug
    )
    app.config['JWT_COOKIE_SECURE'] = not is_development
    # Disable JWT's built-in CSRF - we use SameSite=Lax which prevents CSRF attacks
    app.config['JWT_COOKIE_CSRF_PROTECT'] = False
    app.config['JWT_COOKIE_SAMESITE'] = 'Lax'  # Primary CSRF protection
    # Don't set cookie domain - allows cookies to work on any domain
    app.config['JWT_COOKIE_DOMAIN'] = False

    # Configure CORS with credentials support for cookies
    CORS(app,
         origins=[app.config['FRONTEND_URL']],
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization', 'X-CSRF-Token'],
         expose_headers=['Set-Cookie'])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    csrf.init_app(app)
    limiter.init_app(app)

    # JWT token version validation for security (invalidate tokens on password change)
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):  # noqa: ARG001
        """Check if token_version in JWT matches current user's token_version."""
        try:
            user_id = jwt_payload.get('sub')  # 'sub' is the identity (user ID)
            token_version = jwt_payload.get('token_version', 0)

            from models import User  # noqa: PLC0415
            user = User.query.get(int(user_id))

            if not user:
                return True  # User deleted, block token

            # If token_version doesn't match, token is revoked
            return user.token_version != token_version

        except Exception:
            return True  # Error occurred, block token to be safe

    # Register all blueprints from routes
    from routes.auth_routes import auth_routes  # noqa: PLC0415
    from routes.post_routes import post_routes  # noqa: PLC0415
    from routes.user_routes import user_routes  # noqa: PLC0415

    app.register_blueprint(auth_routes, url_prefix='/api')
    app.register_blueprint(user_routes, url_prefix='/api')
    app.register_blueprint(post_routes, url_prefix='/api')

    # Exempt JWT-authenticated endpoints from CSRF (they use JWT cookies with SameSite=Lax)
    # SameSite=Lax prevents CSRF attacks by not sending cookies on cross-site requests
    csrf.exempt(auth_routes)
    csrf.exempt(user_routes)
    csrf.exempt(post_routes)

    # CSRF token endpoint
    @app.route('/api/csrf-token', methods=['GET'])
    def get_csrf_token():
        """Get CSRF token for client-side requests"""
        token = generate_csrf()
        return {'csrf_token': token}

    # Security headers
    @app.after_request
    def set_security_headers(response):
        """Set security headers on all responses"""
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'

        # Add HSTS only in production (when using HTTPS)
        if not app.config.get('TESTING'):
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'

        # Only add CSP for non-API routes (HTML responses)
        if not request.path.startswith('/api'):
            response.headers['Content-Security-Policy'] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com; "
                "connect-src 'self'; "
                "frame-src https://challenges.cloudflare.com; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "img-src 'self' data: https:; "
                "font-src 'self' data: https://cdn.jsdelivr.net;"
            )

        return response

    # Rate limit breach handler - send security alerts
    @app.errorhandler(429)
    def rate_limit_handler(e):  # noqa: ARG001
        """Handle rate limit exceeded - send admin alert and return error"""
        from models import User  # noqa: PLC0415
        from utils import send_rate_limit_alert  # noqa: PLC0415

        # Get request details
        ip_address = get_real_ip()
        endpoint = request.path

        # Skip alerts for non-security endpoints (health checks, monitoring, etc.)
        skip_alert_endpoints = ['/health', '/ping', '/metrics']
        should_send_alert = not any(endpoint.startswith(skip) for skip in skip_alert_endpoints)

        # Try to extract user email from request if available
        user_email = None
        try:
            if request.is_json:
                data = request.get_json()
                # Try to get email or identifier (username/email)
                user_email = data.get('email') or data.get('identifier')

                # Track rate limit violation for the user if email/username provided
                if user_email:
                    user = User.query.filter(
                        (User.email == user_email.lower().strip()) |
                        (User.username == user_email.lower().strip())
                    ).first()
                    if user:
                        user.rate_limit_violations += 1
                        db.session.commit()
        except Exception as track_error:
            app.logger.error(f"Failed to track rate limit violation: {track_error!r}")

        # Send alert to admin (non-blocking - won't fail request if email fails)
        # Only send for security-relevant endpoints (auth, user actions, etc.)
        if should_send_alert:
            try:
                send_rate_limit_alert(ip_address, endpoint, user_email)
            except Exception as alert_error:
                app.logger.error(f"Failed to send rate limit alert: {alert_error!r}")
        else:
            app.logger.debug(f"Rate limit on {endpoint} - skipping alert (non-security endpoint)")

        # Return rate limit error to client
        return {
            'error': 'Too many requests. Please try again later.',
            'msg': 'Too many requests. Please try again later.',  # For consistency with other errors
            'retry_after': 60
        }, 429

    # Serve Vite assets (JS, CSS, etc.)
    @app.route('/assets/<path:filename>')
    def serve_assets(filename):
        assets_dir = os.path.join(REACT_BUILD_DIR, 'assets')
        return send_from_directory(assets_dir, filename)

    # Serve images from build/img
    @app.route('/img/<path:filename>')
    def serve_img(filename):
        img_dir = os.path.join(REACT_BUILD_DIR, 'img')
        return send_from_directory(img_dir, filename)

    # Catch-all route for React SPA
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react_app(path):
        # Don't serve index.html for API requests or assets
        if path.startswith('api/') or path.startswith('assets/') or path.startswith('img/'):
            return 'Not Found', 404

        # Try to serve static files from build directory (favicon, etc.)
        if path and '/' not in path:  # Single-segment paths only
            file_path = os.path.join(REACT_BUILD_DIR, path)
            if os.path.isfile(file_path):
                return send_from_directory(REACT_BUILD_DIR, path)

        # Default: serve React app
        return send_file(os.path.join(REACT_BUILD_DIR, 'index.html'))

    return app

# For development/production servers that expect `app`
app = create_app()
