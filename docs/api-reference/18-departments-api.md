# Departments API

The Departments API manages the municipal departments configured in the CSCRS (such as Sanitation, Roads, Drainage, etc.). Departments serve as the routing nodes for civic issue report matching, administrative boundaries for Department Admins, and structural queues for field technicians.

---

## Endpoint Summary

The Departments controller maps exactly 5 operations under `/api/v1/departments`:

| Method | Endpoint | Roles | Authentication | Purpose |
| :---: | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/departments` | Super Admin | Bearer Access Token | Create a new municipal department in the system. |
| **GET** | `/api/v1/departments` | Super Admin, City Admin | Bearer Access Token | Retrieve a list of all registered municipal departments. |
| **GET** | `/api/v1/departments/{department_id}` | Super Admin, City Admin | Bearer Access Token | Retrieve detailed metadata for a specific department. |
| **PATCH** | `/api/v1/departments/{department_id}/activate` | Super Admin, City Admin | Bearer Access Token | Activate a deactivated department. |
| **PATCH** | `/api/v1/departments/{department_id}/deactivate` | Super Admin, City Admin | Bearer Access Token | Deactivate an active department. |

---

## Department Data Model

The Department record contains the following API-exposed properties:

| Field | Type | Accepted on Input | Returned in Response | Description |
| :--- | :--- | :---: | :---: | :--- |
| `id` | Integer | No | Yes | Database primary key of the department. |
| `name` | String | Yes (min 2, max 100) | Yes | Unique name of the municipal department. |
| `description` | String | Yes (max 255) | Yes | Optional text description (defaults to `None`). |
| `is_active` | Boolean | No | Yes | Flag indicating active status (defaults to `true`). |
| `created_at` | DateTime | No | Yes | Timestamp of department creation. |

---

## Issue Routing and Department Mapping

Civic issues submitted by citizens are routed to departments based on a static mapping configuration:
* **Static Mapping Definition:** The mapping is statically defined in `configs/department_mapping.py` rather than managed dynamically via administrative APIs:
  * `"Garbage"` $\rightarrow$ `"Sanitation"`
  * `"Road Damage"` $\rightarrow$ `"Roads"`
  * `"Manhole"` $\rightarrow$ `"Roads"`
  * `"Waterlogging"` $\rightarrow$ `"Drainage"`
  * `"Damage Electric Pole"` $\rightarrow$ `"Electricity"`
  * `"Damage Street Light"` $\rightarrow$ `"Street Lighting"`
* **Auto-Routing Process:** During report submission, the `resolve()` service method maps the report's `issue_type` to resolve the corresponding database `Department` record. If a mapping cannot be resolved or is missing from the database, the API returns a validation error. Refer to [Reports API Reference](11-reports-api.md) for submission details.

---

## Deactivation Semantics

CSCRS does **not** expose a delete (physical hard delete or soft delete) endpoint for departments. Instead, state control is managed through activation and deactivation:
* **Idempotent Toggle:** The `deactivate` endpoint sets `is_active = False` in the database.
* **No Integrity Checks:** The deactivation service does **not** check for linked active reports, assigned workers, or department admins. Deactivating a department does not clear relations, but may prevent new reports matching its mapping from being created if validation checks enforce active status.

---

## Department Relationships

### 1. Workers
* A worker profile is associated with exactly one department via `WorkerProfile.department_id`.
* The auto-assignment engine queries workers scoped to the report's resolved department. Refer to [Workers API Reference](14-workers-api.md) and [Assignments API Reference](12-assignments-api.md) for details.

### 2. Department Admins
* Department Admins are mapped directly via `User.department_id` on the core User record.
* Multiple admins can belong to the same department. Scopes restrict admin access to reports, worker assignments, and manual reviews matching their own `department_id`. Refer to [Department Admin API Reference](15-department-admin-api.md).

### 3. Forwarding
* Reports can be forwarded between departments to resolve routing errors. The forwarding history details department switches. See the [Forward Requests API](19-forward-requests-api.md) for full endpoint specifications.

---

## Department Enumerations

No specific enums are exposed by these operations.

---

## Detailed Endpoint Specifications

---

## `POST /api/v1/departments`

### Purpose
Allows a Super Admin to create a new municipal department in the system.

### Roles / Authorization
* Super Admin role only.

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
| `name` | String | Yes | `min_length=2`, `max_length=100` | Name of the municipal department. |
| `description` | String | No | Max length 255 | Optional description detail. |

### Validation Rules
* **Pydantic Validation:** Malformed structures or parameter lengths return `422 Unprocessable Entity`.
* **Uniqueness Check:** Name check is case-sensitive and stripped of whitespace. Duplicate department names return `400 Bad Request`.

### Rate Limit
* `No endpoint-specific rate limit verified.`

### Business Flow
1. Authenticates Super Admin caller.
2. Checks if a department with the same name already exists in the database. Throws `400` on conflict.
3. Creates a new `Department` record: `is_active` defaults to `True`.
4. Commits the transaction and returns the serialized department details.

### Success Response
* **HTTP Status:** `201 Created`
* **Response Model:** `DepartmentResponse`

### Example Success Response
```json
{
  "id": 6,
  "name": "Street Lighting",
  "description": "Street lights, electrical repairs, and safety poles.",
  "is_active": true,
  "created_at": "2026-07-28T16:00:00.123456Z"
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **400** | Department name already exists. | `{"detail": "Department already exists."}` |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **403** | Caller is not Super Admin. | `{"detail": "Permission denied."}` |
| **422** | Name is too short or too long. | `{"detail": [{"loc": ["body", "name"], "msg": "ensure this value has at least 2 characters", "type": "value_error.any_str.min_length"}]}` |

### Possible HTTP Status Codes
* `201`, `400`, `401`, `403`, `422`

---

## `GET /api/v1/departments`

### Purpose
Retrieves a list of all registered municipal departments.

### Roles / Authorization
* Super Admin or City Admin roles.

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

### Business Flow
1. Authenticates caller role.
2. Retrieves all department records from the database.
3. Returns list collections.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `list[DepartmentResponse]`

### Example Success Response
```json
[
  {
    "id": 1,
    "name": "Sanitation",
    "description": "Garbage, debris, and waste management.",
    "is_active": true,
    "created_at": "2026-07-28T12:00:00Z"
  },
  {
    "id": 2,
    "name": "Roads",
    "description": "Potholes, manholes, and paving.",
    "is_active": true,
    "created_at": "2026-07-28T12:00:00Z"
  }
]
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **403** | Caller role is not permitted (e.g. Worker, Citizen). | `{"detail": "Permission denied."}` |

### Possible HTTP Status Codes
* `200`, `401`, `403`

---

## `GET /api/v1/departments/{department_id}`

### Purpose
Retrieves detailed metadata for a specific department.

### Roles / Authorization
* Super Admin or City Admin roles.

### Path Parameters

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `department_id` | Integer | Yes | Database ID of target department. |

### Validation Rules
* If the `department_id` does not exist, returns `404 Not Found`.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `DepartmentResponse`

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **403** | Caller role not permitted. | `{"detail": "Permission denied."}` |
| **404** | Department ID does not exist. | `{"detail": "Department not found."}` |

### Possible HTTP Status Codes
* `200`, `401`, `403`, `404`

---

## `PATCH /api/v1/departments/{department_id}/activate`

### Purpose
Allows a Super Admin or City Admin to activate a deactivated department.

### Roles / Authorization
* Super Admin or City Admin roles.

### Path Parameters

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `department_id` | Integer | Yes | Database ID of the department. |

### Validation Rules
* If the `department_id` does not exist, returns `404 Not Found`.

### Business Flow
1. Authenticates caller role.
2. Checks department existence. Throws `404` if not found.
3. Sets `is_active = True`.
4. Commits the transaction and returns a confirmation message.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `DepartmentStatusResponse`

### Example Success Response
```json
{
  "message": "Department activated successfully."
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **403** | Caller role is not authorized. | `{"detail": "Permission denied."}` |
| **404** | Department ID does not exist. | `{"detail": "Department not found."}` |

### Possible HTTP Status Codes
* `200`, `401`, `403`, `404`

### Related APIs
* [PATCH /api/v1/departments/{department_id}/deactivate](#patch-apiv1departmentsdepartment_iddeactivate)

---

## `PATCH /api/v1/departments/{department_id}/deactivate`

### Purpose
Allows a Super Admin or City Admin to deactivate an active department.

### Roles / Authorization
* Super Admin or City Admin roles.

### Path Parameters

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `department_id` | Integer | Yes | Database ID of the department. |

### Validation Rules
* If the `department_id` does not exist, returns `404 Not Found`.

### Business Flow
1. Authenticates caller role.
2. Checks department existence. Throws `404` if not found.
3. Sets `is_active = False`.
4. Commits the transaction and returns a confirmation message.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `DepartmentStatusResponse`

### Example Success Response
```json
{
  "message": "Department deactivated successfully."
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **403** | Caller role is not authorized. | `{"detail": "Permission denied."}` |
| **404** | Department ID does not exist. | `{"detail": "Department not found."}` |

### Possible HTTP Status Codes
* `200`, `401`, `403`, `404`

### Related APIs
* [PATCH /api/v1/departments/{department_id}/activate](#patch-apiv1departmentsdepartment_idactivate)
