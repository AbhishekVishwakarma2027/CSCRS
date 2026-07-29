# Feedback API

The Feedback API manages overall citizen satisfaction ratings and comments regarding the CSCRS application. Rather than binding feedback to specific report IDs, this subsystem functions as a global application feedback registry where users submit overall star ratings and textual comments for admin review.

---

## Endpoint Summary

The Feedback controller registers exactly **2 operations** under `/api/v1/feedback`:

| Method | Endpoint | Roles | Scope | Purpose |
| :---: | :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/feedback` | Any Authenticated User | Owner | Submit a new general satisfaction rating and comment for the app. |
| **GET** | `/api/v1/feedback/export` | Super Admin, City Admin, Department Admin | Global | Export all feedback records to XLSX or CSV formats. |

---

## Feedback Lifecycle

The Feedback lifecycle operates independently from individual reports:

1. **Submission:** An authenticated user submits feedback (`POST /api/v1/feedback`).
2. **Persistence:** Feedback is stored in the database (`feedbacks` table).
3. **Administration:** Administrators view metrics via the [Dashboard API](20-dashboard-api.md) and can export raw feedback data (`GET /api/v1/feedback/export`).
* *Note:* The API provides **no update or delete endpoints** for submitted feedback records. Once submitted, feedback cannot be altered or removed by the user.

---

## Feedback Eligibility

* **Global Scope:** Feedback is **not report-specific**. A user does not need to have a resolved report or active assignments to submit feedback. Any authenticated user (Citizen, Worker, or Admin) is eligible to post feedback at any time.

---

## Duplicate Feedback

* **No Duplication Restriction:** The system does **not** enforce a "one feedback per user" constraint. Users can submit multiple feedback forms over time; each submission creates a separate entry in the database.

---

## Rating Semantics

* **Rating Range:** Ratings are integers validated to be between **1** (minimum) and **5** (maximum), inclusive.
* **No Subjective Labels:** The backend stores and averages the integer rating directly. The API makes no semantic assumptions (e.g. "poor" or "excellent") on specific numbers.

---

## Feedback Data Model

The `Feedback` record model contains the following fields:

| Field | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | Integer | No | Database primary key of the feedback record. |
| `user_id` | Integer | No | ID of the submitting user. |
| `rating` | Integer | No | Numeric rating score (validated between 1 and 5). |
| `liked_text` | Text | Yes | Comments regarding what the user liked (optional, max 1000 characters). |
| `suggestion_text` | Text | Yes | Suggestions for improvement (optional, max 1000 characters). |
| `created_at` | DateTime | No | Timestamp of submission. |

---

## Rate Limiting

* **Rate Limit Decorator:** Feedback submissions are throttled at a rate of **10 requests per hour** per user.
* **Limiter Details:** Configured using the SlowAPI `@limiter.limit("10 per hour")` decorator.
* **Keying Strategy:** Uses the global `smart_rate_limit_key` which resolves to the authenticated user ID (`user:<user_id>`).
* **Exceeded Limits:** Excess requests return `429 Too Many Requests`. Refer to [Rate Limiting Guide](07-rate-limiting.md) for global rules.

---

## Dashboard Relationship

* **Metric Aggregation:** Submitting feedback directly updates the App Feedback dashboard aggregates. The `GET /api/v1/dashboard/feedback` endpoint aggregates totals, average ratings, and star distribution counts from the `feedbacks` table. Refer to [Dashboard API Reference](20-dashboard-api.md) for dashboard responses.

---

## Notification Relationship

* **No Side Effects:** Submitting feedback does **not** generate in-app notification records, send administrative emails, or add events to report timelines. It writes strictly to the `feedbacks` table and logs no standard audit events.

---

## Detailed Endpoint Specifications

---

## `POST /api/v1/feedback`

### Purpose
Allows an authenticated user to submit overall app satisfaction rating and comments.

### Roles / Authorization
* Any authenticated user.

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
| `rating` | Integer | Yes | Value must be $\ge 1$ and $\le 5$ | General star rating. |
| `liked_text` | String | No | Max length 1000 | Text detailing positive feedback. |
| `suggestion_text` | String | No | Max length 1000 | Text detailing suggestions. |

### Validation Rules
* **Pydantic Validation:** Rating values outside $[1, 5]$ or text fields exceeding 1000 characters return `422 Unprocessable Entity`.
* **String Sanitization:** Submitting whitespace-only text blocks for `liked_text` or `suggestion_text` is stripped to `None` in the service layer before saving.

### Rate Limit
* `10 per hour` per authenticated user. Returns `429 Too Many Requests` on breach.

### Business Flow
1. Authenticates current user.
2. Checks rate limiting. Throws `429` if limit is exceeded.
3. Validates rating is in range $[1, 5]$. Throws `422` on violation.
4. Strips leading/trailing whitespace from text comments. If empty, saves as `null`.
5. Creates a new `Feedback` record.
6. Commits transaction and returns the feedback ID.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `FeedbackResponse`

```json
{
  "message": "Thank you for your feedback.",
  "feedback_id": 14
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **422** | Rating is out of bounds or text is too long. | `{"detail": [{"loc": ["body", "rating"], "msg": "ensure this value is less than or equal to 5", "type": "value_error.number.not_le"}]}` |
| **429** | Exceeded the limit of 10 submissions per hour. | `{"detail": "Rate limit exceeded: 10 per hour"}` |

---

## `GET /api/v1/feedback/export`

### Purpose
Exports all feedback records to Excel (`xlsx`) or CSV formats.

### Roles / Authorization
* Super Admin, City Admin, or Department Admin. Citizens and Workers receive `403 Forbidden`.

### Query Parameters

| Name | Type | Required | Default | Constraints | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `format` | String | No | `xlsx` | Must match regex `^(xlsx|csv)$` | The target file format. |

### Business Flow
1. Authenticates user and checks role permission. Throws `403` if role is Citizen or Worker.
2. Queries all feedback records from the database ordered descending by `created_at`.
3. Calls utility helper to compile raw rows.
4. Returns a `StreamingResponse` file download attachment.

### Success Response
* **HTTP Status:** `200 OK`
* **Media Type:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (for xlsx) or `text/csv` (for csv).

### Example Headers
```http
Content-Disposition: attachment; filename=feedback.xlsx
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **403** | Caller role is Citizen or Worker. | `{"detail": "You are not authorized to export feedback."}` |
| **422** | Invalid export format selected (e.g. `json`). | `{"detail": [{"loc": ["query", "format"], "msg": "string does not match regex", "type": "value_error.str.regex"}]}` |

---

## Frontend Integration Notes

* **Rating Input:** The rating field must map to an integer between 1 and 5. Ensure rating selection widgets (e.g., star icons) enforce this boundary before sending.
* **Optional Text Fields:** Liked text and suggestions are entirely optional. The submit form should allow the user to send only a star rating.
* **Handling 429 Errors:** Client applications must anticipate `429` responses and display a user-friendly throttle message (e.g., "Too many submissions. Please try again later").
