# CSCRS Deployment & Operational Environment Specification

## 1. System Requirements & Dependencies

### System Requirements
- **OS**: Windows 10/11, Linux (Ubuntu 20.04+), or macOS
- **Python Version**: Python 3.10+
- **GPU (Optional)**: NVIDIA GPU with CUDA support for accelerated YOLOv8 and OpenCLIP inference.

### Core Software Stack
- **Web Framework**: FastAPI (`0.110.0+`)
- **ASGI Server**: Uvicorn / Gunicorn
- **Database**: SQLite (Development / Standalone) or PostgreSQL (Production)
- **ORM**: SQLAlchemy (`2.0.28+`)
- **Migrations**: Alembic (`1.13.1+`)
- **Deep Learning / Vision**:
  - `ultralytics` (`8.1.27+` for YOLOv8 segmentation)
  - `torch` & `torchvision`
  - `open_clip_torch` (`2.24.0+` for scene similarity)
  - `opencv-python` (`4.9.0.80+` for quality metrics)
  - `Pillow` & `exifread` (EXIF parsing)

---

## 2. Environment Variables Configuration

Create a `.env` file in the repository root based on `.env.example`:

| Variable Name | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | `sqlite:///./cscrs.db` | SQLAlchemy connection string URL. |
| `SECRET_KEY` | **Yes** | — | Cryptographic secret key for signing JWT tokens. |
| `ALGORITHM` | No | `HS256` | JWT signing algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `60` | JWT token validity lifetime in minutes. |
| `SMTP_HOST` | **Yes** | `smtp.gmail.com` | SMTP server hostname for email delivery. |
| `SMTP_PORT` | No | `587` | SMTP port (TLS/STARTTLS). |
| `SMTP_USERNAME` | **Yes** | — | Email sender account username. |
| `SMTP_PASSWORD` | **Yes** | — | Email sender account app password. |
| `MAIL_FROM` | **Yes** | — | Sender email address for outbound emails. |
| `OTP_EXPIRY_MINUTES` | No | `5` | Email verification OTP expiration time. |
| `OTP_LENGTH` | No | `6` | Length of generated OTP string. |
| `APP_BASE_URL` | No | `http://localhost:8000` | Backend API base URL for activation links. |
| `FRONTEND_BASE_URL` | No | `http://localhost:3000` | Web frontend URL. |
| `DUPLICATE_REPORT_RADIUS_METERS` | No | `8.0` | Spatial radius threshold for duplicate detection. |
| `DUPLICATE_SCENE_THRESHOLD` | No | `0.82` | OpenCLIP cosine similarity threshold for duplicate scene. |
| `START_WORK_RADIUS_METERS` | No | `30.0` | Proximity radius threshold for starting worker repair. |

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
pip install -r requirements.txt
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
