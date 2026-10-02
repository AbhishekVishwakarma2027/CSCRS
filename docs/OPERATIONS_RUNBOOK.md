# CSCRS Production Operations & System Runbook

This document serves as the operational runbook for system administrators maintaining the **Crowdsourced Civic Issue Reporting and Resolution System (CSCRS)** in production environments (`Oracle Cloud VM / Ubuntu 24.04 LTS`).

---

## 1. Primary Health Monitoring Protocols

### Endpoint Probes
- **Service Status**: `GET https://api.cscrs.tech/health` (Returns status `healthy`, API version, and timestamp).
- **Liveness Probe**: `GET https://api.cscrs.tech/liveness` (Returns status `alive`).
- **Readiness Probe**: `GET https://api.cscrs.tech/readiness` (Checks PostgreSQL database connectivity via `SELECT 1`. Returns `200 OK` when ready, or `503 Service Unavailable` if database connection fails).

### Container Status Check
```bash
# SSH into production server
ssh ubuntu@<oracle_vm_ip>

# Navigate to backend deployment directory
cd /home/ubuntu/CSCRS/backend

# Verify container runtime status
docker compose ps
```
Expected output:
- `cscrs-postgres`: `Up (healthy)`
- `cscrs-redis`: `Up (healthy)`
- `cscrs-backend`: `Up (healthy)`
- `cscrs-nginx`: `Up`

---

## 2. Log Inspection & Troubleshooting

### Real-Time Container Logging
```bash
# View aggregated tail of all containers
docker compose logs -f --tail=100

# View FastAPI backend application logs
docker compose logs -f backend

# View Nginx reverse proxy access & error logs
docker compose logs -f nginx

# View PostgreSQL database logs
docker compose logs -f postgres

# View Redis cache & rate-limiter logs
docker compose logs -f redis
```

### Rotating File Logs (`backend/logs/`)
The backend application writes rotated log files to the `logs/` directory volume:
- `logs/cscrs.log`: General application activity and audit trails.
- `logs/error.log`: Exception tracebacks and critical errors.

---

## 3. Database Administration & Backup Protocol

### Database Backup (`backend/backup.sh`)
Execute a PostgreSQL database dump before performing maintenance or running schema migrations:
```bash
cd /home/ubuntu/CSCRS/backend

# Execute database backup script
chmod +x backup.sh
./backup.sh
```
Or execute manual PostgreSQL dump directly via Docker container:
```bash
docker exec -t cscrs-postgres pg_dump -U cscrs_admin cscrs_db > backup_$(date +%Y%m%m_%H%M%S).sql
```

### Database Restoration
```bash
# Restore PostgreSQL database from backup SQL file
cat backup_file.sql | docker exec -i cscrs-postgres psql -U cscrs_admin -d cscrs_db
```

---

## 4. Alembic Database Migration Safety Protocol

> [!CAUTION]
> **STRICT PRODUCTION SAFETY RULES**:
> 1. **NEVER** execute `docker compose down -v` in production. Deleting Docker volumes (`postgres_data`, `uploads_data`) results in permanent loss of citizen reports, resolution evidence, and user accounts.
> 2. **NEVER** blindly stamp Alembic revisions (`alembic stamp head` or `alembic stamp <rev>`) without inspecting actual PostgreSQL database tables first. Stamping out-of-sync schemas creates schema drift and causes runtime column errors.

### Safe Migration Procedure
1. Create a full database backup prior to migration (`./backup.sh`).
2. Run Alembic upgrade:
   ```bash
   docker exec -it cscrs-backend alembic upgrade head
   ```
3. Verify current revision matching head:
   ```bash
   docker exec -it cscrs-backend alembic current
   ```

---

## 5. System Update & Maintenance Workflows

### Standard Zero-Downtime System Update
To pull latest codebase changes and update Docker containers:
```bash
cd /home/ubuntu/CSCRS/backend
./update.sh
```

### Manual Container Rebuild
```bash
cd /home/ubuntu/CSCRS/backend

# Rebuild backend container image
docker compose build backend

# Re-launch containers with updated image
docker compose up -d backend
```

---

## 6. Rollback & Emergency Recovery Protocols

### Code Rollback Procedure
If a newly deployed code commit contains unexpected bugs:
1. Revert Git repository to the previous stable commit or tag:
   ```bash
   git checkout v1.0.0
   ```
2. Rebuild and restart containers:
   ```bash
   ./update.sh
   ```

### Safe Migration Downgrade (Only when necessary)
If a migration script fails or must be rolled back:
```bash
# Check current database revision
docker exec -it cscrs-backend alembic current

# Downgrade to target previous revision
docker exec -it cscrs-backend alembic downgrade -1
```

---

## 7. Common Incident Runbooks

### Incident 1: Backend Returns `503 Service Unavailable` on `/readiness`
- **Cause**: Database container (`cscrs-postgres`) is unreachable or restarting.
- **Remediation**:
  1. Inspect PostgreSQL logs: `docker compose logs postgres`
  2. Verify disk space on Oracle VM host: `df -h`
  3. Restart PostgreSQL container if stopped: `docker compose restart postgres`

### Incident 2: Rate Limiting Blocking Valid Users (`429 Too Many Requests`)
- **Cause**: Redis connection lost or client IP proxy header misconfiguration.
- **Remediation**:
  1. Verify Redis health: `docker exec -it cscrs-redis redis-cli ping` (Should return `PONG`).
  2. Restart Redis container: `docker compose restart redis`

### Incident 3: Media Upload Failures (`400 Bad Request` or `500 Server Error`)
- **Cause**: Missing write permissions or storage volume capacity reached.
- **Remediation**:
  1. Inspect upload directory volume: `ls -la /app/uploads`
  2. Confirm disk space availability on `/var/lib/docker/volumes/`.
