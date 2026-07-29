# Timeline API

The Timeline API provides a read-only, chronological history of report status transitions and operational milestones. It translates internal system audit logs into user-friendly milestone updates to help citizens track the lifecycle progress of their submitted civic reports.

---

## Endpoint Summary

The Timeline controller exposes exactly **1 operation** under `/api/v1/reports`:

| Method | Endpoint | Roles | Scope | Purpose |
| :---: | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/reports/{report_id}/timeline` | Citizen | Owner | Retrieve the chronological milestone timeline for a citizen's own report. |

---

## Timeline Data Sources

* **Source Database Tables:** Timeline entries are constructed dynamically by joining the core `Report` table with the `AuditLog` table:
  * **Report Information:** Supplies the `id`, `report_number`, and current `status`.
  * **Audit Log Records:** Supplies the list of historical action log records matching the `report_id`.
* **Dynamic Filtering:** The service does **not** expose raw audit log records directly. Instead, it reads the `action` field from the audit log, filters for events mapped in `EVENT_MAPPING`, and translates the action code into citizen-facing `title` and `description` strings.
* **No Dedicated Table:** There is no dedicated `timeline` table in the database; it is constructed on-demand from audit logs.

---

## Timeline Events

Only the following audit log action codes are exposed as timeline events to the citizen client:

| Event / Action | Trigger | Actor | Meaning |
| :--- | :--- | :--- | :--- |
| `REPORT_CREATED` | Citizen submits report | Citizen | **Report Submitted:** "Your report has been submitted successfully." |
| `AUTO_ASSIGNED` | Auto-assignment logic dispatches worker | System | **Worker Assigned:** "A field worker has been assigned." |
| `WORK_STARTED` | Worker begins repair work | Worker | **Work Started:** "Repair work has started." |
| `REPORT_COMPLETED` | Worker completes repairs | Worker | **Issue Resolved:** "The civic issue has been resolved." |
| `FORWARD_SENT_TO_DESTINATION` | Source Admin routes report to new department | Source Admin | **Report Forwarded:** "Your report has been forwarded to another department for review." |
| `REPORT_ACCEPTED_BY_DESTINATION` | Destination Admin accepts forwarded report | Destination Admin | **Forward Request Accepted:** "The destination department accepted your report." |
| `REPORT_RETURNED_TO_SOURCE` | Destination Admin declines forwarding request | Destination Admin | **Returned to Source Department:** "The destination department declined the request. The report has been returned to the source department." |
| `FORWARDED_WORKER_ASSIGNED` | Destination Admin auto-assigns local worker | System | **New Worker Assigned:** "A new worker from the destination department has been assigned." |
| `REPORT_CANCELLED_BY_DEPARTMENT` | Department cancels report | Admin | **Report Cancelled:** "Department cancelled this report after review." |
| `REPORT_REOPENED` | Department Admin reopens resolved report | Admin | **Report Reopened:** "Department reopened this report." |

* **Internal Exclusions:** Internal actions (e.g. `FORWARD_REQUEST_CREATED`, `FORWARD_REQUEST_REJECTED`, `ASSIGNMENT_CREATED`, `ASSIGNMENT_CANCELLED`, `VERIFICATION_PIPELINE_PASSED`) do not appear on the citizen's timeline.

---

## Timeline Visibility

The timeline endpoint is strictly restricted to ensure citizen privacy:

| Role | Required Relationship | Access |
| :--- | :--- | :---: |
| **Citizen** | Creator / Owner of the target report (`report.citizen_id == current_user.id`) | **Allowed** |
| **Citizen** | Not the owner of the report | **Forbidden (403)** |
| **Worker** | Mapped assignment or department | **Forbidden (403)** |
| **Department Admin** | Admin of target department | **Forbidden (403)** |
| **City Admin / Super Admin** | Global scope | **Forbidden (403)** |

* *Note:* While administrators can view general report updates via Administrative APIs, they cannot call this specific timeline GET route due to `require_citizen()` dependency enforcement.

---

## Timeline vs Audit Log

* **Audit Logs** contain raw, technical event logs (including user IDs, internal status toggles, machine pipeline outcomes, and administrative transitions) intended for system auditing.
* **Timeline Events** represent a highly filtered, curated subset of the audit logs translated into plain, user-friendly language. No internal user IDs or database IDs of actors are exposed.

---

## Timeline Read-Only Semantics

`No persistent state changes are performed by Timeline API operations.`
The GET endpoint performs database selection only.

---

## Detailed Endpoint Specifications

---

## `GET /api/v1/reports/{report_id}/timeline`

### Purpose
Retrieves the chronological milestone timeline for a citizen's own report.

### Roles / Authorization
* Citizen role only. The calling citizen must be the owner of the report.

### Authentication
* Bearer Access Token required.

### Headers
* `Authorization: Bearer <access_token>`

### Path Parameters

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `report_id` | Integer | Yes | Database ID of the report. |

### Query Parameters
* `Not applicable`

### Request Body / Form Data
* `Not applicable`

### Validation Rules
* **Ownership Verification:** Validates that `report.citizen_id == current_user.id`. Raises `403 Forbidden` if it does not match.
* **Existence Verification:** Throws `404 Not Found` if the report does not exist.

### Rate Limit
* `No endpoint-specific rate limit verified.`

### Business Flow
1. Authenticates current user as a Citizen.
2. Retrieves report details matching `report_id`.
3. Verifies ownership. Throws `403` on mismatch.
4. Queries all audit log entries for `report_id`, ordered chronologically ascending (`AuditLog.created_at.asc()`).
5. Iterates log records, mapping matching `action` codes to milestone strings.
6. Returns the consolidated timeline payload.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `TimelineResponse`

| Field | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `report_id` | Integer | No | Database ID of the report. |
| `report_number` | String | No | Unique report tracking identifier. |
| `status` | String | No | Current report status string. |
| `timeline` | List | No | List of chronological events. |
| `timeline[].title` | String | No | Citizen-facing title of milestone. |
| `timeline[].description` | String | No | Summary detailing the event status. |
| `timeline[].created_at` | DateTime | No | Timestamp of the log occurrence. |

### Example Success Response
```json
{
  "report_id": 92,
  "report_number": "REP-2026-0103",
  "status": "Assigned",
  "timeline": [
    {
      "title": "Report Submitted",
      "description": "Your report has been submitted successfully.",
      "created_at": "2026-07-28T16:00:00Z"
    },
    {
      "title": "Worker Assigned",
      "description": "A field worker has been assigned.",
      "created_at": "2026-07-28T16:10:00Z"
    }
  ]
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **403** | Caller citizen is not the owner of the report. | `{"detail": "Access denied."}` |
| **404** | Report ID does not exist in database. | `{"detail": "Report not found."}` |

### Possible HTTP Status Codes
* `200`, `401`, `403`, `404`

---

## Frontend Integration Notes

* **Chronological Rendering:** The API returns timeline events sorted ascending (oldest first). Frontend client views can render this as a vertical progress track starting from the top down.
* **Static Label Translation:** Do not write custom text translations in frontend code. The backend already supplies pre-translated, user-friendly `title` and `description` strings suited directly for UI display.
* **Auto-refresh Trigger:** Call this endpoint to refresh the timeline after receiving a real-time status update notification or completing manual user re-submissions.
