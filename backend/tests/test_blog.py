from unittest.mock import patch

from backend.app import create_app, db
from backend.models import User
import pytest


@pytest.fixture(autouse=True)
def mock_send_email():
    with patch("backend.routes.auth_routes.send_verification_email") as mock:
        yield mock

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

# ...existing code...

def test_update_blog_post(client):
    user = create_verified_user(client)
    token = get_token(client)
    # Create a post
    response = client.post('/api/posts', json={
        'title': 'Old Title',
        'content': 'Old content.'
    }, headers={"Authorization": f"Bearer {token}"})
    post_id = response.get_json()["id"]

    # Update the post
    response = client.put(f'/api/posts/{post_id}', json={
        'title': 'New Title',
        'content': 'New content.',
        'topic_tags': 'test,update'
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.get_json()["post"]
    assert data["title"] == "New Title"
    assert data["content"] == "New content."

def test_delete_blog_post(client):
    user = create_verified_user(client)
    token = get_token(client)
    # Create a post
    response = client.post('/api/posts', json={
        'title': 'Delete Me',
        'content': 'To be deleted.'
    }, headers={"Authorization": f"Bearer {token}"})
    post_id = response.get_json()["id"]

    # Delete the post
    response = client.delete(f'/api/posts/{post_id}', headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert b"deleted" in response.data or b"success" in response.data

    # Confirm deletion
    response = client.get(f'/api/posts/{post_id}')
    assert response.status_code == 404

def test_get_all_blog_posts(client):
    user = create_verified_user(client)
    token = get_token(client)
    # Create two posts
    client.post('/api/posts', json={
        'title': 'First Post',
        'content': 'First content.'
    }, headers={"Authorization": f"Bearer {token}"})
    client.post('/api/posts', json={
        'title': 'Second Post',
        'content': 'Second content.'
    }, headers={"Authorization": f"Bearer {token}"})

    # Get all posts
    response = client.get('/api/posts')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) >= 2

def test_cannot_edit_or_delete_others_post(client):
    # User 1 creates a post
    create_verified_user(client, username="user1", email="user1@dev.com")
    token1 = get_token(client, username="user1")
    response = client.post('/api/posts', json={
        'title': 'User1 Post',
        'content': 'Owned by user1.'
    }, headers={"Authorization": f"Bearer {token1}"})
    post_id = response.get_json()["id"]

    # User 2 tries to edit/delete User 1's post
    create_verified_user(client, username="user2", email="user2@dev.com")
    token2 = get_token(client, username="user2")

    # Try to update
    response = client.put(f'/api/posts/{post_id}', json={
        'title': 'Hacked!',
        'content': 'Not allowed.'
    }, headers={"Authorization": f"Bearer {token2}"})
    assert response.status_code == 403

    # Try to delete
    response = client.delete(f'/api/posts/{post_id}', headers={"Authorization": f"Bearer {token2}"})
    assert response.status_code == 403

def test_create_post_missing_fields(client):
    create_verified_user(client)
    token = get_token(client)
    # Missing title
    response = client.post('/api/posts', json={
        'content': 'No title here.'
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 400
    # Missing content
    response = client.post('/api/posts', json={
        'title': 'No Content'
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 400
