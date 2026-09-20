# CSCRS Security Architecture Specification

This document details the security model, authentication mechanisms, authorization constraints, data privacy safeguards, and operational protection layers implemented in the **Crowdsourced Civic Issue Reporting and Resolution System (CSCRS)** (`backend/authentication`).

---

## 1. Authentication Architecture & Token Lifecycles

### JSON Web Tokens (JWT)
- **Algorithm**: `HS256` symmetric key signature using cryptographic `SECRET_KEY`.
- **Payload Contents**:
  - `sub`: Authenticated User ID (Integer string)
  - `role`: Assigned user role string (`Citizen`, `Worker`, `DepartmentAdmin`, `CityAdmin`, `SuperAdmin`)
  - `exp`: UNIX timestamp defining token expiration (`ACCESS_TOKEN_EXPIRE_MINUTES`, default 60 mins).

### Refresh Token Rotation & Session Revocation (`RefreshToken` Model)
- Access tokens are accompanied by a database-backed **Refresh Token**.
- Refresh token strings are hashed using SHA-256 before storage in the `refresh_tokens` table.
- Stores client metadata (`device_info`, `ip_address`, `expires_at`, `is_revoked`).
- **Session Endpoints**:
  - `/api/v1/auth/refresh`: Rotates active refresh token, revoking the previous token and issuing a new token pair.
  - `/api/v1/auth/logout`: Revokes target device refresh session.
  - `/api/v1/auth/logout-all`: Invalidates all active sessions for the user.

---

## 2. Password & OTP Security Controls

### Password Hashing
- Account passwords are encrypted using `bcrypt` password hashing with dynamic salt generation. Plaintext passwords are never stored or logged.

### Email Verification & OTP Cooldown Rules (`EmailVerification` Model)
- **6-Digit Numeric OTP**: Generated using cryptographically secure random number generators.
- **Expiry Limit**: OTP expires after **5 minutes** (`OTP_EXPIRY_MINUTES`).
- **Attempt Throttling**: Maximum **5 failed attempts** allowed before OTP invalidation.
- **Resend Cooldown**: Enforces a strict **60-second cooldown** between consecutive OTP resend requests (`OTP_RESEND_COOLDOWN_SECONDS`).

---

## 3. Role-Based Access Control (RBAC) Enforcement

System authorization relies on explicit route-level dependency guards in `backend/authentication/dependencies.py`:

```python
def require_roles(*allowed_roles: UserRole):
    def dependency(current_user=Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied.",
            )
        return current_user
    return dependency
```

### Exact Role Mapping Dependencies
- `require_citizen()` $\rightarrow$ `UserRole.CITIZEN`
- `require_worker()` $\rightarrow$ `UserRole.WORKER`
- `require_department_admin()` $\rightarrow$ `UserRole.DEPARTMENT_ADMIN`
- `require_city_admin()` $\rightarrow$ `UserRole.CITY_ADMIN`
- `require_super_admin()` $\rightarrow$ `UserRole.SUPER_ADMIN`
- `require_admin()` $\rightarrow$ `DEPARTMENT_ADMIN`, `SUPER_ADMIN`
- `require_admin_reports()` $\rightarrow$ `CITY_ADMIN`, `DEPARTMENT_ADMIN`
- `require_city_or_super_admin()` $\rightarrow$ `CITY_ADMIN`, `SUPER_ADMIN`

*Note: Access control is strictly enforced at the API layer regardless of UI visibility.*

---

## 4. Upload File & Media Validation (`utils/file_utils.py`)

All uploaded files (citizen report photos, resolution proofs, update thumbnails, bug attachments) pass through mandatory validation (`validate_uploaded_file`):

- **Extension Whitelist**: `.jpg`, `.jpeg`, `.png`, `.webp` (case-insensitive).
- **MIME-Type Validation**: `image/jpeg`, `image/png`, `image/webp`.
- **File Size Upper Bound**: Enforces maximum upload size (`MAX_FILE_SIZE`, default 10MB).
- **Sanitized Filename Generation**: Files are renamed upon arrival using UUID v4 strings (`generate_filename`), preventing directory traversal attacks (`../`) and filename injection.

---

## 5. Location EXIF & Spatial Geofence Verification

- **EXIF GPS Verification**: Citizen photo uploads undergo automatic EXIF metadata extraction (`utils/gps.py`). Photos lacking GPS EXIF tags or containing invalid coordinates fail validation.
- **Worker 30-Meter Geofence**: Field workers initiating work on an assigned report (`/api/v1/assignments/{id}/start`) must submit real-time GPS coordinates. The backend verifies the worker is within **30 meters** (`START_WORK_RADIUS_METERS`) of the report location.

---

## 6. Authenticated Media Access Controls

- Public landing assets and press update thumbnails are served publicly via `/api/v1/public/updates/images/{filename}`.
- Sensitive civic issue evidence and admin report details require authenticated session tokens via `/api/v1/reports/{report_id}/admin/image` which validates user role permissions prior to streaming `FileResponse`.

---

## 7. Rate Limiting & Denial of Service Protection

Implemented using `SlowAPI` with a Redis backend (`utils/rate_limiter.py`):
- Citizen Report Submission: **60 requests per hour** (`@limiter.limit("60 per hour")`).
- Worker Resolution Upload: **20 requests per hour**.
- Bug & System Issue Filing: **20 requests per hour**.
- PDF Report Downloads: **20 requests per hour**.

---

## 8. Audit Logging & Login Security Tracking

- **System Audit Log (`AuditLog` Model)**: Records sensitive administrative actions (blocking users, cancelling reports, accepting department transfers) with actor ID, action code, timestamp, and remote IP address.
- **Login Security Audit (`LoginAudit` Model)**: Logged during every `/api/v1/auth/login` attempt. Tracks user email, success/failure status, remote IP address, user-agent string, and failure reason.

---

## 9. CORS, Reverse Proxy & Security Headers

- **Cross-Origin Resource Sharing (CORS)**: Configured in `backend/api/app.py` with explicit allowed origins (`FRONTEND_BASE_URL`) and dynamic regex matching for preview deployments (`r"https://.*\.vercel\.app"`). `allow_credentials=True` is enabled.
- **HTTP Security Headers**: Injected via custom FastAPI middleware:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- **Proxy Configuration**: Nginx forwards client IP details (`X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`).

---

## 10. Database Access Security

- All SQL interactions utilize SQLAlchemy ORM parameterized queries, completely immune to SQL injection.
- Database credentials (`POSTGRES_USER`, `POSTGRES_PASSWORD`) are loaded via environment variables and never checked into source control.
