from datetime import datetime, timedelta, timezone
import os
import re
import secrets

from app import db, get_real_ip, limiter
from flask import Blueprint, current_app, jsonify, make_response, render_template_string, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
    set_access_cookies,
    unset_jwt_cookies,
)
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from models import User
import requests
from sqlalchemy.exc import IntegrityError
from utils import validate_password
from utils.email import (
    get_2fa_code_email,
    get_email_verification_email,
    get_login_notification_email,
    get_password_change_confirmation_email,
    get_password_reset_confirmation_email,
    get_password_reset_request_email,
    get_registration_code_email,
    send_email,
    send_password_reset_admin_alert,
)
from utils.login_details import get_location_from_ip, parse_user_agent


auth_bp = Blueprint('auth', __name__)

secret_key = os.environ.get('SECRET_KEY')
if not secret_key:
    raise RuntimeError("SECRET_KEY environment variable is not set")
serializer = URLSafeTimedSerializer(secret_key)

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

def send_verification_email(user_email):
    """Send email verification using centralized email template"""
    token = serializer.dumps(user_email, salt='email-confirm')
    confirm_url = f"{FRONTEND_URL}/verify-email/{token}"

    # Get professional email template
    subject, html = get_email_verification_email(confirm_url)

    # Send via centralized email system
    send_email(to=user_email, subject=subject, html=html)


# VERIFY EMAIL
@auth_bp.route('/verify-email/<token>', methods=['GET'])
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
@auth_bp.route('/resend-verification', methods=['POST'])
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
@auth_bp.route('/register', methods=['POST'])
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
    is_valid, message = validate_password(password)
    if not is_valid:
        return jsonify({"msg": message}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "User already exists"}), 400
    new_user = User(username=username, email=email) # type: ignore
    new_user.set_password(password)

    # Generate 6-digit verification code (expires in 10 minutes)
    code = new_user.generate_2fa_code(minutes=10)

    db.session.add(new_user)
    try :
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return {"msg": "Username or email already exists."}, 400

    # Send verification code via email
    try:
        subject, html = get_registration_code_email(code)
        send_email(to=email, subject=subject, html=html)
    except Exception as e:
        print(f"Failed to send verification code email: {e!r}")
        # Don't fail registration if email fails - user can request resend
        # But log the error

    return jsonify({"msg": "Registration successful. Please check your email for a verification code."}), 201


# LOGIN
@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
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
        # Record failed login attempt
        user.record_failed_login()
        db.session.commit()
        return jsonify({"msg": "Incorrect password"}), 401

    if not user.is_verified:
        return jsonify({"msg": "Please verify your email before logging in."}), 403

    # Check if 2FA is required for this user
    if user.twofa_enabled:
        # Generate and send 2FA code instead of completing login
        code = user.generate_2fa_code(minutes=5)
        db.session.commit()

        # Send 2FA code via email
        try:
            subject, html = get_2fa_code_email(code)
            send_email(to=user.email, subject=subject, html=html)
        except Exception as e:
            print(f"Failed to send 2FA code email: {e!r}")
            return jsonify({"msg": "Failed to send verification code. Please try again."}), 500

        # Return response indicating 2FA is required (don't set JWT cookies yet)
        return jsonify({
            'requires_2fa': True,
            'email': user.email,
            'message': 'Verification code sent to your email'
        }), 200

    # No 2FA required - complete normal login flow
    # Capture login details for security tracking
    login_ip = get_real_ip()
    user_agent_string = request.headers.get('User-Agent', '')
    browser_info, device_info = parse_user_agent(user_agent_string)
    location_info = get_location_from_ip(login_ip)

    # Record successful login
    user.record_successful_login(
        ip_address=login_ip,
        location=location_info,
        browser=browser_info,
        device=device_info
    )
    db.session.commit()

    # Send login notification email (security feature)
    try:
        login_time = datetime.now(timezone.utc).strftime('%B %d, %Y at %I:%M %p UTC')
        subject, html = get_login_notification_email(
            email=user.email,
            login_time=login_time,
            ip_address=login_ip,
            location=location_info,
            browser=browser_info,
            device=device_info
        )
        send_email(to=user.email, subject=subject, html=html)
    except Exception as e:
        # Don't fail login if email fails - log it
        print(f"Failed to send login notification: {e!r}")

    # Create access token with token version for invalidation support
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"token_version": user.token_version}
    )

    # Calculate session expiry timestamp (Unix timestamp in seconds)
    jwt_expires_seconds = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 14400)
    session_expires_at = int(datetime.now(timezone.utc).timestamp()) + jwt_expires_seconds

    # Set httpOnly cookie and return user info with session expiry
    response = make_response(jsonify({
        'user': user.to_dict(),
        'message': 'Login successful',
        'sessionExpiresAt': session_expires_at
    }), 200)
    set_access_cookies(response, access_token)
    return response


# LOGOUT
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout by clearing httpOnly cookie"""
    try:
        response = make_response(jsonify({
            'message': 'Logged out successfully'
        }), 200)
        unset_jwt_cookies(response)
        return response
    except Exception as e:
        print(f"Logout error: {e!r}")
        return jsonify({'error': 'An error occurred during logout'}), 500


# EXTEND SESSION
@auth_bp.route('/auth/extend-session', methods=['POST'])
@jwt_required()
def extend_session():
    """Extend session by issuing a new JWT with fresh 4-hour expiry"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 401

        # Create new JWT with fresh 4-hour expiry
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={"token_version": user.token_version}
        )

        # Calculate new session expiry timestamp (Unix timestamp in seconds)
        jwt_expires_seconds = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 14400)
        session_expires_at = int(datetime.now(timezone.utc).timestamp()) + jwt_expires_seconds

        # Set new httpOnly cookie and return new expiry time
        response = make_response(jsonify({
            'message': 'Session extended successfully',
            'sessionExpiresAt': session_expires_at
        }), 200)
        set_access_cookies(response, access_token)
        return response

    except Exception as e:
        print(f"Extend session error: {e!r}")
        return jsonify({'error': 'An error occurred while extending session'}), 500


# FORGOT PASSWORD - Request password reset
@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit("3 per hour")
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
    user.reset_token_expiry = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=1)
    db.session.commit()

    # Send password reset email using professional template
    reset_url = f"{FRONTEND_URL}/reset-password/{reset_token}"
    subject, html = get_password_reset_request_email(reset_url)
    send_email(to=email, subject=subject, html=html)

    # Send admin security alert for password reset
    try:
        send_password_reset_admin_alert(email)
    except Exception as e:
        # Don't fail request if admin alert fails - log it
        print(f"Failed to send password reset admin alert: {e!r}")

    return jsonify({"msg": "If that email exists, a password reset link has been sent."}), 200


# RESET PASSWORD - Set new password with token
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')

    if not token or not new_password:
        return jsonify({"msg": "Token and new password are required"}), 400

    # Validate password strength
    is_valid, message = validate_password(new_password)
    if not is_valid:
        return jsonify({"msg": message}), 400

    user = User.query.filter_by(reset_token=token).first()
    if not user:
        return jsonify({"msg": "Invalid or expired reset token"}), 400

    # Check if token is expired
    if not user.reset_token_expiry or user.reset_token_expiry < datetime.now(timezone.utc).replace(tzinfo=None):
        return jsonify({"msg": "Reset token has expired"}), 400

    # Set new password and invalidate all existing tokens
    user.set_password(new_password)
    user.invalidate_tokens()
    user.password_reset_count += 1
    user.reset_token = None
    user.reset_token_expiry = None
    db.session.commit()

    # Send password reset confirmation email
    try:
        subject, html = get_password_reset_confirmation_email(user.email)
        send_email(to=user.email, subject=subject, html=html)
    except Exception as e:
        # Don't fail request if email fails - log it
        print(f"Failed to send password reset confirmation email: {e!r}")

    return jsonify({"msg": "Password has been reset successfully"}), 200


# VERIFY 2FA
@auth_bp.route('/verify-2fa', methods=['POST'])
@limiter.limit("5 per 5 minutes")
def verify_2fa():
    """Verify 2FA code and complete login"""
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')

    if not email or not code:
        return jsonify({"msg": "Email and verification code are required"}), 400

    user = User.query.filter(User.email == email).first()
    if not user or not user.is_valid_2fa_code(code):
        return jsonify({"msg": "Invalid or expired verification code"}), 401

    # Clear 2FA code
    user.clear_2fa_code()

    # Capture login details for security tracking
    login_ip = get_real_ip()
    user_agent_string = request.headers.get('User-Agent', '')
    browser_info, device_info = parse_user_agent(user_agent_string)
    location_info = get_location_from_ip(login_ip)

    # Record successful login
    user.record_successful_login(
        ip_address=login_ip,
        location=location_info,
        browser=browser_info,
        device=device_info
    )
    db.session.commit()

    # Send login notification email
    try:
        login_time = datetime.now(timezone.utc).strftime('%B %d, %Y at %I:%M %p UTC')
        subject, html = get_login_notification_email(
            email=user.email,
            login_time=login_time,
            ip_address=login_ip,
            location=location_info,
            browser=browser_info,
            device=device_info
        )
        send_email(to=user.email, subject=subject, html=html)
    except Exception as e:
        print(f"Failed to send login notification: {e!r}")

    # Create access token
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"token_version": user.token_version}
    )

    # Calculate session expiry timestamp (Unix timestamp in seconds)
    jwt_expires_seconds = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 14400)
    session_expires_at = int(datetime.now(timezone.utc).timestamp()) + jwt_expires_seconds

    # Set httpOnly cookie and return user info with session expiry
    response = make_response(jsonify({
        'user': user.to_dict(),
        'message': 'Login successful',
        'sessionExpiresAt': session_expires_at
    }), 200)
    set_access_cookies(response, access_token)
    return response


# VERIFY REGISTRATION
@auth_bp.route('/verify-registration', methods=['POST'])
def verify_registration():
    """Verify registration code and complete account setup"""
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')

    if not email or not code:
        return jsonify({"msg": "Email and verification code are required"}), 400

    user = User.query.filter(User.email == email).first()
    if not user:
        return jsonify({"msg": "Invalid verification code"}), 401

    # Check if already verified
    if user.is_verified:
        return jsonify({"msg": "Email already verified. Please login."}), 400

    # Verify the code
    if not user.is_valid_2fa_code(code):
        return jsonify({"msg": "Invalid or expired verification code"}), 401

    # Mark user as verified
    user.is_verified = True

    # Clear verification code
    user.clear_2fa_code()

    # Capture login details for security tracking (auto-login after verification)
    login_ip = get_real_ip()
    user_agent_string = request.headers.get('User-Agent', '')
    browser_info, device_info = parse_user_agent(user_agent_string)
    location_info = get_location_from_ip(login_ip)

    # Record successful login
    user.record_successful_login(
        ip_address=login_ip,
        location=location_info,
        browser=browser_info,
        device=device_info
    )
    db.session.commit()

    # Send login notification email (optional - user just verified)
    try:
        login_time = datetime.now(timezone.utc).strftime('%B %d, %Y at %I:%M %p UTC')
        subject, html = get_login_notification_email(
            email=user.email,
            login_time=login_time,
            ip_address=login_ip,
            location=location_info,
            browser=browser_info,
            device=device_info
        )
        send_email(to=user.email, subject=subject, html=html)
    except Exception as e:
        print(f"Failed to send login notification: {e!r}")

    # Create access token
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"token_version": user.token_version}
    )

    # Calculate session expiry timestamp (Unix timestamp in seconds)
    jwt_expires_seconds = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 14400)
    session_expires_at = int(datetime.now(timezone.utc).timestamp()) + jwt_expires_seconds

    # Set httpOnly cookie and return user info with session expiry
    response = make_response(jsonify({
        'user': user.to_dict(),
        'message': 'Email verified successfully! Welcome!',
        'sessionExpiresAt': session_expires_at
    }), 200)
    set_access_cookies(response, access_token)
    return response


# TOGGLE 2FA
@auth_bp.route('/toggle-2fa', methods=['POST'])
@jwt_required()
def toggle_2fa():
    """Enable or disable 2FA for the current user"""

    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"msg": "User not found"}), 404

    data = request.get_json()
    enable = data.get('enable', False)

    user.twofa_enabled = enable
    db.session.commit()

    return jsonify({
        'message': f'2FA {"enabled" if enable else "disabled"} successfully',
        'twofa_enabled': user.twofa_enabled
    }), 200


# CHANGE PASSWORD
@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change password for the current user"""
    try:
        data = request.get_json()

        if not data or not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Current password and new password are required'}), 400

        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Verify current password
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 400

        # Validate new password strength
        new_password = data['new_password']
        is_valid, error_msg = validate_password(new_password)
        if not is_valid:
            return jsonify({'error': error_msg}), 400

        # Set new password and invalidate all existing tokens
        user.set_password(new_password)
        user.invalidate_tokens()  # Invalidate all existing JWT tokens
        db.session.commit()

        # Send password change confirmation email
        try:
            subject, html = get_password_change_confirmation_email(user.email)
            send_email(to=user.email, subject=subject, html=html)
        except Exception as e:
            print(f"Failed to send password change confirmation email: {e!r}")
            # Don't fail the request if email fails

        return jsonify({'message': 'Password changed successfully'}), 200

    except Exception as e:
        print(f"Change password error: {e!s}")
        db.session.rollback()
        return jsonify({'error': 'An error occurred while changing password'}), 500
