# Development Guide

Complete guide for running the Computer Anything Blog in **development mode** on your local machine.

## Recommended Development Workflow

**Development = 3 Terminals** (fastest iteration, instant hot reload)
- Terminal 1: Docker Redis
- Terminal 2: Backend (Flask run.py)
- Terminal 3: Frontend (Vite dev server)

**Staging Test = Docker Compose** (production-like environment for final testing before deploy)

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment File Management](#environment-file-management)
- [Quick Start - 3 Terminal Setup](#quick-start---3-terminal-setup)
- [Python Version Check (Do This First!)](#python-version-check-do-this-first)
- [Initial Setup](#initial-setup)
- [Daily Development Workflow](#daily-development-workflow)
- [Running Tests](#running-tests)
- [Staging Test with Docker](#staging-test-with-docker)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Python 3.12+** installed (pyenv recommended)
- **Node.js 20+** and **npm** installed
- **Docker** (for running Redis locally)
- **Git** for version control

**Note:** Development uses PostgreSQL (Neon free tier) - no local PostgreSQL installation needed!

---

## Environment File Management

**IMPORTANT:** This project uses environment-specific `.env` files that you copy into the standard `.env` before running.

### How It Works

The application **ALWAYS reads the standard `.env` file**:
- Backend Flask reads: `backend/.env`
- Frontend Vite reads: `frontend/.env`

The other files are **templates** you maintain and copy from:
- `.env.development` - Development settings (weak passwords, test keys)
- `.env.staging` - Staging settings (strong passwords, staging database)
- `.env.production` - Production settings (strong passwords, production database)

### Switching Environments

**Development:**
```bash
# Backend
cp backend/.env.development backend/.env

# Frontend
cp frontend/.env.development frontend/.env
```

**Staging (Docker):**
```bash
# Copy both env files before building
cp backend/.env.staging backend/.env
cp frontend/.env.staging frontend/.env

# Build and run
docker compose -f docker-compose.staging.yml build
docker compose -f docker-compose.staging.yml up -d
```

**Production (Docker):**
```bash
# Copy both env files before building
cp backend/.env.production backend/.env
cp frontend/.env.production frontend/.env

# Build and run
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
```

### Why This Approach?

✅ **One source of truth** - Applications always read `.env`
✅ **Easy switching** - Just copy the environment you need
✅ **Safe** - Original templates stay unchanged
✅ **Clear** - Know exactly which environment you're using

**Remember:** The standard `.env` files are in `.gitignore` and never committed. Only `.env.example` and the environment templates should be in git.

---

## Quick Start - 3 Terminal Setup

**TL;DR - Get coding in 5 minutes:**

```bash
# STEP 0: Check Python version (REQUIRED - must be 3.12.x)
python --version
# If NOT 3.12.x, see "Python Environment Setup" section below to install it first!

# STEP 1: Create virtual environment (in project root)
# This venv is used by both backend and test scripts
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r backend/requirements.txt

# STEP 2: Backend configuration and database setup
cd backend
cp .env.development .env
# Edit .env.development if needed (DATABASE_URL, RESEND_API_KEY, etc.)
flask db upgrade  # Creates/updates database schema

# STEP 3: Frontend setup
cd ../frontend
cp .env.development .env
npm install

# STEP 4: Daily workflow (3 terminals):
# Terminal 1 - Redis
docker compose -f docker-compose.staging.yml up redis

# Terminal 2 - Backend (copy dev env, activate venv, run backend)
cp backend/.env.development backend/.env && source venv/bin/activate && cd backend && python run.py

# Terminal 3 - Frontend (copy dev env and run)
cp frontend/.env.development frontend/.env && cd frontend && npm run dev
```

**Frontend:** http://localhost:5173 (Vite dev server with instant hot reload)
**Backend API:** http://localhost:5000/api/*
**Redis:** Running in Docker (Terminal 1)

---

## Python Version Check (Do This First!)

**Before starting, ensure you have Python 3.12:**

```bash
# Check your Python version
python --version
# or
python3 --version
```

**If you see Python 3.12.x** - you're good! Continue to Initial Setup.

**If you DON'T have Python 3.12:**

<details>
<summary><b>📦 Install Python 3.12 with pyenv (Recommended)</b></summary>

```bash
# Install pyenv if you don't have it
# See: https://github.com/pyenv/pyenv#installation

# Install Python 3.12.3
pyenv install 3.12.3

# Set it for this project (the .python-version file will auto-switch)
cd /path/to/cpta_blog
pyenv local 3.12.3

# Verify
python --version  # Should show: Python 3.12.3
```
</details>

<details>
<summary><b>💻 Install Python 3.12 with system package manager</b></summary>

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3.12 python3.12-venv python3.12-dev

# Use python3.12 explicitly when creating venv
python3.12 --version  # Verify it's installed
```

**macOS:**
```bash
brew install python@3.12

# Verify
python3.12 --version
```
</details>

---

## Initial Setup

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd cpta_blog
```

### 2. Database Setup

**Good news:** Development uses **Neon PostgreSQL** (free tier, cloud-hosted).

- ✅ No local PostgreSQL installation needed
- ✅ Database auto-creates on first `flask db upgrade`
- ✅ Zero Neon compute usage (free tier autoscaling)
- ✅ Configured via `DATABASE_URL` in `.env`

### 3. Python Environment Setup

**Important:** This project uses **Python 3.12** to match the Docker production environment (`python:3.12-slim`).

**Using pyenv (Recommended):**

```bash
# Install Python 3.12.3
pyenv install 3.12.3

# Set Python 3.12 for this project (creates .python-version file)
cd /path/to/cpta_blog
pyenv local 3.12.3

# Verify - should show 3.12.3
python --version
```

The `.python-version` file will automatically switch to Python 3.12 whenever you `cd` into the project directory.

**Alternative: System Python**

If you're using system Python, ensure you have Python 3.12 installed:

```bash
# Ubuntu/Debian
sudo apt install python3.12 python3.12-venv python3.12-dev

# macOS (via Homebrew)
brew install python@3.12
```

### 4. Create Virtual Environment (Project Root)

**Important:** Create the venv in the project root (not in backend/) as it's shared by both the backend and test scripts.

```bash
# From project root directory
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### 5. Backend Setup

```bash
cd backend

# Copy and edit environment variables
cp .env.example .env
nano .env  # or code .env
```

**Edit `backend/.env` with your development values:**

```bash
# Flask environment variables
FLASK_ENV=development
FLASK_APP=app.py
SECRET_KEY=dev-secret-key-change-me
JWT_SECRET_KEY=dev-jwt-secret-key-change-me

# Database configuration - Neon Development Branch
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# SMTP configuration
RESEND_API_KEY=re_your_api_key_here
ADMIN_EMAIL=admin@yourdomain.com

# Turnstile configuration (optional for development)
TURNSTILE_SECRET_KEY=0x...

# Frontend URL (for CORS and email links)
FRONTEND_URL=http://localhost:5173

# Redis for rate limiting
REDIS_URL=redis://:changeme@localhost:6379/0
```

**Run database migrations:**

```bash
# Make sure venv is activated and you're in the backend directory
flask db upgrade
```

### 6. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

**Frontend environment variables are optional** - the frontend will auto-detect the backend at `http://localhost:5000` in development mode.

---

## Daily Development Workflow

This is what you'll do every day when coding:

### Terminal 1: Redis

```bash
docker compose -f docker-compose.staging.yml up redis
```

You should see:
```
redis_1  | 1:M 01 Jan 2024 12:00:00.000 * Ready to accept connections
```

**Keep this running** - Redis provides rate limiting.

### Terminal 2: Backend

```bash
# From project root, copy development env and run backend
source venv/bin/activate
cp backend/.env.development backend/.env
cd backend
python run.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Running on http://192.168.x.x:5000
```

**Backend changes auto-reload instantly!**

### Terminal 3: Frontend

```bash
# Copy development environment
cp frontend/.env.development frontend/.env
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

**Frontend changes auto-reload instantly!**

---

## Code Quality & Linting

### Backend Linting (Python)

The backend uses **Ruff** for fast Python linting and formatting.

```bash
# From project root
source venv/bin/activate
cd backend

# Check for linting errors
ruff check .

# Auto-fix issues
ruff check . --fix

# Format code
ruff format .

# Check specific file
ruff check routes/auth.py
```

**Configuration:** `backend/pyproject.toml` or `backend/ruff.toml`

**Common issues Ruff catches:**
- Unused imports
- Undefined variables
- Line too long
- Missing docstrings
- Syntax errors

### Frontend Linting (TypeScript/React)

The frontend uses **ESLint** for JavaScript/TypeScript linting.

```bash
cd frontend

# Check for linting errors
npm run lint

# Auto-fix issues
npm run lint:fix
```

**Common issues ESLint catches:**
- Unused variables
- Missing dependencies in useEffect
- Type errors
- React hooks rules violations
- Import order issues

---

## Running Tests

```bash
# From project root
source venv/bin/activate
cd backend
pytest -v

# Specific test file
pytest tests/test_auth.py -v

# With coverage
pytest --cov=. --cov-report=html
```

**For comprehensive testing guide, see [TESTING.md](./TESTING.md)**

---

## Staging Testing

Before deploying to production, you should test in a production-like environment.

**Quick summary:**
- Staging uses `docker-compose.yml` with production-like architecture
- Network segmentation, security hardening
- Runs on http://localhost:8001
- Uses production database (Neon) in staging mode

**Quick start:**
```bash
# Start staging
docker compose -f docker-compose.staging.yml up --build

# View logs
docker compose -f docker-compose.staging.yml logs -f
```

**To switch back to development:**
```bash
docker compose -f docker-compose.staging.yml down
```

---

## Common Development Tasks

### Clean Cache Files

```bash
# Remove Python cache files
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -type f -name "*.pyc" -delete

# Remove Node cache
cd frontend && rm -rf node_modules package-lock.json
npm install
```

### Create Admin User

```bash
# From project root
source venv/bin/activate
cd backend
python

>>> from backend.extensions import db
>>> from backend.models import User
>>> from backend.app import create_app
>>> app = create_app()
>>> with app.app_context():
...     user = User(username='admin', email='admin@example.com', is_verified=True)
...     user.set_password('SecurePassword123!')
...     db.session.add(user)
...     db.session.commit()
...     print(f'Admin created: {user.email}')
```

### Database Migrations

**Create migration:**
```bash
# From project root
source venv/bin/activate
cd backend
flask db migrate -m "Add new field to User"
```

**Apply migration:**
```bash
flask db upgrade
```

**Rollback:**
```bash
flask db downgrade
```

### Manage Redis

**Check if Redis is running:**
```bash
docker compose -f docker-compose.staging.yml ps
# Should show "redis" service as "Up"
```

**Start Redis:**
```bash
docker compose -f docker-compose.staging.yml up redis -d
```

**Stop Redis:**
```bash
docker compose -f docker-compose.staging.yml down redis
```

**View Redis logs:**
```bash
docker compose -f docker-compose.staging.yml logs -f redis
```

**Connect to Redis CLI:**
```bash
docker compose -f docker-compose.staging.yml exec redis redis-cli -a changeme

# Test commands
> PING
# Should return: PONG

> KEYS *
# Shows all rate limit keys

> QUIT
```

**Clear Rate Limits (for testing):**

When testing auth/password reset flows, you may hit rate limits. Here's how to clear them:

```bash
# Option 1: Flush all rate limits (FASTEST - instant)
docker compose -f docker-compose.staging.yml exec redis redis-cli -a changeme FLUSHALL

# Option 2: Restart Redis container (clears everything)
docker compose -f docker-compose.staging.yml restart redis
```

**Pro Tip:** Add this alias to your `~/.bashrc` or `~/.zshrc` for quick access:
```bash
alias clear-rate-limits='docker compose -f docker-compose.staging.yml exec redis redis-cli -a changeme FLUSHALL'
```
Then just run `clear-rate-limits` anytime you're rate limited!

---

## Troubleshooting

### Port Already in Use

```bash
# Find what's using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### Database Connection Errors

```bash
# Check DATABASE_URL in backend/.env
cat backend/.env | grep DATABASE_URL

# Test connection
source venv/bin/activate
cd backend
python -c "from extensions import db; from app import create_app; app = create_app(); app.app_context().push(); print('Database connected!')"
```

### "ModuleNotFoundError" in Backend

```bash
# Make sure virtualenv is activated (from project root)
source venv/bin/activate

# Reinstall dependencies
pip install -r backend/requirements.txt
```

### Frontend Not Loading

```bash
# Check if Vite dev server is running in Terminal 3
# Should see http://localhost:5173

# If not, restart it:
cd frontend
npm run dev
```

### Redis Connection Errors

```bash
# Check if Redis is running
docker compose -f docker-compose.staging.yml ps
# Should show "redis" service as "Up"

# If not running, start it
docker compose -f docker-compose.staging.yml up redis -d

# Test Redis connection
docker compose -f docker-compose.staging.yml exec redis redis-cli -a changeme ping
# Should return: PONG

# Check REDIS_URL in backend/.env
cat backend/.env | grep REDIS_URL
# Should be: redis://:changeme@localhost:6379/0

# View Redis logs for errors
docker compose -f docker-compose.staging.yml logs redis

# Restart Redis
docker compose -f docker-compose.staging.yml restart redis
```

**If Flask says "Connection refused" for Redis:**
- Make sure Redis is running: `docker compose -f docker-compose.staging.yml ps`
- Check REDIS_URL uses `localhost:6379` (not `redis:6379`)
- Verify password matches in both REDIS_URL and docker-compose.yml

---

## Environment Files Summary

**Development workflow:**
- `backend/.env` - Your active backend config (Neon DB, Resend API)
- `frontend/.env` - Your active frontend config (optional)

**Template files (don't edit directly):**
- `backend/.env.example` - Template with placeholders
- `backend/.env.staging` - Staging config template

**Copy templates to .env when needed:**
```bash
# For dev
cp backend/.env.example backend/.env
# Then edit with your actual values

# For staging test
cp backend/.env.staging backend/.env
```

---

## Next Steps

- Make your changes
- Run tests: `pytest -v`
- Test locally with 3 terminals
- Before deploying: [Test with Docker](#staging-test-with-docker)
- Deploy: See [PRODUCTION.md](./PRODUCTION.md)

Happy coding! 🚀
