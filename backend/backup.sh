#!/bin/bash

set -e

echo ""
echo "========================================"
echo " CSCRS Database Backup"
echo "========================================"
echo ""

# Check .env.production

if [ ! -f ".env.production" ]; then
    echo "ERROR: .env.production not found!"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.production | xargs)

# Backup directory
BACKUP_DIR="backups"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

BACKUP_FILE="$BACKUP_DIR/cscrs_$TIMESTAMP.sql"

echo "Creating backup..."

docker compose exec -T postgres pg_dump \
    -U "$POSTGRES_USER" \
    "$POSTGRES_DB" \
    > "$BACKUP_FILE"

echo ""
echo "Backup completed successfully."

echo ""
echo "Backup File:"
echo "$BACKUP_FILE"
echo ""