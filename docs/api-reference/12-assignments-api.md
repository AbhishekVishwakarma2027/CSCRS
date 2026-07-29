# Assignments API

The Assignments API manages the allocation of verified civic issue reports to municipal workers. It handles automatic workload-based dispatching, worker task queues, and geo-fenced job commencement tracking.

---

## Endpoint Summary

The Assignments controller maps exactly 3 operations under `/api/v1/assignments`:

| Method | Endpoint | Roles | Authentication | Purpose |
| :---: | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/assignments` | Department Admin, Super Admin | Bearer Access Token | Trigger automatic worker assignment for a pending report. |
| **GET** | `/api/v1/assignments/my` | Worker | Bearer Access Token | Retrieve active and historical assignments allocated to the calling worker. |
| **POST** | `/api/v1/assignments/{assignment_id}/start` | Worker | Bearer Access Token | Commences site repair work, validating worker location (30m geo-fence limit). |

---

## Assignment Enumerations

The following enums are utilized inside the Assignments module:

### `AssignmentStatus`
Defines the state of a worker allocation.

| Value | Meaning |
| :--- | :--- |
| `Assigned` | Worker has been assigned but has not started working. |
| `Accepted` | Worker accepted the task (status defined in enum but transition not directly exposed in endpoints). |
| `In Progress` | Worker has arrived at the site and started repair work. |
| `Rejected` | Worker rejected the assignment. |
| `Completed` | Work has been completed, and resolution is pending verification. |
| `Cancelled` | Assignment cancelled by administration (e.g., forwarded or cancelled report). |
| `Rework Required` | Resolution rejected; assignment reopened for work. |

---

## Internal Assignment Behavior

Auto-assignment is a central feature of the CSCRS backend. It is triggered automatically during **Report Creation** and **Report Reopening** (after administrative cancellation), but runs using the same engine as the manual assignment endpoint.

### Worker Selection & Allocation Flow:
1. **Scope Resolution:** Identifies the municipal department assigned to the report (`report.department_id`).
2. **Worker Lookup:** Searches for workers matching the target department ID who are active and marked available.
3. **Workload Analysis:** Evaluates the number of active assignments (`Assigned`, `Accepted`, `In Progress`) currently assigned to each available worker.
4. **Least Active Workload Strategy:** Allocates the assignment to the worker with the **lowest active workload**. If multiple workers have the same lowest workload, the first resolved worker in the dataset is selected.
5. **State Updates:**
   * Creates a new `Assignment` record (status: `Assigned`, `assigned_at = now()`).
   * Updates `Report.status` to `Assigned`.
   * Sends a `NEW_ASSIGNMENT` in-app notification to the selected worker.
6. **Fallback Behavior:** If no available workers exist in the department:
   * Throws `404 Not Found` with detail `"No available workers found."`.
   * The caller's transaction is completed, but `Report.status` remains `Pending`. The report must be assigned later either by re-triggering assignment or manually when a worker becomes available.

---

## Detailed Endpoint Specifications

---

## `POST /api/v1/assignments`

### Purpose
Allows an administrator to manually trigger the workload-based auto-assignment algorithm for a specific pending report. 

> [!NOTE]
> The request payload does not allow specifying a target worker ID. The allocation is resolved automatically by the workload engine.

### Roles / Authorization
* Department Admin or Super Admin roles.

### Authentication
* Bearer Access Token required.

### Headers
* `Authorization: Bearer <access_token>`
* `Content-Type: application/json`

### Path Parameters
* `Not applicable`

### Query Parameters
* `Not applicable`

### Request Body / Form Data

| Field | Type | Required | Constraints / Validation | Description |
| :--- | :--- | :---: | :--- | :--- |
| `report_id` | Integer | Yes | None | Database ID of the report to assign. |
| `remarks` | String | No | Optional, defaults to `None` | Custom notes regarding assignment instructions. |

### Validation Rules
* **Pydantic Validation:** Malformed JSON structure returns HTTP `422 Unprocessable Entity`.
* **State Verification:** Report must be in `Pending` status. Attempting to assign reports that are already assigned or inactive returns `409 Conflict`.
* **Active Assignment Verification:** If an active assignment already exists for this report, aborts with `409 Conflict`.

### Rate Limit
* `No endpoint-specific rate limit verified.`

### Business Flow
1. Authenticates administrative caller.
2. Checks report existence. If not found, throws `404`.
3. Validates that the report status is `Pending` and no active assignment exists. Throws `409` on conflict.
4. Executes the **Least Active Workload** selection strategy to resolve the best worker in the report's department.
   * If no worker is found, raises `404 Not Found` with detail `"No suitable worker found."`.
5. Creates the new `Assignment` record (status set to `Assigned`).
6. Updates `Report.status` to `Assigned`.
7. Adds audit log trace `AUTO_ASSIGNED`.
8. Dispatches in-app notification `NEW_ASSIGNMENT` to the assigned worker.
9. Commits database changes and returns the serialized assignment metadata.

### Success Response
* **HTTP Status:** `201 Created`
* **Response Model:** `AssignmentResponse`

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Database key of the assignment. |
| `report_id` | Integer | ID of the linked report. |
| `worker_id` | Integer | ID of the assigned worker. |
| `assigned_by` | Integer | User ID of the assigning administrator. |
| `assigned_at` | DateTime | Timestamp of assignment. |
| `accepted_at` | DateTime \| null | Timestamp of worker acceptance (if any). |
| `completed_at` | DateTime \| null | Timestamp of work completion. |
| `status` | String | Initial status (`Assigned`). |
| `remarks` | String \| null | Custom assignment instructions. |

### Example Success Response
```json
{
  "id": 142,
  "report_id": 92,
  "worker_id": 18,
  "assigned_by": 2,
  "assigned_at": "2026-07-28T15:10:00.123456Z",
  "accepted_at": null,
  "completed_at": null,
  "status": "Assigned",
  "remarks": "Please expedite; high traffic area."
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **403** | Caller role is not authorized (e.g. Citizen). | `{"detail": "Permission denied."}` |
| **404** | Report ID does not exist. | `{"detail": "Report not found."}` |
| **404** | No suitable worker exists in the department. | `{"detail": "No suitable worker found."}` |
| **409** | Report status is not Pending. | `{"detail": "Cannot assign report with status 'Assigned'."}` |
| **409** | Report is already assigned. | `{"detail": "Report is already assigned."}` |
| **422** | Missing required parameters. | `{"detail": [{"loc": ["body", "report_id"], "msg": "field required", "type": "value_error.missing"}]}` |

### Possible HTTP Status Codes
* `201`, `401`, `403`, `404`, `409`, `422`

### Database / State Changes
* Creates a new `Assignment` record.
* Updates `status` in the target Report record to `Assigned`.
* Appends audit log trace and notifications.

### Related APIs
* [GET /api/v1/assignments/my](#get-apiv1assignmentsmy)

---

## `GET /api/v1/assignments/my`

### Purpose
Retrieves a list of all active and completed task assignments assigned to the calling worker.

### Roles / Authorization
* Worker role only.

### Authentication
* Bearer Access Token required.

### Headers
* `Authorization: Bearer <access_token>`

### Path Parameters
* `Not applicable`

### Query Parameters
* `Not applicable`

### Request Body / Form Data
* `Not applicable`

### Validation Rules
* Access token signature verification.
* Active worker profile verification.

### Rate Limit
* `No endpoint-specific rate limit verified.`

### Business Flow
1. Authenticates worker user.
2. Queries database for all assignments matching worker ID.
3. For each assignment:
   * Normalizes image path forward slashes and returns it.
   * Generates a Google Maps navigation URL using the report's coordinates: `https://www.google.com/maps?q={latitude},{longitude}`.
4. Returns matching elements collection.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `list[WorkerAssignmentResponse]`

| Field | Type | Description |
| :--- | :--- | :--- |
| `assignment_id` | Integer | ID of the assignment. |
| `report_id` | Integer | ID of the report. |
| `issue_type` | String | Classification of issue. |
| `description` | String \| null | Report description text. |
| `priority` | String | Serialized priority string. |
| `status` | String | Serialized assignment status string. |
| `address` | String \| null | Calculated address of issue. |
| `latitude` | Float \| null | Latitude coordinate. |
| `longitude` | Float \| null | Longitude coordinate. |
| `google_maps_url` | String | Formatted Google Maps redirect string. |
| `image_url` | String \| null | URL path to issue photo. |
| `assigned_at` | DateTime | Timestamp of assignment allocation. |
| `work_started_at` | DateTime \| null | Timestamp of work commencement. |

### Example Success Response
```json
[
  {
    "assignment_id": 142,
    "report_id": 92,
    "issue_type": "Road Damage",
    "description": "Large pothole in center lane.",
    "priority": "High",
    "status": "Assigned",
    "address": "42 Main St, Bangalore, India",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "google_maps_url": "https://www.google.com/maps?q=12.9716,77.5946",
    "image_url": "/uploads/8e9a2b1c4d7e6f8a.jpeg",
    "assigned_at": "2026-07-28T15:10:00.123456Z",
    "work_started_at": null
  }
]
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **403** | Caller is not a worker. | `{"detail": "Permission denied."}` |

### Possible HTTP Status Codes
* `200`, `401`, `403`

### Database / State Changes
* `No persistent state change`

### Related APIs
* [POST /api/v1/assignments/{assignment_id}/start](#post-apiv1assignmentsassignment_idstart)

---

## `POST /api/v1/assignments/{assignment_id}/start`

### Purpose
Allows an assigned worker to signal that they have arrived on site and are commencing repair work.

> [!IMPORTANT]
> This endpoint enforces a geo-fence constraint. The worker must be within **30 meters** of the report coordinate location to start work.

### Roles / Authorization
* Worker role only. Access restricted to the worker assigned to this specific task.

### Authentication
* Bearer Access Token required.

### Headers
* `Authorization: Bearer <access_token>`
* `Content-Type: application/json`

### Path Parameters

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `assignment_id` | Integer | Yes | Database ID of the assignment. |

### Query Parameters
* `Not applicable`

### Request Body / Form Data

| Field | Type | Required | Constraints / Validation | Description |
| :--- | :--- | :---: | :--- | :--- |
| `latitude` | Float | Yes | Valid latitude range | Current GPS latitude of worker device. |
| `longitude` | Float | Yes | Valid longitude range | Current GPS longitude of worker device. |

### Validation Rules
* **Pydantic Validation:** Missing or invalid coordinate types returns `422`.
* **Ownership Check:** The assignment's `worker_id` must match the caller's ID. If mismatched, returns `403 Forbidden`.
* **State Check:** The assignment status must not be `In Progress` (cannot double-commence). Returns `409 Conflict`.
* **Geo-fence Validation:** Calculates distance (using Haversine) between client coordinates (`latitude`, `longitude`) and report coordinates. If distance exceeds **30.0 meters** (`START_WORK_RADIUS_METERS`), returns `403 Forbidden` detailing the current distance.

### Rate Limit
* `No endpoint-specific rate limit verified.`

### Business Flow
1. Authenticates worker and decodes coordinates.
2. Checks assignment database existence. Throws `404` if not found.
3. Checks ownership. If caller is not the assigned worker, raises `403`.
4. Checks if status is already `In Progress`. If yes, raises `409`.
5. Evaluates distance between caller and report location. If distance exceeds 30m, throws `403` with current distance.
6. Updates `Assignment.status` to `In Progress`.
7. Sets `work_started_at = now()`, `work_started_latitude = latitude`, and `work_started_longitude = longitude`.
8. Updates `Report.status` to `In Progress`.
9. Logs audit action `WORK_STARTED`.
10. Dispatches in-app notification `WORK_STARTED` to the citizen who created the report.
11. Commits changes and returns updated assignment schema.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `StartWorkResponse`

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Database key of the assignment. |
| `report_id` | Integer | ID of the linked report. |
| `worker_id` | Integer | ID of the worker. |
| `assigned_by` | Integer | ID of the assigning administrator. |
| `assigned_at` | DateTime | Timestamp of assignment allocation. |
| `accepted_at` | DateTime \| null | Timestamp of worker acceptance (if any). |
| `completed_at` | DateTime \| null | Timestamp of work completion. |
| `work_started_at` | DateTime | Timestamp of work commencement. |
| `work_started_latitude` | Float | GPS latitude recorded at commencement. |
| `work_started_longitude` | Float | GPS longitude recorded at commencement. |
| `status` | String | Updated status (`In Progress`). |
| `remarks` | String \| null | Custom assignment instructions. |

### Example Success Response
```json
{
  "id": 142,
  "report_id": 92,
  "worker_id": 18,
  "assigned_by": 2,
  "assigned_at": "2026-07-28T15:10:00.123456Z",
  "accepted_at": null,
  "completed_at": null,
  "work_started_at": "2026-07-28T15:35:10.123456Z",
  "work_started_latitude": 12.971625,
  "work_started_longitude": 77.594631,
  "status": "In Progress",
  "remarks": "Please expedite; high traffic area."
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **403** | Worker is not assigned to this assignment. | `{"detail": "You are not assigned to this report."}` |
| **403** | Geo-fence limits violated (distance > 30m). | `{"detail": "You are not at the report location. Current distance: 45.32 meters."}` |
| **404** | Assignment ID does not exist. | `{"detail": "Assignment not found."}` |
| **409** | Work has already been started. | `{"detail": "Work already started."}` |
| **422** | Invalid coordinates format. | `{"detail": [{"loc": ["body", "latitude"], "msg": "value is not a valid float", "type": "type_error.float"}]}` |

### Possible HTTP Status Codes
* `200`, `401`, `403`, `404`, `409`, `422`

### Database / State Changes
* Updates assignment status, commencement timestamps, and GPS coordinates.
* Shifts linked Report status to `In Progress`.
* Adds audit log trace and citizen notification entry.

### Frontend Integration Notes
* The frontend must acquire precise GPS location coordinates from the device location sensor before calling this endpoint.
* Prompt workers to refresh their dashboard list when starting work to load status transitions correctly.

### Related APIs
* [GET /api/v1/assignments/my](#get-apiv1assignmentsmy)
* [POST /api/v1/resolutions](13-resolutions-api.md) _(Note: Resolutions are uploaded following task completion)_
