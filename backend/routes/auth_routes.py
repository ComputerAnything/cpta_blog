from datetime import UTC, datetime, timedelta
import os
import re
import secrets

from backend.extensions import db
from backend.models import User
from flask import Blueprint, jsonify, render_template_string, request
from flask_jwt_extended import create_access_token
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
import requests
import resend
from sqlalchemy.exc import IntegrityError


auth_routes = Blueprint('auth_routes', __name__)

secret_key = os.environ.get('SECRET_KEY')
if not secret_key:
    raise RuntimeError("SECRET_KEY environment variable is not set")
serializer = URLSafeTimedSerializer(secret_key)

RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
if not RESEND_API_KEY:
    raise RuntimeError("RESEND_API_KEY environment variable is not set")
resend.api_key = RESEND_API_KEY

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
TURNSTILE_SECRET_KEY = os.environ.get('TURNSTILE_SECRET_KEY')

def verify_turnstile(token):
    """Verify Cloudflare Turnstile token"""
    if not TURNSTILE_SECRET_KEY:
        # If no secret key is set, allow for development/testing
        return True

    url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
    data = {
        'secret': TURNSTILE_SECRET_KEY,
        'response': token
    }

    try:
        response = requests.post(url, data=data, timeout=5)
        result = response.json()
        return result.get('success', False)
    except Exception:
        # If verification fails (network error, etc.), reject
        return False

def validate_password_strength(password):
    """
    Validate password strength.
    Requirements (either):
    Option 1: At least 8 characters with uppercase, lowercase, number, and special character
    Option 2: At least 12 characters (any characters allowed)
    """
    has_uppercase = re.search(r'[A-Z]', password)
    has_lowercase = re.search(r'[a-z]', password)
    has_number = re.search(r'\d', password)
    has_special = re.search(r'[!@#$%^&*(),.?":{}|<>]', password)

    # Option 1: 8+ chars with all requirements
    if len(password) >= 8 and has_uppercase and has_lowercase and has_number and has_special:
        return True, "Password is strong"

    # Option 2: 12+ chars (no other requirements)
    if len(password) >= 12:
        return True, "Password is strong"

    # Build error message based on what's missing
    if len(password) < 8:
        return False, "Password must be at least 8 characters (with special character) or 12 characters"

    if not has_uppercase:
        return False, "Password must contain at least one uppercase letter"

    if not has_lowercase:
        return False, "Password must contain at least one lowercase letter"

    if not has_number:
        return False, "Password must contain at least one number"

    if len(password) < 12:
        return False, "Password must contain a special character (!@#$%^&*(),.?\":{}|<>) or be at least 12 characters"

    return False, "Password does not meet security requirements"

def send_verification_email(user_email):
    token = serializer.dumps(user_email, salt='email-confirm')
    confirm_url = f"{FRONTEND_URL}/verify-email/{token}"
    params = {
        "from": "noreply@computeranything.dev",
        "to": [user_email],
        "subject": "Confirm Your Email",
        "html": f"""
            <h1>Confirm Your Email</h1>
            <p>Click the link below to verify your email address:</p>
            <a href="{confirm_url}">{confirm_url}</a>
            <p>If you did not sign up, you can ignore this email.</p>
        """,
    }
    resend.Emails.send(params) # type: ignore


# VERIFY EMAIL
@auth_routes.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    try:
        email = serializer.loads(token, salt='email-confirm', max_age=3600)
    except SignatureExpired:
        return render_template_string("""
            <html>
            <head><title>Email Verification</title></head>
            <body style="background:#111;color:#00ff00;font-family:sans-serif;text-align:center;padding:2em;">
                <h1>Email Verification Failed</h1>
                <p>Expired</p>
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
                <p>Invalid</p>
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


# RESEND VERIFICATION EMAIL
@auth_routes.route('/api/resend-verification', methods=['POST'])
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


# REGISTER
@auth_routes.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()

    # Verify Turnstile token
    turnstile_token = data.get('turnstile_token')
    if not verify_turnstile(turnstile_token):
        return jsonify({"msg": "Verification challenge failed. Please try again."}), 400

    honeypot = data.get('website', '')
    if honeypot:
        return jsonify({"msg": "Bot detected."}), 400
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password')
    if not username or not email or not password:
        return jsonify({"msg": "Username, email, and password are required"}), 400

    # Validate username
    if len(username) < 3:
        return jsonify({"msg": "Username must be at least 3 characters"}), 400
    if len(username) > 20:
        return jsonify({"msg": "Username must be 20 characters or less"}), 400
    if not username.islower():
        return jsonify({"msg": "Username must be lowercase"}), 400
    if not re.match(r'^[a-z0-9_]+$', username):
        return jsonify({"msg": "Username can only contain lowercase letters, numbers, and underscores"}), 400

    # Validate password strength
    is_valid, message = validate_password_strength(password)
    if not is_valid:
        return jsonify({"msg": message}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "User already exists"}), 400
    new_user = User(username=username, email=email) # type: ignore
    new_user.set_password(password)
    db.session.add(new_user)
    try :
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return {"msg": "Username or email already exists."}, 400
    send_verification_email(email)
    return jsonify({"msg": "User created successfully. Please check your email to verify your account."}), 201


# LOGIN
@auth_routes.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()

    # Verify Turnstile token
    turnstile_token = data.get('turnstile_token')
    if not verify_turnstile(turnstile_token):
        return jsonify({"msg": "Verification challenge failed. Please try again."}), 400

    identifier = data.get('identifier')
    password = data.get('password')
    if not identifier or not password:
        return jsonify({"msg": "Username/email and password are required"}), 400
    user = User.query.filter((User.username == identifier) | (User.email == identifier)).first()
    if not user:
        return jsonify({"msg": "User does not exist"}), 404
    if not user.check_password(password):
        return jsonify({"msg": "Incorrect password"}), 401
    if not user.is_verified:
        return jsonify({"msg": "Please verify your email before logging in."}), 403
    access_token = create_access_token(identity=str(user.id), expires_delta=timedelta(hours=12))
    return jsonify({
        "access_token": access_token,
        "user_id": user.id,
        "username": user.username
    }), 200


# FORGOT PASSWORD - Request password reset
@auth_routes.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()

    # Verify Turnstile token
    turnstile_token = data.get('turnstile_token')
    if not verify_turnstile(turnstile_token):
        return jsonify({"msg": "Verification challenge failed. Please try again."}), 400

    email = data.get('email')

    if not email:
        return jsonify({"msg": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        # Return success even if user not found (security best practice)
        return jsonify({"msg": "If that email exists, a password reset link has been sent."}), 200

    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.reset_token_expiry = datetime.now(UTC).replace(tzinfo=None) + timedelta(hours=1)
    db.session.commit()

    # Send reset email
    reset_url = f"{FRONTEND_URL}/reset-password/{reset_token}"
    params = {
        "from": "noreply@computeranything.dev",
        "to": [email],
        "subject": "Password Reset Request",
        "html": f"""
            <html>
            <head><title>Password Reset</title></head>
            <body style="background:#111;color:#00ff00;font-family:sans-serif;padding:2em;">
                <h1>Password Reset Request</h1>
                <p>You requested to reset your password. Click the link below to reset it:</p>
                <a href="{reset_url}" style="color:#00ff00;text-decoration:underline;">{reset_url}</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request a password reset, you can safely ignore this email.</p>
            </body>
            </html>
        """,
    }
    resend.Emails.send(params) # type: ignore

    return jsonify({"msg": "If that email exists, a password reset link has been sent."}), 200


# RESET PASSWORD - Set new password with token
@auth_routes.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')

    if not token or not new_password:
        return jsonify({"msg": "Token and new password are required"}), 400

    # Validate password strength
    is_valid, message = validate_password_strength(new_password)
    if not is_valid:
        return jsonify({"msg": message}), 400

    user = User.query.filter_by(reset_token=token).first()
    if not user:
        return jsonify({"msg": "Invalid or expired reset token"}), 400

    # Check if token is expired
    if not user.reset_token_expiry or user.reset_token_expiry < datetime.now(UTC).replace(tzinfo=None):
        return jsonify({"msg": "Reset token has expired"}), 400

    # Set new password
    user.set_password(new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.session.commit()

    return jsonify({"msg": "Password has been reset successfully"}), 200
