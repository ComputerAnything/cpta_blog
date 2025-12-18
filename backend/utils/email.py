"""Email utility using Resend API with centralized email templates"""
from datetime import datetime, timezone
import os

from flask import current_app, request
import redis
import resend


def send_email(to: str | list[str], subject: str, html: str, from_email: str | None = None, reply_to: str | None = None):
    """
    Send email using Resend API

    Args:
        to: Email address or list of email addresses
        subject: Email subject
        html: HTML content of the email
        from_email: Sender email (defaults to noreply@computeranything.dev)
        reply_to: Reply-to email address (optional)

    Returns:
        dict: Response from Resend API

    Raises:
        Exception: If email fails to send
    """
    # Skip email sending during tests
    if os.environ.get('TESTING') == 'true':
        current_app.logger.info(f"[TEST MODE] Email skipped: {subject} to {to}")
        return {'id': 'test-email-id'}

    # Log emails in development instead of sending
    if os.environ.get('FLASK_ENV') == 'development':
        # Extract URLs from HTML for easy copy/paste
        import re  # noqa: PLC0415
        url_pattern = r'href=["\']([^"\']*)["\']'
        urls = re.findall(url_pattern, html)
        # Filter to only show http/https URLs (exclude mailto:)
        action_urls = [url for url in urls if url.startswith('http')]

        current_app.logger.info(
            f"\n{'='*80}\n"
            f"[DEVELOPMENT MODE] Email NOT sent - logged instead:\n"
            f"  To: {to}\n"
            f"  Subject: {subject}\n"
            f"  From: {from_email or 'noreply@computeranything.dev'}\n"
            f"  Reply-To: {reply_to or 'N/A'}\n"
            f"\n"
            f"  📧 ACTION LINKS (copy/paste to test):\n"
        )

        # Print each action URL on its own line for easy copy/paste
        for i, url in enumerate(action_urls, 1):
            current_app.logger.info(f"     [{i}] {url}")

        current_app.logger.info(
            f"\n"
            f"  💡 TIP: Copy the link above and paste it into your browser to test!\n"
            f"{'='*80}\n"
        )
        return {'id': 'dev-email-logged'}

    try:
        # Set API key from config
        resend.api_key = current_app.config.get('RESEND_API_KEY')

        if not resend.api_key:
            raise ValueError("RESEND_API_KEY not configured")

        # Get from email
        if from_email is None:
            from_email = 'noreply@computeranything.dev'

        # Ensure to is a list
        if isinstance(to, str):
            to = [to]

        # Send email via Resend
        params = {
            "from": from_email,
            "to": to,
            "subject": subject,
            "html": html,
        }

        # Add reply_to if provided
        if reply_to:
            params["reply_to"] = reply_to

        response = resend.Emails.send(params)  # type: ignore[arg-type]
        current_app.logger.info(f"Email sent successfully to {to}")
        return response

    except Exception as e:
        current_app.logger.error(f"Failed to send email: {e!r}")
        raise


def send_rate_limit_alert(ip_address: str, endpoint: str, user_email: str | None = None):
    """
    Send security alert to admin when rate limit is exceeded

    Args:
        ip_address: IP address that exceeded rate limit
        endpoint: The endpoint that was rate limited (e.g., '/api/login')
        user_email: Email of the user attempting action (if known)
    """
    # Skip alerts during tests
    if os.environ.get('TESTING') == 'true':
        current_app.logger.info(f"[TEST MODE] Rate limit alert skipped: {endpoint} from {ip_address}")
        return

    # Log alerts in development instead of sending
    if os.environ.get('FLASK_ENV') == 'development':
        current_app.logger.info(
            f"\n{'='*80}\n"
            f"[DEVELOPMENT MODE] Rate limit alert NOT sent - logged instead:\n"
            f"  Alert Type: Rate Limit Exceeded\n"
            f"  IP Address: {ip_address}\n"
            f"  Endpoint: {endpoint}\n"
            f"  User Email: {user_email or 'Unknown'}\n"
            f"  Timestamp: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n"
            f"  Note: In production, this would email admin at ADMIN_EMAIL\n"
            f"{'='*80}\n"
        )
        return

    try:
        admin_email = current_app.config.get('ADMIN_EMAIL')

        if not admin_email:
            current_app.logger.warning("ADMIN_EMAIL not configured - skipping rate limit alert")
            return

        # CRITICAL: Deduplicate alerts - only send ONE alert per IP+endpoint per 5 minutes
        # This prevents email spam when users make multiple requests while rate-limited
        redis_url = os.environ.get('REDIS_URL')
        if redis_url and redis_url != 'memory://':
            try:
                r = redis.from_url(redis_url, decode_responses=True)
                alert_cache_key = f"ALERT_SENT:{ip_address}:{endpoint}"

                # Check if we've already sent an alert for this IP+endpoint recently
                if r.exists(alert_cache_key):
                    current_app.logger.debug(f"Rate limit alert suppressed for {ip_address} on {endpoint} (already sent in last 5 min)")
                    return

                # Mark that we're sending an alert now (expires in 5 minutes = 300 seconds)
                r.setex(alert_cache_key, 300, '1')
                current_app.logger.info(f"Rate limit alert will be sent for {ip_address} on {endpoint}")
            except Exception as redis_error:
                current_app.logger.warning(f"Redis deduplication failed: {redis_error!r} - sending alert anyway")
                # Continue - better to send duplicate alert than miss a real attack
        else:
            current_app.logger.warning("Redis not configured - alert deduplication disabled (may cause email spam)")

        timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')

        # Build HTML email
        html = f"""
        <h2 style="color: #dc3545;">⚠️ Rate Limit Exceeded - Potential Attack</h2>
        <p>A user has been temporarily blocked due to excessive requests.</p>

        <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
            <h3 style="margin-top: 0;">Incident Details</h3>
            <ul style="list-style: none; padding-left: 0;">
                <li><strong>Time:</strong> {timestamp}</li>
                <li><strong>IP Address:</strong> <code>{ip_address}</code></li>
                <li><strong>Endpoint:</strong> <code>{endpoint}</code></li>
                <li><strong>User Email:</strong> {user_email if user_email else 'Unknown'}</li>
                <li><strong>Action:</strong> Request blocked temporarily</li>
            </ul>
        </div>

        <h3>What This Means</h3>
        <p>This could indicate:</p>
        <ul>
            <li><strong>Brute force attack:</strong> Automated attempts to guess passwords</li>
            <li><strong>Spam/abuse:</strong> Automated posting or voting</li>
            <li><strong>Legitimate user error:</strong> User accidentally triggering rate limits</li>
        </ul>

        <h3>Recommended Actions</h3>
        <ul>
            <li>Monitor for repeated attempts from this IP address</li>
            <li>Check application logs for patterns: <code>docker logs cpta_blog-backend-1 | grep {ip_address}</code></li>
            <li>If pattern continues, consider blocking IP at firewall level</li>
        </ul>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 0.9em;">
            This is an automated security alert from Computer Anything Blog.<br>
            <strong>Note:</strong> You will only receive ONE alert per IP+endpoint per 5 minutes to prevent email spam.<br>
            To disable these alerts, remove ADMIN_EMAIL from your .env configuration.
        </p>
        """

        send_email(
            to=admin_email,
            subject=f"🚨 Rate Limit Alert - {endpoint} from {ip_address}",
            html=html
        )

        current_app.logger.info(f"Rate limit alert sent to admin for IP {ip_address} on {endpoint}")

    except Exception as e:
        # Don't fail the request if alert email fails
        current_app.logger.error(f"Failed to send rate limit alert: {e!r}")


# ============================================================================
# EMAIL TEMPLATE STYLES AND CONSTANTS
# ============================================================================

# Base email styling that all templates inherit
BASE_STYLE = """
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        {content}
    </div>
    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>This is an automated notification from Computer Anything Blog.</p>
        <p>Need help? Contact us at <a href="mailto:admin@computeranything.dev" style="color: #28a745;">admin@computeranything.dev</a></p>
    </div>
</div>
"""

# Header with logo
HEADER = """
<div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #28a745; margin: 0;">Computer Anything Blog</h1>
    <p style="color: #666; margin: 5px 0 0 0;">Share Your Tech Knowledge</p>
</div>
"""

# Button styles
BUTTON_PRIMARY = 'background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;'
BUTTON_SECONDARY = 'background-color: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;'
BUTTON_DANGER = 'background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;'

# Alert box styles
ALERT_SUCCESS = 'background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px;'
ALERT_WARNING = 'background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;'
ALERT_DANGER = 'background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px;'
ALERT_INFO = 'background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; border-radius: 4px;'


# ============================================================================
# AUTHENTICATION EMAIL TEMPLATES
# ============================================================================

def get_login_notification_email(email: str, login_time: str, ip_address: str, location: str | None = None, browser: str | None = None, device: str | None = None) -> tuple[str, str]:
    """Email sent after successful login"""
    from markupsafe import escape
    subject = "New Login to Your Account"
    frontend_url = os.getenv('FRONTEND_URL')
    reset_password_url = f"{frontend_url}/forgot-password"

    content = f"""
        {HEADER}
        <h2 style="color: #333;">New Login Detected</h2>
        <p>Hello,</p>
        <p>We detected a new login to your Computer Anything Blog account:</p>
        <div style="{ALERT_INFO}">
            <strong>Login Details:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Email:</strong> {escape(email)}</li>
                <li><strong>Time:</strong> {escape(login_time)}</li>
                <li><strong>IP Address:</strong> {escape(ip_address)}</li>
                <li><strong>Location:</strong> {escape(location or 'Unknown')}</li>
                <li><strong>Browser:</strong> {escape(browser or 'Unknown')}</li>
                <li><strong>Device:</strong> {escape(device or 'Unknown')}</li>
            </ul>
        </div>
        <p>If this was you, you can safely ignore this email.</p>
        <div style="{ALERT_DANGER}">
            <strong>⚠️ Wasn't you?</strong><br>
            If you didn't make this login, secure your account immediately:
            <p style="text-align: center; margin: 20px 0;">
                <a href="{escape(reset_password_url)}" style="{BUTTON_PRIMARY}">Reset Password Now</a>
            </p>
            <p style="margin-top: 15px;">
                Then contact our support team at <a href="mailto:admin@computeranything.dev" style="color: #dc3545;">admin@computeranything.dev</a>
            </p>
        </div>
        <p style="margin-top: 30px;">Best regards,<br>The Computer Anything Blog Team</p>
    """
    return subject, BASE_STYLE.format(content=content)


def get_email_verification_email(confirm_url: str) -> tuple[str, str]:
    """Email sent for email verification"""
    from markupsafe import escape
    subject = "Confirm Your Email"

    content = f"""
        {HEADER}
        <h2 style="color: #333;">Confirm Your Email Address</h2>
        <p>Hello,</p>
        <p>Thank you for registering with Computer Anything Blog! Please confirm your email address to activate your account.</p>
        <div style="{ALERT_WARNING}">
            <strong>⏰ This link expires in 1 hour</strong>
        </div>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{escape(confirm_url)}" style="{BUTTON_PRIMARY}">Confirm Email Address</a>
        </p>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
            {escape(confirm_url)}
        </p>
        <div style="{ALERT_INFO}">
            <strong>Didn't sign up?</strong><br>
            If you didn't create an account, you can safely ignore this email.
        </div>
        <p style="margin-top: 30px;">Best regards,<br>The Computer Anything Blog Team</p>
    """
    return subject, BASE_STYLE.format(content=content)


def get_password_reset_request_email(reset_url: str) -> tuple[str, str]:
    """Email sent when user requests password reset"""
    from markupsafe import escape
    subject = "Password Reset Request"
    content = f"""
        {HEADER}
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your Computer Anything Blog account.</p>
        <div style="{ALERT_WARNING}">
            <strong>⏰ This link expires in 1 hour</strong>
        </div>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{escape(reset_url)}" style="{BUTTON_PRIMARY}">Reset Password</a>
        </p>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
            {escape(reset_url)}
        </p>
        <div style="{ALERT_INFO}">
            <strong>Didn't request this?</strong><br>
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </div>
        <p style="margin-top: 30px;">Best regards,<br>The Computer Anything Blog Team</p>
    """
    return subject, BASE_STYLE.format(content=content)


def get_password_reset_confirmation_email(email: str) -> tuple[str, str]:
    """Email sent after successful password reset"""
    from markupsafe import escape
    subject = "Password Reset Successful"
    content = f"""
        {HEADER}
        <h2 style="color: #28a745;">Password Reset Successful</h2>
        <p>Hello,</p>
        <div style="{ALERT_SUCCESS}">
            <strong>✓ Your password has been successfully reset</strong>
        </div>
        <p>Your password for <strong>{escape(email)}</strong> was changed at {datetime.now(timezone.utc).strftime('%B %d, %Y at %I:%M %p UTC')}.</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{os.getenv('FRONTEND_URL')}" style="{BUTTON_PRIMARY}">Login to Your Account</a>
        </p>
        <div style="{ALERT_DANGER}">
            <strong>⚠️ Didn't make this change?</strong><br>
            If you didn't reset your password, please contact our support team immediately at
            <a href="mailto:admin@computeranything.dev" style="color: #dc3545;">admin@computeranything.dev</a>
        </div>
        <p style="margin-top: 30px;">Best regards,<br>The Computer Anything Blog Team</p>
    """
    return subject, BASE_STYLE.format(content=content)


# ============================================================================
# ADMIN ALERT EMAIL TEMPLATES
# ============================================================================

def get_password_reset_admin_alert_email(email: str, ip_address: str, user_agent: str) -> tuple[str, str]:
    """Alert sent to admin when a password reset is requested"""
    from markupsafe import escape
    timestamp = datetime.now(timezone.utc).strftime('%B %d, %Y at %I:%M %p UTC')
    subject = "🔐 Password Reset Request - Security Alert"
    content = f"""
        {HEADER}
        <h2 style="color: #dc3545;">Password Reset Security Alert</h2>
        <div style="{ALERT_WARNING}">
            <strong>⚠️ A password reset was requested for a blog user account</strong>
        </div>
        <h3 style="color: #333; margin-top: 25px;">Request Details:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr style="background-color: #f8f9fa;">
                <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Email Address:</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">{escape(email)}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">IP Address:</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">{escape(ip_address)}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
                <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">User Agent:</td>
                <td style="padding: 10px; border: 1px solid #dee2e6; font-size: 12px;">{escape(user_agent)}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Timestamp:</td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">{timestamp}</td>
            </tr>
        </table>
        <h3 style="color: #333; margin-top: 25px;">Recommended Actions:</h3>
        <ul style="color: #666; line-height: 1.8;">
            <li>Monitor for multiple reset attempts from the same IP</li>
            <li>Check if this user has recent failed login attempts</li>
            <li>Look for suspicious patterns in user agent or location</li>
            <li>Consider contacting the user if activity seems unusual</li>
        </ul>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This is an automated security notification. You're receiving this because password resets are being monitored for security purposes.
        </p>
    """
    return subject, BASE_STYLE.format(content=content)


def send_password_reset_admin_alert(email: str):
    """
    Send security alert to admin when a password reset is requested

    Args:
        email: Email address that requested password reset
    """
    # Skip alerts during tests
    if os.environ.get('TESTING') == 'true':
        current_app.logger.info(f"[TEST MODE] Password reset alert skipped for {email}")
        return

    # Log alerts in development instead of sending
    if os.environ.get('FLASK_ENV') == 'development':
        current_app.logger.info(
            f"\n{'='*80}\n"
            f"[DEVELOPMENT MODE] Password reset alert NOT sent - logged instead:\n"
            f"  Alert Type: Password Reset Request\n"
            f"  User Email: {email}\n"
            f"  IP Address: {request.remote_addr or 'Unknown'}\n"
            f"  User Agent: {request.headers.get('User-Agent', 'Unknown')}\n"
            f"  Timestamp: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n"
            f"  Note: In production, this would email admin at ADMIN_EMAIL\n"
            f"{'='*80}\n"
        )
        return

    try:
        admin_email = current_app.config.get('ADMIN_EMAIL')

        if not admin_email:
            current_app.logger.warning("ADMIN_EMAIL not configured - skipping password reset alert")
            return

        # Get request details
        ip_address = request.remote_addr or 'Unknown'
        user_agent = request.headers.get('User-Agent', 'Unknown')

        # CRITICAL: Deduplicate alerts - only send ONE alert per email per 10 minutes
        redis_url = os.environ.get('REDIS_URL')
        if redis_url and redis_url != 'memory://':
            try:
                r = redis.from_url(redis_url, decode_responses=True)
                alert_cache_key = f"ALERT_SENT:PASSWORD_RESET:{email}"

                # Check if we've already sent an alert for this email recently
                if r.exists(alert_cache_key):
                    current_app.logger.debug(f"Password reset alert suppressed for {email} (already sent in last 10 min)")
                    return

                # Mark that we're sending an alert now (expires in 10 minutes = 600 seconds)
                r.setex(alert_cache_key, 600, '1')
                current_app.logger.info(f"Password reset alert will be sent for {email}")
            except Exception as redis_error:
                current_app.logger.warning(f"Redis deduplication failed: {redis_error!r} - sending alert anyway")
        else:
            current_app.logger.warning("Redis not configured - alert deduplication disabled")

        # Get email content from template
        subject, html = get_password_reset_admin_alert_email(email, ip_address, user_agent)

        send_email(
            to=admin_email,
            subject=subject,
            html=html
        )

        current_app.logger.info(f"Password reset alert sent to admin for {email}")

    except Exception as e:
        # Don't fail the request if alert email fails
        current_app.logger.error(f"Failed to send password reset alert: {e!r}")
