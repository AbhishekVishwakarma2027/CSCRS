#!/bin/bash

set -e

echo ""
echo "========================================"
echo " CSCRS Production Update"
echo "========================================"
echo ""

echo "[1/7] Checking .env.production..."

if [ ! -f ".env.production" ]; then
    echo "ERROR: .env.production not found!"
    exit 1
fi

echo "OK"

echo ""
echo "[2/7] Pulling latest source..."

git pull

echo ""
echo "[3/7] Rebuilding Docker images..."

docker compose build

echo ""
echo "[4/7] Restarting containers..."

docker compose up -d

echo ""
echo "[5/7] Waiting for backend..."

sleep 10

echo ""
echo "[6/7] Checking health..."

if curl -fs http://localhost/health > /dev/null; then
    echo "Backend is healthy."
else
    echo "Health check failed."
    docker compose logs backend
    exit 1
fi

echo ""
echo "[7/7] Update completed successfully."

echo ""
docker compose ps