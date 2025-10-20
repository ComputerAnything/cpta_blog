# Stage 1: Build React frontend with Vite
FROM node:20 AS frontend-build

WORKDIR /frontend

# Copy frontend package files
COPY ./frontend/package.json ./frontend/package-lock.json ./

# Install dependencies
RUN npm ci --silent

# Copy frontend source and .env
COPY ./frontend ./

# Build the React app with Vite (uses frontend/.env)
RUN npm run build

# Stage 2: Python backend with built frontend
FROM python:3.11-slim

WORKDIR /app

# System deps for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy the built React frontend from stage 1 (Vite builds to 'dist' not 'build')
COPY --from=frontend-build /frontend/dist ./backend/frontend/build

ENV PYTHONPATH=/app/backend
ENV PYTHONUNBUFFERED=1

EXPOSE 5000

CMD ["gunicorn", "-w", "5", "-b", "0.0.0.0:5000", "--timeout", "120", "backend.app:app"]
