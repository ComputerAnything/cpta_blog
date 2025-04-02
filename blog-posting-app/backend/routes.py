from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from models import User, BlogPost
from flask_sqlalchemy import SQLAlchemy


# Create a blueprint for the routes
routes = Blueprint('routes', __name__)

# User registration route
@routes.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')  # Add email field
    password = data.get('password')

    # Validate input
    if not username or not email or not password:
        return jsonify({"msg": "Username, email, and password are required"}), 400

    # Check if the user already exists
    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "User already exists"}), 400

    # Create a new user
    new_user = User(username=username, email=email)
    new_user.set_password(password)  # Hash the password
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": "User created successfully"}), 201


# Login route
@routes.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Check if the user exists
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"msg": "User does not exist"}), 404

    # Check if the password is correct
    if not user.check_password(password):
        return jsonify({"msg": "Incorrect password"}), 401

    # Generate access token if login is successful
    access_token = create_access_token(identity=user.id)
    return jsonify({"access_token": access_token}), 200


# Route to get all blog posts
@routes.route('/posts', methods=['GET'])
def get_posts():
    posts = BlogPost.query.all()
    return jsonify([post.to_dict() for post in posts]), 200
