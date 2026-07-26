#!/bin/sh
set -e

echo "========================================"
echo "Running database migrations..."
echo "========================================"

alembic upgrade head

echo "========================================"
echo "Checking seed data..."
echo "========================================"

echo "Running Department bootstrap..."
python -m scripts.seed_departments 

echo "Running Super Admin bootstrap..."
python -m scripts.bootstrap_super_admin 

echo "========================================"
echo "Starting FastAPI..."
echo "========================================"

exec uvicorn api.app:app --host 0.0.0.0 --port 8000