from datetime import datetime, timedelta, timezone
import secrets

from app import db
from werkzeug.security import check_password_hash, generate_password_hash


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    # Email verification
    is_verified = db.Column(db.Boolean, default=False)

    # Token versioning for security (invalidate JWTs on password change)
    token_version = db.Column(db.Integer, default=0, nullable=False)

    # Password reset
    reset_token = db.Column(db.String(100), unique=True)
    reset_token_expiry = db.Column(db.DateTime)

    # Two-factor authentication
    twofa_code = db.Column(db.String(6))
    twofa_expires_at = db.Column(db.DateTime)
    twofa_enabled = db.Column(db.Boolean, default=False, nullable=False)

    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(tz=timezone.utc).replace(tzinfo=None))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(tz=timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(tz=timezone.utc).replace(tzinfo=None))

    # Security tracking
    last_login = db.Column(db.DateTime)
    last_login_ip = db.Column(db.String(255))  # IP address
    last_login_location = db.Column(db.String(200))  # City, Country
    last_login_browser = db.Column(db.String(100))  # Browser name and version
    last_login_device = db.Column(db.String(100))  # Device type (Desktop, Mobile, Tablet)
    failed_login_attempts = db.Column(db.Integer, default=0)
    last_failed_login = db.Column(db.DateTime)
    password_reset_count = db.Column(db.Integer, default=0)
    rate_limit_violations = db.Column(db.Integer, default=0)

    # Relationships
    posts = db.relationship('BlogPost', backref='user', cascade='all, delete-orphan', lazy=True)
    votes = db.relationship('Vote', backref='user', cascade='all, delete-orphan', lazy=True)
    comments = db.relationship('Comment', backref='user', cascade='all, delete-orphan', lazy=True)

    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)

    def invalidate_tokens(self):
        """Increment token_version to invalidate all existing JWT tokens"""
        self.token_version += 1

    def record_successful_login(self, ip_address=None, location=None, browser=None, device=None):
        """Record a successful login and reset failed attempts"""
        self.last_login = datetime.now(tz=timezone.utc).replace(tzinfo=None)
        self.last_login_ip = ip_address
        self.last_login_location = location
        self.last_login_browser = browser
        self.last_login_device = device
        self.failed_login_attempts = 0
        self.last_failed_login = None

    def record_failed_login(self):
        """Record a failed login attempt"""
        self.failed_login_attempts += 1
        self.last_failed_login = datetime.now(tz=timezone.utc).replace(tzinfo=None)

    def is_reset_token_valid(self):
        """Check if password reset token is valid and not expired"""
        if not self.reset_token or not self.reset_token_expiry:
            return False

        now_utc = datetime.now(tz=timezone.utc).replace(tzinfo=None)
        expires_at = self.reset_token_expiry

        # Handle timezone-aware datetime
        if expires_at.tzinfo is not None:
            expires_at = expires_at.replace(tzinfo=None)

        return expires_at > now_utc

    def generate_2fa_code(self, minutes=5):
        """Generate a 6-digit 2FA code that expires in X minutes"""
        self.twofa_code = str(secrets.randbelow(900000) + 100000)  # Cryptographically secure 6-digit code
        self.twofa_expires_at = datetime.now(tz=timezone.utc).replace(tzinfo=None) + timedelta(minutes=minutes)
        # Don't commit here - let the caller handle the commit
        return self.twofa_code

    def is_valid_2fa_code(self, code):
        """Check if the 2FA code is valid and not expired"""
        if not self.twofa_code or not self.twofa_expires_at:
            return False

        # Compare naive UTC datetimes (database stores as naive UTC)
        now_utc = datetime.now(tz=timezone.utc).replace(tzinfo=None)

        # twofa_expires_at should be naive UTC from database
        # If for some reason it has timezone, remove it for comparison
        expires_at = self.twofa_expires_at
        if expires_at.tzinfo is not None:
            # Convert to naive UTC
            expires_at = expires_at.replace(tzinfo=None)

        return self.twofa_code == code and expires_at > now_utc

    def clear_2fa_code(self):
        """Clear the 2FA code after use"""
        self.twofa_code = None
        self.twofa_expires_at = None
        db.session.commit()

    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_verified': self.is_verified,
            'twofa_enabled': self.twofa_enabled,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'token_version': self.token_version
        }

        if include_sensitive:
            data.update({
                'reset_token': self.reset_token,
                'failed_login_attempts': self.failed_login_attempts,
                'last_login_ip': self.last_login_ip,
                'last_login_location': self.last_login_location
            })

        return data

    def __repr__(self):
        return f'<User {self.username}>'
