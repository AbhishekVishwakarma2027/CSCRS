# CSCRS API Reference Documentation Index

Welcome to the official **Citizen Suggestion & Complaint Resolution System (CSCRS)** API Reference. This documentation serves as the authoritative, implementation-grounded guide for consuming and integrating with the CSCRS backend API.

## What This Documentation Covers
This documentation covers the core architectural foundation, global API conventions, authentication lifecycles, role-based access control (RBAC), error schemas, file upload rules, rate limits, and pagination contracts of the CSCRS REST API. 

## Intended Audience
* **Frontend Web Developers:** Consuming the API for citizen portals and administrative dashboards.
* **Mobile Developers:** Integrating mobile applications for field workers and citizens.
* **AI Coding Agents:** Programmatically discovering schemas, parameters, and workflows to automate integration or feature additions.
* **QA Engineers & Test Automation:** Mapping status codes, error payloads, and input requirements.
* **Backend Developers & Maintainers:** Onboarding, troubleshooting, and extending the API surface.

## Source-of-Truth Policy
All documentation in this reference is directly derived from the active FastAPI backend implementation. 
* **Authoritative Source:** The Python source code (`api/`, `services/`, `utils/`, `database/`) is the ultimate source of truth.
* **No Cache Policy:** Stale documentation, legacy diagrams, or cached specs must never override the actual code behavior.
* **Resolved Anomalies:** The routing system has been audited, and duplicate routing prefixes (such as the historical `/api/v1/api/v1/` nested router registration bug) have been fully resolved. All versioned routes are mapped directly under a single `/api/v1` prefix.

## API Base Paths & Versioning
* **Root Probes (Unversioned):** `/health`, `/liveness`, and `/readiness` are mounted directly at the root.
* **Versioned API surface:** All application operations are prefixed with `/api/v1` (e.g., `/api/v1/auth/login`, `/api/v1/reports`).

## Documentation Navigation
The foundation of the API is divided into the following chapters:
1. **[00-introduction.md](00-introduction.md):** Introduction to CSCRS, core actors, high-level capabilities, and the report lifecycle.
2. **[01-architecture-overview.md](01-architecture-overview.md):** Layered backend layout, request lifecycle, AI pipeline, and notification integrations.
3. **[02-api-conventions.md](02-api-conventions.md):** Global HTTP conventions, serialization formats, identifier formats, and common data-types.
4. **[03-authentication-overview.md](03-authentication-overview.md):** JWT authentication model, token lifetimes, login lockout rules, session management, and password recovery.
5. **[04-rbac-and-authorization.md](04-rbac-and-authorization.md):** Explicit roles matrix, user scopes, spatial constraints, and departmental boundaries.
6. **[05-response-and-error-handling.md](05-response-and-error-handling.md):** Serialization envelopes, HTTP error codes, validation errors, and custom exception schemas.
7. **[06-file-and-image-uploads.md](06-file-and-image-uploads.md):** Rules for multipart data, file validators, MIME checks, magic-byte matching, and size limitations.
8. **[07-rate-limiting.md](07-rate-limiting.md):** SlowAPI decorators, keying strategy (authenticated user fallback to IP), and Redis storage constraints.
9. **[08-pagination-filtering-sorting.md](08-pagination-filtering-sorting.md):** List filtering query parameters, search formats, and pagination pagination metadata envelopes.
10. **[09-authentication-api.md](09-authentication-api.md):** Detailed endpoint specifications for all 13 Authentication API operations.
11. **[10-profile-api.md](10-profile-api.md):** Detailed endpoint specifications for all 4 Profile API operations.
12. **[11-reports-api.md](11-reports-api.md):** Detailed endpoint specifications for all 12 Reports API operations (10 CRUD + 2 PDF download operations).
13. **[12-assignments-api.md](12-assignments-api.md):** Detailed endpoint specifications for all 3 Assignments API operations.
14. **[13-resolutions-api.md](13-resolutions-api.md):** Detailed endpoint specifications for all 5 Resolutions API operations.
15. **[14-workers-api.md](14-workers-api.md):** Detailed endpoint specifications for all 6 Workers API operations.
16. **[15-department-admin-api.md](15-department-admin-api.md):** Detailed endpoint specifications for all 2 Department Admin API operations.
17. **[16-city-admin-api.md](16-city-admin-api.md):** Detailed endpoint specifications for all 8 City Admin API operations.
18. **[17-super-admin-api.md](17-super-admin-api.md):** High-level overview of Super Admin role permissions and cross-module administrative authority.
19. **[18-departments-api.md](18-departments-api.md):** Detailed endpoint specifications for all 5 Departments API operations.
20. **[19-forward-requests-api.md](19-forward-requests-api.md):** Detailed endpoint specifications for all 8 Forward Requests API operations.
21. **[20-dashboard-api.md](20-dashboard-api.md):** Detailed endpoint specifications for all 14 Dashboard API operations.
22. **[21-timeline-api.md](21-timeline-api.md):** Detailed endpoint specifications for the Report Timeline API operation.
23. **[22-notifications-api.md](22-notifications-api.md):** Detailed endpoint specifications for all 4 In-App Notifications API operations.
24. **[23-feedback-api.md](23-feedback-api.md):** Detailed endpoint specifications for all 2 Feedback API operations.
25. **[24-system-issues-api.md](24-system-issues-api.md):** Detailed endpoint specifications for all 5 System Issues API operations.
26. **[25-ai-dataset-api.md](25-ai-dataset-api.md):** Detailed endpoint specifications for the AI Dataset Export API operation.
27. **[26-health-api.md](26-health-api.md):** Detailed endpoint specifications for the health, liveness, and readiness API operations.

## Completed Endpoint Chapters Map
All 96 registered HTTP operations in the CSCRS backend have been fully documented across 18 endpoint chapters:
* `/api/v1/auth/*` — Authentication (see [09-authentication-api.md](09-authentication-api.md), 13 operations)
* `/api/v1/profile/*` — User Profile (see [10-profile-api.md](10-profile-api.md), 4 operations)
* `/api/v1/report` + `/api/v1/reports/*` — Core Suggestion/Complaint Management + PDF Downloads (see [11-reports-api.md](11-reports-api.md), 12 operations)
* `/api/v1/assignments/*` — Work Allocation (see [12-assignments-api.md](12-assignments-api.md), 3 operations)
* `/api/v1/resolutions/*` — Verification & Resolution Uploads (see [13-resolutions-api.md](13-resolutions-api.md), 5 operations)
* `/api/v1/workers/*` — Worker Management (see [14-workers-api.md](14-workers-api.md), 6 operations)
* `/api/v1/admins/*` — Department Admin Management (see [15-department-admin-api.md](15-department-admin-api.md), 2 operations)
* `/api/v1/city-admins/*` — City Admin + Citizen/Dept-Admin Blocking (see [16-city-admin-api.md](16-city-admin-api.md), 8 operations)
* `Super Admin` — Global administrative authority (see [17-super-admin-api.md](17-super-admin-api.md))
* `/api/v1/departments/*` — Department Configurations (see [18-departments-api.md](18-departments-api.md), 5 operations)
* `/api/v1/forward-requests/*` — Inter-departmental Routing (see [19-forward-requests-api.md](19-forward-requests-api.md), 8 operations)
* `/api/v1/dashboard/*` — Dashboard Statistics & Metrics (see [20-dashboard-api.md](20-dashboard-api.md), 14 operations)
* `/api/v1/reports/{report_id}/timeline` — Report History Timeline (see [21-timeline-api.md](21-timeline-api.md), 1 operation)
* `/api/v1/notifications/*` — In-App Notifications (see [22-notifications-api.md](22-notifications-api.md), 4 operations)
* `/api/v1/feedback/*` — App Feedback (see [23-feedback-api.md](23-feedback-api.md), 2 operations)
* `/api/v1/issues/*` — System Issue Reports (see [24-system-issues-api.md](24-system-issues-api.md), 5 operations)
* `/api/v1/ai-dataset/*` — Detections Datasets Export (see [25-ai-dataset-api.md](25-ai-dataset-api.md), 1 operation)
* Root status/diagnostics — Health, liveness, and readiness (see [26-health-api.md](26-health-api.md), 3 operations)

## API Coverage Verification

This documentation has been fully audited and reconciled via a two-pass route scan against the live backend. See [API_DOCUMENTATION_AUDIT.md](API_DOCUMENTATION_AUDIT.md) for the complete audit trail, all repairs, and backend inconsistency log.

```
Registered backend HTTP operations: 96
Documented HTTP operations:         96
Missing:                             0
Extra/stale:                         0
Duplicate contracts:                 0
Last verified against current repository: 2026-07-29
```

| Metric | Value |
| :--- | :---: |
| Total Registered Backend Routes | **96** |
| Fully Documented Routes | **96** |
| Missing Operations | **0** |
| Extra / Stale Operations | **0** |
| Duplicate Contracts | **0** |
| Coverage | **100%** |
| Repairs Made (this audit pass) | **11** |
| Backend Inconsistencies Found | **4** |

## How Consumers Should Use This Reference
* **Authenticating Requests:** Always acquire an access token via `/api/v1/auth/login` and pass it in the `Authorization: Bearer <token>` header for all authenticated routes.
* **Reading JSON Keys:** Case-sensitivity is strictly preserved. Pay close attention to underscored snake_case identifiers (e.g., `assignment_id`, `issue_number`) and standard UTC timestamp strings.
* **Error Handling:** Anticipate both standard FastAPI validation errors (422) and logical HTTPExceptions (400, 401, 403, 404, 409, 413, 423, 429) as described in the response and error handling guide.
