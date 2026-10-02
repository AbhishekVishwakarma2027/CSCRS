# CSCRS Deployment & Operational Specification

This document details the environment configuration, local setup protocols, production Docker container topology, and deployment workflows for the **Crowdsourced Civic Issue Reporting and Resolution System (CSCRS)**.

---

## 1. System Requirements & Infrastructure Stack

### Hardware & Operating System Specifications
- **Local Development**: Windows 10/11, macOS, or Linux (Ubuntu 22.04+). Python 3.10+ and Node.js 18+.
- **Production Server**: **Oracle Cloud Infrastructure (OCI) ARM64 Virtual Machine** running **Ubuntu 24.04 LTS**.
- **GPU (Optional)**: NVIDIA CUDA-accelerated GPU for accelerated YOLOv8 and OpenCLIP inference.

### Production Core Software Stack
- **Web API Framework**: FastAPI (`0.138.2`) running on Uvicorn (`0.49.0`).
- **Frontend Hosting**: **Vercel** Edge Network (React 19 + Vite static build).
- **Production Database**: PostgreSQL 16 (`postgres:16` container).
- **Cache & Rate Limiter**: Redis 7 (`redis:7-alpine` container) with AOF persistence.
- **Reverse Proxy**: Nginx 1.28 (`nginx:1.28-alpine` container) handling SSL, CORS, proxy headers, and static uploads serving.
- **ORM & Migrations**: SQLAlchemy (`2.0.51`) & Alembic (`1.18.5`).
- **Computer Vision & Deep Learning**:
  - `ultralytics` (`8.4.41` for YOLOv8 object detection & segmentation)
  - `torch` (`2.5.1`) & `torchvision` (`0.20.1`)
  - `open_clip_torch` (`3.3.0` for visual scene similarity)
  - `opencv-contrib-python-headless` (`4.11.0.86`)
  - `Pillow` (`12.1.1`) & `exifread` (`3.5.1`)

---

## 2. Environment Configuration

### Root `.env` (Local Development)
Create `.env` in the repository root based on `.env.example`:

| Variable | Required | Default / Example | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | `sqlite:///./cscrs.db` | Connection string URL (SQLite or PostgreSQL). |
| `REDIS_URL` | No | `redis://localhost:6379/0` | Redis connection URL for rate limiting. |
| `SECRET_KEY` | **Yes** | — | Cryptographic secret for signing JWT tokens. |
| `ALGORITHM` | No | `HS256` | JWT signing algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `60` | JWT access token lifetime in minutes. |
| `SMTP_HOST` | **Yes** | `smtp.gmail.com` | Outbound SMTP server hostname. |
| `SMTP_PORT` | No | `587` | SMTP port (STARTTLS). |
| `SMTP_USERNAME` | **Yes** | — | Sender email address. |
| `SMTP_PASSWORD` | **Yes** | — | Sender account app password. |
| `MAIL_FROM` | **Yes** | — | Displayed sender email address. |
| `OTP_EXPIRY_MINUTES` | No | `5` | Verification OTP expiration time. |
| `OTP_RESEND_COOLDOWN_SECONDS` | No | `60` | Cooldown between OTP resends. |
| `APP_BASE_URL` | No | `http://localhost:8000` | Backend API base URL for activation links. |
| `FRONTEND_BASE_URL` | No | `http://localhost:5173` | Allowed origins for CORS (comma-separated). |
| `DUPLICATE_REPORT_RADIUS_METERS` | No | `8.0` | Spatial duplicate detection radius. |
| `DUPLICATE_SCENE_THRESHOLD` | No | `0.82` | OpenCLIP visual scene similarity threshold. |

### Backend `.env.production` (Production Docker)
The following variables are required in `backend/.env.production` for Docker Compose deployment:
- `POSTGRES_DB` (e.g., `cscrs_db`)
- `POSTGRES_USER` (e.g., `cscrs_admin`)
- `POSTGRES_PASSWORD` (Production database secret)
- `DATABASE_URL` (`postgresql+psycopg://cscrs_admin:password@postgres:5432/cscrs_db`)
- `REDIS_URL` (`redis://redis:6379/0`)
- `SECRET_KEY` (Strong production key)
- `FRONTEND_BASE_URL` (`https://cscrs.vercel.app,https://www.cscrs.in`)

---

## 3. Local Development Startup

### Backend Service
```bash
# Navigate to backend
cd backend

# Create & activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements-dev.txt

# Execute database migrations
alembic upgrade head

# Seed initial departments and Super Admin
python -m scripts.seed_departments
python -m scripts.bootstrap_super_admin

# Start FastAPI server
uvicorn api.app:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Service
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

---

## 4. Production Docker Topology & Container Orchestration

The production backend stack is defined in `backend/docker-compose.yml`:

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16
    container_name: cscrs-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - cscrs-network

  redis:
    image: redis:7-alpine
    container_name: cscrs-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - cscrs-network

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: cscrs-backend
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    env_file:
      - .env.production
    expose:
      - "8000"
    volumes:
      - ../models:/app/models:ro
      - uploads_data:/app/uploads
      - logs_data:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - cscrs-network

  nginx:
    image: nginx:1.28-alpine
    container_name: cscrs-nginx
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./deployment/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    networks:
      - cscrs-network

volumes:
  postgres_data:
  redis_data:
  uploads_data:
  logs_data:

networks:
  cscrs-network:
    driver: bridge
```

### Automatic Container Entrypoint Workflow (`backend/docker-entrypoint.sh`)
When the backend container launches, `docker-entrypoint.sh` executes automatically before starting Uvicorn:
1. Runs Alembic database migrations: `alembic upgrade head`
2. Executes department bootstrapping: `python -m scripts.seed_departments`
3. Executes Super Admin bootstrapping: `python -m scripts.bootstrap_super_admin`
4. Launches FastAPI via Uvicorn: `exec uvicorn api.app:app --host 0.0.0.0 --port 8000`

---

## 5. Deployment Scripts & Automated Execution

### System Update Protocol (`backend/update.sh`)
To pull the latest code and safely update production containers:
```bash
cd backend
chmod +x update.sh
./update.sh
```

`update.sh` executes the following sequence:
1. Verifies `.env.production` exists.
2. Runs `git pull` to fetch the latest commits from `main`.
3. Rebuilds Docker container images (`docker compose build`).
4. Restarts container stack (`docker compose up -d`).
5. Waits 10 seconds for backend initialization.
6. Performs health check against `http://localhost/health`.
7. Displays container status (`docker compose ps`).

---

## 6. Continuous Integration & Deployment (CI/CD)

The repository features automated GitHub Actions workflows under `.github/workflows/`:

- **Backend CI (`.github/workflows/backend-ci.yml`)**:
  - Triggers on push and pull requests targeting `main`.
  - Sets up Python 3.12, installs dependencies, and runs `python -m compileall backend` to verify import integrity.
- **Deploy Backend (`.github/workflows/deploy.yml`)**:
  - Manual trigger via `workflow_dispatch`.
  - Connects via SSH (`secrets.ORACLE_SSH_KEY`) to Oracle VM host (`secrets.ORACLE_HOST`).
  - Pulls latest code, executes `update.sh`, and validates health check at `https://api.cscrs.in/health`.

---

## 7. Operational Diagnostics & Monitoring

### Container Status
```bash
docker compose ps
```

### Real-Time Logs
```bash
# View backend application logs
docker compose logs -f backend

# View Nginx access & error logs
docker compose logs -f nginx

# View PostgreSQL logs
docker compose logs -f postgres
```

### Health Endpoints
- `GET /health`: Service health summary.
- `GET /liveness`: Container liveness check.
- `GET /readiness`: Database connectivity test (`SELECT 1`).
