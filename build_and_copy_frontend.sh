#!/bin/bash

set -e

echo "Running 'npm run build' in ./frontend ..."
cd frontend
npm run build
cd ..

# Ensure backend/frontend exists
mkdir -p backend/frontend

# Remove old build if it exists
if [ -d backend/frontend/build ]; then
    echo "Removing existing 'backend/frontend/build' ..."
    rm -rf backend/frontend/build
fi

echo "Copying 'frontend/build' to 'backend/frontend/build' ..."
cp -r frontend/build backend/frontend/build

echo "Done. You can now run 'docker build' or 'docker compose up'."
