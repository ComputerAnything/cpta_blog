"""Tests for user routes (routes/user.py)"""
from app import db
from models.post import BlogPost
from models.user import User


def test_get_profile(authenticated_client):
    """Test GET /api/profile - Get current user's profile"""
    client, token = authenticated_client

    response = client.get('/api/profile', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200
    data = response.get_json()
    assert data['username'] == 'testuser'
    assert data['email'] == 'test@dev.com'
    assert 'created_at' in data
    assert data['is_verified'] is True


def test_get_profile_unauthenticated(client):
    """Test GET /api/profile without authentication"""
    response = client.get('/api/profile')
    assert response.status_code == 401


def test_update_profile(authenticated_client):
    """Test PUT /api/profile - Update username and email"""
    client, token = authenticated_client

    response = client.put('/api/profile', json={
        'username': 'newusername',
        'email': 'newemail@dev.com'
    }, headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200
    # API returns updated user object (not a message)

    # Verify changes
    user = User.query.filter_by(username='newusername').first()
    assert user is not None
    assert user.email == 'newemail@dev.com'
    # Email changed, so is_verified should be False
    assert user.is_verified is False


def test_update_profile_duplicate_username(create_verified_user, authenticated_client):
    """Test PUT /api/profile with username already taken"""
    # Create another user
    create_verified_user(username='existinguser', email='existing@dev.com', password='Test@Pass123')

    client, token = authenticated_client

    # Try to change to existing username
    response = client.put('/api/profile', json={
        'username': 'existinguser',
        'email': 'test@dev.com'
    }, headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 400
    assert b'already taken' in response.data or b'username' in response.data


def test_update_profile_invalid_username(authenticated_client):
    """Test PUT /api/profile with invalid username (too short)"""
    client, token = authenticated_client

    response = client.put('/api/profile', json={
        'username': 'ab',  # Too short (min 3 chars)
        'email': 'test@dev.com'
    }, headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 400
    assert b'3-20 characters' in response.data


def test_update_profile_invalid_username_special_chars(authenticated_client):
    """Test PUT /api/profile with invalid characters in username"""
    client, token = authenticated_client

    response = client.put('/api/profile', json={
        'username': 'user@name!',  # Invalid chars
        'email': 'test@dev.com'
    }, headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 400
    assert b'lowercase letters, numbers, and underscores' in response.data


def test_delete_profile(authenticated_client):
    """Test DELETE /api/profile - Delete user account and all data"""
    client, token = authenticated_client

    # Create some data for the user
    user = User.query.filter_by(username='testuser').first()
    post = BlogPost(title='Test Post', content='Test content', user_id=user.id)
    db.session.add(post)
    db.session.commit()

    response = client.delete('/api/profile', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200
    assert b'deleted successfully' in response.data

    # Verify user and data are deleted
    user = User.query.filter_by(username='testuser').first()
    assert user is None
    post = BlogPost.query.filter_by(title='Test Post').first()
    assert post is None


def test_get_user_by_username(create_verified_user, client):
    """Test GET /api/users/<username> - Get user profile by username"""
    create_verified_user(username='publicuser', email='public@dev.com', password='Test@Pass123')

    response = client.get('/api/users/publicuser')
    assert response.status_code == 200
    data = response.get_json()
    assert data['username'] == 'publicuser'
    assert 'created_at' in data


def test_get_user_by_username_not_found(client):
    """Test GET /api/users/<username> with non-existent user"""
    response = client.get('/api/users/nonexistent')
    assert response.status_code == 404


def test_get_all_users(authenticated_client, create_verified_user):
    """Test GET /api/users - Get all users with pagination"""
    client, token = authenticated_client

    # Create additional users
    create_verified_user(username='user2', email='user2@dev.com', password='Test@Pass123')
    create_verified_user(username='user3', email='user3@dev.com', password='Test@Pass123')

    response = client.get('/api/users', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200
    data = response.get_json()
    assert 'users' in data
    assert 'total' in data
    assert 'pages' in data
    assert len(data['users']) >= 3  # At least 3 users


def test_get_all_users_with_search(authenticated_client, create_verified_user):
    """Test GET /api/users with search query"""
    client, token = authenticated_client

    create_verified_user(username='searchuser', email='search@dev.com', password='Test@Pass123')

    response = client.get('/api/users?search=search', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['users']) >= 1
    assert data['users'][0]['username'] == 'searchuser'


def test_get_all_users_pagination(authenticated_client, create_verified_user):  # noqa: ARG001
    """Test GET /api/users with pagination parameters"""
    client, token = authenticated_client

    response = client.get('/api/users?page=1&per_page=2', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200
    data = response.get_json()
    assert data['current_page'] == 1
    assert len(data['users']) <= 2


def test_get_all_users_unauthenticated(client):
    """Test GET /api/users without authentication"""
    response = client.get('/api/users')
    assert response.status_code == 401


def test_get_user_posts(create_verified_user, get_auth_token, client):
    """Test GET /api/users/<username>/posts"""
    create_verified_user(username='blogwriter', email='writer@dev.com', password='Test@Pass123')
    token = get_auth_token(username='blogwriter', password='Test@Pass123')

    # Create a post
    client.post('/api/posts', json={
        'title': 'My Post',
        'content': 'Post content'
    }, headers={'Authorization': f'Bearer {token}'})

    response = client.get('/api/users/blogwriter/posts')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]['title'] == 'My Post'


def test_get_user_votes_count(create_verified_user, client):
    """Test GET /api/users/<username>/votes/count"""
    create_verified_user(username='voter', email='voter@dev.com', password='Test@Pass123')

    response = client.get('/api/users/voter/votes/count')
    assert response.status_code == 200
    data = response.get_json()
    assert 'count' in data
    assert data['count'] == 0


def test_get_user_comments_count(create_verified_user, client):
    """Test GET /api/users/<username>/comments/count"""
    create_verified_user(username='commenter', email='commenter@dev.com', password='Test@Pass123')

    response = client.get('/api/users/commenter/comments/count')
    assert response.status_code == 200
    data = response.get_json()
    assert 'count' in data
    assert data['count'] == 0
