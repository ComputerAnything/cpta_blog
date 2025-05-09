from unittest.mock import patch

from backend.app import create_app, db
from backend.models import User
import pytest


@pytest.fixture
def client():
    app = create_app(testing=True)
    with app.test_client() as client, app.app_context():
        db.create_all()
        yield client
        db.drop_all()

# Automatically mock send_verification_email for all tests in this file
@pytest.fixture(autouse=True)
def mock_send_email():
    with patch("backend.routes.auth_routes.send_verification_email") as mock:
        yield mock

def test_register_and_login(client):
    # Register a new user
    response = client.post('/api/register', json={
        'username': 'testuser',
        'email': 'delivered@resend.dev',
        'password': 'testpass'
    })
    assert response.status_code == 201  # noqa: PLR2004
    assert b'Please check your email' in response.data

    # Try to login before verification
    response = client.post('/api/login', json={
        'identifier': 'testuser',
        'password': 'testpass'
    })
    assert response.status_code == 403  # noqa: PLR2004
    assert b'verify your email' in response.data

    # Manually verify user for testing
    user = User.query.filter_by(username='testuser').first()
    assert user is not None
    user.is_verified = True
    db.session.commit()

    # Login after verification
    response = client.post('/api/login', json={
        'identifier': 'testuser',
        'password': 'testpass'
    })
    assert response.status_code == 200  # noqa: PLR2004
    assert b'access_token' in response.data

def test_register_duplicate_username(client):
    # Register a user
    client.post('/api/register', json={
        'username': 'dupeuser',
        'email': 'dupe1@resend.dev',
        'password': 'testpass'
    })
    # Try to register with the same username
    response = client.post('/api/register', json={
        'username': 'dupeuser',
        'email': 'dupe2@resend.dev',
        'password': 'testpass'
    })
    assert response.status_code == 400  # noqa: PLR2004
    assert b'username' in response.data or b'already' in response.data

def test_register_duplicate_email(client):
    # Register a user
    client.post('/api/register', json={
        'username': 'user1',
        'email': 'dupeemail@resend.dev',
        'password': 'testpass'
    })
    # Try to register with the same email
    response = client.post('/api/register', json={
        'username': 'user2',
        'email': 'dupeemail@resend.dev',
        'password': 'testpass'
    })
    assert response.status_code == 400  # noqa: PLR2004
    assert b'email' in response.data or b'already' in response.data

def test_login_wrong_password(client):
    # Register and verify user
    client.post('/api/register', json={
        'username': 'wrongpass',
        'email': 'wrongpass@resend.dev',
        'password': 'rightpass'
    })
    user = User.query.filter_by(username='wrongpass').first()
    assert user is not None, "User 'wrongpass' not found in database"
    user.is_verified = True
    db.session.commit()
    # Attempt login with wrong password
    response = client.post('/api/login', json={
        'identifier': 'wrongpass',
        'password': 'wrongpass'
    })
    assert response.status_code == 401  # noqa: PLR2004
    assert b'Incorrect password' in response.data
