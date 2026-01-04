"""Tests for post interactions (votes & comments)"""
from models.comment import Comment
from models.vote import Vote


def test_upvote_post(create_verified_user, get_auth_token, client):
    """Test POST /api/posts/<id>/upvote"""
    create_verified_user(username='voter', email='voter@dev.com', password='Test@Pass123')
    token = get_auth_token(username='voter', password='Test@Pass123')

    # Create a post first
    response = client.post('/api/posts', json={
        'title': 'Post to Vote',
        'content': 'Vote for this post'
    }, headers={'Authorization': f'Bearer {token}'})
    post_id = response.get_json()['id']

    # Upvote the post
    response = client.post(f'/api/posts/{post_id}/upvote', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200
    assert b'upvoted' in response.data or b'vote' in response.data

    # Verify vote in database
    vote = Vote.query.filter_by(post_id=post_id).first()
    assert vote is not None
    assert vote.vote_type == 'upvote'


def test_downvote_post(create_verified_user, get_auth_token, client):
    """Test POST /api/posts/<id>/downvote"""
    create_verified_user(username='downvoter', email='downvoter@dev.com', password='Test@Pass123')
    token = get_auth_token(username='downvoter', password='Test@Pass123')

    # Create a post
    response = client.post('/api/posts', json={
        'title': 'Post to Downvote',
        'content': 'Downvote this post'
    }, headers={'Authorization': f'Bearer {token}'})
    post_id = response.get_json()['id']

    # Downvote the post
    response = client.post(f'/api/posts/{post_id}/downvote', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200
    assert b'downvoted' in response.data or b'vote' in response.data

    # Verify vote in database
    vote = Vote.query.filter_by(post_id=post_id).first()
    assert vote is not None
    assert vote.vote_type == 'downvote'


def test_change_vote(create_verified_user, get_auth_token, client):
    """Test changing vote from upvote to downvote"""
    create_verified_user(username='changer', email='changer@dev.com', password='Test@Pass123')
    token = get_auth_token(username='changer', password='Test@Pass123')

    # Create a post
    response = client.post('/api/posts', json={
        'title': 'Post to Change Vote',
        'content': 'Change vote on this'
    }, headers={'Authorization': f'Bearer {token}'})
    post_id = response.get_json()['id']

    # First upvote
    client.post(f'/api/posts/{post_id}/upvote', headers={'Authorization': f'Bearer {token}'})

    # Then downvote (should change the vote)
    response = client.post(f'/api/posts/{post_id}/downvote', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200

    # Verify vote changed
    vote = Vote.query.filter_by(post_id=post_id).first()
    assert vote.vote_type == 'downvote'


def test_vote_unauthenticated(create_verified_user, get_auth_token, client, app):
    """Test voting without authentication"""
    create_verified_user(username='creator', email='creator@dev.com', password='Test@Pass123')
    token = get_auth_token(username='creator', password='Test@Pass123')

    # Create a post
    response = client.post('/api/posts', json={
        'title': 'Post',
        'content': 'Content'
    }, headers={'Authorization': f'Bearer {token}'})
    post_id = response.get_json()['id']

    # Create a fresh client without auth cookies
    fresh_client = app.test_client()

    # Try to vote without auth
    response = fresh_client.post(f'/api/posts/{post_id}/upvote')
    assert response.status_code == 401


def test_vote_nonexistent_post(authenticated_client):
    """Test voting on non-existent post"""
    client, token = authenticated_client

    response = client.post('/api/posts/99999/upvote', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 404


def test_create_comment(create_verified_user, get_auth_token, client):
    """Test POST /api/posts/<id>/comments"""
    create_verified_user(username='commenter', email='commenter@dev.com', password='Test@Pass123')
    token = get_auth_token(username='commenter', password='Test@Pass123')

    # Create a post
    response = client.post('/api/posts', json={
        'title': 'Post with Comments',
        'content': 'Comment on this'
    }, headers={'Authorization': f'Bearer {token}'})
    post_id = response.get_json()['id']

    # Create a comment
    response = client.post(f'/api/posts/{post_id}/comments', json={
        'content': 'This is a great post!'
    }, headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 201
    data = response.get_json()
    assert data['content'] == 'This is a great post!'
    assert data['username'] == 'commenter'

    # Verify comment in database
    comment = Comment.query.filter_by(post_id=post_id).first()
    assert comment is not None
    assert comment.content == 'This is a great post!'


def test_create_comment_empty_content(create_verified_user, get_auth_token, client):
    """Test creating comment with empty content"""
    create_verified_user(username='badcommenter', email='badcommenter@dev.com', password='Test@Pass123')
    token = get_auth_token(username='badcommenter', password='Test@Pass123')

    # Create a post
    response = client.post('/api/posts', json={
        'title': 'Post',
        'content': 'Content'
    }, headers={'Authorization': f'Bearer {token}'})
    post_id = response.get_json()['id']

    # Try to create empty comment
    response = client.post(f'/api/posts/{post_id}/comments', json={
        'content': ''
    }, headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 400


def test_create_comment_unauthenticated(create_verified_user, get_auth_token, client, app):
    """Test creating comment without authentication"""
    create_verified_user(username='postowner', email='postowner@dev.com', password='Test@Pass123')
    token = get_auth_token(username='postowner', password='Test@Pass123')

    # Create a post
    response = client.post('/api/posts', json={
        'title': 'Post',
        'content': 'Content'
    }, headers={'Authorization': f'Bearer {token}'})
    post_id = response.get_json()['id']

    # Create a fresh client without auth cookies
    fresh_client = app.test_client()

    # Try to comment without auth
    response = fresh_client.post(f'/api/posts/{post_id}/comments', json={
        'content': 'Trying to comment'
    })
    assert response.status_code == 401


def test_get_comments(create_verified_user, get_auth_token, client):
    """Test GET /api/posts/<id>/comments"""
    create_verified_user(username='reader', email='reader@dev.com', password='Test@Pass123')
    token = get_auth_token(username='reader', password='Test@Pass123')

    # Create a post
    response = client.post('/api/posts', json={
        'title': 'Post with Comments',
        'content': 'Read comments'
    }, headers={'Authorization': f'Bearer {token}'})
    post_id = response.get_json()['id']

    # Add some comments
    client.post(f'/api/posts/{post_id}/comments', json={
        'content': 'First comment'
    }, headers={'Authorization': f'Bearer {token}'})
    client.post(f'/api/posts/{post_id}/comments', json={
        'content': 'Second comment'
    }, headers={'Authorization': f'Bearer {token}'})

    # Get comments
    response = client.get(f'/api/posts/{post_id}/comments')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[0]['content'] == 'First comment'
    assert data[1]['content'] == 'Second comment'


def test_get_comments_empty(create_verified_user, get_auth_token, client):
    """Test getting comments from post with no comments"""
    create_verified_user(username='lonely', email='lonely@dev.com', password='Test@Pass123')
    token = get_auth_token(username='lonely', password='Test@Pass123')

    # Create a post
    response = client.post('/api/posts', json={
        'title': 'Lonely Post',
        'content': 'No comments here'
    }, headers={'Authorization': f'Bearer {token}'})
    post_id = response.get_json()['id']

    # Get comments
    response = client.get(f'/api/posts/{post_id}/comments')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) == 0


def test_delete_comment(create_verified_user, get_auth_token, client):
    """Test DELETE /api/posts/<id>/comments/<comment_id>"""
    create_verified_user(username='deleter', email='deleter@dev.com', password='Test@Pass123')
    token = get_auth_token(username='deleter', password='Test@Pass123')

    # Create a post
    response = client.post('/api/posts', json={
        'title': 'Post',
        'content': 'Content'
    }, headers={'Authorization': f'Bearer {token}'})
    post_id = response.get_json()['id']

    # Create a comment
    response = client.post(f'/api/posts/{post_id}/comments', json={
        'content': 'Comment to delete'
    }, headers={'Authorization': f'Bearer {token}'})
    comment_id = response.get_json()['id']

    # Delete the comment
    response = client.delete(f'/api/posts/{post_id}/comments/{comment_id}', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200

    # Verify comment is deleted
    comment = Comment.query.get(comment_id)
    assert comment is None


def test_delete_comment_not_owner(create_verified_user, get_auth_token, client):
    """Test deleting someone else's comment (should fail)"""
    # User 1 creates post and comment
    create_verified_user(username='owner', email='owner@dev.com', password='Test@Pass123')
    token1 = get_auth_token(username='owner', password='Test@Pass123')

    response = client.post('/api/posts', json={
        'title': 'Post',
        'content': 'Content'
    }, headers={'Authorization': f'Bearer {token1}'})
    post_id = response.get_json()['id']

    response = client.post(f'/api/posts/{post_id}/comments', json={
        'content': 'Original comment'
    }, headers={'Authorization': f'Bearer {token1}'})
    comment_id = response.get_json()['id']

    # User 2 tries to delete it
    create_verified_user(username='hacker', email='hacker@dev.com', password='Test@Pass123')
    token2 = get_auth_token(username='hacker', password='Test@Pass123')

    response = client.delete(f'/api/posts/{post_id}/comments/{comment_id}', headers={'Authorization': f'Bearer {token2}'})
    assert response.status_code == 403


def test_delete_comment_unauthenticated(create_verified_user, get_auth_token, client, app):
    """Test deleting comment without authentication"""
    create_verified_user(username='author', email='author@dev.com', password='Test@Pass123')
    token = get_auth_token(username='author', password='Test@Pass123')

    # Create post and comment
    response = client.post('/api/posts', json={
        'title': 'Post',
        'content': 'Content'
    }, headers={'Authorization': f'Bearer {token}'})
    post_id = response.get_json()['id']

    response = client.post(f'/api/posts/{post_id}/comments', json={
        'content': 'Comment'
    }, headers={'Authorization': f'Bearer {token}'})
    comment_id = response.get_json()['id']

    # Create a fresh client without auth cookies
    fresh_client = app.test_client()

    # Try to delete without auth
    response = fresh_client.delete(f'/api/posts/{post_id}/comments/{comment_id}')
    assert response.status_code == 401
