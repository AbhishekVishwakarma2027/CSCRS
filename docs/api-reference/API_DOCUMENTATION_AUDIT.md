# CSCRS API Documentation Audit

> **Audit Date:** 2026-07-29
> **Repository:** `d:\Projects\CSCRS`
> **Scope:** Full backend route reconciliation, RBAC verification, request/response contract audit, normalization, and cross-link verification against all 26 API reference chapters.

---

## Audit Summary

| Metric | Result |
| :--- | ---: |
| Registered backend HTTP operations | **96** |
| Documented HTTP operations | **96** |
| Missing operations (post-repair) | **0** |
| Extra / stale documented operations (post-repair) | **0** |
| Duplicate endpoint contracts | **0** |
| Chapters audited | **26** |
| Backend inconsistencies discovered | **4** |
| Documentation files modified | **8** |

---

## Registered Route Coverage

Route resolution formula: `Application Prefix (none) + routes.py include prefix (/api/v1 where applicable) + Router prefix + Endpoint path`

| # | Method | Final Path | Documentation Chapter | Status |
| :--- | :---: | :--- | :--- | :---: |
| 1 | GET | `/health` | 26-health-api.md | Verified |
| 2 | GET | `/liveness` | 26-health-api.md | Verified |
| 3 | GET | `/readiness` | 26-health-api.md | Verified |
| 4 | POST | `/api/v1/auth/register` | 09-authentication-api.md | Verified |
| 5 | POST | `/api/v1/auth/login` | 09-authentication-api.md | Verified |
| 6 | GET | `/api/v1/auth/me` | 09-authentication-api.md | Verified |
| 7 | POST | `/api/v1/auth/refresh` | 09-authentication-api.md | Verified |
| 8 | POST | `/api/v1/auth/logout` | 09-authentication-api.md | Verified |
| 9 | POST | `/api/v1/auth/logout-all` | 09-authentication-api.md | Verified |
| 10 | GET | `/api/v1/auth/sessions` | 09-authentication-api.md | Verified |
| 11 | POST | `/api/v1/auth/verify-email` | 09-authentication-api.md | Verified |
| 12 | POST | `/api/v1/auth/resend-otp` | 09-authentication-api.md | Verified |
| 13 | POST | `/api/v1/auth/forgot-password` | 09-authentication-api.md | Verified |
| 14 | POST | `/api/v1/auth/verify-reset-otp` | 09-authentication-api.md | Verified |
| 15 | POST | `/api/v1/auth/reset-password` | 09-authentication-api.md | Verified |
| 16 | POST | `/api/v1/auth/change-password` | 09-authentication-api.md | Verified |
| 17 | GET | `/api/v1/profile/me` | 10-profile-api.md | Verified |
| 18 | PATCH | `/api/v1/profile/me` | 10-profile-api.md | Verified |
| 19 | DELETE | `/api/v1/profile/me/avatar` | 10-profile-api.md | Verified |
| 20 | POST | `/api/v1/profile/me/avatar` | 10-profile-api.md | Verified |
| 21 | POST | `/api/v1/report` | 11-reports-api.md | Verified |
| 22 | GET | `/api/v1/reports` | 11-reports-api.md | Verified |
| 23 | GET | `/api/v1/reports/{report_id}` | 11-reports-api.md | Verified |
| 24 | PATCH | `/api/v1/reports/{report_id}/cancel` | 11-reports-api.md | Verified |
| 25 | POST | `/api/v1/reports/{report_id}/support` | 11-reports-api.md | Verified |
| 26 | DELETE | `/api/v1/reports/{report_id}/support` | 11-reports-api.md | Verified |
| 27 | GET | `/api/v1/reports/{report_id}/support-count` | 11-reports-api.md | Verified |
| 28 | GET | `/api/v1/reports/my-reports` | 11-reports-api.md | Verified |
| 29 | PATCH | `/api/v1/reports/{report_id}/status` | 11-reports-api.md | Verified |
| 30 | GET | `/api/v1/reports/{report_id}/images` | 11-reports-api.md | Verified |
| 31 | GET | `/api/v1/reports/department/download` | 11-reports-api.md | Verified |
| 32 | GET | `/api/v1/reports/city/download` | 11-reports-api.md | Verified |
| 33 | POST | `/api/v1/assignments` | 12-assignments-api.md | Verified |
| 34 | GET | `/api/v1/assignments/{report_id}` | 12-assignments-api.md | Verified |
| 35 | PATCH | `/api/v1/assignments/{assignment_id}/status` | 12-assignments-api.md | Verified |
| 36 | POST | `/api/v1/resolutions` | 13-resolutions-api.md | Verified |
| 37 | GET | `/api/v1/resolutions/{report_id}` | 13-resolutions-api.md | Verified |
| 38 | GET | `/api/v1/resolutions/{report_id}/ai-result` | 13-resolutions-api.md | Verified |
| 39 | POST | `/api/v1/resolutions/{resolution_id}/manual-review` | 13-resolutions-api.md | Verified |
| 40 | POST | `/api/v1/resolutions/{resolution_id}/rework` | 13-resolutions-api.md | Verified |
| 41 | GET | `/api/v1/workers` | 14-workers-api.md | Verified |
| 42 | POST | `/api/v1/workers/invite` | 14-workers-api.md | Verified |
| 43 | GET | `/api/v1/workers/{worker_id}` | 14-workers-api.md | Verified |
| 44 | PATCH | `/api/v1/workers/{worker_id}/deactivate` | 14-workers-api.md | Verified |
| 45 | PATCH | `/api/v1/workers/{worker_id}/reactivate` | 14-workers-api.md | Verified |
| 46 | GET | `/api/v1/workers/available` | 14-workers-api.md | Verified |
| 47 | POST | `/api/v1/admins/invite` | 15-department-admin-api.md | Verified |
| 48 | GET | `/api/v1/admins` | 15-department-admin-api.md | Verified |
| 49 | POST | `/api/v1/city-admins/invite` | 16-city-admin-api.md | Verified |
| 50 | GET | `/api/v1/city-admins` | 16-city-admin-api.md | Verified |
| 51 | PATCH | `/api/v1/city-admins/admins/{admin_id}/block` | 16-city-admin-api.md | Verified |
| 52 | PATCH | `/api/v1/city-admins/admins/{admin_id}/unblock` | 16-city-admin-api.md | Verified |
| 53 | PATCH | `/api/v1/city-admins/citizens/{citizen_id}/block` | 16-city-admin-api.md | Verified |
| 54 | PATCH | `/api/v1/city-admins/citizens/{citizen_id}/unblock` | 16-city-admin-api.md | Verified |
| 55 | PATCH | `/api/v1/city-admins/department-admins/{admin_id}/block` | 16-city-admin-api.md | Verified |
| 56 | PATCH | `/api/v1/city-admins/department-admins/{admin_id}/unblock` | 16-city-admin-api.md | Verified |
| 57 | GET | `/api/v1/departments` | 18-departments-api.md | Verified |
| 58 | POST | `/api/v1/departments` | 18-departments-api.md | Verified |
| 59 | GET | `/api/v1/departments/{department_id}` | 18-departments-api.md | Verified |
| 60 | PATCH | `/api/v1/departments/{department_id}` | 18-departments-api.md | Verified |
| 61 | DELETE | `/api/v1/departments/{department_id}` | 18-departments-api.md | Verified |
| 62 | POST | `/api/v1/forward-requests` | 19-forward-requests-api.md | Verified |
| 63 | GET | `/api/v1/forward-requests/{report_id}` | 19-forward-requests-api.md | Verified |
| 64 | PATCH | `/api/v1/forward-requests/{request_id}/source-approve` | 19-forward-requests-api.md | Verified |
| 65 | PATCH | `/api/v1/forward-requests/{request_id}/source-reject` | 19-forward-requests-api.md | Verified |
| 66 | PATCH | `/api/v1/forward-requests/{request_id}/destination-accept` | 19-forward-requests-api.md | Verified |
| 67 | PATCH | `/api/v1/forward-requests/{request_id}/destination-reject` | 19-forward-requests-api.md | Verified |
| 68 | PATCH | `/api/v1/forward-requests/{request_id}/cancel` | 19-forward-requests-api.md | Verified |
| 69 | GET | `/api/v1/forward-requests/pending` | 19-forward-requests-api.md | Verified |
| 70 | GET | `/api/v1/dashboard/summary` | 20-dashboard-api.md | Verified |
| 71 | GET | `/api/v1/dashboard/feedback` | 20-dashboard-api.md | Verified |
| 72 | GET | `/api/v1/dashboard/departments` | 20-dashboard-api.md | Verified |
| 73 | GET | `/api/v1/dashboard/issues` | 20-dashboard-api.md | Verified |
| 74 | GET | `/api/v1/dashboard/status` | 20-dashboard-api.md | Verified |
| 75 | GET | `/api/v1/dashboard/priorities` | 20-dashboard-api.md | Verified |
| 76 | GET | `/api/v1/dashboard/monthly-trends` | 20-dashboard-api.md | Verified |
| 77 | GET | `/api/v1/dashboard/recent-reports` | 20-dashboard-api.md | Verified |
| 78 | GET | `/api/v1/dashboard/high-priority` | 20-dashboard-api.md | Verified |
| 79 | GET | `/api/v1/dashboard/insights` | 20-dashboard-api.md | Verified |
| 80 | GET | `/api/v1/dashboard/department/dashboard` | 20-dashboard-api.md | Verified |
| 81 | GET | `/api/v1/dashboard/top-workers` | 20-dashboard-api.md | Verified |
| 82 | GET | `/api/v1/dashboard/worker/dashboard` | 20-dashboard-api.md | Verified |
| 83 | GET | `/api/v1/dashboard/citizen/dashboard` | 20-dashboard-api.md | Verified |
| 84 | GET | `/api/v1/reports/{report_id}/timeline` | 21-timeline-api.md | Verified |
| 85 | GET | `/api/v1/notifications` | 22-notifications-api.md | Verified |
| 86 | GET | `/api/v1/notifications/unread-count` | 22-notifications-api.md | Verified |
| 87 | PATCH | `/api/v1/notifications/{notification_id}/read` | 22-notifications-api.md | Verified |
| 88 | PATCH | `/api/v1/notifications/read-all` | 22-notifications-api.md | Verified |
| 89 | POST | `/api/v1/feedback` | 23-feedback-api.md | Verified |
| 90 | GET | `/api/v1/feedback` | 23-feedback-api.md | Verified |
| 91 | POST | `/api/v1/issues` | 24-system-issues-api.md | Verified |
| 92 | GET | `/api/v1/issues` | 24-system-issues-api.md | Verified |
| 93 | GET | `/api/v1/issues/export` | 24-system-issues-api.md | Verified |
| 94 | GET | `/api/v1/issues/{issue_number}` | 24-system-issues-api.md | Verified |
| 95 | PATCH | `/api/v1/issues/{issue_number}/status` | 24-system-issues-api.md | Verified |
| 96 | GET | `/api/v1/ai-dataset/export` | 25-ai-dataset-api.md | Verified |

---

## Documentation Repairs Performed

### 1. Dashboard: 4 Missing Detailed Endpoint Sections [Critical]
**File:** 20-dashboard-api.md
GET /dashboard/departments, /dashboard/issues, /dashboard/status, /dashboard/priorities were listed in the Endpoint Summary table but had no detailed endpoint specification sections in the document body.
**Repair:** Added full standard-template endpoint sections for all 4 endpoints including auth, RBAC, response schemas, and error responses.

### 2. City Admin: 4 Missing Detailed Endpoint Sections [Critical]
**File:** 16-city-admin-api.md
PATCH .../citizens/{citizen_id}/block, /unblock, PATCH .../department-admins/{admin_id}/block, /unblock were registered in backend but absent from docs. Summary incorrectly stated 4 operations (8 actual).
**Repair:** Added full endpoint specifications for all 4 missing routes; corrected summary table.

### 3. Reports: 2 Missing PDF Download Endpoint Sections [Critical]
**File:** 11-reports-api.md
GET /reports/department/download and GET /reports/city/download were registered but absent from documentation.
**Repair:** Added full endpoint specifications including streaming response details and rate limits.

### 4. Super Admin: False Login Lock Bypass Claim [Accuracy]
**File:** 17-super-admin-api.md
Stated 'Bypasses standard login lock limits'. Source code inspection of auth_service.py confirms no such bypass exists.
**Repair:** Replaced with accurate: 'Subject to the same lockout (5 failed attempts 30-minute lock) as all other roles.'

### 5. Super Admin: 4 Stale Forthcoming Chapter References [Cross-Link]
**File:** 17-super-admin-api.md
Authority table referenced 4 now-completed chapters as 'Forthcoming API Chapter'.
**Repair:** Replaced with proper Markdown links to 18-departments-api.md, 23-feedback-api.md, 24-system-issues-api.md, 25-ai-dataset-api.md.

### 6. Super Admin: Wrong HTTP Method for Profile Update [Accuracy]
**File:** 17-super-admin-api.md
Listed 'PUT /api/v1/profile'. Actual registered method/path is PATCH /api/v1/profile/me.
**Repair:** Corrected to PATCH /api/v1/profile/me.

### 7. Departments: Stale Forthcoming Forward Requests Reference [Cross-Link]
**File:** 18-departments-api.md
Text stated 'The Forward Request API chapter is forthcoming'. Chapter 19 is now complete.
**Repair:** Replaced with proper link to 19-forward-requests-api.md.

### 8. Dashboard: Speculative Polling Interval Guidance [Phase 15]
**File:** 20-dashboard-api.md
Frontend notes prescribed 'a polling interval of 30-60 seconds' - speculative product guidance.
**Repair:** Removed the polling interval recommendation.

### 9. Notifications: Speculative Polling Interval Guidance [Phase 15]
**File:** 22-notifications-api.md
Frontend notes prescribed 'check for new notifications every 60 seconds' - speculative.
**Repair:** Replaced with neutral: 'No specific polling interval is enforced by the API contract.'

### 10. AI Dataset: Imprecise Ground Truth Terminology [Phase 19]
**File:** 25-ai-dataset-api.md
Used 'ground truth' for administrator-reviewed final system decisions.
**Repair:** Replaced with 'human-reviewed final system decisions.'

### 11. README: Stale Operation Counts and Section Title [Accuracy]
**File:** README.md
Reports API listed as 10 operations (12 actual); City Admin listed as 4 operations (8 actual); stale 'Future Endpoint Chapters Plan' section.
**Repair:** Updated counts, renamed section, added Final Coverage Verification table.

---

## Backend Inconsistencies Discovered

| # | Area | Current Behavior | Why Inconsistent | Documentation Treatment |
| :--- | :--- | :--- | :--- | :--- |
| 1 | average_resolution_time_hours | Returns static 0.0 placeholder in analytics CRUD for department and worker dashboards. Schema field is declared but not computed. | Field is in contract schema but always returns 0.0 regardless of actual resolution history. | Documented in Dashboard Metric Definitions table and Frontend Integration Notes. |

### Resolved Backend Inconsistencies

The following inconsistencies were fixed by the developer after this audit pass:

| # | Area | Fix Applied | Effective |
| :--- | :--- | :--- | :--- |
| R1 | `schemas/analytics.py` — `TopWorkerItem` defined twice | Removed duplicate first class definition (without `completion_rate`). Only the single correct definition with `completion_rate` remains. | 2026-07-29 |
| R2 | `POST /api/v1/auth/change-password` — missing `@limiter.limit()` decorator | Added `@limiter.limit("2 per 15 minutes")` decorator. Rate limit is now active and the `429` OpenAPI response hint is reachable. Rate Limiting reference and endpoint spec updated. | 2026-07-29 |
| R3 | `GET /api/v1/dashboard/summary` — incorrect 403 error message | Fixed `detail` string from `"You are not authorized to export feedback."` to `"You are not authorized to access the dashboard summary."` in `api/dashboard.py`. Dashboard doc updated with correct message. | 2026-07-29 |

---

## Documentation Limitations

1. Notification side-effect chains: Assignments, Resolutions, and Forward Requests chapters document notification side effects. Full trigger chain for every status combination was not exhaustively traced.
2. Email side-effect claims: Invitation and password reset flows claim to send emails. SMTP config exists but live delivery was not verified.
3. Rate limit Redis availability: SlowAPI behavior when Redis is unavailable (fail open vs fail closed) was not audited.
4. Worker available path ordering: GET /workers/available and GET /workers/{worker_id} coexist; FastAPI resolves literal paths before parameters by registration order. Behavior is currently correct.

---

## Final Verification

### Second-Pass Route Count (Independent Confirmation)

Backend scan: 3 health routes (api/routes.py) + 93 routes across 17 router files = **96 registered operations**

Documentation scan: 96 detailed endpoint sections across 18 endpoint chapters (17-super-admin-api.md has 0 dedicated endpoints by design; Super Admin role is a cross-module permission gate, not a dedicated endpoint namespace)

`
Registered backend HTTP operations: 96
Documented HTTP operations:         96
Missing documented operations:       0
Extra/stale documented operations:   0
Duplicate endpoint contracts:        0
Last verified against current repo: 2026-07-29
`

Every registered operation has exactly one canonical documented endpoint contract.
No nonexistent endpoints remain in documentation.
No duplicate contracts remain in documentation.
Two backend inconsistencies (R1, R2) were fixed by the developer subsequent to this audit and their documentation has been updated accordingly.
