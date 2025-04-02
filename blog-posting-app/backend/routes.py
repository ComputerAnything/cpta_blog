from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import User, BlogPost
from flask_sqlalchemy import SQLAlchemy


# Initialize the database
db = SQLAlchemy()

# Create a blueprint for the routes
routes = Blueprint('routes', __name__)

# User registration route
@routes.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "User already exists"}), 400

    new_user = User()
    new_user.username = username
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": "User created successfully"}), 201


# Login route
@routes.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        access_token = create_access_token(identity=user.id)
        return jsonify(access_token=access_token), 200

    return jsonify({"msg": "Bad username or password"}), 401


# Blog post routes
@routes.route('/posts', methods=['GET'])
@jwt_required()
def get_posts():
    posts = BlogPost.query.all()
    return jsonify([post.to_dict() for post in posts]), 200


# Create a new blog post
@routes.route('/posts', methods=['POST'])
@jwt_required()
def create_post():
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    user_id = get_jwt_identity()

    new_post = BlogPost(name=title, content=content, user_id=user_id)  # Replace 'name' with the correct attribute if different
    db.session.add(new_post)
    db.session.commit()

    return jsonify(new_post.to_dict()), 201


# Get a single blog post
@routes.route('/posts/<int:post_id>', methods=['GET'])
@jwt_required()
def get_post(post_id):
    post = BlogPost.query.get_or_404(post_id)
    return jsonify(post.to_dict()), 200


# Update a blog post
@routes.route('/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    data = request.get_json()
    post = BlogPost.query.get_or_404(post_id)

    post.title = data.get('title', post.title)
    post.content = data.get('content', post.content)
    db.session.commit()

    return jsonify(post.to_dict()), 200


# Delete a blog post
@routes.route('/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    post = BlogPost.query.get_or_404(post_id)
    db.session.delete(post)
    db.session.commit()

    return jsonify({"msg": "Post deleted"}), 200
