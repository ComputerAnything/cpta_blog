from datetime import timedelta
from flask import Blueprint, request, jsonify, render_template_string
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from models import User, BlogPost, Vote, Comment
import requests
import os
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature

# SMTP configuration
mail = Mail()
secret_key = os.environ.get('SECRET_KEY')
if not secret_key:
    raise RuntimeError("SECRET_KEY environment variable is not set")

serializer = URLSafeTimedSerializer(secret_key)


# function to send verification email
def send_verification_email(user_email):
    token = serializer.dumps(user_email, salt='email-confirm')
    confirm_url = f"{request.url_root}verify-email/{token}"
    msg = Message(
        subject='Confirm Your Email',
        recipients=[user_email],
        body=f'Click the link to verify your email: {confirm_url}'
    )
    mail.send(msg)


# Create a blueprint for the routes
routes = Blueprint('routes', __name__)


# EMAIL VERIFICATION
@routes.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    try:
        email = serializer.loads(token, salt='email-confirm', max_age=3600)
    except SignatureExpired:
        return render_template_string("""
            <html>
            <head><title>Email Verification</title></head>
            <body style="background:#111;color:#00ff00;font-family:sans-serif;text-align:center;padding:2em;">
                <h1>Email Verification Failed</h1>
                <p>The verification link has expired.</p>
                <a href="https://www.computeranything.dev/" style="color:#00ff00;text-decoration:underline;">Back to Computer Anything</a>
            </body>
            </html>
        """), 400
    except BadSignature:
        return render_template_string("""
            <html>
            <head><title>Email Verification</title></head>
            <body style="background:#111;color:#00ff00;font-family:sans-serif;text-align:center;padding:2em;">
                <h1>Email Verification Failed</h1>
                <p>Invalid verification token.</p>
                <a href="https://www.computeranything.dev/" style="color:#00ff00;text-decoration:underline;">Back to Computer Anything</a>
            </body>
            </html>
        """), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return render_template_string("""
            <html>
            <head><title>Email Verification</title></head>
            <body style="background:#111;color:#00ff00;font-family:sans-serif;text-align:center;padding:2em;">
                <h1>Email Verification Failed</h1>
                <p>User not found.</p>
                <a href="https://www.computeranything.dev/" style="color:#00ff00;text-decoration:underline;">Back to Computer Anything</a>
            </body>
            </html>
        """), 404
    user.is_verified = True
    db.session.commit()
    return render_template_string("""
        <html>
        <head><title>Email Verified</title></head>
        <body style="background:#111;color:#00ff00;font-family:sans-serif;text-align:center;padding:2em;">
            <h1>Email Verified!</h1>
            <p>Your email has been successfully verified.</p>
            <a href="https://www.computeranything.dev/" style="color:#00ff00;text-decoration:underline;">Click Here, and login with your verified email address</a>
        </body>
        </html>
    """), 200


# RETRY EMAIL VERIFICATION
@routes.route('/api/resend-verification', methods=['POST'])
def resend_verification():
    data = request.get_json()
    identifier = data.get('identifier')
    user = User.query.filter((User.username == identifier) | (User.email == identifier)).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404
    if user.is_verified:
        return jsonify({"msg": "Email already verified."}), 400
    send_verification_email(user.email)
    return jsonify({"msg": "Verification email sent."}), 200


# USER REGISTRATION
@routes.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    honeypot = data.get('website', '')
    if honeypot:
        return jsonify({"msg": "Bot detected."}), 400
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    # recaptcha_token = data.get('recaptchaToken')

    # reCAPTCHA verification
    # RECAPTCHA_SECRET_KEY = os.environ.get('RECAPTCHA_SECRET_KEY')
    # if not recaptcha_token:
    #     return jsonify({"msg": "reCAPTCHA token is missing"}), 400

    # recaptcha_response = requests.post(
    #     'https://www.google.com/recaptcha/api/siteverify',
    #     data={
    #         'secret': RECAPTCHA_SECRET_KEY,
    #         'response': recaptcha_token
    #     }
    # )
    # result = recaptcha_response.json()
    # if not result.get('success'):
    #     return jsonify({"msg": "reCAPTCHA verification failed"}), 400

    # Validate input
    if not username or not email or not password:
        return jsonify({"msg": "Username, email, and password are required"}), 400

    # Check if the user already exists
    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "User already exists"}), 400

    # Create a new user
    new_user = User(username=username, email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    # Send verification email
    # send_verification_email(email)

    return jsonify({"msg": "User created successfully"}), 201


# USER LOGIN
@routes.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    identifier = data.get('identifier')  # Can be username or email
    password = data.get('password')

    if not identifier or not password:
        return jsonify({"msg": "Username/email and password are required"}), 400

    # Try to find user by username or email
    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()

    # If user not found, return error
    if not user:
        return jsonify({"msg": "User does not exist"}), 404

    # Check if the password is correct
    if not user.check_password(password):
        return jsonify({"msg": "Incorrect password"}), 401

    # Check if the user's email has been verified
    # if not user.is_verified:
    #     return jsonify({"msg": "Please verify your email before logging in."}), 403

    access_token = create_access_token(identity=str(user.id), expires_delta=timedelta(hours=12))
    # Debugging
    # print(f"User ID: {user.id}")

    return jsonify({
        "access_token": access_token,
        "user_id": user.id,
        "username": user.username
    }), 200


# GET CURRENT USER PROFILE
@routes.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()  # Get the user ID from the JWT token
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
@routes.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()  # Get the user ID from the JWT token
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    data = request.get_json()
    username = data.get('username')
    email = data.get('email')

    # Validate input
    if not username or not email:
        return jsonify({"msg": "Username and email are required"}), 400

    # Update user information
    old_email = user.email
    user.username = username
    user.email = email
    # Check if the email has changed, if so, send a verification email
    # if email != old_email:
    #     user.is_verified = False
    #     send_verification_email(email)
    # db.session.commit()

    return jsonify({"msg": "Profile updated successfully"}), 200


# DELETE USER PROFILE
@routes.route('/api/profile', methods=['DELETE'])
@jwt_required()
def delete_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    # Delete user's votes
    Vote.query.filter_by(user_id=user.id).delete(synchronize_session=False)
    # Delete user's comments
    Comment.query.filter_by(user_id=user.id).delete(synchronize_session=False)
    # Delete user's posts (this will also delete votes/comments on those posts due to cascade)
    BlogPost.query.filter_by(user_id=user.id).delete(synchronize_session=False)

    db.session.delete(user)
    db.session.commit()
    return jsonify({"msg": "Account and all related data deleted successfully"}), 200


# GET USER PROFILE BY ID
@routes.route('/api/users/<int:user_id>', methods=['GET'])
# @jwt_required()
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
@routes.route('/api/users', methods=['GET'])
# Remove for guest access
# @jwt_required()
def get_all_users():
    users = User.query.all()
    return jsonify([{"id": user.id, "username": user.username} for user in users]), 200


# GET ALL BLOG POSTS
@routes.route('/api/posts', methods=['GET'])
# Remove for guest access
# @jwt_required()
def get_posts():
    try:
        posts = BlogPost.query.all()
        # Debugging
        # print([post.to_dict() for post in posts])
        return jsonify([post.to_dict() for post in posts]), 200
    except Exception as e:
        # Debugging
        # print('Error in /posts:', e)
        return jsonify({'msg': str(e)}), 500


# GET USER'S BLOG POSTS
@routes.route('/api/users/<int:user_id>/posts', methods=['GET'])
# @jwt_required()
def get_user_posts(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    posts = BlogPost.query.filter_by(user_id=user_id).all()
    return jsonify([post.to_dict() for post in posts]), 200


# GET A SINGLE BLOG POST
@routes.route('/api/posts/<int:post_id>', methods=['GET'])
# @jwt_required()
def get_post(post_id):
    post = BlogPost.query.get(post_id)
    if not post:
        return jsonify({"msg": "Post not found"}), 404
    return jsonify(post.to_dict()), 200


# CREATE BLOG POST
@routes.route('/api/posts', methods=['POST'])
@jwt_required()
def create_post():
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    topic_tags = data.get('topic_tags') # Optional field
    user_id = get_jwt_identity()  # Get the user ID from the JWT token

    # Validate input
    if not title or not content:
        return jsonify({"msg": "Title and content are required"}), 400

    # Create a new blog post
    new_post = BlogPost(title=title, content=content, topic_tags=topic_tags, user_id=user_id)
    db.session.add(new_post)
    db.session.commit()

    return jsonify(new_post.to_dict()), 201


# UPDATE BLOG POST
@routes.route('/api/posts/<int:post_id>', methods=['PUT'])
@jwt_required()
def update_post(post_id):
    user_id = get_jwt_identity()  # Get the user ID from the JWT token
    post = BlogPost.query.get(post_id)

    if not post:
        return jsonify({"msg": "Post not found"}), 404

    # Ensure the post belongs to the current user
    if post.user_id != int(user_id):
        return jsonify({"msg": "You are not authorized to edit this post"}), 403

    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    topic_tags = data.get('topic_tags') # Optional field

    # Validate input
    if not title or not content:
        return jsonify({"msg": "Title and content are required"}), 400

    # Update the post
    post.title = title
    post.content = content
    post.topic_tags = topic_tags
    db.session.commit()

    return jsonify({"msg": "Post updated successfully", "post": post.to_dict()}), 200


# DELETE BLOG POST
@routes.route('/api/posts/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_post(post_id):
    user_id = get_jwt_identity()  # Get the user ID from the JWT token
    post = BlogPost.query.get(post_id)

    if not post:
        return jsonify({"msg": "Post not found"}), 404

    # Ensure the post belongs to the current user
    if post.user_id != int(user_id):
        return jsonify({"msg": "You are not authorized to delete this post"}), 403

    db.session.delete(post)
    db.session.commit()

    return jsonify({"msg": "Post deleted successfully"}), 200


# UPVOTE BLOG POST
@routes.route('/api/posts/<int:post_id>/upvote', methods=['POST'])
@jwt_required()
def upvote_post(post_id):
    user_id = get_jwt_identity()
    post = BlogPost.query.get(post_id)
    if not post:
        return jsonify({"msg": "Post not found"}), 404

    # Check if the user has already voted
    existing_vote = Vote.query.filter_by(user_id=user_id, post_id=post_id).first()
    if existing_vote:
        if existing_vote.vote_type == 'upvote':
            # Remove the upvote
            db.session.delete(existing_vote)
            post.upvotes -= 1
        else:
            # Change the vote to upvote
            existing_vote.vote_type = 'upvote'
            post.upvotes += 1
            post.downvotes -= 1
    else:
        # Add a new upvote
        new_vote = Vote(user_id=user_id, post_id=post_id, vote_type='upvote')
        db.session.add(new_vote)
        post.upvotes += 1

    db.session.commit()
    return jsonify({"msg": "Post upvoted successfully", "upvotes": post.upvotes, "downvotes": post.downvotes}), 200


# DOWNVOTE BLOG POST
@routes.route('/api/posts/<int:post_id>/downvote', methods=['POST'])
@jwt_required()
def downvote_post(post_id):
    user_id = get_jwt_identity()
    post = BlogPost.query.get(post_id)
    if not post:
        return jsonify({"msg": "Post not found"}), 404

    # Check if the user has already voted
    existing_vote = Vote.query.filter_by(user_id=user_id, post_id=post_id).first()
    if existing_vote:
        if existing_vote.vote_type == 'downvote':
            # Remove the downvote
            db.session.delete(existing_vote)
            post.downvotes -= 1
        else:
            # Change the vote to downvote
            existing_vote.vote_type = 'downvote'
            post.downvotes += 1
            post.upvotes -= 1
    else:
        # Add a new downvote
        new_vote = Vote(user_id=user_id, post_id=post_id, vote_type='downvote')
        db.session.add(new_vote)
        post.downvotes += 1

    db.session.commit()
    return jsonify({"msg": "Post downvoted successfully", "upvotes": post.upvotes, "downvotes": post.downvotes}), 200


# COUNT VOTES
@routes.route('/api/users/<int:user_id>/votes/count', methods=['GET'])
# @jwt_required()
def get_user_votes_count(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    count = Vote.query.filter_by(user_id=user_id).count()
    return jsonify({"count": count}), 200


# POST A COMMENT
@routes.route('/api/posts/<int:post_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(post_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    content = data.get('content')

    if not content:
        return jsonify({"msg": "Content is required"}), 400

    post = BlogPost.query.get(post_id)
    if not post:
        return jsonify({"msg": "Post not found"}), 404

    comment = Comment(content=content, user_id=user_id, post_id=post_id)
    db.session.add(comment)
    db.session.commit()

    return jsonify(comment.to_dict()), 201


# GET COMMENTS FOR A POST
@routes.route('/api/posts/<int:post_id>/comments', methods=['GET'])
# @jwt_required()
def get_comments(post_id):
    post = BlogPost.query.get(post_id)
    if not post:
        return jsonify({"msg": "Post not found"}), 404

    comments = Comment.query.filter_by(post_id=post_id).all()
    return jsonify([comment.to_dict() for comment in comments]), 200


# DELETE A COMMENT
@routes.route('/api/posts/<int:post_id>/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(post_id, comment_id):
    user_id = get_jwt_identity()  # Get the user ID from the JWT token
    comment = Comment.query.get(comment_id)

    if not comment:
        return jsonify({"msg": "Comment not found"}), 404

    # Ensure the comment belongs to the correct post
    if comment.post_id != post_id:
        return jsonify({"msg": "Comment does not belong to this post"}), 400

    # Ensure the comment belongs to the current user
    if comment.user_id != int(user_id):
        return jsonify({"msg": "You are not authorized to delete this comment"}), 403

    db.session.delete(comment)
    db.session.commit()

    return jsonify({"msg": "Comment deleted successfully"}), 200


# COUNT COMMENTS
@routes.route('/api/users/<int:user_id>/comments/count', methods=['GET'])
# @jwt_required()
def get_user_comments_count(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    count = Comment.query.filter_by(user_id=user_id).count()
    return jsonify({"count": count}), 200
