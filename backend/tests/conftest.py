"""Pytest configuration and fixtures for backend tests."""

import os
import sys

import pytest


# ==============================================================================
# CRITICAL: Environment Setup BEFORE Imports
# ==============================================================================
# Set Redis URL to in-memory BEFORE importing app
# (limiter is initialized at module level in app.py)
os.environ['REDIS_URL'] = 'memory://'
# Disable email sending during tests
os.environ['TESTING'] = 'true'

# Add the backend directory to Python path
# This allows imports like "from app import create_app"
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Now import with relative paths (no "backend." prefix)
from app import create_app, db
from config import Config
from models.user import User


# ==============================================================================
# Test Configuration
# ==============================================================================

class TestConfig(Config):
    """Configuration for testing environment."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_SECRET_KEY = 'test-jwt-secret'
    JWT_ACCESS_TOKEN_EXPIRES = 14400  # 4 hours
    SECRET_KEY = 'test-secret'
    WTF_CSRF_ENABLED = False
    # Use in-memory rate limiting for tests (no Redis needed)
    RATELIMIT_STORAGE_URL = 'memory://'


# ==============================================================================
# Application Fixtures
# ==============================================================================

@pytest.fixture
def app():
    """Create and configure a test Flask application."""
    app = create_app(testing=True)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Create a test client for the Flask application."""
    return app.test_client()


# ==============================================================================
# Mock Fixtures
# ==============================================================================

@pytest.fixture(autouse=True)
def mock_send_email(monkeypatch):
    """Automatically mock send_verification_email for all tests."""
    def mock_send(*_args, **_kwargs):
        pass
    # Use relative path (no "backend." prefix) to match import style
    monkeypatch.setattr('routes.auth.send_verification_email', mock_send)


# ==============================================================================
# Helper Fixtures
# ==============================================================================

@pytest.fixture
def create_verified_user(client):
    """Factory fixture to create a verified user."""
    def _create_user(username="testuser", email="test@dev.com", password="Test@Pass123"):
        client.post('/api/register', json={
            'username': username,
            'email': email,
            'password': password
        })
        user = User.query.filter_by(username=username).first()
        if user is not None:
            user.is_verified = True
            db.session.commit()
        return user
    return _create_user


@pytest.fixture
def get_auth_token(client):
    """Factory fixture to get an auth token for a user."""
    def _get_token(username="testuser", password="Test@Pass123"):
        response = client.post('/api/login', json={
            'identifier': username,
            'password': password
        })
        # Extract JWT from httpOnly cookie
        cookies = response.headers.getlist('Set-Cookie')
        for cookie in cookies:
            if 'access_token_cookie=' in cookie:
                # Extract token value from cookie string
                return cookie.split('access_token_cookie=')[1].split(';')[0]
        raise ValueError("No access_token_cookie found in response")
    return _get_token


@pytest.fixture
def authenticated_client(client, create_verified_user, get_auth_token):
    """Create a client with an authenticated user and return both client and token."""
    user = create_verified_user()  # noqa: F841 
    token = get_auth_token()

    # Add helper method to client for authenticated requests
    def auth_request(method, url, **kwargs):
        headers = kwargs.pop('headers', {})
        headers['Authorization'] = f'Bearer {token}'
        return getattr(client, method)(url, headers=headers, **kwargs)

    client.auth_get = lambda url, **kw: auth_request('get', url, **kw)
    client.auth_post = lambda url, **kw: auth_request('post', url, **kw)
    client.auth_put = lambda url, **kw: auth_request('put', url, **kw)
    client.auth_delete = lambda url, **kw: auth_request('delete', url, **kw)

    return client, token
