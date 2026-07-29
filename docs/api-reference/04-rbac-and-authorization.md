# 04 - RBAC and Authorization

This document specifies the Authorization and Access Control conventions of the CSCRS API. 

## 1. Authentication vs. Authorization
* **Authentication:** Handled by decoding the JWT token via `get_current_user` in `authentication/dependencies.py` to verify *who* is calling.
* **Authorization:** Evaluates *what* actions that authenticated user is permitted to perform. Enforced via both role dependencies (`require_roles(...)`) and contextual, row-level check queries inside the service layer.

---

## 2. Global Role-Based Access Control (RBAC) Matrix
CSCRS enforces a strict hierarchy of five roles (`UserRole` enum). The table below lists functional-module access mappings:

| Functional Area / Endpoint Domain | Citizen | Worker | DepartmentAdmin | CityAdmin | SuperAdmin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Authentication/Session Listing** (`/api/v1/auth/sessions`) | ✔ | ✔ | ✔ | ✔ | ✔ |
| **Profile Management** (`/api/v1/profile/*`) | ✔ | ✔ | ✔ | ✔ | ✔ |
| **Submit Civic Report** (`POST /api/v1/report`) | ✔ | ❌ | ❌ | ❌ | ❌ |
| **List My Submissions** (`GET /api/v1/reports/my`) | ✔ | ❌ | ❌ | ❌ | ❌ |
| **View Report Detail** (`GET /api/v1/reports/{report_number}`) | ✔ (Own) | ❌ | ✔ (Dept)* | ✔ | ✔ |
| **Citywide Paginated Reports** (`GET /api/v1/reports`) | ❌ | ❌ | ❌ | ✔ | ✔ |
| **Department Reports** (`GET /api/v1/reports/department`) | ❌ | ❌ | ✔ (Dept)* | ❌ | ❌ |
| **Cancel/Reopen Report** (`/api/v1/reports/{report_id}/[cancel\|reopen]`) | ❌ | ❌ | ✔ (Dept)* | ❌ | ❌ |
| **Assign Worker** (`POST /api/v1/assignments`) | ❌ | ❌ | ✔ (Dept)* | ❌ | ✔ |
| **List Assigned Work** (`GET /api/v1/assignments/my`) | ❌ | ✔ | ❌ | ❌ | ❌ |
| **Start Assigned Work** (`POST /api/v1/assignments/{id}/start`) | ❌ | ✔ (Own)* | ❌ | ❌ | ❌ |
| **Submit Resolution Proof** (`POST /api/v1/resolutions`) | ❌ | ✔ (Own)* | ❌ | ❌ | ❌ |
| **Review Flagged Resolutions** (`/api/v1/resolutions/manual-review/*`) | ❌ | ❌ | ✔ (Dept)* | ❌ | ❌ |
| **Forward Department Requests** (`/api/v1/forward-requests/*`) | ❌ | ✔ (Own)* | ✔ (Dept)* | ❌ | ❌ |
| **Department Stats Dashboard** (`GET /api/v1/dashboard/department/...`) | ❌ | ❌ | ✔ (Dept)* | ❌ | ❌ |
| **Worker Personal Stats** (`GET /api/v1/dashboard/worker/...`) | ❌ | ✔ | ❌ | ❌ | ❌ |
| **Citizen Personal Stats** (`GET /api/v1/dashboard/citizen/...`) | ✔ | ❌ | ❌ | ❌ | ❌ |
| **City/Department Stats** (Other `/api/v1/dashboard/...`) | ❌ | ❌ | ❌ | ✔ | ✔ |
| **Worker Account Management** (`/api/v1/workers/*`) | ❌ | ❌ | ✔ (Dept)* | ❌ | ✔ |
| **Admins Account Management** (`/api/v1/admins/*`) | ❌ | ❌ | ❌ | ✔ | ✔ |
| **City Admins Management** (`/api/v1/city-admins/*`) | ❌ | ❌ | ❌ | ❌ | ✔ |
| **Citizen Account Blocking** (`PATCH /api/v1/city-admins/citizens/...`) | ❌ | ❌ | ❌ | ✔ | ❌ |
| **Department Management** (`/api/v1/departments/*`) | ❌ | ❌ | ❌ | ✔ | ✔ |
| **Submit System Bug/Issue** (`POST /api/v1/issues`) | ✔ | ✔ | ✔ | ✔ | ✔ |
| **Manage System Issue Tickets** (Other `/api/v1/issues/*`) | ❌ | ❌ | ❌ | ✔ | ✔ |
| **Export Detections Dataset** (`GET /api/v1/ai-dataset/export`) | ❌ | ❌ | ❌ | ❌ | ✔ |

*\*Subject to contextual/departmental boundaries (see Section 3).*

---

## 3. Contextual and Resource-Level Authorization Rules
Beyond explicit RBAC roles, the backend checks database ownership and relationship context before executing business logic:

### Resource & Assignment Ownership Checks
* **Citizens:** A Citizen can only view the details (`GET /api/v1/reports/{report_number}`) or trace the timeline (`GET /api/v1/reports/{report_id}/timeline`) of a report if they are the original submitter (`reporter_id == current_user.id`).
* **Workers:** A Worker can only start work (`POST /api/v1/assignments/{assignment_id}/start`) or submit resolution proof (`POST /api/v1/resolutions`) if the assignment record is explicitly assigned to them (`assignment.worker_id == current_user.id`).

### Spatial (Geofencing) Restrictions
* **Worker Radius Verification:** When starting an assignment via `POST /api/v1/assignments/{assignment_id}/start`, the worker must provide their current GPS coordinates (`latitude`, `longitude`).
  * The backend calculates the Haversine distance between the worker's coordinates and the reported issue coordinates.
  * If the calculated distance exceeds `START_WORK_RADIUS_METERS` (default `30` meters), access is denied, raising a `403 Forbidden` (`"Too far from location"`).

### Departmental Scoping
* **DepartmentAdmin Boundaries:**
  * **Report Management:** A DepartmentAdmin can only cancel, reopen, or view reports associated with their specific department (`report.department_id == current_user.department_id`).
  * **Worker Onboarding & Controls:** A DepartmentAdmin can only onboard (`POST /api/v1/workers`), deactivate, or block workers belonging to their department.
  * **Resolution Review:** A DepartmentAdmin can only fetch or decide upon manual resolutions flagged within their department.
  * **Dashboard Scope:** The dashboard endpoint `/api/v1/dashboard/department/dashboard` automatically injects the admin's `department_id` into database aggregate filters to restrict cross-department stats leaking.

### Forward Request Boundaries
* **Source/Destination Scoping:** When routing reports between departments:
  * A Worker can only create a forward request (`POST /api/v1/forward-requests/{report_id}`) if they are assigned to it.
  * Only a DepartmentAdmin belonging to the *source* department can approve the request (`POST /api/v1/forward-requests/{request_id}/approve`).
  * Only a DepartmentAdmin belonging to the *destination* department can accept or decline the incoming request (`POST /api/v1/forward-requests/{request_id}/accept` or `decline`).
