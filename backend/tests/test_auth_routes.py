from app import db
from models.user import User


def test_register_and_login(client):
    # Register a new user
    response = client.post('/api/register', json={
        'username': 'testuser',
        'email': 'delivered@resend.dev',
        'password': 'Test@Pass123'
    })
    assert response.status_code == 201
    assert b'Please check your email' in response.data

    # Try to login before verification
    response = client.post('/api/login', json={
        'identifier': 'testuser',
        'password': 'Test@Pass123'
    })
    assert response.status_code == 403
    assert b'verify your email' in response.data

    # Manually verify user for testing
    user = User.query.filter_by(username='testuser').first()
    assert user is not None
    user.is_verified = True
    db.session.commit()

    # Login after verification
    response = client.post('/api/login', json={
        'identifier': 'testuser',
        'password': 'Test@Pass123'
    })
    assert response.status_code == 200
    # Check for JWT in cookies instead of JSON
    cookies = response.headers.getlist('Set-Cookie')
    assert any('access_token_cookie=' in cookie for cookie in cookies)

def test_register_duplicate_username(client):
    # Register a user
    client.post('/api/register', json={
        'username': 'dupeuser',
        'email': 'dupe1@resend.dev',
        'password': 'Test@Pass123'
    })
    # Try to register with the same username
    response = client.post('/api/register', json={
        'username': 'dupeuser',
        'email': 'dupe2@resend.dev',
        'password': 'Test@Pass123'
    })
    assert response.status_code == 400
    assert b'username' in response.data or b'already' in response.data

def test_register_duplicate_email(client):
    # Register a user
    client.post('/api/register', json={
        'username': 'user1',
        'email': 'dupeemail@resend.dev',
        'password': 'Test@Pass123'
    })
    # Try to register with the same email
    response = client.post('/api/register', json={
        'username': 'user2',
        'email': 'dupeemail@resend.dev',
        'password': 'Test@Pass123'
    })
    assert response.status_code == 400
    assert b'email' in response.data or b'already' in response.data

def test_login_wrong_password(client):
    # Register and verify user
    client.post('/api/register', json={
        'username': 'wrongpass',
        'email': 'wrongpass@resend.dev',
        'password': 'Right@Pass123'
    })
    user = User.query.filter_by(username='wrongpass').first()
    assert user is not None, "User 'wrongpass' not found in database"
    user.is_verified = True
    db.session.commit()
    # Attempt login with wrong password
    response = client.post('/api/login', json={
        'identifier': 'wrongpass',
        'password': 'Wrong@Pass123'
    })
    assert response.status_code == 401
    assert b'Incorrect password' in response.data


# ============================================================================
# LOGOUT TESTS
# ============================================================================

def test_logout(authenticated_client):
    """Test POST /api/logout - User can logout successfully"""
    client, token = authenticated_client

    response = client.post('/api/logout', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200
    assert b'logged out' in response.data or b'success' in response.data


def test_logout_unauthenticated(client):
    """Test logout without authentication"""
    response = client.post('/api/logout')
    assert response.status_code == 401


# ============================================================================
# CHANGE PASSWORD TESTS
# ============================================================================

def test_change_password_success(authenticated_client):
    """Test POST /api/change-password - Successfully change password"""
    client, token = authenticated_client

    response = client.post('/api/change-password', json={
        'current_password': 'Test@Pass123',
        'new_password': 'NewPass@123'
    }, headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200
    assert b'changed' in response.data or b'success' in response.data

    # Verify can login with new password
    user = User.query.filter_by(username='testuser').first()
    assert user.check_password('NewPass@123')


def test_change_password_wrong_current(authenticated_client):
    """Test change password with wrong current password"""
    client, token = authenticated_client

    response = client.post('/api/change-password', json={
        'current_password': 'WrongPass@123',
        'new_password': 'NewPass@123'
    }, headers={'Authorization': f'Bearer {token}'})
    assert response.status_code in {400, 401}
    assert b'current password' in response.data or b'incorrect' in response.data.lower()


def test_change_password_weak_new_password(authenticated_client):
    """Test change password with weak new password"""
    client, token = authenticated_client

    response = client.post('/api/change-password', json={
        'current_password': 'Test@Pass123',
        'new_password': 'weak'
    }, headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 400
    assert b'password' in response.data.lower()


def test_change_password_unauthenticated(client):
    """Test change password without authentication"""
    response = client.post('/api/change-password', json={
        'current_password': 'Test@Pass123',
        'new_password': 'NewPass@123'
    })
    assert response.status_code == 401


# ============================================================================
# EMAIL VERIFICATION TESTS
# ============================================================================

def test_verify_email_success(client, app):
    """Test GET /api/verify-email/<token> - Successful email verification"""
    # Register a user
    client.post('/api/register', json={
        'username': 'verifyuser',
        'email': 'verify@resend.dev',
        'password': 'Test@Pass123'
    })

    # Generate verification token using the same serializer as the app
    import os  # noqa: PLC0415

    from itsdangerous import URLSafeTimedSerializer  # noqa: PLC0415
    secret_key = os.environ.get('SECRET_KEY', app.config['SECRET_KEY'])
    serializer = URLSafeTimedSerializer(secret_key)
    token = serializer.dumps('verify@resend.dev', salt='email-confirm')

    # Get user and verify not yet verified
    user = User.query.filter_by(username='verifyuser').first()
    assert user is not None
    assert user.is_verified is False

    # Verify email
    response = client.get(f'/api/verify-email/{token}')
    assert response.status_code == 200
    assert b'verified' in response.data.lower() or b'success' in response.data.lower()

    # Check user is now verified
    user = User.query.filter_by(username='verifyuser').first()
    assert user.is_verified is True


def test_verify_email_invalid_token(client):
    """Test email verification with invalid token"""
    response = client.get('/api/verify-email/invalid-token-123')
    assert response.status_code == 400
    assert b'invalid' in response.data.lower() or b'failed' in response.data.lower()


def test_resend_verification(client):
    """Test POST /api/resend-verification - Resend verification email"""
    # Register a user
    client.post('/api/register', json={
        'username': 'resenduser',
        'email': 'resend@resend.dev',
        'password': 'Test@Pass123'
    })

    # Resend verification - endpoint expects 'identifier' not 'email'
    response = client.post('/api/resend-verification', json={
        'identifier': 'resend@resend.dev'
    })
    assert response.status_code == 200
    assert b'sent' in response.data or b'email' in response.data


def test_resend_verification_already_verified(create_verified_user, client):
    """Test resending verification to already verified user"""
    create_verified_user(username='verified', email='verified@dev.com', password='Test@Pass123')

    # Endpoint expects 'identifier' not 'email'
    response = client.post('/api/resend-verification', json={
        'identifier': 'verified@dev.com'
    })
    # Should return already verified message
    assert response.status_code == 400
    assert b'already verified' in response.data.lower()


# ============================================================================
# 2FA TESTS
# ============================================================================

def test_toggle_2fa_enable(authenticated_client):
    """Test POST /api/toggle-2fa - Enable 2FA"""
    client, token = authenticated_client

    response = client.post('/api/toggle-2fa', json={
        'enable': True
    }, headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200

    # Verify 2FA is enabled
    user = User.query.filter_by(username='testuser').first()
    assert user.twofa_enabled is True


def test_toggle_2fa_disable(create_verified_user, get_auth_token, client):
    """Test POST /api/toggle-2fa - Disable 2FA"""
    # Create user (2FA disabled by default)
    create_verified_user(username='twofa_user', email='twofa@dev.com', password='Test@Pass123')

    # Get auth token BEFORE enabling 2FA (otherwise login requires 2FA verification)
    token = get_auth_token(username='twofa_user', password='Test@Pass123')

    # Now manually enable 2FA in database
    user = User.query.filter_by(username='twofa_user').first()
    user.twofa_enabled = True
    db.session.commit()

    # Disable 2FA using the token
    response = client.post('/api/toggle-2fa', json={
        'enable': False
    }, headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 200

    # Verify 2FA is disabled
    user = User.query.filter_by(username='twofa_user').first()
    assert user.twofa_enabled is False


def test_verify_2fa_success(create_verified_user, client):
    """Test POST /api/verify-2fa - Successful 2FA verification"""
    # Create user with 2FA enabled
    create_verified_user(username='twofa_verify', email='twofa_verify@dev.com', password='Test@Pass123')
    user = User.query.filter_by(username='twofa_verify').first()
    user.twofa_enabled = True
    db.session.commit()

    # Login (triggers 2FA)
    client.post('/api/login', json={
        'identifier': 'twofa_verify',
        'password': 'Test@Pass123'
    })

    # Get 2FA code from database
    user = User.query.filter_by(username='twofa_verify').first()
    code = user.twofa_code

    # Verify 2FA
    response = client.post('/api/verify-2fa', json={
        'email': 'twofa_verify@dev.com',
        'code': code
    })
    assert response.status_code == 200


def test_verify_2fa_wrong_code(create_verified_user, client):
    """Test 2FA verification with wrong code"""
    # Create user with 2FA enabled
    create_verified_user(username='twofa_wrong', email='twofa_wrong@dev.com', password='Test@Pass123')
    user = User.query.filter_by(username='twofa_wrong').first()
    user.twofa_enabled = True
    db.session.commit()

    # Login (triggers 2FA)
    client.post('/api/login', json={
        'identifier': 'twofa_wrong',
        'password': 'Test@Pass123'
    })

    # Try with wrong code
    response = client.post('/api/verify-2fa', json={
        'email': 'twofa_wrong@dev.com',
        'code': '000000'
    })
    assert response.status_code in {400, 401}
    assert b'invalid' in response.data.lower() or b'incorrect' in response.data.lower()


# ============================================================================
# PASSWORD RESET TESTS
# ============================================================================

def test_forgot_password(create_verified_user, client):
    """Test POST /api/forgot-password - Request password reset"""
    create_verified_user(username='forgotuser', email='forgot@dev.com', password='Test@Pass123')

    response = client.post('/api/forgot-password', json={
        'email': 'forgot@dev.com'
    })
    assert response.status_code == 200
    assert b'email' in response.data or b'sent' in response.data

    # Verify reset token was generated
    user = User.query.filter_by(email='forgot@dev.com').first()
    assert user.reset_token is not None


def test_forgot_password_nonexistent_email(client):
    """Test forgot password with non-existent email"""
    response = client.post('/api/forgot-password', json={
        'email': 'nonexistent@dev.com'
    })
    # Should return success to prevent email enumeration
    assert response.status_code == 200


def test_reset_password_success(create_verified_user, client):
    """Test POST /api/reset-password - Successfully reset password"""
    create_verified_user(username='resetuser', email='reset@dev.com', password='Test@Pass123')

    # Request password reset
    client.post('/api/forgot-password', json={
        'email': 'reset@dev.com'
    })

    # Get reset token from database
    user = User.query.filter_by(email='reset@dev.com').first()
    token = user.reset_token

    # Reset password - endpoint expects 'password' not 'new_password'
    response = client.post('/api/reset-password', json={
        'token': token,
        'password': 'NewReset@Pass123'
    })
    assert response.status_code == 200
    assert b'reset' in response.data.lower() or b'success' in response.data.lower()

    # Verify can login with new password
    user = User.query.filter_by(email='reset@dev.com').first()
    assert user.check_password('NewReset@Pass123')


def test_reset_password_invalid_token(client):
    """Test password reset with invalid token"""
    response = client.post('/api/reset-password', json={
        'token': 'invalid-token-123',
        'password': 'NewPass@123'
    })
    assert response.status_code == 400
    assert b'invalid' in response.data.lower() or b'token' in response.data.lower()


def test_reset_password_weak_password(create_verified_user, client):
    """Test password reset with weak password"""
    create_verified_user(username='weakreset', email='weakreset@dev.com', password='Test@Pass123')

    # Request password reset
    client.post('/api/forgot-password', json={
        'email': 'weakreset@dev.com'
    })

    # Get reset token
    user = User.query.filter_by(email='weakreset@dev.com').first()
    token = user.reset_token

    # Try to reset with weak password - endpoint expects 'password' not 'new_password'
    response = client.post('/api/reset-password', json={
        'token': token,
        'password': 'weak'
    })
    assert response.status_code == 400
    assert b'password' in response.data.lower()
