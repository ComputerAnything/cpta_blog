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

def test_register_and_login(client):
    # Register a new user
    response = client.post('/api/register', json={
        'username': 'testuser',
        'email': 'delivered@resend.dev',
        'password': 'testpass'
    })
    assert response.status_code == 201
    assert b'Please check your email' in response.data

    # Try to login before verification
    response = client.post('/api/login', json={
        'identifier': 'testuser',
        'password': 'testpass'
    })
    assert response.status_code == 403
    assert b'verify your email' in response.data

    # Manually verify user for testing
    user = User.query.filter_by(username='testuser').first()
    assert user is not None  # Add this line for static analysis and safety
    user.is_verified = True
    db.session.commit()

    # Login after verification
    response = client.post('/api/login', json={
        'identifier': 'testuser',
        'password': 'testpass'
    })
    assert response.status_code == 200
    assert b'access_token' in response.data
