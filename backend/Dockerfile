FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY . ./backend/

# Environment setup
ENV PYTHONPATH=/app/backend
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD curl -f http://localhost:8000/api/health || exit 1

# Run with Gunicorn
CMD ["sh", "-c", "gunicorn --workers 2 --threads 4 --worker-class gthread -b 0.0.0.0:8000 --timeout 120 backend.run:app"]
