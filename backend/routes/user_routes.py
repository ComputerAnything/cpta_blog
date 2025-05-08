from backend.extensions import db
from backend.models import BlogPost, Comment, User, Vote
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required


user_routes = Blueprint('user_routes', __name__)

# GET CURRENT USER PROFILE
@user_routes.route('/api/profile', methods=['GET'])
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
@user_routes.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    if not username or not email:
        return jsonify({"msg": "Username and email are required"}), 400
    old_email = user.email
    user.username = username
    user.email = email
    if email != old_email:
        user.is_verified = False
        # You may want to import and call send_verification_email here
    db.session.commit()
    return jsonify({"msg": "Profile updated successfully"}), 200

# DELETE USER PROFILE
@user_routes.route('/api/profile', methods=['DELETE'])
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

# GET USER PROFILE BY ID
@user_routes.route('/api/users/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
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

# GET ALL USERS
@user_routes.route('/api/users', methods=['GET'])
def get_all_users():
    users = User.query.all()
    return jsonify([{"id": user.id, "username": user.username} for user in users]), 200

# GET USER POSTS COUNT
@user_routes.route('/api/users/<int:user_id>/posts', methods=['GET'])
def get_user_posts(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    posts = BlogPost.query.filter_by(user_id=user_id).all()
    return jsonify([post.to_dict() for post in posts]), 200

# GET USER VOTES COUNT
@user_routes.route('/api/users/<int:user_id>/votes/count', methods=['GET'])
def get_user_votes_count(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    count = Vote.query.filter_by(user_id=user_id).count()
    return jsonify({"count": count}), 200

# GET USER COMMENTS COUNT
@user_routes.route('/api/users/<int:user_id>/comments/count', methods=['GET'])
def get_user_comments_count(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    count = Comment.query.filter_by(user_id=user_id).count()
    return jsonify({"count": count}), 200

