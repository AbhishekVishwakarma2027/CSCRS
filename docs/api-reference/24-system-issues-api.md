# System Issues API

The System Issues API manages platform bugs, technical errors, account problems, and application-specific exceptions reported by users (citizens, workers, or administrators). It functions as a platform ticketing registry monitored and resolved by global administrators.

---

## Endpoint Summary

The System Issues controller registers exactly **5 operations** under `/api/v1/issues`:

| Method | Endpoint | Roles | Scope | Purpose |
| :---: | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/issues` | Any Authenticated User | Owner | Submit a new system issue ticket (with optional file attachment). |
| **GET** | `/api/v1/issues` | Super Admin, City Admin | Global | Retrieve a filtered list of all submitted system issue tickets. |
| **GET** | `/api/v1/issues/export` | Super Admin | Global | Export all system issues to Excel or CSV formats. |
| **GET** | `/api/v1/issues/{issue_number}` | Super Admin, City Admin | Global | Retrieve detailed metadata for a specific system issue. |
| **PATCH** | `/api/v1/issues/{issue_number}/status` | Super Admin | Global | Update ticket status and record administrative remarks. |

---

## System Issues vs Civic Reports

The CSCRS distinguishes strictly between civic reports and technical platform issues:

* **Civic Reports:** Represent physical municipal problems (garbage, potholes, water leaks) reported by citizens to be resolved by field workers in specific city departments. Scoped by department mapping.
* **System Issues:** Represent software application bugs, performance issues, image upload errors, or access permission faults reported by any platform user. Scoped globally and resolved by platform Super Admins.

---

## System Issue Data Model

Exposed fields within the `SystemIssue` schemas:

| Field | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `issue_number` | String | No | Unique generated tracking number (e.g. `ISS-2026-0021`). |
| `title` | String | No | Brief summary of the bug (min 5, max 200 characters). |
| `description` | String | No | Detailed explanation of the technical problem (min 10, max 3000 characters). |
| `category` | String | No | Serialized category enum explaining the technical layer affected. |
| `status` | String | No | Current review lifecycle state (defaults to `OPEN`). |
| `reporter_name` | String | No | Full name of the user who submitted the ticket. |
| `reporter_email` | String | No | Email address of the submitting user. |
| `reporter_phone` | String \| null | Yes | Phone number of the submitting user. |
| `related_report_number` | String \| null | Yes | Associated civic report number (if the bug occurred during report lifecycle). |
| `attachments` | List | No | Mapped attachment files. |
| `attachments[].original_filename`| String | No | Original name of the uploaded attachment. |
| `attachments[].file_path` | String | No | Relative server path to the stored attachment. |
| `attachments[].mime_type` | String | No | File content type (e.g. `image/png`). |
| `attachments[].file_size` | Integer | No | File size in bytes. |
| `created_at` | DateTime | No | Timestamp of submission. |
| `updated_at` | DateTime | No | Timestamp of last status change. |

---

## System Issue Lifecycle

System Issues follow a directed state lifecycle:

1. **Submission:** A ticket is submitted via `POST /api/v1/issues` in `OPEN` status.
2. **Review:** A Super Admin transitions the status to `IN_REVIEW` while examining the platform bug.
3. **Closure:** Once addressed, the Super Admin updates the status to `RESOLVED` or `REJECTED`, recording administrative `remarks`. 
   * **Timestamp Logging:** Setting the status to `RESOLVED` or `REJECTED` automatically logs the current UTC time in `closed_at`. Returning the status to `OPEN` or `IN_REVIEW` resets `closed_at` to `null`.

---

## System Issue Access Rules

Access matrix detailing operations permitted per role:

| Role | Submit Ticket | View Own Tickets | View All Tickets | Update Status | Export List |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Citizen** | **Allowed** | **Forbidden** | **Forbidden** | **Forbidden** | **Forbidden** |
| **Worker** | **Allowed** | **Forbidden** | **Forbidden** | **Forbidden** | **Forbidden** |
| **Department Admin** | **Allowed** | **Forbidden** | **Forbidden** | **Forbidden** | **Forbidden** |
| **City Admin** | **Allowed** | **Forbidden** | **Allowed** | **Forbidden** | **Forbidden** |
| **Super Admin** | **Allowed** | **Forbidden** | **Allowed** | **Allowed** | **Allowed** |

* *Note:* The API provides **no route** for a standard citizen, worker, or department admin to view their own submitted tickets. Standard users submit issues blindly; they cannot query their history or track progress.

---

## System Issue Attachment Rules

* **Supported Formats:** The API allows attaching files (such as screenshots or screen recordings) to help identify errors.
  * **Images:** `.jpg`, `.jpeg`, `.png`, `.webp` (MIME types: `image/jpeg`, `image/png`, `image/webp`).
  * **Videos:** `.mp4`, `.mov`, `.avi`, `.mkv` (MIME types: `video/mp4`, `video/quicktime`, `video/x-msvideo`, `video/x-matroska`).
* **Upload Limits:**
  * **Size Constraint:** Maximum file size is **10 MB** (`10 * 1024 * 1024` bytes).
  * **Count Constraint:** The service supports up to **5 attachments** per ticket. However, because the POST endpoint route maps a single `attachments` multipart parameter (`attachments: UploadFile | None = File(None)`), clients can send **at most 1 attachment** per request.
* **Storage Location:** Attachments are verified and stored within the `system_issues` upload subdirectory. Refer to [File Upload Guide](06-file-and-image-uploads.md) for global upload validation.

---

## Rate Limiting

* **Rate Limit Decorator:** Submitting issues is throttled at a rate of **20 requests per hour** per user.
* **Limiter Details:** Configured using the SlowAPI `@limiter.limit("20 per hour")` decorator.
* **Keying Strategy:** Uses `smart_rate_limit_key` which keys by user ID (`user:<user_id>`) for authenticated callers. Over-limit requests return `429 Too Many Requests`.

---

## Notifications and Audit Logs

* **No Side Effects:** Submitting, reviewing, or resolving technical system issues does **not** trigger in-app notifications, send administrative emails, or write to report timeline histories. System Issues are managed silently in the database.

---

## System Issue Enumerations

### `SystemIssueStatus`
Tracks the administrative status of a ticket.

| Value | Meaning |
| :--- | :--- |
| `OPEN` | Ticket submitted; awaiting administrative review. |
| `IN_REVIEW` | Super Admin is actively investigating the platform bug. |
| `RESOLVED` | Bug fixed or account problem resolved. Sets `closed_at` timestamp. |
| `REJECTED` | Ticket declined (e.g. spam, not a technical bug). Sets `closed_at` timestamp. |

### `SystemIssueCategory`
Explains the platform module or layer affected by the bug.

| Value | Meaning |
| :--- | :--- |
| `Authentication` | Problems with login, OTP, token generation, or lockouts. |
| `Authorization` | Issues with RBAC access control or scope validation. |
| `Report Submission` | Bugs submitting reports, category errors, or mapping issues. |
| `Report Verification` | Errors in the verification pipeline or YOLO engine. |
| `Duplicate Detection` | Erroneous duplication tags or support counters. |
| `Assignment` | Failures in auto-assignment dispatch or availability tracking. |
| `Worker` | Worker profile problems or invitation activations. |
| `Resolution Upload` | Problems uploading completion photos or file validation errors. |
| `Resolution Verification` | Verification attempt logic failures. |
| `Timeline` | Milestone rendering bugs or missing milestones. |
| `Notification` | Missing alerts or count mismatch in unread indicators. |
| `Email` | Missing registration/activation emails or OTPs. |
| `Dashboard` | Graph errors or count aggregation mismatches. |
| `Search` | Problems searching reports or filtering results. |
| `Filter` | Query filtering anomalies. |
| `Performance` | Slow API queries or Redis timeout errors. |
| `UI / UX` | Rendering issues, style failures, or broken links. |
| `API` | Serializer mismatch or HTTP response format errors. |
| `Database` | Integrity errors or persistence failures. |
| `AI Detection` | YOLO model inference bugs or score inaccuracies. |
| `GPS / EXIF` | Metadata extraction errors from photos. |
| `Image Upload` | Multi-part upload failures or MIME type rejection. |
| `Video Upload` | Video upload compression or playback errors. |
| `Security` | CSRF, SQLi attempts, or role escalation alerts. |
| `Other` | Unclassified bugs. |

---

## Detailed Endpoint Specifications

---

## `POST /api/v1/issues`

### Purpose
Allows any authenticated user to report a platform bug or account issue.

### Roles / Authorization
* Any authenticated user.

### Authentication
* Bearer Access Token required.

### Headers
* `Authorization: Bearer <access_token>`
* `Content-Type: multipart/form-data`

### Request Body / Form Data

| Field | Type | Required | Constraints / Validation | Description |
| :--- | :--- | :---: | :--- | :--- |
| `title` | String | Yes | `min_length=5`, `max_length=200` | Brief summary of system issue. |
| `description` | String | Yes | `min_length=10`, `max_length=3000` | Description details. |
| `category` | String | Yes | Must match `SystemIssueCategory` | Mapped category. |
| `related_report_number`| String | No | Max length 30 | Associated report number, if any. |
| `attachments` | File | No | Max 10MB (MIME check applies) | Uploaded attachment file. |

### Validation Rules
* **Pydantic Validation:** Form fields are parsed and validated against `SystemIssueCreate`. Violation returns `422`.
* **Related Report Check:** If `related_report_number` is provided, verifies report existence in the database. Returns `400 Bad Request` if report number is not found.
* **File Upload Constraints:** Attachment size must not exceed 10MB. File extension and MIME type must match allowed formats. Returns `400` on validation failure.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `SystemIssueResponse`

```json
{
  "message": "Issue submitted successfully.",
  "issue_number": "ISS-2026-0005"
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **400** | Related report number does not exist. | `{"detail": "Related report does not exist."}` |
| **400** | Attached file exceeds 10MB or is an invalid type. | `{"detail": "File size exceeds 10MB limit."}` |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **422** | Title or description field validation failure. | `{"detail": [{"loc": ["body", "title"], "msg": "ensure this value has at least 5 characters", "type": "value_error.any_str.min_length"}]}` |

---

## `GET /api/v1/issues`

### Purpose
Retrieves a list of all submitted system issues.

### Roles / Authorization
* Super Admin or City Admin roles.
* *Note on Error Detail:* If called by Citizen or Worker roles, the API returns `403 Forbidden` with the literal detail message: **`"You are not authorized to export feedback."`** (due to code reuse in the controller).

### Query Parameters

| Name | Type | Required | Default | Constraints | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `status` | String | No | None | None | Filter by status (`OPEN`, `RESOLVED`, etc.). |
| `category` | String | No | None | Must match category | Filter by category. |
| `reporter` | String | No | None | None | Filter by reporter user name (case-insensitive substring search). |
| `search` | String | No | None | None | Search by `issue_number` or `title`. |

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `list[SystemIssueListItem]`

```json
[
  {
    "issue_number": "ISS-2026-0005",
    "title": "Camera upload freeze",
    "category": "Image Upload",
    "status": "OPEN",
    "reporter_name": "Alice Green",
    "created_at": "2026-07-28T12:00:00Z"
  }
]
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **403** | Caller is not Super Admin or City Admin. | `{"detail": "You are not authorized to export feedback."}` |

---

## `GET /api/v1/issues/{issue_number}`

### Purpose
Retrieves detailed metadata, user contacts, and attachments for a specific system issue.

### Roles / Authorization
* Super Admin or City Admin roles. Citizen or Worker roles return `403 Forbidden` (`"You are not authorized."`).

### Path Parameters

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `issue_number` | String | Yes | Unique issue number (e.g. `ISS-2026-0005`). |

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `SystemIssueDetailResponse`

```json
{
  "issue_number": "ISS-2026-0005",
  "title": "Camera upload freeze",
  "description": "App crashes during camera compression process.",
  "category": "Image Upload",
  "status": "OPEN",
  "reporter_name": "Alice Green",
  "reporter_email": "alice@gmail.com",
  "reporter_phone": "+919876543210",
  "related_report_number": "REP-2026-0103",
  "attachments": [
    {
      "original_filename": "crash_screenshot.png",
      "file_path": "uploads/system_issues/7a8b9c.png",
      "mime_type": "image/png",
      "file_size": 204850
    }
  ],
  "created_at": "2026-07-28T12:00:00Z",
  "updated_at": "2026-07-28T12:00:00Z"
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **403** | Caller role is Citizen or Worker. | `{"detail": "You are not authorized."}` |
| **404** | Issue number does not exist. | `{"detail": "Issue not found."}` |

---

## `GET /api/v1/issues/export`

### Purpose
Exports all system issues in CSV or Excel spreadsheet formats.

### Roles / Authorization
* Super Admin role only. City Admin receives `403 Forbidden` (`"You are not authorized."`).

### Query Parameters

| Name | Type | Required | Default | Constraints | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `format` | String | No | `csv` | Must match regex `^(csv|excel)$` | Export format. |

### Success Response
* **HTTP Status:** `200 OK`
* **Media Type:** `text/csv` (for CSV) or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (for Excel).

---

## `PATCH /api/v1/issues/{issue_number}/status`

### Purpose
Allows a Super Admin to update the status of a system issue and record review remarks.

### Roles / Authorization
* Super Admin role only. City Admin receives `403 Forbidden` (`"You are not authorized."`).

### Path Parameters

| Name | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `issue_number` | String | Yes | Unique issue number. |

### Request Body / Form Data

| Field | Type | Required | Constraints / Validation | Description |
| :--- | :--- | :---: | :--- | :--- |
| `status` | String | Yes | Must match `SystemIssueStatus` | New target status. |
| `remarks` | String | No | Max length 1000 | Administrative comments. |

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `MessageResponse`

```json
{
  "message": "Issue status updated successfully."
}
```

---

## Frontend Integration Notes

* **Form Upload Configuration:** Ensure that the submit issue form is configured with `enctype="multipart/form-data"` and matches the expected Form parameters.
* **Single Attachment Limitation:** Although the service layer is designed to support up to 5 files, the current routing controller maps only a single UploadFile parameter. Form inputs should limit users to attaching a single screenshot or recording.
* **Admin-Only History tracking:** Do not build a "My Technical Tickets" page for Citizens or Workers. Since there are no endpoints for non-admins to list or view their own tickets, standard users have no way to query their submitted reports.
