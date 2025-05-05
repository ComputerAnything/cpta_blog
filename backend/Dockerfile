# Stage 1: Build the React frontend
FROM node:18 as frontend-build

# Set the working directory for the frontend
WORKDIR /frontend

# Copy the frontend code
COPY ../frontend ./

# Install dependencies and build the React app
RUN npm install && npm run build

# Stage 2: Build the Python backend
FROM python:3.11-slim

# Set the working directory for the backend
WORKDIR /backend

# Copy the backend code
COPY . .

# Copy the built React frontend into the backend's build directory
COPY --from=frontend-build /frontend/build ./frontend/build

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the Flask port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# Run the Flask app
CMD ["flask", "run"]
