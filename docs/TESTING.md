# CSCRS Testing & Quality Assurance Specification

This document details the testing strategy, test suites, static verification tools, build validation procedures, and known test environment characteristics for the **Crowdsourced Civic Issue Reporting and Resolution System (CSCRS)**.

---

## 1. Testing Strategy Overview

The CSCRS repository employs a multi-tiered testing strategy combining automated backend integration tests, frontend static type checks, production bundler validation, API health probes, and manual quality assurance.

```
                   ┌──────────────────────────────────┐
                   │    Manual QA & Responsive UI     │
                   └────────────────┬─────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌──────────────────────┐                         ┌──────────────────────┐
│  Vite Production     │                         │  Pytest Integration  │
│  Bundle Validation   │                         │  Targeted Test Suite │
└──────────┬───────────┘                         └──────────┬───────────┘
           │                                                │
           └────────────────────────┬───────────────────────┘
                                    ▼
                       ┌─────────────────────────┐
                       │ TypeScript `tsc` Checks │
                       │  & Syntax Compilation   │
                       └─────────────────────────┘
```

---

## 2. Backend Automated Test Suites (`backend/`)

Backend test scripts are located in `backend/` and use `pytest`:

| Test Module File | Target Subsystem | Key Tested Scenarios |
| :--- | :--- | :--- |
| `test_super_admin.py` | Super Admin Governance & Audit | Audit log pagination, login security audit log query, platform system health diagnostics, AI telemetry compilation, system announcements lifecycle. |
| `test_public_overview.py` | Public Platform Overview | Public platform overview statistics API (`/api/v1/public/overview`), unauthenticated metrics rendering. |
| `test_public_state_dashboard.py` | UP State Dashboard | Uttar Pradesh 75-district resolution scores, district GeoJSON resolution, state metrics calculation. |
| `test_public_updates.py` | Public News & Press | News creation, thumbnail upload validation, publication toggling, slug querying, and public listing pagination. |
| `test_city_admin_analytics.py` | City Admin Analytics | Department performance stats, issue statistics, status & priority distributions, monthly trends, and dashboard insights. |

### Running Backend Tests
```bash
# Navigate to backend directory
cd backend

# Execute pytest suite
pytest -v
```

---

## 3. Frontend Typechecking & Production Build Validation (`frontend/`)

### TypeScript Static Type Verification
The frontend enforces strict TypeScript compilation checks to catch type mismatches, missing props, or invalid API contract schemas prior to deployment.
```bash
cd frontend
npm run typecheck
```

### Vite Production Build Validation
Validates that code splitting, dynamic imports (`React.lazy`), CSS asset bundling, and path resolution (`@/`) compile cleanly into `/dist`:
```bash
cd frontend
npm run build
```

---

## 4. API Health, Liveness & Readiness Verification

The backend exposes automated health verification probes at root level:

```bash
# Check basic API responsiveness
curl -fs http://localhost:8000/health

# Check container liveness
curl -fs http://localhost:8000/liveness

# Check database readiness (returns 503 if DB disconnected)
curl -fs http://localhost:8000/readiness
```

---

## 5. Database & Migration Verification

Alembic migration execution is verified locally and during container startup:
```bash
cd backend
alembic upgrade head
```
This confirms that all 7 migration revisions apply cleanly to PostgreSQL/SQLite without table conflict errors or missing foreign keys.

---

## 6. AI Vision Pipeline Validation

The AI computer vision pipeline can be verified independently using the standalone Gradio evaluation interface:
```bash
cd backend
python evaluation_lab/app.py
```
Access `http://127.0.0.1:7860` to run interactive image uploads through YOLOv8 object detection, EXIF GPS extraction, and OpenCLIP visual scene similarity scoring.

---

## 7. Manual QA & Responsive Testing Protocol

Cross-browser and responsive breakpoint verification protocols include:
- **Responsive Layout Verification**: Auditing dashboard tables, stats grids, and modals across Mobile (375px), Tablet (768px), and Desktop (1440px) breakpoints.
- **RBAC Portal Access Verification**: Logging in with different user roles (`SUPER_ADMIN`, `CITY_ADMIN`, `DEPARTMENT_ADMIN`, `WORKER`, `CITIZEN`) to confirm sidebars, topbars, and protected routes enforce expected role constraints.
- **Geofence Simulation**: Testing worker job start within $\le 30\text{m}$ vs $> 30\text{m}$ radius.

---

## 8. Known Test Suite Limitations

- **Headless GPU / Model Dependencies**: PyTorch CUDA acceleration tests require NVIDIA GPU drivers. In CPU-only CI environments (`.github/workflows/backend-ci.yml`), YOLOv8 and OpenCLIP fall back to CPU execution, resulting in higher inference latency during visual similarity tests.
- **SMTP Delivery Mocking**: Automated test suites mock outbound email dispatch to avoid requiring active Google SMTP credentials during unit test execution.
