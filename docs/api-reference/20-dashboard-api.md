# Dashboard API

The Dashboard API provides read-only, aggregated analytical metrics, workload distributions, performance trends, and recent operational histories across various user scopes. These endpoints serve as the reporting engine for administrative dashboards and worker task queues.

---

## Endpoint Summary

The Dashboard controller maps exactly 14 operations under `/api/v1/dashboard`:

| Method | Endpoint | Roles | Scope | Purpose |
| :---: | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/dashboard/summary` | Super Admin, City Admin, Department Admin | Scoped by Role (Dept Admin scoped to department, others global) | Retrieve overall count statistics for reports and actors. |
| **GET** | `/api/v1/dashboard/feedback` | City Admin | Global | Retrieve citizen feedback rating aggregates. |
| **GET** | `/api/v1/dashboard/departments` | City Admin | Global | Retrieve report counts and mappings grouped by department. |
| **GET** | `/api/v1/dashboard/issues` | City Admin | Global | Retrieve report counts grouped by issue category. |
| **GET** | `/api/v1/dashboard/status` | City Admin | Global | Retrieve report counts grouped by report status. |
| **GET** | `/api/v1/dashboard/priorities` | City Admin | Global | Retrieve report counts grouped by priority. |
| **GET** | `/api/v1/dashboard/monthly-trends` | City Admin | Global | Retrieve monthly report submission counts for a given year. |
| **GET** | `/api/v1/dashboard/recent-reports` | City Admin | Global | Retrieve recent report activities list (default limit: 10). |
| **GET** | `/api/v1/dashboard/high-priority` | City Admin | Global | Retrieve high priority unassigned reports sorted by risk score. |
| **GET** | `/api/v1/dashboard/insights` | City Admin | Global | Retrieve systemic insights (highest workloads, delayed issues). |
| **GET** | `/api/v1/dashboard/department/dashboard` | Department Admin | Department | Retrieve department-scoped workload and worker metrics. |
| **GET** | `/api/v1/dashboard/top-workers` | City Admin | Department | Retrieve top-performing workers by completion rate. |
| **GET** | `/api/v1/dashboard/worker/dashboard` | Worker | Owner | Retrieve active workload, completions, and average times for the worker. |
| **GET** | `/api/v1/dashboard/citizen/dashboard` | Citizen | Owner | Retrieve report statistics and recent reports submitted by the citizen. |

---

## Dashboard Audiences and Scope

* **Citizen Dashboard:** Scoped strictly to reports created by the calling citizen (`citizen_id`). Returns total counts and a recent activity log (limit: 5).
* **Worker Dashboard:** Scoped strictly to the worker's active queue and historical performance. Returns active assignments and completions.
* **Department Admin Dashboard:** Scoped strictly to the admin's `department_id`. Bounded to department reports, local worker availability, and incoming/outgoing forward requests.
* **City Admin Dashboard:** Scoped globally. Can view all departments, monthly municipal trends, feedback distributions, and top workers across any department.
* **Super Admin Dashboard:** Shares global access with the City Admin dashboard.

---

## Dashboard Metric Definitions

The following table details the calculated operational metrics returned by the Dashboard APIs:

| Metric | Type | Scope | Definition / Formula |
| :--- | :--- | :--- | :--- |
| `resolution_rate` | Float | Global | Percentage of resolved/closed reports out of total reports: <br> `((Resolved + Closed) / Total) * 100` (rounded to 2 decimal points). |
| `automation_rate` | Float | Global / Department | Percentage of resolution attempts automatically accepted by the AI pipeline without human review: <br> `(AI_Fully_Resolved / Total_AI_Results) * 100` (rounded to 2 decimal points). |
| `reopened_reports` | Integer | Global / Department | Count of reports containing a `REPORT_REOPENED` action in `audit_logs`. |
| `age_hours` | Float | Global | The age of a report computed in hours: <br> `(Current_UTC_Time - Created_UTC_Time) / 3600` (rounded to 1 decimal point). |
| `completion_rate` | Float | Department | Worker efficiency rating based on assignments: <br> `(Completed / (Completed + In_Progress)) * 100` (rounded to 2 decimal points). |
| `average_resolution_time_hours` | Float | Department / Worker | Statically defaults to **`0.0`** placeholder in current implementation. |

---

## Status-Based Counts

* **Report Status Metrics:** Counts mapped directly to the following `ReportStatus` enums:
  * `pending_reports`: `Pending`
  * `assigned_reports`: `Assigned`
  * `in_progress_reports`: `In Progress`
  * `resolved_reports`: `Resolved`
  * `closed_reports`: `Closed`
  * `rejected_reports`: `Rejected`
  * `cancelled_reports`: `Cancelled`
* **Active Citizen Reports:** Aggregates reports matching `Pending`, `Assigned`, or `In Progress`.
* **Resolved Citizen Reports:** Aggregates reports matching `Resolved` or `Closed`.

---

## Lists / Recent Activity

* **Recent Reports (`GET /recent-reports`):** Returns the last N reports (default limit: 10) ordered by `created_at DESC`.
* **High Priority Reports (`GET /high-priority`):** Returns reports where priority is `High` or `Critical`, and status is `Pending`, `Assigned`, or `In Progress`. Ordered by `risk_score DESC` then `created_at ASC` (default limit: 10).
* **Citizen Recent Reports:** Returns the last reports submitted by the citizen, limited by `DASHBOARD_RECENT_REPORT_LIMIT` (defaults to **5** in configs). Ordered by `created_at DESC`.
* **Top Workers:** Returns list of workers within a department sorted by completion rate descending (completed assignments count, then completion rate, default limit: 5).

---

## Dashboard Read-Only Semantics

* **Transactional Safety:** All dashboard GET endpoints are read-only and execute standard database select queries. They make no persistent state changes to the database.
* **No Cache Implementation:** The backend performs active database aggregation queries per request. Results are not cached in Redis or in-memory stores; live updates occur on page refresh.

---

## Detailed Endpoint Specifications

---

## `GET /api/v1/dashboard/summary`

### Purpose
Retrieves global count statistics for reports, departments, and actors. If called by a Department Admin, the summary is automatically scoped to their department.

### Roles / Authorization
* Super Admin, City Admin, or Department Admin. Citizens and Workers receive `403 Forbidden`.

### Authentication
* Bearer Access Token required.

### Headers
* `Authorization: Bearer <access_token>`

### Path Parameters
* Not applicable.

### Query Parameters
* Not applicable.

### Request Body / Form Data
* Not applicable.

### Rate Limit
* `No endpoint-specific rate limit verified.`

### Validation Rules
* Caller must hold `SUPER_ADMIN`, `CITY_ADMIN`, or `DEPARTMENT_ADMIN` role. Other roles receive `403 Forbidden`.

### Business Flow
1. Authenticates caller and checks role against allowed set.
2. If `DEPARTMENT_ADMIN`: calls `get_department_dashboard_summary(department_id)` scoped to the caller's department.
3. Otherwise: calls `get_dashboard_summary()` for global aggregates.
4. Returns serialized `CityDashboardSummaryResponse`.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `CityDashboardSummaryResponse`

| Field | Type | Description |
| :--- | :--- | :--- |
| `total_reports` | Integer | Total count of reports. |
| `pending_reports` | Integer | Reports in `Pending` state. |
| `assigned_reports` | Integer | Reports in `Assigned` state. |
| `in_progress_reports` | Integer | Reports in `In Progress` state. |
| `resolved_reports` | Integer | Reports in `Resolved` state. |
| `closed_reports` | Integer | Reports in `Closed` state. |
| `rejected_reports` | Integer | Reports in `Rejected` state. |
| `cancelled_reports` | Integer | Reports in `Cancelled` state. |
| `reopened_reports` | Integer | Count of reopened reports. |
| `total_departments` | Integer | Total department count. |
| `total_workers` | Integer | Total worker count. |
| `total_citizens` | Integer | Total citizen count. |
| `resolution_rate` | Float | Percentage resolved. |
| `automation_rate` | Float | AI pass percentage. |

### Example Success Response (Global Scope)
```json
{
  "total_reports": 140,
  "pending_reports": 20,
  "assigned_reports": 30,
  "in_progress_reports": 40,
  "resolved_reports": 40,
  "closed_reports": 5,
  "rejected_reports": 3,
  "cancelled_reports": 2,
  "reopened_reports": 1,
  "total_departments": 5,
  "total_workers": 24,
  "total_citizens": 120,
  "resolution_rate": 32.14,
  "automation_rate": 84.21
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **403** | Caller role is Citizen or Worker. | `{"detail": "You are not authorized to access the dashboard summary."}` |

### Possible HTTP Status Codes
* `200`, `401`, `403`

### Database / State Changes
* No persistent state change.

### Side Effects
* No additional side effects verified.

### Related APIs
* [GET /api/v1/dashboard/department/dashboard](#get-apiv1dashboarddepartmentdashboard)
* [GET /api/v1/dashboard/monthly-trends](#get-apiv1dashboardmonthly-trends)

---

## `GET /api/v1/dashboard/feedback`

### Purpose
Retrieves ratings distribution metrics for citizen app feedback.

### Roles / Authorization
* City Admin role only.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `FeedbackDashboardResponse`

| Field | Type | Description |
| :--- | :--- | :--- |
| `total_feedback` | Integer | Total feedback responses. |
| `average_rating` | Float | Average rating score (1-5 scale). |
| `rating_distribution` | Object | Nested star counts. |
| `rating_distribution.one_star` | Integer | 1-star rating count. |
| `rating_distribution.two_star` | Integer | 2-star rating count. |
| `rating_distribution.three_star` | Integer | 3-star rating count. |
| `rating_distribution.four_star` | Integer | 4-star rating count. |
| `rating_distribution.five_star` | Integer | 5-star rating count. |

### Example Success Response
```json
{
  "total_feedback": 45,
  "average_rating": 4.22,
  "rating_distribution": {
    "one_star": 2,
    "two_star": 3,
    "three_star": 5,
    "four_star": 15,
    "five_star": 20
  }
}
```

---

## `GET /api/v1/dashboard/departments`

### Purpose
Retrieves the total report count grouped by department, providing a list of department-level activity distributions.

### Roles / Authorization
* City Admin role only.

### Authentication
* Bearer Access Token required.

### Headers
* `Authorization: Bearer <access_token>`

### Path Parameters
* Not applicable.

### Query Parameters
* Not applicable.

### Request Body / Form Data
* Not applicable.

### Rate Limit
* `No endpoint-specific rate limit verified.`

### Validation Rules
* Caller must hold `CITY_ADMIN` role. Other roles receive `403 Forbidden`.

### Business Flow
1. Authenticates caller as City Admin.
2. Queries `Department` table joined with `Report` table.
3. Groups by `department_id` and counts reports per department.
4. Returns serialized list of `DepartmentStatisticsItem`.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `list[DepartmentStatisticsItem]`

| Field | Type | Description |
| :--- | :--- | :--- |
| `department_id` | Integer | Database ID of the department. |
| `department_name` | String | Human-readable name of the department. |
| `total_reports` | Integer | Total count of reports assigned to this department. |

### Example Success Response
```json
[
  {
    "department_id": 1,
    "department_name": "Roads",
    "total_reports": 42
  },
  {
    "department_id": 2,
    "department_name": "Sanitation",
    "total_reports": 27
  }
]
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **403** | Caller is not City Admin. | `{"detail": "Permission denied."}` |

### Possible HTTP Status Codes
* `200`, `401`, `403`

### Database / State Changes
* No persistent state change.

### Side Effects
* No additional side effects verified.

### Related APIs
* [GET /api/v1/dashboard/summary](#get-apiv1dashboardsummary)

---

## `GET /api/v1/dashboard/issues`

### Purpose
Retrieves the total report count grouped by issue category type (e.g. Road Damage, Water Supply), providing a breakdown of civic issue frequencies.

### Roles / Authorization
* City Admin role only.

### Authentication
* Bearer Access Token required.

### Headers
* `Authorization: Bearer <access_token>`

### Path Parameters
* Not applicable.

### Query Parameters
* Not applicable.

### Request Body / Form Data
* Not applicable.

### Rate Limit
* `No endpoint-specific rate limit verified.`

### Validation Rules
* Caller must hold `CITY_ADMIN` role. Other roles receive `403 Forbidden`.

### Business Flow
1. Authenticates caller as City Admin.
2. Queries `Report` table, groups by `issue_type`.
3. Counts reports per issue category.
4. Returns serialized list of `IssueStatisticsItem`.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `list[IssueStatisticsItem]`

| Field | Type | Description |
| :--- | :--- | :--- |
| `issue_type` | String | Issue category label (e.g. `"Road Damage"`). |
| `total_reports` | Integer | Count of reports of this issue type. |

### Example Success Response
```json
[
  {
    "issue_type": "Road Damage",
    "total_reports": 38
  },
  {
    "issue_type": "Water Supply",
    "total_reports": 14
  }
]
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **403** | Caller is not City Admin. | `{"detail": "Permission denied."}` |

### Possible HTTP Status Codes
* `200`, `401`, `403`

### Database / State Changes
* No persistent state change.

### Side Effects
* No additional side effects verified.

### Related APIs
* [GET /api/v1/dashboard/status](#get-apiv1dashboardstatus)

---

## `GET /api/v1/dashboard/status`

### Purpose
Retrieves the total report count grouped by report status (Pending, Assigned, In Progress, etc.), providing a lifecycle distribution view.

### Roles / Authorization
* City Admin role only.

### Authentication
* Bearer Access Token required.

### Headers
* `Authorization: Bearer <access_token>`

### Path Parameters
* Not applicable.

### Query Parameters
* Not applicable.

### Request Body / Form Data
* Not applicable.

### Rate Limit
* `No endpoint-specific rate limit verified.`

### Validation Rules
* Caller must hold `CITY_ADMIN` role. Other roles receive `403 Forbidden`.

### Business Flow
1. Authenticates caller as City Admin.
2. Queries `Report` table, groups by `status`.
3. Counts reports per status value.
4. Returns serialized list of `StatusStatisticsItem`.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `list[StatusStatisticsItem]`

| Field | Type | Description |
| :--- | :--- | :--- |
| `status` | String | Report status (e.g. `"Pending"`, `"Assigned"`, `"In Progress"`, `"Resolved"`, `"Closed"`, `"Cancelled"`, `"Rejected"`). |
| `total_reports` | Integer | Count of reports in this status. |

### Example Success Response
```json
[
  {
    "status": "Pending",
    "total_reports": 20
  },
  {
    "status": "Resolved",
    "total_reports": 40
  }
]
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **403** | Caller is not City Admin. | `{"detail": "Permission denied."}` |

### Possible HTTP Status Codes
* `200`, `401`, `403`

### Database / State Changes
* No persistent state change.

### Side Effects
* No additional side effects verified.

### Related APIs
* [GET /api/v1/dashboard/priorities](#get-apiv1dashboardpriorities)

---

## `GET /api/v1/dashboard/priorities`

### Purpose
Retrieves the total report count grouped by priority level (Low, Medium, High, Critical), providing a severity distribution view.

### Roles / Authorization
* City Admin role only.

### Authentication
* Bearer Access Token required.

### Headers
* `Authorization: Bearer <access_token>`

### Path Parameters
* Not applicable.

### Query Parameters
* Not applicable.

### Request Body / Form Data
* Not applicable.

### Rate Limit
* `No endpoint-specific rate limit verified.`

### Validation Rules
* Caller must hold `CITY_ADMIN` role. Other roles receive `403 Forbidden`.

### Business Flow
1. Authenticates caller as City Admin.
2. Queries `Report` table, groups by `priority`.
3. Counts reports per priority level.
4. Returns serialized list of `PriorityStatisticsItem`.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `list[PriorityStatisticsItem]`

| Field | Type | Description |
| :--- | :--- | :--- |
| `priority` | String | Priority level (`"Low"`, `"Medium"`, `"High"`, `"Critical"`). |
| `total_reports` | Integer | Count of reports at this priority. |

### Example Success Response
```json
[
  {
    "priority": "High",
    "total_reports": 15
  },
  {
    "priority": "Critical",
    "total_reports": 5
  }
]
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **403** | Caller is not City Admin. | `{"detail": "Permission denied."}` |

### Possible HTTP Status Codes
* `200`, `401`, `403`

### Database / State Changes
* No persistent state change.

### Side Effects
* No additional side effects verified.

### Related APIs
* [GET /api/v1/dashboard/issues](#get-apiv1dashboardissues)

---

## `GET /api/v1/dashboard/monthly-trends`

### Purpose
Retrieves monthly report submission totals for a given year.

### Roles / Authorization
* City Admin role only.

### Query Parameters

| Name | Type | Required | Default | Constraints | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `year` | Integer | Yes | None | Valid calendar year | The year to aggregate trends. |

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `list[MonthlyTrendItem]`

| Field | Type | Description |
| :--- | :--- | :--- |
| `month` | Integer | Numeric month (1-12). |
| `month_name` | String | Alphabetical month name (e.g. January). |
| `total_reports` | Integer | Reports submitted in the month. |

### Example Success Response
```json
[
  {
    "month": 7,
    "month_name": "July",
    "total_reports": 12
  }
]
```

---

## `GET /api/v1/dashboard/recent-reports`

### Purpose
Retrieves a list of recent reports.

### Roles / Authorization
* City Admin role only.

### Query Parameters

| Name | Type | Required | Default | Constraints | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `limit` | Integer | No | 10 | Max list length | Number of records to return. |

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `list[RecentReportItem]`

| Field | Type | Description |
| :--- | :--- | :--- |
| `report_number` | String | Unique report identifier. |
| `issue_type` | String | Issue category. |
| `priority` | String | Priority. |
| `status` | String | Current status. |
| `department_name` | String | Target department name. |
| `created_at` | DateTime | Creation timestamp. |

---

## `GET /api/v1/dashboard/high-priority`

### Purpose
Retrieves a list of high-priority unassigned reports sorted by risk score.

### Roles / Authorization
* City Admin role only.

### Query Parameters

| Name | Type | Required | Default | Constraints | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `limit` | Integer | No | 10 | Max list length | Number of records to return. |

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `list[HighPriorityReportItem]`

| Field | Type | Description |
| :--- | :--- | :--- |
| `report_number` | String | Unique report identifier. |
| `issue_type` | String | Issue category. |
| `priority` | String | Priority level. |
| `status` | String | Current status. |
| `department_name` | String | Department name. |
| `risk_score` | Float | Evaluated report risk score. |
| `created_at` | DateTime | Timestamp of creation. |
| `age_hours` | Float | Calculated age hours. |
| `assigned_worker` | String \| null | Assigned worker name (returns `"Unassigned"` if null). |

---

## `GET /api/v1/dashboard/insights`

### Purpose
Retrieves systemic warning/insight blocks (e.g. high pending department workloads, delayed reports).

### Roles / Authorization
* City Admin role only.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `list[DashboardInsightItem]`

| Field | Type | Description |
| :--- | :--- | :--- |
| `type` | String | Insight severity classification (`warning`, `info`, `success`). |
| `title` | String | Title of insight card. |
| `message` | String | Informational message body. |

### Example Success Response
```json
[
  {
    "type": "warning",
    "title": "High Pending Workload",
    "message": "Roads Department currently has the highest pending workload."
  }
]
```

---

## `GET /api/v1/dashboard/department/dashboard`

### Purpose
Retrieves department-scoped workload and worker metrics for the admin's department.

### Roles / Authorization
* Department Admin role.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `DepartmentDashboardResponse`

| Field | Type | Description |
| :--- | :--- | :--- |
| `total_reports` | Integer | Reports scoped to department. |
| `pending_reports` | Integer | Pending reports. |
| `assigned_reports` | Integer | Assigned reports. |
| `in_progress_reports` | Integer | In-progress reports. |
| `resolved_reports` | Integer | Resolved reports. |
| `cancelled_reports` | Integer | Cancelled reports. |
| `reopened_reports` | Integer | Reopened reports count. |
| `available_workers` | Integer | Available local workers. |
| `busy_workers` | Integer | Busy local workers. |
| `forward_requests_pending` | Integer | Pending forward requests. |
| `forward_requests_accepted` | Integer | Accepted forward requests. |
| `forward_requests_rejected` | Integer | Rejected forward requests. |
| `average_resolution_time_hours` | Float | Average time (returns `0.0`). |
| `automation_rate` | Float | Department AI pass rate. |

---

## `GET /api/v1/dashboard/top-workers`

### Purpose
Retrieves top performing workers in a department.

### Roles / Authorization
* City Admin role only.

### Query Parameters

| Name | Type | Required | Default | Constraints | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `department_id` | Integer | Yes | None | None | Scoped department ID. |
| `limit` | Integer | No | 5 | None | Number of workers to return. |

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `list[TopWorkerItem]`

| Field | Type | Description |
| :--- | :--- | :--- |
| `worker_id` | Integer | User ID of worker. |
| `worker_name` | String | Name of worker. |
| `completed_reports` | Integer | Completed assignments. |
| `in_progress_reports` | Integer | In-progress assignments. |
| `completion_rate` | Float | Completion rate percentage. |

---

## `GET /api/v1/dashboard/worker/dashboard`

### Purpose
Retrieves assignment counts and averages for the calling worker.

### Roles / Authorization
* Worker role only.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `WorkerDashboardResponse`

| Field | Type | Description |
| :--- | :--- | :--- |
| `assigned_reports` | Integer | Current assigned tasks. |
| `in_progress_reports` | Integer | Tasks in progress. |
| `pending_review_reports` | Integer | Submissions pending manual review. |
| `completed_reports` | Integer | Lifetime completed tasks. |
| `today_completed_reports` | Integer | Tasks completed today. |
| `average_resolution_time_hours` | Float | Average time (returns `0.0`). |

---

## `GET /api/v1/dashboard/citizen/dashboard`

### Purpose
Retrieves report counts and a list of recent submissions for the calling citizen.

### Roles / Authorization
* Citizen role only.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `CitizenDashboardResponse`

| Field | Type | Description |
| `summary` | Object | Summary counts. |
| `summary.total_reports` | Integer | Total submitted. |
| `summary.active_reports` | Integer | Pending/assigned/in-progress. |
| `summary.resolved_reports` | Integer | Resolved/closed. |
| `summary.cancelled_reports` | Integer | Cancelled. |
| `summary.reopened_reports` | Integer | Reopened count. |
| `status_distribution` | Object | Status values. |
| `status_distribution.pending` | Integer | Pending count. |
| `status_distribution.assigned` | Integer | Assigned count. |
| `status_distribution.in_progress` | Integer | In-progress count. |
| `status_distribution.resolved` | Integer | Resolved count. |
| `status_distribution.cancelled` | Integer | Cancelled count. |
| `recent_reports` | List | Recent reports. |
| `recent_reports[].report_id` | Integer | Report ID. |
| `recent_reports[].report_number` | String | Identifier. |
| `recent_reports[].issue_type` | String | Category. |
| `recent_reports[].priority` | String | Priority. |
| `recent_reports[].status` | String | Status. |
| `recent_reports[].department_name` | String \| null | Scoped department. |
| `recent_reports[].created_at` | DateTime | Submissions timestamp. |

### Example Success Response
```json
{
  "summary": {
    "total_reports": 5,
    "active_reports": 2,
    "resolved_reports": 2,
    "cancelled_reports": 1,
    "reopened_reports": 0
  },
  "status_distribution": {
    "pending": 1,
    "assigned": 1,
    "in_progress": 0,
    "resolved": 2,
    "cancelled": 1
  },
  "recent_reports": [
    {
      "report_id": 92,
      "report_number": "REP-2026-0103",
      "issue_type": "Road Damage",
      "priority": "High",
      "status": "Assigned",
      "department_name": "Roads",
      "created_at": "2026-07-28T16:10:00Z"
    }
  ]
}
```

---

## Frontend Integration Notes

* **Avoid Frontend Calculations:** Always parse the aggregate metrics (`resolution_rate`, `automation_rate`, `completion_rate`) directly from the response rather than recalculating them client-side.
* **Resolution Duration Placeholder:** The `average_resolution_time_hours` field statically returns `0.0` in the current release. Applications should handle or suppress this field until the backend computes it.

---

