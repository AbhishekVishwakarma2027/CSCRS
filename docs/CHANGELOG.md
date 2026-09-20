# CSCRS System Changelog & Technical Release Notes

This document provides a technical change log tracking major architecture evolutions, feature releases, database migrations, and deployment enhancements in the **Crowdsourced Civic Issue Reporting and Resolution System (CSCRS)** codebase.

---

## [1.0.1] - 2026-09-18 — Feature-Complete Enterprise Release

### Added Features & Subsystems

#### 1. Super Admin Governance Suite & Audit Telemetry
- **System Audit Logging (`AuditLog`)**: Implemented system-wide immutable audit trail capturing administrative mutations (`REPORT_CANCELLED`, `WORKER_BLOCKED`, `TRANSFER_APPROVED`) with actor IDs, IP tracking, and timestamp records (`/api/v1/super-admin/audit-logs`).
- **User Login Security Audits (`LoginAudit`)**: Added comprehensive login tracking for security monitoring (`/api/v1/super-admin/login-audits`).
- **Platform Health Diagnostics**: Added real-time container health diagnostics (`/api/v1/super-admin/health`) tracking memory usage, CPU load, and database connection pools.
- **AI Telemetry Suite**: Implemented prediction telemetry (`/api/v1/super-admin/ai-telemetry`) monitoring YOLO confidence scores, OpenCLIP visual similarity distributions, and model processing latencies.

#### 2. System Broadcast Architecture
- **Broadcast Announcements (`Broadcast`)**: Introduced platform-wide and role-targeted broadcast system created by Super Admins (`/api/v1/super-admin/announcements`).
- **Notification Decoupling**: Separated user-targeted in-app notifications (`InAppNotification`) from broadcast messaging, featuring derived time lifecycle states (`SCHEDULED`, `ACTIVE`, `EXPIRED`, `CANCELLED`).

#### 3. Public Platform & Uttar Pradesh State Dashboard
- **Public Overview API**: Unauthenticated public platform overview metrics (`/api/v1/public/overview`).
- **75-District State Dashboard**: Implemented real-time Uttar Pradesh district analytics (`/api/v1/public/state-dashboard`) with GeoJSON resolution scores for all 75 UP districts.
- **Public News & Press Portal**: Added public municipal update publishing (`/api/v1/public/updates` and `/api/v1/super-admin/updates`) with thumbnail image upload support.

#### 4. Inter-Department Transfer Workflow
- **Transfer Request History**: Added comprehensive transfer audit trail and rejected request queries (`/api/v1/forward-requests/rejected`).
- **Worker Forward Flagging**: Allowed workers to flag reports for transfer with reason codes (`WRONG_AI_CLASSIFICATION`, `ADMINISTRATIVE_TRANSFER`, etc.).

#### 5. Worker Assignment & Geofenced Start
- **Manual Worker Dispatch**: Added manual worker assignment capability (`/api/v1/assignments`) for Department Admins.
- **30-Meter Geofenced Work Start**: Enforced worker location verification within 30 meters of report GPS coordinates before job initiation.

#### 6. Resolution AI Verification & Manual Review Queue
- **Dual-Phase Vision Verification**: Combined OpenCLIP before/after scene similarity scoring with YOLO object re-detection.
- **Manual Review Workspace**: Added side-by-side photo comparison workspace for Department Admins (`/api/v1/resolutions/manual-review`).

#### 7. Responsive UI & Build-Time Metadata
- **Responsive Layout Standardization**: Standardized admin tables, stats grids, and navigation sidebars across mobile, tablet, and desktop viewports.
- **Build-Time Git Metadata**: Integrated build-time Git commit and timestamp metadata rendering.

---

### Infrastructure & Migration Enhancements

- **PostgreSQL 16 & Redis 7 Docker Stack**: Orchestrated multi-container stack with Nginx 1.28 reverse proxy and Vercel frontend edge deployment.
- **Automated Startup Migration Workflow**: Configured `docker-entrypoint.sh` to automatically run `alembic upgrade head`, `seed_departments`, and `bootstrap_super_admin` upon backend container start.
- **Alembic Revisions**: Applied migrations `08a946b86902` through `9c71a8234567`.

---

## [1.0.0] - 2026-08-15 — Initial Core Release

### Added Features
- Core citizen report submission with basic image upload.
- Initial FastAPI REST API structure and SQLite database integration.
- Initial JWT authentication (Login, Register, Password Reset).
- Initial municipal department seeding and baseline worker assignments.
