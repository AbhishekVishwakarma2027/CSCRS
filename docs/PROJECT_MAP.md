# CSCRS Repository Project Map

This document presents the complete file and directory layout of the **Crowdsourced Civic Issue Reporting and Resolution System (CSCRS)** repository, detailing the exact responsibility of each major module across backend, frontend, database, AI inference, deployment, and documentation layers.

---

## 1. Root Repository Layout

```
CSCRS/
├── .env                              # Local environment configuration file
├── .env.example                      # Template for environment configuration variables
├── .gitignore                        # Git exclusion pattern configuration
├── .github/                          # GitHub Actions CI/CD workflow configurations
│   └── workflows/
│       ├── backend-ci.yml            # Automated Python build & import syntax check workflow
│       └── deploy.yml                # SSH-based automated deployment workflow to Oracle Cloud VM
├── backend/                          # FastAPI application, database, services, and AI vision
├── docs/                             # Complete verified system documentation suite
├── frontend/                         # React 19 + Vite + TypeScript web portal codebase
├── models/                           # Machine learning model weights directory
│   └── best.pt                       # Fine-tuned YOLOv8 civic issue object detection weights
├── uploads/                          # Local storage volume for uploaded citizen & resolution photos
│   ├── public_updates/               # Thumbnail images for public news & press articles
│   └── resolution/                   # Worker post-repair proof photo uploads
├── LICENSE                           # Project MIT open-source software license
└── README.MD                         # Master repository entry point and quickstart documentation
```

---

## 2. Backend Module Architecture (`backend/`)

```
backend/
├── alembic/                          # Alembic database migration management
│   ├── versions/                     # 7 executed schema migration revisions
│   │   ├── 08a946b86902_initial_postgresql_schema.py
│   │   ├── 2a344703429c_fix_timestamp_timezone_consistency.py
│   │   ├── 65d2488006d6_create_refresh_tokens_table.py
│   │   ├── cd2598f26b66_increase_system_issue_number_length.py
│   │   ├── 7a8e9f102345_add_announcement_lifecycle_fields.py
│   │   ├── 8b9fa0113456_create_broadcasts_table_and_decouple_notifications.py
│   │   └── 9c71a8234567_create_public_updates_table.py
│   ├── env.py                        # Alembic migration environment runtime script
│   └── script.py.mako                # Template for generating new Alembic revisions
├── alembic.ini                       # Alembic migration configuration file
├── api/                              # FastAPI REST API route handlers
│   ├── admin.py                      # Department admin invitation and worker listing endpoints
│   ├── ai_dataset.py                 # Verified detection dataset export endpoint for YOLO training
│   ├── announcements.py              # System broadcast announcement endpoints (Super Admin & User)
│   ├── app.py                        # FastAPI application instantiation, middleware & startup hooks
│   ├── assignment.py                 # Manual worker assignment and 30m geofenced job start APIs
│   ├── auth.py                       # Authentication, JWT login/refresh, session control & OTP APIs
│   ├── city_admin.py                 # City Admin governance, user management, and blocking APIs
│   ├── dashboard.py                  # Analytics endpoints for City Admin, Dept Admin, Worker & Citizen
│   ├── department.py                 # Municipal department management endpoints
│   ├── feedback.py                   # Citizen feedback submission & export APIs
│   ├── forward_request.py            # Inter-department report transfer request APIs
│   ├── generate_report.py            # PDF performance report streaming endpoints
│   ├── in_app_notification.py        # In-app user notification reading & counter APIs
│   ├── profile.py                    # User profile viewing, editing & avatar photo upload APIs
│   ├── public.py                     # Public overview, UP State Dashboard & news reading APIs
│   ├── public_updates_admin.py       # Super Admin news & press management & thumbnail upload APIs
│   ├── report.py                     # Citizen report filing, search, pagination, cancel & reopen APIs
│   ├── resolution.py                 # Worker resolution photo upload & Dept Admin manual review APIs
│   ├── routes.py                     # Central APIRouter setup and health/liveness/readiness probes
│   ├── super_admin.py                # Super Admin audit logs, login security, health & AI telemetry APIs
│   ├── system_issue.py               # System bug/issue reporting, query & status management APIs
│   ├── timeline.py                   # Report lifecycle timeline tracking APIs
│   └── worker.py                     # Field worker onboarding, activation & blocking APIs
├── authentication/                   # Security, JWT tokens & RBAC authorization dependencies
│   ├── dependencies.py               # Fine-grained role dependencies (require_super_admin, etc.)
│   ├── security.py                   # Cryptographic password hashing (bcrypt) & JWT token signing
│   └── session.py                    # Database session & refresh token rotation helper functions
├── configs/                          # Global backend application settings
│   └── config.py                     # Environment variable parsing, default parameters & limits
├── database/                         # Database connection, ORM models & CRUD functions
│   ├── crud/                         # Database access functions grouped by entity domain
│   │   ├── assignment.py
│   │   ├── audit_log.py
│   │   ├── broadcast.py
│   │   ├── department.py
│   │   ├── forward_request.py
│   │   ├── login_audit.py
│   │   ├── public_update.py
│   │   ├── report.py
│   │   ├── resolution.py
│   │   ├── system_issue.py
│   │   └── user.py
│   ├── models/                       # 26 SQLAlchemy ORM model definitions
│   │   ├── assignment.py
│   │   ├── audit_log.py
│   │   ├── broadcast.py
│   │   ├── department.py
│   │   ├── department_forward_request.py
│   │   ├── email_verification.py
│   │   ├── feedback.py
│   │   ├── in_app_notification.py
│   │   ├── login_audit.py
│   │   ├── password_reset.py
│   │   ├── public_update.py
│   │   ├── refresh_token.py
│   │   ├── report.py
│   │   ├── report_detection.py
│   │   ├── report_forward_history.py
│   │   ├── report_image.py
│   │   ├── report_support.py
│   │   ├── resolution.py
│   │   ├── resolution_ai_result.py
│   │   ├── resolution_attempt.py
│   │   ├── system_issue.py
│   │   ├── system_issue_attachment.py
│   │   ├── user.py
│   │   ├── worker_invitation.py
│   │   └── worker_profile.py
│   ├── connection.py                 # SQLAlchemy engine and SessionLocal factory setup
│   ├── dependencies.py               # FastAPI database session injection (`get_db`)
│   └── enums.py                      # System database enums (UserRole, ReportStatus, Priority, etc.)
├── deployment/                       # Production deployment web server configuration
│   └── nginx/
│       └── nginx.conf                # Production Nginx reverse proxy configuration
├── evaluation_lab/                   # Standalone model evaluation interface
│   └── app.py                        # Gradio interactive testing suite for YOLOv8 & OpenCLIP
├── inference/                        # AI Model inference engines
│   ├── engine.py                     # Primary YOLOv8 object detection predictor & polygon annotator
│   └── open_clip_engine.py           # OpenCLIP visual scene embedding & cosine similarity computer
├── schemas/                          # Pydantic data validation and serialization schemas
│   ├── admin.py
│   ├── analytics.py
│   ├── assignment.py
│   ├── city_admin.py
│   ├── forward_request.py
│   ├── public_dashboard.py
│   ├── public_update.py
│   ├── report.py
│   ├── resolution.py
│   ├── super_admin.py
│   ├── system_issue.py
│   ├── user.py
│   └── worker.py
├── scripts/                          # Administrative seed and management scripts
│   ├── bootstrap_super_admin.py      # Seeds initial Super Admin account
│   └── seed_departments.py           # Seeds default municipal departments (Roads, Water, Waste, etc.)
├── services/                         # Business logic domain services
│   ├── admin_service.py
│   ├── analytics_service.py
│   ├── assignment.py
│   ├── audit_log_service.py
│   ├── city_admin_service.py
│   ├── duplicate_detection_service.py # Spatial (8m) & OpenCLIP scene duplicate checker
│   ├── forward_request_service.py
│   ├── generate_report_service.py     # PDF report generator (ReportLab)
│   ├── public_dashboard_service.py    # 75 UP District analytics & GeoJSON resolution
│   ├── public_update_service.py
│   ├── report_service.py
│   ├── resolution.py
│   ├── super_admin_service.py
│   ├── system_issue_service.py
│   └── worker_service.py
├── utils/                            # Utility helper functions
│   ├── email.py                      # Outbound SMTP email sender
│   ├── file_utils.py                 # File upload validation & UUID filename generator
│   ├── gps.py                        # EXIF GPS degree-minute-second to decimal converter
│   ├── logger.py                     # Rotational application logger setup
│   └── rate_limiter.py               # SlowAPI rate limiter instance
├── verification/                     # Image quality & EXIF verification pipeline
│   ├── exif.py                       # Image EXIF extraction module
│   └── quality.py                    # Blurriness (Laplacian variance) & contrast validator
├── Dockerfile                        # Multi-stage production container build instructions
├── docker-compose.yml                # Docker Compose production stack orchestration file
├── docker-entrypoint.sh              # Container startup script (migrations, seeds, uvicorn)
├── update.sh                         # Production code pull, container rebuild & update script
└── deploy.sh                         # Host deployment script
```

---

## 3. Frontend Module Architecture (`frontend/`)

```
frontend/
├── src/
│   ├── app/                          # Application wrapper & global configuration
│   ├── assets/                       # Static images, icons, and SVG graphics
│   ├── components/                   # Shared UI component library
│   │   ├── common/                   # Skeleton loaders, buttons, badges, modals
│   │   └── layout/                   # Navbar, sidebar, AppLayout shell wrappers
│   ├── config/                       # Frontend environment constants & API base URLs
│   ├── features/                     # Feature-sliced application modules
│   │   ├── analytics/                # Analytics charts & performance widgets
│   │   ├── auth/                     # Login, OTP verification & password recovery pages
│   │   ├── dashboard/                # Main dashboard view for admins, workers & citizens
│   │   ├── departments/              # Department directory & management views
│   │   ├── feedback/                 # Citizen feedback submit & list views
│   │   ├── forward-requests/         # Inter-department transfer workspace
│   │   ├── notifications/            # User notification center page
│   │   ├── platform/                 # System landing & static platform pages
│   │   ├── profile/                  # Profile settings & password change forms
│   │   ├── public/                   # Public news detail & press updates views
│   │   ├── reports/                  # Citizen report filing modal & city report tables
│   │   ├── resolutions/              # Worker job execution & admin manual review workspace
│   │   ├── super-admin/              # Governance, broadcasts, press editor & audit logs
│   │   ├── system-issues/            # System bug reporting form & health page
│   │   ├── user-directories/         # Directory tables for citizens, admins & workers
│   │   └── workers/                  # Worker onboarding & roster management
│   ├── hooks/                        # Custom React hooks (useAuth, useToast, etc.)
│   ├── lib/                          # External client library configurations
│   │   └── api-client.ts             # Axios HTTP client with JWT interceptor & refresh logic
│   ├── pages/                        # Top-level standalone page routes
│   │   └── LandingPage.tsx           # Public platform landing page with 75 UP District map
│   ├── providers/                    # React context providers (QueryClientProvider, AuthProvider)
│   ├── routes/                       # Application routing configuration
│   │   ├── index.tsx                 # Central React Router route definitions & lazy loaders
│   │   ├── paths.ts                  # Centralized path string definitions
│   │   ├── protected-route.tsx       # Role-gated route protection wrapper
│   │   └── public-route.tsx          # Unauthenticated route protection wrapper
│   ├── schemas/                      # Zod form validation schemas
│   ├── services/                     # Frontend API request integration services
│   ├── stores/                       # Client state management stores (Zustand)
│   ├── types/                        # TypeScript type definitions & API contracts
│   ├── utils/                        # Frontend date formatters and string helpers
│   ├── index.css                     # Master Tailwind CSS styles and glassmorphism utilities
│   └── main.tsx                      # Vite React application entry point
├── package.json                      # Node.js dependencies and npm scripts
├── tsconfig.json                     # TypeScript compiler configuration
└── vite.config.ts                    # Vite bundler configuration & path aliases (`@/`)
```

---

## 4. Documentation Directory (`docs/`)

```
docs/
├── api-reference/                    # Modular API reference files directory
├── API.md                            # Complete 23-module REST API specification
├── ARCHITECTURE.md                   # 25-section system architecture document with 5 Mermaid diagrams
├── CHANGELOG.md                      # Technical change history detailing system releases
├── DATABASE.md                       # Database schema guide for 26 models & 7 Alembic revisions
├── DEPLOYMENT.md                     # Local setup & Oracle Cloud VM Docker deployment guide
├── OPERATIONS_RUNBOOK.md             # Administrator runbook for monitoring, logging & recovery
├── PROJECT_MAP.md                    # Complete codebase filesystem mapping (this document)
├── SECURITY.md                       # System security architecture, auth & rate limiting specification
└── TESTING.md                        # Testing strategy covering pytest, TypeScript checks & Vite builds
```
