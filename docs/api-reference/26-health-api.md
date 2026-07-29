# Health API

The Health API provides public readiness, liveness, and diagnostics check endpoints used for container orchestration (such as Kubernetes probes), load balancer status monitoring, and production deployment health assertions.

---

## Endpoint Summary

The Health controller exposes exactly **3 operations** directly at the root path:

| Method | Endpoint | Authentication | Purpose |
| :---: | :--- | :---: | :--- |
| **GET** | `/health` | Public | Retrieve shallow status, version, and server timestamp. |
| **GET** | `/liveness` | Public | Check if the FastAPI application process is alive. |
| **GET** | `/readiness` | Public | Validate database connection health and query execution capability. |

---

## Liveness and Readiness Semantics

The backend implements standard decoupled checks:
* **Liveness:** The `/liveness` route returns immediately, asserting only that the Uvicorn/FastAPI runtime process is running and accepting HTTP requests. It performs no dependency queries.
* **Readiness:** The `/readiness` route performs an active check on the backing PostgreSQL database. It asserts that the application can check out a connection and execute SQL queries successfully.

---

## Dependency Coverage

Status checks verify the following platform dependencies:

| Dependency | Checked by Health API | Failure Behavior |
| :--- | :---: | :--- |
| **PostgreSQL Database** | **Yes** (via `/readiness`) | Propagates exception and raises `503 Service Unavailable` with connection error details. |
| **Redis Cache / Rate Limiter** | **No** | Not verified from current implementation. |
| **YOLO AI Detection Engine** | **No** | Not verified from current implementation. |
| **Local Upload Directory** | **No** | Not verified from current implementation. |
| **SMTP Mail Server** | **No** | Not verified from current implementation. |

---

## Detailed Endpoint Specifications

---

## `GET /health`

### Purpose
Retrieves a shallow API status and system parameters.

### Roles / Authorization
* Public route. No auth limits.

### Authentication
* Public access.

### Headers
* `Content-Type: application/json`

### Path / Query Parameters
* `Not applicable`

### Request Body / Form Data
* `Not applicable`

### Validation Rules
* `Not applicable`

### Rate Limit
* `No endpoint-specific rate limit verified.`

### Business Flow
1. Receives GET request.
2. Formats current UTC datetime to ISO-8601 string.
3. Returns status dictionary.

### Success Response
* **HTTP Status:** `200 OK`

| Field | Type | Description |
| :--- | :--- | :--- |
| `status` | String | Fixed status string (`"healthy"`). |
| `service` | String | Service name (`"CSCRS API"`). |
| `version` | String | Semantic version (`"1.0.0"`). |
| `timestamp` | String | ISO-8601 formatted UTC timestamp. |

### Example Success Response
```json
{
  "status": "healthy",
  "service": "CSCRS API",
  "version": "1.0.0",
  "timestamp": "2026-07-28T18:45:00.123456+00:00"
}
```

### Possible HTTP Status Codes
* `200`

---

## `GET /liveness`

### Purpose
Liveness probe asserting the FastAPI process is running.

### Roles / Authorization
* Public access.

### Success Response
* **HTTP Status:** `200 OK`

```json
{
  "status": "alive"
}
```

### Possible HTTP Status Codes
* `200`

---

## `GET /readiness`

### Purpose
Readiness probe verifying active database availability.

### Roles / Authorization
* Public access.

### Business Flow
1. Opens a database session via `SessionLocal()`.
2. Executes test query: `SELECT 1`.
3. If successful, returns status dictionary.
4. If connection fails or query throws an error, raises `503 Service Unavailable`.
5. Closes connection session in `finally` block to prevent leaks.

### Success Response
* **HTTP Status:** `200 OK`

```json
{
  "status": "ready",
  "database": "connected"
}
```

### Failure Response
* **HTTP Status:** `503 Service Unavailable`

```json
{
  "detail": {
    "status": "not_ready",
    "database": "disconnected"
  }
}
```

### Possible HTTP Status Codes
* `200`, `503`

---

## Deployment / Monitoring Notes

* **Load Balancer Configuration:** Configure the primary target group to query `/liveness` or `/health` for basic health validation.
* **Kubernetes Probes:**
  * Map `livenessProbe` to `/liveness`.
  * Map `readinessProbe` to `/readiness` to ensure traffic routing is delayed until database migrations are finished and connections can be established.
* **Secret Leak Check:** The readiness response details contain no connection string parameters or database credentials.
