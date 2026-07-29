# 07 - Rate Limiting

The CSCRS API prevents abuse and resource exhaustion by enforcing traffic thresholds on sensitive or resource-intensive endpoints.

## 1. Rate Limiting Backend & Storage
* **Library:** Built on the `slowapi` library, which integrates standard rate-limiting decorators into FastAPI route handlers.
* **Storage Provider:** Confirmed as **Redis** using the connection string `REDIS_URL` (configured in `configs/config.py`). Rate limit counters are tracked globally in memory across multi-worker deployments.

---

## 2. Key Strategy (`smart_rate_limit_key`)
Rate limits are tracked against callers using the `smart_rate_limit_key` helper (`utils/rate_limiter.py`), which resolves keys with the following priority order:
1. **Authenticated User (`user:{user_id}`):** If the incoming request has a valid JWT `Authorization: Bearer <token>` header, the backend decodes it and extracts the subject `sub`. The rate limit key is set to `user:<user_id>`. This ensures a malicious caller cannot bypass limits simply by rotating their IP address.
2. **Client IP Address (`ip:{client_ip}`):** If the request is unauthenticated (or the JWT is missing/corrupted), the backend falls back to the client IP address resolving the key to `ip:<client_ip>`.

---

## 3. Rate-Limit Exceeded Exception Response (HTTP 429)
When a client exceeds the limit configured for an endpoint, the request is blocked before reaching the router controller. The application-level custom `RateLimitExceeded` exception handler returns a structured JSON response:

* **HTTP Status Code:** `429 Too Many Requests`
* **JSON Payload:**
  ```json
  {
    "success": false,
    "message": "Too many requests. Please try again later.",
    "error_code": "RATE_LIMIT_EXCEEDED"
  }
  ```

---

## 4. Rate-Limited Endpoints Reference
The following table catalogs every rate-limited endpoint in the backend. 
*Note: Configured rate-limit strings are transcribed exactly as declared in the Python source code decorators (including unusual singular/plural endings like `per minutes` or `per 10 minute` which are processed by SlowAPI's internal parser).*

| HTTP Method | Route Endpoint | Configured Rate Limit String | Effective Window & Behavior |
| :---: | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/register` | `3 per minutes` | Limits new registration requests to 3 per minute. |
| **POST** | `/api/v1/auth/login` | `5 per minute` | Limits login requests to 5 per minute per IP. |
| **POST** | `/api/v1/auth/verify-email` | `5 per minutes` | Limits email verification attempts to 5 per minute. |
| **POST** | `/api/v1/auth/resend-otp` | `5 per 10 minute` | Limits OTP resend requests to 5 every 10 minutes. |
| **POST** | `/api/v1/auth/forgot-password` | `3 per 15 minutes` | Limits password recovery requests to 3 every 15 minutes. |
| **POST** | `/api/v1/auth/verify-reset-otp` | `5 per 10 minutes` | Limits password reset OTP checks to 5 every 10 minutes. |
| **POST** | `/api/v1/auth/reset-password` | `5 per 15 minutes` | Limits final password resets to 5 every 15 minutes. |
| **POST** | `/api/v1/auth/change-password` | `2 per 15 minutes` | Limits in-session password changes to 2 every 15 minutes. |
| **POST** | `/api/v1/report` | `60 per hour` | Limits citizens to submitting 60 complaints per hour. |
| **POST** | `/api/v1/resolutions` | `20 per hour` | Limits workers to uploading 20 resolutions per hour. |
| **POST** | `/api/v1/feedback` | `10 per hour` | Limits feedback submissions to 10 per hour. |
| **POST** | `/api/v1/issues` | `20 per hour` | Limits system bug ticket submissions to 20 per hour. |
| **GET** | `/api/v1/reports/department/download` | `20 per hour` | Limits department report PDF exports to 20 per hour. |
| **GET** | `/api/v1/reports/city/download` | `20 per hour` | Limits city report PDF exports to 20 per hour. |
