import re

from app import db
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from models.comment import Comment
from models.post import BlogPost
from models.user import User
from models.vote import Vote
from sqlalchemy.exc import IntegrityError


user_bp = Blueprint('user', __name__)

# GET CURRENT USER PROFILE
@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "created_at": user.created_at.isoformat(),
        "is_verified": user.is_verified
    }), 200

# UPDATE USER PROFILE
@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    data = request.get_json()
    username = data.get('username', '').strip().lower()
    email = data.get('email', '').strip()

    if not username or not email:
        return jsonify({"msg": "Username and email are required"}), 400

    # Username validation
    if len(username) < 3 or len(username) > 20:
        return jsonify({"msg": "Username must be 3-20 characters long"}), 400

    if not re.match(r'^[a-z0-9_]+$', username):
        return jsonify({"msg": "Username can only contain lowercase letters, numbers, and underscores"}), 400

    # Check if username is taken by another user
    existing_user = User.query.filter_by(username=username).first()
    if existing_user and existing_user.id != user.id:
        return jsonify({"msg": "Username is already taken"}), 400

    old_email = user.email
    user.username = username
    user.email = email
    if email != old_email:
        user.is_verified = False
        # You may want to import and call send_verification_email here

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"msg": "Username or email is already taken"}), 400

    # Return the updated user object (matches GET /profile pattern)
    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "created_at": user.created_at.isoformat(),
        "is_verified": user.is_verified,
        "twofa_enabled": user.twofa_enabled
    }), 200

# DELETE USER PROFILE
@user_bp.route('/profile', methods=['DELETE'])
@jwt_required()
def delete_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    Vote.query.filter_by(user_id=user.id).delete(synchronize_session=False)
    Comment.query.filter_by(user_id=user.id).delete(synchronize_session=False)
    BlogPost.query.filter_by(user_id=user.id).delete(synchronize_session=False)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"msg": "Account and all related data deleted successfully"}), 200

# GET USER PROFILE BY USERNAME
@user_bp.route('/users/<string:username>', methods=['GET'])
def get_user_profile(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404
    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "created_at": user.created_at.isoformat(),
        "is_verified": user.is_verified
    }), 200

# GET ALL USERS (with pagination and search)
@user_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users with pagination and search (authenticated users only)"""
    try:
        # 1. Get pagination and search parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')

        # 2. Validate inputs to prevent DoS attacks
        if page < 1 or page > 10000:
            return jsonify({'error': 'Page must be between 1 and 10000'}), 400
        if per_page < 1 or per_page > 100:
            return jsonify({'error': 'Per page must be between 1 and 100'}), 400
        if len(search) > 100:
            return jsonify({'error': 'Search query too long (max 100 characters)'}), 400

        # 3. Build query with optional search filter
        query = User.query

        if search:
            # Server-side filtering - search by username (case-insensitive)
            query = query.filter(User.username.ilike(f'%{search}%'))

        # 4. Apply pagination and ordering
        users = query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        # 5. Return structured response with metadata
        return jsonify({
            'users': [{"id": user.id, "username": user.username} for user in users.items],
            'total': users.total,
            'pages': users.pages,
            'current_page': page
        }), 200

    except Exception:
        return jsonify({'error': 'An error occurred'}), 500

# GET USER POSTS BY USERNAME
@user_bp.route('/users/<string:username>/posts', methods=['GET'])
def get_user_posts(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404
    posts = BlogPost.query.filter_by(user_id=user.id).all()
    return jsonify([post.to_dict() for post in posts]), 200

# GET USER VOTES COUNT BY USERNAME
@user_bp.route('/users/<string:username>/votes/count', methods=['GET'])
def get_user_votes_count(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404
    count = Vote.query.filter_by(user_id=user.id).count()
    return jsonify({"count": count}), 200

# GET USER COMMENTS COUNT BY USERNAME
@user_bp.route('/users/<string:username>/comments/count', methods=['GET'])
def get_user_comments_count(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404
    count = Comment.query.filter_by(user_id=user.id).count()
    return jsonify({"count": count}), 200

# GET POSTS USER HAS VOTED ON
@user_bp.route('/users/<string:username>/voted-posts', methods=['GET'])
def get_user_voted_posts(username):
    """Get all posts that a user has voted on"""
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    # Get all votes by this user with their associated posts
    votes = Vote.query.filter_by(user_id=user.id).all()

    # Get the posts and include user's vote type
    posts_with_votes = []
    for vote in votes:
        post = BlogPost.query.get(vote.post_id)
        if post:
            post_dict = post.to_dict()
            post_dict['user_vote'] = vote.vote_type
            posts_with_votes.append(post_dict)

    return jsonify(posts_with_votes), 200

# GET POSTS USER HAS COMMENTED ON
@user_bp.route('/users/<string:username>/commented-posts', methods=['GET'])
def get_user_commented_posts(username):
    """Get all posts that a user has commented on, with their comment preview"""
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    # Get distinct posts user has commented on
    # For each post, include user's most recent comment as a preview
    comments = Comment.query.filter_by(user_id=user.id).order_by(Comment.created_at.desc()).all()

    # Track unique posts and their most recent comment from this user
    seen_posts = {}
    for comment in comments:
        if comment.post_id not in seen_posts:
            post = BlogPost.query.get(comment.post_id)
            if post:
                post_dict = post.to_dict()
                post_dict['user_comment'] = {
                    'content': comment.content,
                    'created_at': comment.created_at.isoformat() if comment.created_at else None
                }
                seen_posts[comment.post_id] = post_dict

    return jsonify(list(seen_posts.values())), 200

