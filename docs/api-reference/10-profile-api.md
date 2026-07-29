# Profile API

This document provides a detailed specification for all profile management endpoints in the CSCRS API. It allows authenticated users to inspect their profile snapshots, update editable contact details, and manage their profile photos.

---

## Endpoint Summary

The Profile controller maps exactly 4 operations under the base route `/api/v1/profile`:

| Method | Endpoint | Roles | Authentication | Purpose |
| :---: | :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/profile/me` | Any Authenticated Role | Bearer Access Token | Retrieve full detailed profile snapshot, including role-specific sub-profiles. |
| **PATCH** | `/api/v1/profile/me` | Any Authenticated Role | Bearer Access Token | Update editable profile contact fields (name, phone). |
| **POST** | `/api/v1/profile/photo` | Any Authenticated Role | Bearer Access Token | Upload or overwrite a profile photo (max 5MB). |
| **DELETE** | `/api/v1/profile/photo` | Any Authenticated Role | Bearer Access Token | Delete the current profile photo from the system and storage. |

---

## Detailed Endpoint Specifications

---

## `GET /api/v1/profile/me`

### Purpose
Retrieves the full profile details of the currently authenticated user. Unlike `/api/v1/auth/me`, this endpoint dynamically resolves and populates role-specific details (such as department names, worker designations, and employee codes).

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
* Caller account must be active (`is_active = True`) and not blocked.

### Rate Limit
* `No endpoint-specific rate limit verified.`

### Business Flow
1. Resolves and validates the Bearer access token.
2. Fetches the core user columns.
3. If user has a profile image path, builds a fully qualified URL by prepending the `APP_BASE_URL` configuration value.
4. Checks user role:
   * **Worker:** Queries the `worker_profiles` table, resolves their municipal department name, and populates `employee_code`, `designation`, `phone_extension`, `joined_at`, and `is_available`.
   * **DepartmentAdmin:** Queries the `departments` table and populates `department_id`, `department_name`, and `designation="Department Administrator"`.
   * **CityAdmin:** Populates `designation="City Administrator"`.
   * **Citizen / SuperAdmin:** Keeps secondary fields as `None` or defaults.
5. Serializes the combined profile dictionary to the Pydantic schema and returns the response.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `ProfileResponse`

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | Database key identifier of the user. |
| `name` | String | Full name of the user. |
| `email` | String | Registered email address. |
| `phone` | String \| null | Registered mobile number. |
| `role` | String | PascalCase user role string (e.g. `Worker`). |
| `profile_image` | String \| null | Fully qualified public URL to the profile photo. |
| `is_email_verified` | Boolean | True if the email has been verified. |
| `is_active` | Boolean | True if the account is active. |
| `department_id` | Integer \| null | ID of the municipal department (Workers and DeptAdmins only). |
| `department_name` | String \| null | Name of the municipal department (Workers and DeptAdmins only). |
| `employee_code` | String \| null | Unique worker employee code (Workers only). |
| `designation` | String \| null | Title designation (Workers, DeptAdmins, and CityAdmins only). |
| `phone_extension` | String \| null | Desk extension number (Workers only). |
| `joined_at` | DateTime \| null | Timestamp of account/profile creation. |
| `is_available` | Boolean \| null | Worker availability status (Workers only). |

### Example Success Response
```json
{
  "id": 8,
  "name": "Jane Miller",
  "email": "jane.miller@city.gov",
  "phone": "9876543210",
  "role": "Worker",
  "profile_image": "http://localhost:8000/uploads/profile/8e9a2b1c4d7e6f8a.png",
  "is_email_verified": true,
  "is_active": true,
  "department_id": 2,
  "department_name": "Sanitation",
  "employee_code": "EMP-9402",
  "designation": "Lead Field Inspector",
  "phone_extension": "402",
  "joined_at": "2026-07-28T10:00:00.123456Z",
  "is_available": true
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
* `No persistent state change`

### Side Effects
* None.

### Frontend Integration Notes
* Prefer this endpoint over `/api/v1/auth/me` when rendering user profile menus, as it returns complete role, profile image, and department metadata.

### Related APIs
* [GET /api/v1/auth/me](09-authentication-api.md#get-apiv1authme)

---

## `PATCH /api/v1/profile/me`

### Purpose
Updates the name and phone contact details of the active user.

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
| `name` | String | No | `min_length=2`, `max_length=100` | New full name. |
| `phone` | String | No | `min_length=10`, `max_length=15` | New contact phone number. |

### Validation Rules
* **Pydantic Validation:** Passing parameters outside string boundaries (e.g. name shorter than 2 chars) triggers `422 Unprocessable Entity`.
* **Unique Phone Check:** If `phone` is provided, the database is queried. If the phone number is already registered by another user, aborts with `409 Conflict`.
* **Read-Only Parameters:** Clients cannot modify roles, emails, verified status flags, or passwords via this endpoint. Any extra payload parameters are ignored.

### Rate Limit
* `No endpoint-specific rate limit verified.`

### Business Flow
1. Authenticates current user from access token.
2. Resolves request body values.
3. If `name` is passed, updates user table name attribute.
4. If `phone` is passed, queries for duplicate records. If conflicted, raises `409`. Otherwise, updates phone attribute.
5. Saves changes, commits database transaction, and refreshes the user session.
6. Returns success confirmation message.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `MessageResponse`

| Field | Type | Description |
| :--- | :--- | :--- |
| `message` | String | `"Profile updated successfully."` |

### Example Success Response
```json
{
  "message": "Profile updated successfully."
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid access token. | `{"detail": "Invalid or expired token."}` |
| **409** | Phone number already registered to another account. | `{"detail": "Phone number already registered."}` |
| **422** | Request payload formatting error. | `{"detail": [{"loc": ["body", "name"], "msg": "ensure this value has at least 2 characters", "type": "value_error.any_str.min_length"}]}` |

### Possible HTTP Status Codes
* `200`, `401`, `409`, `422`

### Database / State Changes
* Updates name or phone fields in the matching User database record.

### Side Effects
* None.

### Frontend Integration Notes
* Both fields are optional. Omitted fields are not changed or cleared.

### Related APIs
* [POST /api/v1/auth/change-password](09-authentication-api.md#post-apiv1authchange-password)

---

## `POST /api/v1/profile/photo`

### Purpose
Uploads a profile photo, replacing any existing profile image file.

### Roles / Authorization
* Any authenticated user.

### Authentication
* Bearer Access Token required.

### Headers
* `Authorization: Bearer <access_token>`
* `Content-Type: multipart/form-data`

### Path Parameters
* `Not applicable`

### Query Parameters
* `Not applicable`

### Request Body / Form Data

| Field | Type | Required | Constraints / Validation | Description |
| :--- | :--- | :---: | :--- | :--- |
| `photo` | File (Binary) | Yes | File type: Multipart File | Profile image file to upload. |

### Validation Rules
* **Extension Validation:** Allowed extensions: `.jpg`, `.jpeg`, `.png`, `.webp`.
* **MIME-Type Validation:** Allowed content types: `image/jpeg`, `image/png`, `image/webp`.
* **File Size Validation:** Maximum allowed file size is exactly **5 MB** (`5 * 1024 * 1024` bytes). Exceeding this size returns `413 Payload Too Large`.
* **Magic-Byte Signature Verification:** Verifies binary file header against signatures (e.g. `\xff\xd8\xff` for JPEGs).
* *For details on validation utilities, refer to the [File Uploads Guide](06-file-and-image-uploads.md).*

### Rate Limit
* `No endpoint-specific rate limit verified.`

### Business Flow
1. Authenticates current user from access token.
2. Validates multipart file details (filename presence, extension, size, magic-bytes). Throws `400` or `413` on validation failure.
3. Generates a random UUID hex filename (preserving the file extension) and saves the image to `uploads/profile/`.
4. Retrieves user's previous `profile_image` path.
5. Updates user table record `profile_image` attribute with the new local file path.
6. Commits transaction and refreshes user session.
7. Safely deletes the old profile photo file from the filesystem if present.
8. Returns success confirmation containing the new fully qualified public URL.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** Raw Dictionary (No Pydantic wrapper configured in route).

| Field | Type | Description |
| :--- | :--- | :--- |
| `message` | String | `"Profile photo uploaded successfully."` |
| `profile_image` | String | Fully qualified public URL pointing to the new profile image. |

### Example Success Response
```json
{
  "message": "Profile photo uploaded successfully.",
  "profile_image": "http://localhost:8000/uploads/profile/8e9a2b1c4d7e6f8a.png"
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **400** | Invalid extension, MIME-type, or corrupted signature header. | `{"detail": "Invalid or corrupted image file."}` |
| **400** | Filename is missing. | `{"detail": "Filename is missing."}` |
| **401** | Missing/invalid access token. | `{"detail": "Invalid or expired token."}` |
| **413** | File size exceeds 5MB limit. | `{"detail": "File size exceeds allowed limit."}` |
| **422** | Missing required multipart form field `photo`. | `{"detail": [{"loc": ["body", "photo"], "msg": "field required", "type": "value_error.missing"}]}` |

### Possible HTTP Status Codes
* `200`, `400`, `401`, `413`, `422`

### Database / State Changes
* Updates the `profile_image` path field in the User record.

### Side Effects
* Writes new image file to `uploads/profile/`.
* Deletes previous avatar image file from disk.

### Frontend Integration Notes
* Pay close attention to the form field name: it must be **`photo`**, not `image` or `file`.
* Request payload must be sent with `multipart/form-data` encoding.

### Related APIs
* [DELETE /api/v1/profile/photo](#delete-apiv1profilephoto)

---

## `DELETE /api/v1/profile/photo`

### Purpose
Removes the current profile photo from the database and deletes the physical file from the storage directory.

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
* User must have an active profile image set (`profile_image is not None`). If missing, returns `404 Not Found`.

### Rate Limit
* `No endpoint-specific rate limit verified.`

### Business Flow
1. Authenticates current user from access token.
2. Checks if `profile_image` exists. If None, raises `404`.
3. Records old file path, then sets `user.profile_image = None`.
4. Saves changes, commits transaction, and refreshes the user session.
5. Safely deletes the old profile photo file from the filesystem.
6. Returns success confirmation message.

### Success Response
* **HTTP Status:** `200 OK`
* **Response Model:** `MessageResponse`

| Field | Type | Description |
| :--- | :--- | :--- |
| `message` | String | `"Profile photo deleted successfully."` |

### Example Success Response
```json
{
  "message": "Profile photo deleted successfully."
}
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid access token. | `{"detail": "Invalid or expired token."}` |
| **404** | No profile photo exists to delete. | `{"detail": "Profile photo not found."}` |

### Possible HTTP Status Codes
* `200`, `401`, `404`

### Database / State Changes
* Sets `profile_image = null` in the User database record.

### Side Effects
* Deletes matching image file from the filesystem (`uploads/profile/`).

### Related APIs
* [POST /api/v1/profile/photo](#post-apiv1profilephoto)
