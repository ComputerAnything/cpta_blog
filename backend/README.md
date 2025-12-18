# Backend

Flask REST API server for Computer Anything Blog.

## Tech Stack

- **Framework**: Flask 3.1.0
- **Database**: PostgreSQL (via Neon)
- **ORM**: SQLAlchemy 3.1.1
- **Authentication**: JWT (Flask-JWT-Extended 4.7.1)
- **Rate Limiting**: Flask-Limiter + Redis
- **Email**: Resend API 2.4.0
- **Testing**: pytest 8.3.4
- **Linting**: Ruff 0.7.4

## Project Structure

```
backend/
├── app.py              # Flask app factory
├── config.py           # Configuration management
├── requirements.txt    # Python dependencies
├── models.py           # SQLAlchemy models (User, BlogPost, Vote, Comment)
├── extensions.py       # Flask extensions (db, jwt, migrate)
├── routes/             # API endpoints
│   ├── __init__.py
│   ├── auth_routes.py  # Authentication & registration
│   ├── post_routes.py  # Blog post CRUD & voting
│   └── user_routes.py  # User profile & settings
├── migrations/         # Database migrations (Alembic)
└── tests/              # Unit & integration tests
```

## Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
flask db upgrade

# Start development server
python app.py
```

Server runs at `http://localhost:5000`

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v
```

## API Endpoints

### Authentication (`/api/`)

- `POST /api/register` - User registration with email verification
- `POST /api/login` - User login (returns JWT token)
- `POST /api/verify-email/<token>` - Verify email address
- `POST /api/resend-verification` - Resend verification email
- `POST /api/forgot-password` - Request password reset
- `POST /api/reset-password` - Reset password with token

### Blog Posts (`/api/`)

- `GET /api/posts` - Get all posts (paginated, filterable by tag/search)
- `GET /api/posts/<id>` - Get single post with comments
- `POST /api/posts` - Create new post (requires auth)
- `PUT /api/posts/<id>` - Update post (requires auth, owner only)
- `DELETE /api/posts/<id>` - Delete post (requires auth, owner only)
- `POST /api/posts/<id>/upvote` - Upvote post (requires auth)
- `POST /api/posts/<id>/downvote` - Downvote post (requires auth)
- `POST /api/posts/<id>/comments` - Add comment to post (requires auth)
- `DELETE /api/comments/<id>` - Delete comment (requires auth, owner only)

### User (`/api/`)

- `GET /api/user/<username>` - Get user profile with posts
- `GET /api/user/profile` - Get current user profile (requires auth)

## Environment Variables

Required in `.env`:

```bash
# Flask environment variables
FLASK_ENV=development
FLASK_APP=app.py
SECRET_KEY=your-secret-key-change-me
JWT_SECRET_KEY=your-jwt-secret-key-change-me

# Database configuration - Neon PostgreSQL
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# SMTP configuration
RESEND_API_KEY=re_your_api_key_here
ADMIN_EMAIL=admin@yourdomain.com

# Turnstile configuration (bot protection)
TURNSTILE_SECRET_KEY=0x...

# Frontend URL (for CORS and email links)
FRONTEND_URL=http://localhost:5173

# Redis for rate limiting
REDIS_URL=redis://:changeme@localhost:6379/0
```

## Security Features

- JWT tokens with Bearer authentication
- Rate limiting on sensitive endpoints (login, registration, password reset)
- Cloudflare Turnstile bot protection
- Password hashing with Werkzeug
- SQL injection prevention (SQLAlchemy ORM)
- XSS protection headers
- Email verification for new accounts
- Secure password reset flow with time-limited tokens

See [Security Documentation](../docs/security/SECURITY.md) for details.

## Models

### User
- **Fields**: id, username, email, password (hashed), created_at, is_verified, reset_token, reset_token_expiry
- **Relationships**: posts (one-to-many), votes (one-to-many), comments (one-to-many)
- **Methods**: `set_password()`, `check_password()`

### BlogPost
- **Fields**: id, title, content, topic_tags, user_id, created_at, upvotes, downvotes
- **Relationships**: user (many-to-one), votes (one-to-many), comments (one-to-many)
- **Methods**: `to_dict()`

### Vote
- **Fields**: id, user_id, post_id, vote_type (upvote/downvote), created_at
- **Relationships**: user (many-to-one), post (many-to-one)
- **Unique Constraint**: user_id + post_id (one vote per user per post)

### Comment
- **Fields**: id, post_id, user_id, content, created_at
- **Relationships**: user (many-to-one), post (many-to-one)
- **Methods**: `to_dict()`

## Database Migrations

```bash
# Create new migration
flask db migrate -m "Description of changes"

# Apply migrations
flask db upgrade

# Rollback migration
flask db downgrade
```

## Rate Limiting

Protected endpoints (limits per IP address):
- `/api/register` - 3 per hour
- `/api/login` - 5 per minute
- `/api/forgot-password` - 3 per hour
- `/api/resend-verification` - 3 per hour

Rate limits are tracked in Redis and reset automatically.

## Deployment

See [Production Deployment Guide](../docs/setup/PRODUCTION.md).

## Documentation

- [Development Setup](../docs/setup/DEVELOPMENT.md)
- [Testing Guide](../docs/setup/TESTING.md)
- [Security Features](../docs/security/SECURITY.md)
- [Docker Architecture](../docs/infrastructure/DOCKER_ARCHITECTURE.md)
