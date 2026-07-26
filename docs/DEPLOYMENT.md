# CSCRS Deployment & Operational Environment Specification

## 1. System Requirements & Dependencies

### System Requirements
- **OS**: Windows 10/11, Linux (Ubuntu 20.04+), or macOS
- **Python Version**: Python 3.10+
- **GPU (Optional)**: NVIDIA GPU with CUDA support for accelerated YOLOv8 and OpenCLIP inference.

### Core Software Stack
- **Web Framework**: FastAPI (`0.138.2`)
- **ASGI Server**: Uvicorn (`0.49.0`) / Gunicorn
- **Database**: SQLite (Development / Standalone) or PostgreSQL 16 (Production)
- **Cache & Rate Limiting**: Redis (`7-alpine` container, `redis[hiredis]==6.4.0` driver)
- **ORM**: SQLAlchemy (`2.0.51`)
- **Migrations**: Alembic (`1.18.5`)
- **Deep Learning / Vision**:
  - `ultralytics` (`8.4.41` for YOLOv8 segmentation)
  - `torch` (`2.5.1+cu121`) & `torchvision` (`0.20.1+cu121`)
  - `open_clip_torch` (`3.3.0` for scene similarity)
  - `opencv-contrib-python-headless` (`4.11.0.86` for quality metrics)
  - `Pillow` (`12.1.1`) & `exifread` (`3.5.1`) (EXIF parsing)

---

## 2. Environment Variables Configuration

Create a `.env` file in the repository root based on `.env.example`:

| Variable Name | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | `sqlite:///./cscrs.db` | SQLAlchemy connection string URL. Supports SQLite & PostgreSQL. |
| `REDIS_URL` | No | `redis://localhost:6379/0` | Redis connection URL for rate limiting. |
| `SECRET_KEY` | **Yes** | — | Cryptographic secret key for signing JWT tokens. |
| `ALGORITHM` | No | `HS256` | JWT signing algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `60` | JWT access token validity lifetime in minutes. |
| `SMTP_HOST` | **Yes** | `smtp.gmail.com` | SMTP server hostname for email delivery. |
| `SMTP_PORT` | No | `587` | SMTP port (TLS/STARTTLS). |
| `SMTP_USERNAME` | **Yes** | — | Email sender account username. |
| `SMTP_PASSWORD` | **Yes** | — | Email sender account app password. |
| `MAIL_FROM` | **Yes** | — | Sender email address for outbound emails. |
| `OTP_EXPIRY_MINUTES` | No | `5` | Email verification OTP expiration time. |
| `OTP_LENGTH` | No | `6` | Length of generated OTP string. |
| `OTP_MAX_ATTEMPTS` | No | `5` | Maximum failed OTP attempts before invalidation. |
| `OTP_RESEND_COOLDOWN_SECONDS` | No | `60` | Cooldown period between OTP resends. |
| `APP_BASE_URL` | No | `http://localhost:8000` | Backend API base URL for activation links. |
| `FRONTEND_BASE_URL` | No | `http://localhost:3000` | Web frontend URL. Supports comma-separated origins. |
| `DUPLICATE_REPORT_RADIUS_METERS` | No | `8.0` | Spatial radius threshold for duplicate detection. |
| `DUPLICATE_ENABLE_SCENE_CHECK` | No | `True` | Flag to enable visual scene checks using OpenCLIP for duplicates. |
| `DUPLICATE_SCENE_THRESHOLD` | No | `0.82` | OpenCLIP cosine similarity threshold for duplicate scene. |
| `START_WORK_RADIUS_METERS` | No | `30.0` | Proximity radius threshold for starting worker repair. |
| `LOG_MAX_SIZE_MB` | No | `10` | Maximum size in MB of an application log file before rotating. |
| `LOG_BACKUP_COUNT` | No | `5` | Number of backup log files to retain during rotation. |

### Docker Production Setup Variables
The following environment variables are required in the `.env.production` file when deploying via Docker Compose:
- `POSTGRES_DB` (Production database name)
- `POSTGRES_USER` (Production database user)
- `POSTGRES_PASSWORD` (Production database password)

---

## 3. Step-by-Step Setup & Deployment Protocol

### Step 1: Virtual Environment Creation
```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On Linux/macOS
source venv/bin/activate
```

### Step 2: Install Dependencies
```bash
# For production runtime:
pip install -r requirements-prod.txt

# For development / training environment:
pip install -r requirements-dev.txt
```

### Step 3: Database Migration Execution
Apply Alembic database migrations to initialize tables:
```bash
alembic upgrade head
```

### Step 4: Seed Static Reference Data
Run administrative bootstrap scripts to seed initial municipal departments and Super Admin:
```bash
# Seed default municipal departments (Roads, Water, Waste, Electrical, Sanitation)
python scripts/seed_departments.py

# Bootstrap initial Super Admin account
python scripts/bootstrap_super_admin.py
```

---

## 4. Production Docker Deployment

For production deployments, the system runs as a multi-container stack orchestrated via Docker Compose:

- **Reverse Proxy**: Nginx (`nginx:1.28-alpine`) with proxy headers and static configurations.
- **Backend Application**: FastAPI server running via Uvicorn inside a Docker container using a custom `Dockerfile`.
- **Database**: PostgreSQL 16 database container.
- **Cache / Rate Limiting Storage**: Redis 7 (alpine).

To deploy the production stack:
1. Ensure a `.env.production` file is created in the root directory.
2. Run the deployment script:
   ```bash
   ./deploy.sh
   ```
   Or launch the containers directly:
   ```bash
   docker compose up -d --build
   ```

---

## 5. Execution Procedures

### Launch Primary FastAPI Backend
```bash
uvicorn api.app:app --host 0.0.0.0 --port 8000 --reload
```
- Interactive Swagger API Documentation: `http://localhost:8000/docs`
- Redoc API Documentation: `http://localhost:8000/redoc`

### Launch Standalone Evaluation Lab (Gradio Interface)
```bash
python evaluation_lab/app.py
```
- Access Interactive Evaluation Interface: `http://127.0.0.1:7860`

---

## 6. Directory Permissions & Upload Storage
Ensure the runtime user process has write access to the `uploads/` directory for storing citizen photos and annotated YOLO predictions:
```
uploads/
├── [generated_citizen_images].jpg
└── resolution/
    └── [generated_worker_resolution_images].jpg
```

---

## 7. CI/CD Pipeline & GitHub Actions

The repository features automated GitHub Actions workflows for continuous integration and automated deployment:

### Continuous Integration (`.github/workflows/backend-ci.yml`)
- Triggered automatically on push and pull requests targeting the `main` branch.
- Checks Python compatibility (`3.12`), upgrades pip, installs production dependencies, and compiles the codebase via `compileall` to catch syntax errors or broken imports before merge.

### Continuous Deployment (`.github/workflows/deploy.yml`)
- Triggered manually via `workflow_dispatch`.
- Establishes a secure SSH connection to the Oracle VM deployment target utilizing repository secrets.
- Pulls the latest commits from `main`, executes the `update.sh` system upgrade script, restarts the Docker Compose stack, and performs a deployment health check.
