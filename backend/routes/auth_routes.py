from datetime import timedelta
import os

from backend.extensions import db
from backend.models import User
from flask import Blueprint, jsonify, render_template_string, request
from flask_jwt_extended import create_access_token
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
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

def send_verification_email(user_email):
    token = serializer.dumps(user_email, salt='email-confirm')
    confirm_url = f"{request.url_root}verify-email/{token}"
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
    honeypot = data.get('website', '')
    if honeypot:
        return jsonify({"msg": "Bot detected."}), 400
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    if not username or not email or not password:
        return jsonify({"msg": "Username, email, and password are required"}), 400
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
