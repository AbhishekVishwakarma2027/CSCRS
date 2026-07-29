# 02 - API Conventions

This document outlines the global conventions, protocol configurations, data formats, and structural expectations of the CSCRS REST API.

## 1. Network & Routing Conventions
* **Base API Version Path:** `/api/v1` (e.g., `/api/v1/auth/login`, `/api/v1/reports`).
* **Root Health Endpoints (Unversioned):** Three diagnostics endpoints bypass the `/api/v1` prefix to ease infrastructure load balancer probing:
  * `GET /health` — Simple health check return (API status, version, and server UTC ISO timestamp).
  * `GET /liveness` — Container heartbeat monitoring.
  * `GET /readiness` — Evaluates service readiness by executing a raw query check (`SELECT 1`) on the SQL database connection. Returns `503 Service Unavailable` with `{"status": "not_ready", "database": "disconnected"}` if the database is unreachable.

## 2. HTTP Method Semantics
The API strictly adheres to REST HTTP verb standards:
* `GET` — Read resource state or query collections. Safe and idempotent.
* `POST` — Create new resource entities (e.g., register citizens, create forward requests) or trigger non-idempotent action pipelines (e.g. login, verify email).
* `PATCH` — Apply partial modifications to a resource (e.g., update profile, block a citizen, change status).
* `DELETE` — Remove resources (e.g., delete profile photo).

## 3. Request Encoding & Content-Types
The API supports three request encodings, which are strictly validated by the FastAPI input deserializer:
1. **JSON Body (`application/json`):** Used by default for structured payload inputs (e.g., `UserCreate`, `UpdateProfileRequest`, `ForgotPasswordRequest`).
2. **Form Urlencoded (`application/x-www-www-form-urlencoded`):** Specifically required by the standard OAuth2 login endpoint (`POST /api/v1/auth/login`) which consumes credentials via `OAuth2PasswordRequestForm`.
3. **Multipart Form (`multipart/form-data`):** Mandated for endpoints processing binary file uploads along with secondary form fields:
  * `POST /api/v1/report` (Submit report: image file + optional description)
  * `POST /api/v1/resolutions` (Submit resolution: image file + assignment ID + optional remarks)
  * `POST /api/v1/profile/photo` (Upload profile image)
  * `POST /api/v1/issues` (Report system issue: single attachments file + title + description + category + optional related report number)

## 4. Header Conventions
* **Authorization:** Authenticated routes require a standard Bearer authentication header:
  ```http
  Authorization: Bearer <JWT_Access_Token>
  ```
* **Content-Type:** API request payloads must carry the appropriate header (e.g. `application/json`) matching the endpoint's deserialization signature. Responses are delivered with `application/json` by default (except for PDF download streams which return `application/pdf`).

## 5. System Identifiers & Document Numbers
The system handles three formats for identifying records:
* **Database Primary Keys (IDs):** Numeric integers (e.g., user ID, assignment ID) used for path routing (e.g. `/api/v1/assignments/{assignment_id}`).
* **Report Numbers:** Geocoded public identifiers formatted as:
  ```
  CSCRS-YYYYMMDD-XXXXXXXX
  ```
  Where `YYYYMMDD` is the UTC creation date and `XXXXXXXX` is an 8-character uppercase random hexadecimal string (e.g., `CSCRS-20260728-9F3A4B2C`). Used in `/api/v1/reports/{report_number}`.
* **System Issue Numbers:** Public system bug tickets formatted as:
  ```
  ISS-YYYYMMDD-XXXXXXXX
  ```
  Where `YYYYMMDD` is the UTC creation date and `XXXXXXXX` is an 8-character uppercase random hexadecimal string. Used in `/api/v1/issues/{issue_number}`.

## 6. Datetime Representation
* All datetime values returned in API payloads are formatted as **ISO 8601 UTC timestamp strings** (e.g. `2026-07-28T14:19:20.123456+00:00` or `2026-07-28T14:19:20Z`).
* DateTime comparisons and database timestamps are computed using the UTC timezone.

## 7. Enum Serialization
Enums are serialized as strings. The following naming conventions are enforced:
* **User Roles (`UserRole`):** PascalCase strings (`Citizen`, `Worker`, `DepartmentAdmin`, `CityAdmin`, `SuperAdmin`).
* **Report Status (`ReportStatus`):** Title Case or Spaced Title Case strings (`Pending`, `Assigned`, `In Progress`, `Resolved`, `Verified`, `Closed`, `Cancelled`, `Rejected`).
* **Assignment Status (`AssignmentStatus`):** Title Case or Spaced Title Case strings (`Assigned`, `Accepted`, `In Progress`, `Rejected`, `Completed`, `Cancelled`, `Rework Required`).
* **System Issue Status (`SystemIssueStatus`):** UPPERCASE snake_case strings (`OPEN`, `IN_REVIEW`, `RESOLVED`, `REJECTED`).
* **System Issue Category (`SystemIssueCategory`):** Spaced Title Case strings (e.g. `Authentication`, `Report Submission`, `Resolution Upload`, `GPS / EXIF`).
* **Forward Reasons (`ForwardReasonType`):** UPPERCASE snake_case strings (`WRONG_AI_CLASSIFICATION`, `WRONG_CITIZEN_CATEGORY`, `ADMINISTRATIVE_TRANSFER`, `DUPLICATE_DEPARTMENT`, `OTHER`).
* **Block Types (`BlockType`):** UPPERCASE snake_case strings (`RETIRED`, `TRANSFERRED`, `SUSPENDED`, `TERMINATED`, `DISMISSED`).

## 8. Query and Path Parameters
* **Path Parameters:** Used strictly for locating a unique resource instance by ID, public number, or reference (e.g. `{report_id}`, `{issue_number}`).
* **Query Parameters:** Utilized for collection pagination limits, text search criteria, and collection filtering (e.g. `?page=1&page_size=20&status=Pending`).

## 9. Global Request Validation
All endpoints built with Pydantic schemas enforce type strictness. Passing an incorrect data type, missing a required field, or failing boundaries (e.g. sending a page number less than 1 or a file exceeding 10MB) immediately triggers validation failures. Details of validation schemas and error structures are documented in the [Response & Error Handling Guide](05-response-and-error-handling.md).
