# 05 - Response and Error Handling

This document specifies the formatting conventions for API responses and the structured error schema returned by the CSCRS backend.

## 1. Response Formats & Envelopes
The CSCRS API does not enforce a single, universal wrapping envelope for all responses. Instead, payload formatting is determined by the specific endpoint's schema requirements:
* **Pydantic Response Models:** Standard endpoints return typed JSON objects matching defined schemas (e.g. `TokenResponse`, `ReportResponse`, `WorkerAssignmentResponse`).
* **Raw Dictionary Responses:** Certain utilities or simple controllers return unstructured, plain key-value JSON objects (e.g., the `GET /api/v1/auth/me` profile payload, token revoke responses).
* **Streaming & File Responses:** Binary file exports return streaming media attachments with matching header properties (e.g. `application/pdf` for performance report downloads, or `image/jpeg` static content mapping from `/uploads`).

---

## 2. Global HTTP Status Code Reference
The backend issues specific HTTP status codes to communicate request results:

| Status Code | Semantics | Typical Triggers & Usage |
| :---: | :--- | :--- |
| **200** | OK | Successful read query, update, or action execution. |
| **201** | Created | Successful creation of an entity (e.g. creating departments, worker profiles, reports). |
| **400** | Bad Request | Input validation error (e.g., missing attachments, bad OTP credentials, file verification failure). |
| **401** | Unauthorized | Authentication failures (invalid Bearer signature, expired session, user not found). |
| **403** | Forbidden | Authorization failures (role permission denied, out of physical work radius, inactive/blocked account). |
| **404** | Not Found | Target database record does not exist (e.g. report number mismatch, task ID not found). |
| **409** | Conflict | Unique database constraint violation (e.g. email/phone already registered, duplicate report location). |
| **413** | Payload Too Large | File upload size exceeds limit (greater than 10MB for reports/resolutions, 5MB for profile photos). |
| **423** | Locked | Account lockout due to consecutive login failures (locked for 30 minutes after 5 failures). |
| **429** | Too Many Requests | Rate limit exceeded (controlled by SlowAPI). |
| **500** | Internal Server Error | Unexpected server runtime exception (e.g., SMTP dispatch failure, ML model runtime crash). |
| **503** | Service Unavailable | Deployment readiness probe failure (unreachable SQL database). |

*Note: Endpoint-specific chapters are the authoritative guide for determining which particular codes apply to individual operations.*

---

## 3. Error Payload Schemas

### Standard FastAPI Validation Error (HTTP 422)
When a request fails Pydantic schema verification, FastAPI returns a detailed list of parameter validation failures:
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

### Standard Backend HTTPExceptions (HTTP 400, 401, 403, 404, 409, 413, 500)
For logical backend validation errors, the API returns a standardized detail dictionary:
```json
{
  "detail": "Invalid email or password."
}
```
*Certain endpoints may return an object inside `detail` instead of a string (e.g., the root `/readiness` probe returns `{"status": "not_ready", "database": "disconnected"}` inside the HTTP 503 error detail).*

### Account Lockout Error (HTTP 423)
Returned when an account is temporarily locked due to 5 consecutive failed login attempts:
```json
{
  "detail": "Account is temporarily locked. Try again in 30 minute(s)."
}
```

### Custom Rate Limit Exceeded Error (HTTP 429)
When a SlowAPI decorator triggers, the custom app exception handler formats the response into a structured JSON payload:
```json
{
  "success": false,
  "message": "Too many requests. Please try again later.",
  "error_code": "RATE_LIMIT_EXCEEDED"
}
```
