#!/bin/bash

set -e

echo ""
echo "========================================"
echo " CSCRS Production Deployment"
echo "========================================"
echo ""

echo "[1/6] Checking .env.production..."

if [ ! -f ".env.production" ]; then
    echo "ERROR: .env.production not found!"
    exit 1
fi

echo "OK"

if grep -q "^OBJECT_STORAGE_PROVIDER=oci" .env.production 2>/dev/null; then
    OCI_KEY_PATH="/home/ubuntu/cscrs-secrets/oci/oci_api_key.pem"
    if [ ! -f "$OCI_KEY_PATH" ]; then
        echo "ERROR: Required OCI private key not found at $OCI_KEY_PATH!"
        echo "Please provision the host secret with restricted permissions before deploying."
        exit 1
    fi
fi

echo ""
echo "[2/6] Building Docker images..."

docker compose build

echo ""
echo "[3/6] Starting containers..."

docker compose up -d

echo ""
echo "[4/6] Waiting for backend..."

sleep 10

echo ""
echo "[5/6] Checking health endpoint..."

if curl -fs http://localhost/health > /dev/null; then
    echo "Backend is healthy."
else
    echo "Health check failed."
    docker compose logs backend
    exit 1
fi

echo ""
echo "[6/6] Deployment Complete"

echo ""
echo "Running Containers:"
docker compose ps

echo ""
echo "Application URL:"
echo "http://localhost"
echo ""