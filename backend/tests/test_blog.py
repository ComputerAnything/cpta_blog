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

def create_verified_user(client, username="blogger", email="blogger@dev.com", password="testpass"):
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

def get_token(client, username="blogger", password="testpass"):
    response = client.post('/api/login', json={
        'identifier': username,
        'password': password
    })
    return response.get_json()["access_token"]

def test_create_and_get_blog_post(client):
    create_verified_user(client)
    token = get_token(client)
    # Create a post
    response = client.post('/api/posts', json={
        'title': 'Test Post',
        'content': 'This is a test post.'
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 201  # noqa: PLR2004
    data = response.get_json()
    assert data["title"] == "Test Post"
    assert data["content"] == "This is a test post."

    # Get the post
    post_id = data["id"]
    response = client.get(f'/api/posts/{post_id}')
    assert response.status_code == 200  # noqa: PLR2004
    data = response.get_json()
    assert data["title"] == "Test Post"
    assert data["content"] == "This is a test post."
