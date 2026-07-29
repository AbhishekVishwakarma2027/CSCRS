# Authentication API

This document provides a detailed specification for all authentication and security management endpoints in the CSCRS API. It defines request payloads, validation constraints, backend business logic flows, expected responses, error conditions, rate limits, and state transitions.

---

## Endpoint Summary

The Authentication controller maps exactly 13 operations under the base route `/api/v1/auth`:

| Method | Endpoint | Credential Requirement | Purpose |
| :---: | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/register` | Public (Unauthenticated) | Register a new Citizen account. |
| **POST** | `/api/v1/auth/login` | Form credentials (`username` + `password`) | Authenticate credentials and issue session JWTs. |
| **GET** | `/api/v1/auth/me` | Bearer Access Token | Retrieve current user profile snapshot. |
| **POST** | `/api/v1/auth/refresh` | JSON `refresh_token` | Rotate refresh token and issue new JWT pair. |
| **POST** | `/api/v1/auth/logout` | JSON `refresh_token` | Revoke a specific refresh token session. |
| **POST** | `/api/v1/auth/logout-all` | Bearer Access Token | Revoke all active refresh sessions for the user. |
| **GET** | `/api/v1/auth/sessions` | Bearer Access Token | List all active device sessions for the user. |
| **POST** | `/api/v1/auth/verify-email` | JSON `email` + 6-digit `otp` | Validate registration OTP to activate the account. |
| **POST** | `/api/v1/auth/resend-otp` | JSON `email` | Regenerate and email a fresh registration OTP. |
| **POST** | `/api/v1/auth/forgot-password` | JSON `email` | Dispatch a password reset OTP. |
| **POST** | `/api/v1/auth/verify-reset-otp` | JSON `email` + `otp` | Validate password reset OTP to authorize a password change. |
| **POST** | `/api/v1/auth/reset-password` | JSON `email` + `otp` + `new_password` | Commit new password hash using a verified reset transaction. |
| **POST** | `/api/v1/auth/change-password` | Bearer Access Token + Current Pass | Update account password while logged in. |

---

## Detailed Endpoint Specifications

---

## `POST /api/v1/auth/register`

### Purpose
Allows a new guest to register a citizen account. This starts the account lifecycle in an unverified state.

### Roles / Authorization
* Public (Unauthenticated).

### Authentication
* No Bearer token required.

### Headers
* `Content-Type: application/json`

### Path Parameters
* `Not applicable`

### Query Parameters
* `Not applicable`

### Request Body / Form Data

| Field | Type | Required | Constraints / Validation | Description |
| :--- | :--- | :---: | :--- | :--- |
| `name` | String | Yes | `min_length=2`, `max_length=100` | Full name of the user. |
| `email` | String | Yes | Valid Email syntax | Unique email address. |
| `phone` | String | Yes | Regex `\d{10}` (10 digits) | Unique mobile contact number. |
| `password` | String | Yes | `min_length=8` | Plain-text password. |

### Validation Rules
* **Pydantic Validation Failures:** Any structural payload error or field constraint violation (e.g. invalid email format, phone not exactly 10 digits, password shorter than 8 chars) is rejected by FastAPI before routing, resulting in an HTTP `422 Unprocessable Entity`.
* **Duplicate Email:** Checks database. If email matches an existing user, aborts with `409 Conflict`.
* **Duplicate Phone:** Checks database. If phone matches an existing user, aborts with `409 Conflict`.
* **Initial State:** Created users have default fields `role=UserRole.CITIZEN`, `is_active=False`, and `is_email_verified=False`.

### Rate Limit
* Configured rate limit: `3 per minutes` (Effective: 3 requests per minute per IP address).

### Business Flow
1. Receives and validates the payload body.
2. Checks for conflicting email or phone records in the database.
3. Hashes the password using `bcrypt` and creates the `User` record.
4. Generates a random 6-digit numeric OTP code.
5. Hashes the OTP using SHA-256 and saves it in the `email_verifications` table with a 5-minute expiry.
6. Triggers background email dispatcher.
7. Commits database transaction and returns response message.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `MessageResponse`

| Field | Type | Description |
| :--- | :--- | :--- |
| `message` | String | Confirmation message stating registration was successful. |

### Example Success Response
```json
{
  "message": "Registration successful. Please check your email for the verification OTP."
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **409** | Email already exists in system. | `{"detail": "Email already registered."}` |
| **409** | Phone number already exists. | `{"detail": "Phone number already registered."}` |
| **422** | Pydantic validation failure (e.g. phone not 10 digits). | `{"detail": [{"loc": ["body", "phone"], "msg": "value_error", "type": "value_error"}]}` |
| **429** | Limit of 3 requests per minute exceeded. | `{"success": false, "message": "Too many requests. Please try again later.", "error_code": "RATE_LIMIT_EXCEEDED"}` |
| **500** | Mail dispatcher failed. | `{"detail": "Failed to send verification email: <error_message>"}` |

### Example Error Response
```json
{
  "detail": "Email already registered."
}
```

### Possible HTTP Status Codes
* `200`, `409`, `422`, `429`, `500`

### Database / State Changes
* New `User` record created (inactive, unverified).
* New `EmailVerification` record created containing hashed OTP, creation timestamp, attempts count, and expiry.

### Side Effects
* Emails verification OTP to user.

### Frontend Integration Notes
* Send the body as a JSON object with headers `Content-Type: application/json`.
* Direct the user immediately to the email verification screen to input the code.

### Related APIs
* [POST /api/v1/auth/verify-email](#post-apiv1authverify-email)
* [POST /api/v1/auth/resend-otp](#post-apiv1authresend-otp)

---

## `POST /api/v1/auth/login`

### Purpose
Authenticates user credentials using form parameter mappings and returns token pairs on success.

### Roles / Authorization
* Public (Unauthenticated).

### Authentication
* Form Credentials (email + password form fields).

### Headers
* `Content-Type: application/x-www-form-urlencoded`

### Path Parameters
* `Not applicable`

### Query Parameters
* `Not applicable`

### Request Body / Form Data

The endpoint expects OAuth2 form payload values:

| Field | Type | Required | Constraints / Validation | Description |
| :--- | :--- | :---: | :--- | :--- |
| `username` | String | Yes | Must be a valid email | Email credential matching target user. |
| `password` | String | Yes | None | Plain-text password credential. |

### Validation Rules
* **Pydantic/FastAPI Form Validation:** Missing form fields result in an HTTP `422 Unprocessable Entity` response.
* **Authentication Validation:** Password matched against database bcrypt hash via `verify_password()`.
* **Lockout Gate:** If consecutive failed attempts reach `5`, checks if `account_locked_until` is in the future. If yes, aborts immediately with `423 Locked`.
* **Activation Gate:** The user's account must have `is_email_verified = True` and `is_active = True`. Otherwise, aborts with `403 Forbidden`.
* **Blocked Gate:** The account must not have `is_blocked = True`. Otherwise, aborts with `403 Forbidden`.

### Rate Limit
* Configured rate limit: `5 per minute` (Effective: 5 requests per minute per IP address).

### Business Flow
1. Fetches user record by `username` (email). If user not found, records a login audit failure (`USER_NOT_FOUND`) and returns `401 Unauthorized`.
2. Validates lockout status. If account is locked, returns `423 Locked`.
3. Validates password.
   * If mismatch, increments `failed_login_attempts`. If attempts reach `5`, sets `account_locked_until` to `now() + 30 minutes`. Writes a failure audit log (`INVALID_PASSWORD`), commits transaction, and throws `401 Unauthorized`.
4. Checks account flags (`is_email_verified`, `is_active`, `is_blocked`). If any checks fail, throws `403 Forbidden`.
5. On success, resets `failed_login_attempts = 0` and `account_locked_until = None`.
6. Generates metadata and issues a new access token (expiry set in JWT as `60` minutes) and a refresh token (expires in `30` days).
7. Hashes the refresh token and saves the session to the database `refresh_tokens` table.
8. Writes login audit success and returns tokens payload.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `TokenResponse`

| Field | Type | Description |
| :--- | :--- | :--- |
| `access_token` | String | JWT access token bearer string. |
| `refresh_token` | String | JWT refresh token string. |
| `token_type` | String | Defaults to `"bearer"`. |
| `expires_in` | Integer | Access token lifetime metadata duration in seconds. **Codebase Inconsistency:** The returned field value is hardcoded as `1800` seconds (30 minutes), while the actual generated JWT token expiration timestamp in the token claim is generated for `60` minutes. |

### Example Success Response
```json
{
  "access_token": "<access_token>",
  "refresh_token": "<refresh_token>",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | User does not exist, or password mismatch. | `{"detail": "Invalid email or password."}` |
| **403** | Email not yet verified. | `{"detail": "Please verify your email before logging in."}` |
| **403** | User is marked inactive. | `{"detail": "Account is inactive. Please contact the administrator."}` |
| **403** | User is marked blocked. | `{"detail": "Your account has been blocked. Please contact the city administration."}` |
| **422** | Required form field parameters missing. | `{"detail": [{"loc": ["body", "username"], "msg": "field required", "type": "value_error.missing"}]}` |
| **423** | User is currently locked out. | `{"detail": "Account is temporarily locked. Try again in 28 minute(s)."}` |
| **429** | Limit of 5 requests per minute exceeded. | `{"success": false, "message": "Too many requests. Please try again later.", "error_code": "RATE_LIMIT_EXCEEDED"}` |

### Possible HTTP Status Codes
* `200`, `401`, `403`, `422`, `423`, `429`

### Database / State Changes
* Resets failed login counters on success.
* Increments failed login counters and sets lockout time on failure.
* Inserts a hashed token entry to `refresh_tokens` session table on success.
* Adds record to `login_audits` audit table.

### Side Effects
* None.

### Frontend Integration Notes
* The request must be encoded as standard form fields (`application/x-www-form-urlencoded`), **not JSON**.

### Related APIs
* [POST /api/v1/auth/refresh](#post-apiv1authrefresh)
* [POST /api/v1/auth/logout](#post-apiv1authlogout)

---

## `GET /api/v1/auth/me`

### Purpose
Returns current snapshot values of the logged-in user profile.

### Roles / Authorization
* Any authenticated user.

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
* Access token must decode successfully. If token signature is invalid, missing, or has expired, immediately returns HTTP `401`.
* User account must be active (`is_active = True`) and not blocked.

### Rate Limit
* No endpoint-specific rate limit verified.

### Business Flow
1. Resolves Bearer access token using auth dependencies.
2. Returns a snapshot dictionary containing user details directly.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** Raw Dictionary (No Pydantic wrapper configured in route).

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Database key identifier of the user. |
| `name` | String | Full name of the user. |
| `email` | String | Registered email address. |
| `role` | String | Value matching role string (e.g. `Citizen`). |

### Example Success Response
```json
{
  "id": 4,
  "name": "Alex Mercer",
  "email": "alex.mercer@gmail.com",
  "role": "Citizen"
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing, invalid, or expired access token. | `{"detail": "Invalid or expired token."}` |
| **403** | User account is inactive. | `{"detail": "Account is inactive."}` |
| **403** | User account is blocked. | `{"detail": "Account has been blocked."}` |

### Possible HTTP Status Codes
* `200`, `401`, `403`

### Database / State Changes
* None.

### Side Effects
* None.

### Related APIs
* [POST /api/v1/auth/login](#post-apiv1authlogin)

---

## `POST /api/v1/auth/refresh`

### Purpose
Exchanges a valid refresh token for a fresh access token and a rotated refresh token.

### Roles / Authorization
* No Bearer token; refresh-token credential required.

### Authentication
* JSON refresh token payload.

### Headers
* `Content-Type: application/json`

### Path Parameters
* `Not applicable`

### Query Parameters
* `Not applicable`

### Request Body / Form Data

| Field | Type | Required | Constraints / Validation | Description |
| :--- | :--- | :---: | :--- | :--- |
| `refresh_token` | String | Yes | Must be a valid JWT of type `"refresh"` | Plain text refresh token. |

### Validation Rules
* **Pydantic Validation:** Malformed JSON structure returns HTTP `422 Unprocessable Entity`.
* **Type Check:** Decoded JWT claim `"type"` must be exactly `"refresh"`.
* **Reuse Detection:** Hashed incoming token search in `refresh_tokens`. If matching token is marked as already revoked (`revoked_at is not None`), system flags token reuse, revokes all sessions under the token's session ID (`session_id`), commits, and returns `401`.
* **State Check:** Target user must exist, be active, and not blocked.

### Rate Limit
* No endpoint-specific rate limit verified.

### Business Flow
1. Decodes incoming refresh token. Checks type claim.
2. Searches token hash database record.
3. If token reuse is detected, revokes session and throws `401`.
4. If token is valid, verifies target user exists, is active, and is not blocked.
5. Generates a new access token (expires in 60 minutes) and a new refresh token (expires in 30 days).
6. Updates old refresh token record (`revoked_at = now()`, `revocation_reason = "ROTATED"`).
7. Inserts new hashed refresh token record under the *same* `session_id` into database.
8. Commits database transaction and returns response models.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `TokenResponse`

| Field | Type | Description |
| :--- | :--- | :--- |
| `access_token` | String | New access token. |
| `refresh_token` | String | New rotated refresh token. |
| `token_type` | String | `"bearer"`. |
| `expires_in` | Integer | Access token expiration metadata duration in seconds. **Codebase Inconsistency:** Returns hardcoded `1800` seconds (30 minutes), while actual JWT claims denote a `60` minute expiration lifetime. |

### Example Success Response
```json
{
  "access_token": "<access_token>",
  "refresh_token": "<refresh_token>",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Token type is not `"refresh"`. | `{"detail": "Invalid refresh token."}` |
| **401** | Rotated token replayed. | `{"detail": "Session has been revoked. Please login again."}` |
| **401** | Refresh token is missing/revoked in database. | `{"detail": "Refresh token not found or revoked."}` |
| **401** | User resolved from token does not exist. | `{"detail": "User not found."}` |
| **403** | User inactive or blocked. | `{"detail": "Account is inactive."}` |
| **422** | Request payload parameter missing or invalid format. | `{"detail": [{"loc": ["body", "refresh_token"], "msg": "field required", "type": "value_error.missing"}]}` |

### Possible HTTP Status Codes
* `200`, `401`, `403`, `422`

### Database / State Changes
* Revokes the utilized refresh token.
* Creates new refresh token session entry.
* Updates session last used timestamp.

### Side Effects
* None.

### Frontend Integration Notes
* On success, immediately replace both stored tokens with the new values.
* If a `401` error returns containing `"Session has been revoked"`, clear all client tokens and redirect the user back to the login screen.

### Related APIs
* [POST /api/v1/auth/login](#post-apiv1authlogin)
* [POST /api/v1/auth/logout](#post-apiv1authlogout)

---

## `POST /api/v1/auth/logout`

### Purpose
Revokes a specific refresh token session, invalidating it from rotation.

### Roles / Authorization
* No Bearer token; refresh-token credential required.

### Authentication
* JSON refresh token payload.

### Headers
* `Content-Type: application/json`

### Path Parameters
* `Not applicable`

### Query Parameters
* `Not applicable`

### Request Body / Form Data

| Field | Type | Required | Constraints / Validation | Description |
| :--- | :--- | :---: | :--- | :--- |
| `refresh_token` | String | Yes | Must be a valid JWT of type `"refresh"` | Plain text refresh token to revoke. |

### Validation Rules
* Same validation checks as `validate_refresh_token()` (type, signature, database presence).
* Malformed request body triggers `422 Unprocessable Entity`.

### Rate Limit
* No endpoint-specific rate limit verified.

### Business Flow
1. Validates and decodes the refresh token.
2. Updates database token entry (`revoked_at = now()`, `revocation_reason = "LOGOUT"`).
3. Commits transaction and returns confirmation.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** Raw Dictionary.

| Field | Type | Description |
| :--- | :--- | :--- |
| `message` | String | `"Logged out successfully."` |

### Example Success Response
```json
{
  "message": "Logged out successfully."
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Token signature invalid or not found. | `{"detail": "Refresh token not found or revoked."}` |
| **422** | Request payload invalid. | `{"detail": [{"loc": ["body", "refresh_token"], "msg": "field required", "type": "value_error.missing"}]}` |

### Possible HTTP Status Codes
* `200`, `401`, `422`

### Database / State Changes
* Marks refresh token as revoked (`revoked_at = now()`, `revocation_reason = "LOGOUT"`).

### Side Effects
* Invalidates token session from device.

### Related APIs
* [POST /api/v1/auth/logout-all](#post-apiv1authlogout-all)

---

## `POST /api/v1/auth/logout-all`

### Purpose
Terminates all active sessions for the user.

### Roles / Authorization
* Any authenticated user.

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

### Rate Limit
* No endpoint-specific rate limit verified.

### Business Flow
1. Authenticates current user from access token.
2. Updates database records for all matching active tokens (`revoked_at = now()`, `revocation_reason = "LOGOUT_ALL"`).
3. Commits and returns confirmation.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** Raw Dictionary.

| Field | Type | Description |
| :--- | :--- | :--- |
| `message` | String | `"Logged out from all devices successfully."` |

### Example Success Response
```json
{
  "message": "Logged out from all devices successfully."
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |

### Possible HTTP Status Codes
* `200`, `401`

### Database / State Changes
* Revokes all active refresh tokens associated with user ID (`revoked_at = now()`, `revocation_reason = "LOGOUT_ALL"`).

### Side Effects
* Terminates user sessions globally across all logged-in devices.

### Related APIs
* [POST /api/v1/auth/logout](#post-apiv1authlogout)
* [GET /api/v1/auth/sessions](#get-apiv1authsessions)

---

## `GET /api/v1/auth/sessions`

### Purpose
Lists metadata details for all active sessions of the user.

### Roles / Authorization
* Any authenticated user.

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

### Rate Limit
* No endpoint-specific rate limit verified.

### Business Flow
1. Authenticates current user from access token.
2. Queries database for all unexpired and unrevoked refresh tokens associated with user ID.
3. Maps matching records to schema collection models and returns payload.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `list[SessionResponse]`

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Database key identifier of session record. |
| `session_id` | String | UUID session tracker. |
| `device_type` | String \| null | Categorized device platform. |
| `browser` | String \| null | User-Agent browser client name. |
| `operating_system` | String \| null | OS client details. |
| `ip_address` | String \| null | Login IP address. |
| `created_at` | DateTime | Timestamp of session creation. |
| `last_used_at` | DateTime \| null | Timestamp of last session refresh. |
| `expires_at` | DateTime | Expiration timestamp of the refresh token. |

### Example Success Response
```json
[
  {
    "id": 12,
    "session_id": "7f8b9c8d-6e5f-4a3b-2c1d-0e9f8a7b6c5d",
    "device_type": "Mobile",
    "browser": "Chrome Mobile",
    "operating_system": "Android",
    "ip_address": "192.168.1.1",
    "created_at": "2026-07-28T10:00:00.123456Z",
    "last_used_at": "2026-07-28T14:19:20.123456Z",
    "expires_at": "2026-08-27T10:00:00Z"
  }
]
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |

### Possible HTTP Status Codes
* `200`, `401`

### Database / State Changes
* None.

### Side Effects
* None.

### Related APIs
* [POST /api/v1/auth/logout-all](#post-apiv1authlogout-all)

---

## `POST /api/v1/auth/verify-email`

### Purpose
Validates the registration OTP code to activate the citizen account.

### Roles / Authorization
* Public (Unauthenticated) with registration credentials.

### Authentication
* Email + OTP verification.

### Headers
* `Content-Type: application/json`

### Path Parameters
* `Not applicable`

### Query Parameters
* `Not applicable`

### Request Body / Form Data

| Field | Type | Required | Constraints / Validation | Description |
| :--- | :--- | :---: | :--- | :--- |
| `email` | String | Yes | Valid Email syntax | Registered email address. |
| `otp` | String | Yes | `min_length=6`, `max_length=6` | 6-digit numeric string OTP. |

### Validation Rules
* **Pydantic Validation:** Invalid email formatting or OTP not exactly 6 characters yields `422 Unprocessable Entity`.
* **Existence Verification:** Searches for pending `EmailVerification` row matching user ID.
* **OTP Code Verification:** Matches incoming OTP against database SHA-256 hash using `verify_otp()`.
* **Attempts Limit:** Checks if `attempts >= 5`. If attempts are exceeded, rejects verification.
* **Expiry Verification:** Checks if `expires_at > now()`. OTP expires in `5` minutes from creation.

### Rate Limit
* Configured rate limit: `5 per minutes` (Effective: 5 requests per minute per IP address).

### Business Flow
1. Validates request payload.
2. Checks user database existence.
3. Retrieves latest `EmailVerification` record.
4. Validates transaction status: checks if already verified, attempts counter, and expiration.
5. Verifies OTP:
   * If mismatch, increments `attempts` counter and throws `400 Bad Request`.
6. On success:
   * Sets `verified = True`.
   * Sets user flags `is_active = True` and `is_email_verified = True`.
7. Commits transaction.
8. Sends success notification email in background and returns response.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `MessageResponse`

| Field | Type | Description |
| :--- | :--- | :--- |
| `message` | String | `"Email verified successfully."` |

### Example Success Response
```json
{
  "message": "Email verified successfully."
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **400** | OTP already verified. | `{"detail": "OTP already verified."}` |
| **400** | Failed validation attempts exceeded. | `{"detail": "Maximum OTP attempts exceeded. Please request a new OTP."}` |
| **400** | OTP is expired. | `{"detail": "OTP expired."}` |
| **400** | OTP code mismatch. | `{"detail": "Invalid OTP."}` |
| **404** | User does not exist. | `{"detail": "User not found."}` |
| **404** | Verification record not found. | `{"detail": "Verification request not found."}` |
| **422** | Invalid email format or OTP length not equal to 6. | `{"detail": [{"loc": ["body", "otp"], "msg": "ensure this value has at most 6 characters", "type": "value_error.any_str.max_length"}]}` |
| **429** | Limit of 5 requests per minute exceeded. | `{"success": false, "message": "Too many requests. Please try again later.", "error_code": "RATE_LIMIT_EXCEEDED"}` |

### Possible HTTP Status Codes
* `200`, `400`, `404`, `422`, `429`

### Database / State Changes
* Sets `verified = True` in verification record.
* Increments failed verification attempts counter on mismatch.
* Updates User flags `is_active = True` and `is_email_verified = True` on success.

### Side Effects
* Sends email notification confirming successful account activation.

### Related APIs
* [POST /api/v1/auth/register](#post-apiv1authregister)
* [POST /api/v1/auth/resend-otp](#post-apiv1authresend-otp)

---

## `POST /api/v1/auth/resend-otp`

### Purpose
Regenerates and emails a fresh registration OTP to unverified accounts.

### Roles / Authorization
* Public (Unauthenticated) with registration credentials.

### Authentication
* Email lookup.

### Headers
* `Content-Type: application/json`

### Path Parameters
* `Not applicable`

### Query Parameters
* `Not applicable`

### Request Body / Form Data

| Field | Type | Required | Constraints / Validation | Description |
| :--- | :--- | :---: | :--- | :--- |
| `email` | String | Yes | Valid Email syntax | Registered email address. |

### Validation Rules
* **Pydantic Validation:** Invalid email format triggers HTTP `422`.
* **Verification Check:** Target user must be unverified (`is_email_verified = False`).

### Rate Limit
* Configured rate limit: `5 per 10 minute` (Effective: 5 requests per 10 minutes per IP address).

### Business Flow
1. Validates request payload.
2. Checks user database existence. Throws `404` if not found.
3. Checks if user is already verified. If yes, throws `400`.
4. Deletes previous unverified verification entries.
5. Generates a new 6-digit OTP, hashes it, and saves a fresh `EmailVerification` record with a 5-minute expiry.
6. Triggers background email dispatcher.
7. Commits database transaction and returns response message.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `MessageResponse`

| Field | Type | Description |
| :--- | :--- | :--- |
| `message` | String | `"A new verification OTP has been sent to your email."` |

### Example Success Response
```json
{
  "message": "A new verification OTP has been sent to your email."
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **400** | User email is already verified. | `{"detail": "Email already verified."}` |
| **404** | User does not exist. | `{"detail": "User not found."}` |
| **422** | Invalid email payload format. | `{"detail": [{"loc": ["body", "email"], "msg": "value is not a valid email address", "type": "value_error.email"}]}` |
| **429** | Limit of 5 requests per 10 minutes exceeded. | `{"success": false, "message": "Too many requests. Please try again later.", "error_code": "RATE_LIMIT_EXCEEDED"}` |
| **500** | Mail dispatcher failed. | `{"detail": "Failed to send verification email: <error>"}` |

### Possible HTTP Status Codes
* `200`, `400`, `404`, `422`, `429`, `500`

### Database / State Changes
* Deletes previous unverified verification transaction.
* Saves fresh `EmailVerification` record (hashed OTP, creation time, attempts counter, 5-minute expiry).

### Side Effects
* Sends verification email containing OTP to user.

### Related APIs
* [POST /api/v1/auth/verify-email](#post-apiv1authverify-email)

---

## `POST /api/v1/auth/forgot-password`

### Purpose
Initiates the password recovery flow by generating and emailing a reset OTP.

### Roles / Authorization
* Public (Unauthenticated) with recovery credentials.

### Authentication
* Email lookup.

### Headers
* `Content-Type: application/json`

### Path Parameters
* `Not applicable`

### Query Parameters
* `Not applicable`

### Request Body / Form Data

| Field | Type | Required | Constraints / Validation | Description |
| :--- | :--- | :---: | :--- | :--- |
| `email` | String | Yes | Valid Email syntax | Registered email address of user. |

### Validation Rules
* **Pydantic Validation:** Invalid email format triggers HTTP `422`.
* **Privacy Preserving Check (Non-Enumeration):** If user does not exist, the API bypasses record updates and returns a fake success message (`200 OK`) to prevent user enumeration security issues.

### Rate Limit
* Configured rate limit: `3 per 15 minutes` (Effective: 3 requests per 15 minutes per IP address).

### Business Flow
1. Validates request payload.
2. Checks user database existence.
   * If user is not found, returns success message immediately to preserve privacy.
3. Deletes previous unverified transactions.
4. Generates a new 6-digit OTP, hashes it, and saves a fresh `PasswordReset` record (valid for `5` minutes, limited to `5` failed validation attempts).
5. Triggers background email dispatcher.
6. Commits database transaction and returns response message.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `MessageResponse`

| Field | Type | Description |
| :--- | :--- | :--- |
| `message` | String | `"If the email is registered, a password reset OTP has been sent."` |

### Example Success Response
```json
{
  "message": "If the email is registered, a password reset OTP has been sent."
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **422** | Invalid email format. | `{"detail": [{"loc": ["body", "email"], "msg": "value is not a valid email address", "type": "value_error.email"}]}` |
| **429** | Limit of 3 requests per 15 minutes exceeded. | `{"success": false, "message": "Too many requests. Please try again later.", "error_code": "RATE_LIMIT_EXCEEDED"}` |
| **500** | Mail dispatcher failed. | `{"detail": "Failed to send reset email: <error>"}` |

### Possible HTTP Status Codes
* `200`, `422`, `429`, `500`

### Database / State Changes
* Saves fresh `PasswordReset` record containing user ID, hashed OTP, attempts count, verification status (`verified = False`), and expiry timestamp.

### Side Effects
* Sends email containing OTP to user.

### Related APIs
* [POST /api/v1/auth/verify-reset-otp](#post-apiv1authverify-reset-otp)
* [POST /api/v1/auth/reset-password](#post-apiv1authreset-password)

---

## `POST /api/v1/auth/verify-reset-otp`

### Purpose
Validates the password reset OTP code. Authorizes the client to perform a password change.

### Roles / Authorization
* Public (Unauthenticated) with recovery credentials.

### Authentication
* Email + OTP verification.

### Headers
* `Content-Type: application/json`

### Path Parameters
* `Not applicable`

### Query Parameters
* `Not applicable`

### Request Body / Form Data

| Field | Type | Required | Constraints / Validation | Description |
| :--- | :--- | :---: | :--- | :--- |
| `email` | String | Yes | Valid Email syntax | Registered email address. |
| `otp` | String | Yes | None (Generic String) | 6-digit numeric string OTP. |

### Validation Rules
* **Pydantic Validation:** Invalid email format triggers HTTP `422`.
* **OTP Verification:** Match validation against database SHA-256 hash using `verify_otp()`.
* **Attempts Check:** Verification fails if `attempts >= 5`.
* **Expiry Check:** OTP must not be expired (5-minute expiry).

### Rate Limit
* Configured rate limit: `5 per 10 minutes` (Effective: 5 requests per 10 minutes per IP address).

### Business Flow
1. Validates request payload.
2. Checks user database existence. Throws `404` if not found.
3. Retrieves latest `PasswordReset` record for user. If not found, throws `404`.
4. Evaluates transaction status (checks if already verified, attempts counter, and expiry).
5. Verifies OTP:
   * If mismatch, increments `attempts` counter and throws `400 Bad Request`.
6. On success:
   * Updates state `verified = True`.
7. Commits database transaction and returns response message.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `MessageResponse`

| Field | Type | Description |
| :--- | :--- | :--- |
| `message` | String | `"OTP verified successfully."` |

### Example Success Response
```json
{
  "message": "OTP verified successfully."
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **400** | OTP already verified. | `{"detail": "OTP already verified."}` |
| **400** | Failed validation attempts exceeded. | `{"detail": "Maximum OTP attempts exceeded. Please request a new OTP."}` |
| **400** | OTP is expired. | `{"detail": "OTP expired."}` |
| **400** | OTP code mismatch. | `{"detail": "Invalid OTP."}` |
| **404** | User does not exist. | `{"detail": "User not found."}` |
| **404** | Password reset record not found. | `{"detail": "Password reset request not found."}` |
| **422** | Invalid email payload format. | `{"detail": [{"loc": ["body", "email"], "msg": "value is not a valid email address", "type": "value_error.email"}]}` |
| **429** | Limit of 5 requests per 10 minutes exceeded. | `{"success": false, "message": "Too many requests. Please try again later.", "error_code": "RATE_LIMIT_EXCEEDED"}` |

### Possible HTTP Status Codes
* `200`, `400`, `404`, `422`, `429`

### Database / State Changes
* Sets `verified = True` in `PasswordReset` transaction record.
* Increments failed verification attempts counter on mismatch.

### Side Effects
* None.

### Related APIs
* [POST /api/v1/auth/forgot-password](#post-apiv1authforgot-password)
* [POST /api/v1/auth/reset-password](#post-apiv1authreset-password)

---

## `POST /api/v1/auth/reset-password`

### Purpose
Resets the account password using a verified OTP transaction.

### Roles / Authorization
* Public (Unauthenticated) with reset credentials.

### Authentication
* Reset transaction.

### Headers
* `Content-Type: application/json`

### Path Parameters
* `Not applicable`

### Query Parameters
* `Not applicable`

### Request Body / Form Data

| Field | Type | Required | Constraints / Validation | Description |
| :--- | :--- | :---: | :--- | :--- |
| `email` | String | Yes | Valid Email syntax | Registered email address. |
| `otp` | String | Yes | None | 6-digit numeric string OTP. |
| `new_password` | String | Yes | `min_length=8`, `max_length=128` | Plain-text new password. |

### Validation Rules
* **Pydantic Validation:** Mismatched types, invalid email formats, or a password under 8 characters result in HTTP `422`.
* **Transaction State Verification:** The latest `PasswordReset` transaction must have `verified = True`.
* **Expiry Check:** OTP must not be expired.

### Rate Limit
* Configured rate limit: `5 per 15 minutes` (Effective: 5 requests per 15 minutes per IP address).

### Business Flow
1. Validates request payload.
2. Checks user database existence. Throws `404` if not found.
3. Retrieves latest `PasswordReset` transaction.
4. Validates state: verifies transaction is verified (`verified = True`) and not expired.
5. Hashes the new password via `hash_password()`.
6. Updates database user entry with new password hash.
7. Sets the password reset transaction record to `verified = False` (revokes the transaction to prevent reuse).
8. Commits database transaction and returns response message.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `MessageResponse`

| Field | Type | Description |
| :--- | :--- | :--- |
| `message` | String | `"Password reset successfully."` |

### Example Success Response
```json
{
  "message": "Password reset successfully."
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **400** | Reset transaction is not verified. | `{"detail": "Please verify the OTP first."}` |
| **400** | OTP is expired. | `{"detail": "OTP expired."}` |
| **404** | User does not exist. | `{"detail": "User not found."}` |
| **404** | Password reset record not found. | `{"detail": "Password reset request not found."}` |
| **422** | Invalid payload parameters (e.g. password too short). | `{"detail": [{"loc": ["body", "new_password"], "msg": "ensure this value has at least 8 characters", "type": "value_error.any_str.min_length"}]}` |
| **429** | Limit of 5 requests per 15 minutes exceeded. | `{"success": false, "message": "Too many requests. Please try again later.", "error_code": "RATE_LIMIT_EXCEEDED"}` |

### Possible HTTP Status Codes
* `200`, `400`, `404`, `422`, `429`

### Database / State Changes
* Updates password hash in User record.
* Sets `verified = False` in `PasswordReset` transaction record.

### Side Effects
* None.

### Related APIs
* [POST /api/v1/auth/forgot-password](#post-apiv1authforgot-password)
* [POST /api/v1/auth/verify-reset-otp](#post-apiv1authverify-reset-otp)

---

## `POST /api/v1/auth/change-password`

### Purpose
Updates the account password for logged-in users.

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
| `old_password` | String | Yes | None | Current plain-text password. |
| `new_password` | String | Yes | `min_length=8`, `max_length=128` | Plain-text new password. |
| `confirm_password` | String | Yes | `min_length=8`, `max_length=128` | Confirmation of new password. |

### Validation Rules
* **Pydantic Validation:** Payload errors (e.g. password parameters shorter than 8 characters) result in HTTP `422`.
* **Password Validation:** The `old_password` must match the current password hash.
* **Match Validation:** The `new_password` must be identical to `confirm_password`.
* **Difference Check:** The `new_password` must be different from `old_password`.

### Rate Limit
* `2 per 15 minutes` — Limits in-session password changes to 2 requests every 15 minutes per user. Keyed by authenticated user ID (`user:<user_id>`).

### Business Flow
1. Authenticates current user from access token.
2. Checks `old_password` matches current password hash. If mismatch, throws `400`.
3. Verifies `new_password` matches `confirm_password`. If mismatch, throws `400`.
4. Verifies `new_password` is different from current password. If identical, throws `400`.
5. Hashes the new password via `hash_password()`.
6. Updates database user entry with new password hash.
7. Commits database transaction and returns response message.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `MessageResponse`

| Field | Type | Description |
| :--- | :--- | :--- |
| `message` | String | `"Password changed successfully."` |

### Example Success Response
```json
{
  "message": "Password changed successfully."
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **400** | Old password does not match current hash. | `{"detail": "Current password is incorrect."}` |
| **400** | New password and confirm password do not match. | `{"detail": "New password and confirm password do not match."}` |
| **400** | New password matches old password hash. | `{"detail": "New password must be different from the current password."}` |
| **401** | Missing/invalid access token. | `{"detail": "Invalid or expired token."}` |
| **422** | Invalid parameter payload. | `{"detail": [{"loc": ["body", "new_password"], "msg": "ensure this value has at least 8 characters", "type": "value_error.any_str.min_length"}]}` |
| **429** | Rate limit exceeded (2 per 15 minutes). | `{"success": false, "message": "Too many requests. Please try again later.", "error_code": "RATE_LIMIT_EXCEEDED"}` |

### Possible HTTP Status Codes
* `200`, `400`, `401`, `422`, `429`

### Database / State Changes
* Updates password hash in User record.

### Side Effects
* None.

### Frontend Integration Notes
* Call this route from a secure "Change Password" user settings screen. 
* Note that this endpoint does not automatically revoke active session tokens, meaning the user is not automatically logged out from other sessions.

### Related APIs
* [GET /api/v1/auth/me](#get-apiv1authme)

---

## Authentication Workflow Cross-Reference

* **Registration Lifecycle:**
  `[POST /register]` $\rightarrow$ `[POST /verify-email]` (Account Activates) $\rightarrow$ `[POST /login]`
* **Session Renewal & Revocation:**
  `[POST /login]` $\rightarrow$ `[POST /refresh]` (Sliding Session) $\rightarrow$ `[POST /logout]` / `[POST /logout-all]`
* **Password Recovery Lifecycle:**
  `[POST /forgot-password]` $\rightarrow$ `[POST /verify-reset-otp]` $\rightarrow$ `[POST /reset-password]`
