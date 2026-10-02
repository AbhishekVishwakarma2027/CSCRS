# CSCRS REST API Specification

This document provides a comprehensive, synchronized reference for all REST API endpoints available in the **Crowdsourced Civic Issue Reporting and Resolution System (CSCRS)** backend (`backend/api`).

---

## 1. API Conventions & System Overview

### Base URLs
- **Local Development**: `http://localhost:8000`
- **Production API Gateway**: `https://api.cscrs.tech` (Nginx reverse proxy forwarding to Uvicorn container on port 8000)

### API Prefixing
- All functional resource APIs are prefixed with `/api/v1`.
- Platform Health endpoints (`/health`, `/liveness`, `/readiness`) operate at root without the `/api/v1` prefix.

### Authentication & Authorization Headers
- Authentication uses HTTP Bearer JWT tokens in request headers:
  ```http
  Authorization: Bearer <access_token>
  ```
- **RBAC Strict Enforcement**: Authorization relies on exact-role dependency matching (`require_citizen`, `require_worker`, `require_department_admin`, `require_city_admin`, `require_super_admin`, `require_roles`).

### Rate Limiting
- Built on `SlowAPI` and backed by Redis.
- Rate-limited endpoints return `429 Too Many Requests` with response JSON:
  ```json
  {
    "success": false,
    "message": "Too many requests. Please try again later.",
    "error_code": "RATE_LIMIT_EXCEEDED"
  }
  ```

---

## 2. Authentication & Session Management (`/api/v1/auth`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Rate Limit / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/auth/register` | `POST` | Public | JSON `UserCreate` (`name`, `email`, `phone`, `password`) | `MessageResponse` ("Registration successful. OTP sent.") | Rate limited; sends 6-digit email OTP. |
| `/api/v1/auth/login` | `POST` | Public | Form OAuth2 (`username`, `password`) | `TokenResponse` (`access_token`, `refresh_token`, `token_type`) | Authenticates credentials; logs `LoginAudit`. |
| `/api/v1/auth/me` | `GET` | Authenticated | Header: Bearer Token | `UserResponse` (`id`, `name`, `email`, `phone`, `role`) | Returns active profile. |
| `/api/v1/auth/refresh` | `POST` | Public | JSON `RefreshTokenRequest` (`refresh_token`) | `TokenResponse` (`access_token`, `refresh_token`) | Rotates active refresh token in database. |
| `/api/v1/auth/logout` | `POST` | Public | JSON `RefreshTokenRequest` (`refresh_token`) | `MessageResponse` ("Logged out successfully.") | Revokes target refresh token session. |
| `/api/v1/auth/logout-all` | `POST` | Authenticated | None | `MessageResponse` ("Logged out from all devices.") | Revokes all active refresh sessions for user. |
| `/api/v1/auth/sessions` | `GET` | Authenticated | None | `list[SessionResponse]` | Lists user's active device sessions. |
| `/api/v1/auth/verify-email` | `POST` | Public | JSON `VerifyEmailRequest` (`email`, `otp_code`) | `MessageResponse` ("Email verified successfully.") | Activates citizen account upon OTP match. |
| `/api/v1/auth/resend-otp` | `POST` | Public | JSON `ResendOTPRequest` (`email`) | `MessageResponse` ("OTP code sent.") | Max 5 attempts; 60s resend cooldown. |
| `/api/v1/auth/forgot-password` | `POST` | Public | JSON `ForgotPasswordRequest` (`email`) | `MessageResponse` ("Password reset OTP sent.") | Sends 6-digit password reset OTP. |
| `/api/v1/auth/verify-reset-otp` | `POST` | Public | JSON `VerifyResetOTPRequest` (`email`, `otp_code`) | `MessageResponse` ("OTP verified.") | Validates reset OTP code. |
| `/api/v1/auth/reset-password` | `POST` | Public | JSON `ResetPasswordRequest` (`email`, `otp_code`, `new_password`) | `MessageResponse` ("Password reset successfully.") | Sets new account password. |
| `/api/v1/auth/change-password` | `POST` | Authenticated | JSON `ChangePasswordRequest` (`current_password`, `new_password`) | `MessageResponse` ("Password changed.") | Updates authenticated user password. |

---

## 3. Profile Management (`/api/v1/profile`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/profile/me` | `GET` | Authenticated | None | `ProfileResponse` | Fetch full profile data including active user details and role. |
| `/api/v1/profile/me` | `PATCH` | Authenticated | JSON `UpdateProfileRequest` (`name`, `phone`) | `MessageResponse` | Update current user's profile details. |
| `/api/v1/profile/photo` | `POST` | Authenticated | Multipart Form: `photo` (UploadFile) | JSON (`photo_url`, `message`) | Upload profile photo (`.jpg`, `.jpeg`, `.png`, `.webp`, max 10MB). |
| `/api/v1/profile/photo` | `DELETE` | Authenticated | None | `MessageResponse` | Delete existing profile avatar. |

---

## 4. City Admin Governance (`/api/v1/city-admins`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/city-admins` | `GET` | `SUPER_ADMIN` | None | `list[CityAdminItemResponse]` | List all registered City Admin accounts. |
| `/api/v1/city-admins` | `POST` | `SUPER_ADMIN` | JSON `CityAdminCreate` (`name`, `email`, `phone`) | `CityAdminResponse` | Invite new City Admin account; dispatches invitation token. |
| `/api/v1/city-admins/activate` | `POST` | Public | JSON `CityAdminActivationRequest` (`token`, `password`) | `CityAdminActivationResponse` | Activate City Admin account via token link. |
| `/api/v1/city-admins/citizens` | `GET` | `CITY_ADMIN` | None | `list[CityAdminCitizenResponse]` | List all registered citizen profiles. |
| `/api/v1/city-admins/department-admins` | `GET` | `CITY_ADMIN` | None | `list[CityAdminDepartmentAdminResponse]` | List all department administrators in the city. |
| `/api/v1/city-admins/citizens/{citizen_id}/block` | `PATCH` | `CITY_ADMIN` | Path: `citizen_id`, Body: `BlockCitizenRequest` (`block_type`, `reason`) | JSON status | Block citizen account (`SUSPENDED`, `DISMISSED`, etc.). |
| `/api/v1/city-admins/citizens/{citizen_id}/unblock` | `PATCH` | `CITY_ADMIN` | Path: `citizen_id` | JSON status | Unblock citizen account. |
| `/api/v1/city-admins/department-admins/{admin_id}/block` | `PATCH` | `CITY_ADMIN` | Path: `admin_id`, Body: `BlockDepartmentAdminRequest` | JSON status | Block department admin account. |
| `/api/v1/city-admins/department-admins/{admin_id}/unblock` | `PATCH` | `CITY_ADMIN` | Path: `admin_id` | JSON status | Unblock department admin account. |
| `/api/v1/city-admins/admins/{admin_id}/block` | `PATCH` | `SUPER_ADMIN` | Path: `admin_id`, Body: `BlockCityAdminRequest` | JSON status | Block City Admin account. |
| `/api/v1/city-admins/admins/{admin_id}/unblock` | `PATCH` | `SUPER_ADMIN` | Path: `admin_id` | JSON status | Unblock City Admin account. |

---

## 5. Department Management (`/api/v1/departments` & `/api/v1/admins`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/departments` | `GET` | `SUPER_ADMIN`, `CITY_ADMIN` | None | `list[DepartmentResponse]` | List all municipal departments (Roads, Water, Waste, etc.). |
| `/api/v1/departments` | `POST` | `SUPER_ADMIN` | JSON `DepartmentCreate` (`name`, `code`, `description`) | `DepartmentResponse` | Create new municipal department. |
| `/api/v1/departments/{department_id}` | `GET` | Authenticated | Path: `department_id` | `DepartmentResponse` | Get department details by ID. |
| `/api/v1/departments/{department_id}/activate` | `PATCH` | `SUPER_ADMIN`, `CITY_ADMIN` | Path: `department_id` | `DepartmentResponse` | Activate target department. |
| `/api/v1/departments/{department_id}/deactivate` | `PATCH` | `SUPER_ADMIN`, `CITY_ADMIN` | Path: `department_id` | `DepartmentResponse` | Deactivate target department. |
| `/api/v1/admins` | `POST` | `CITY_ADMIN`, `SUPER_ADMIN` | JSON `DepartmentAdminCreate` (`name`, `email`, `phone`, `department_id`) | `DepartmentAdminResponse` | Invite Department Admin; dispatches token via email. |
| `/api/v1/admins/activate` | `POST` | Public | JSON `DepartmentAdminActivationRequest` (`token`, `password`) | `DepartmentAdminActivationResponse` | Activate Department Admin account. |
| `/api/v1/admins/workers` | `GET` | `DEPARTMENT_ADMIN` | None | `list[DepartmentAdminWorkerResponse]` | List all field workers in admin's department. |

---

## 6. Worker Management (`/api/v1/workers`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/workers` | `POST` | `DEPARTMENT_ADMIN`, `SUPER_ADMIN` | JSON `WorkerCreate` (`name`, `email`, `phone`, `department_id`, `employee_code`, `designation`) | `WorkerResponse` | Onboard new field worker; sends invitation token. |
| `/api/v1/workers/activate` | `POST` | Public | JSON `WorkerActivationRequest` (`token`, `password`) | `WorkerActivationResponse` | Activate field worker account. |
| `/api/v1/workers/{worker_id}/activate` | `PATCH` | `DEPARTMENT_ADMIN`, `SUPER_ADMIN` | Path: `worker_id` | `WorkerStatusResponse` | Re-activate worker account. |
| `/api/v1/workers/{worker_id}/deactivate` | `PATCH` | `DEPARTMENT_ADMIN`, `SUPER_ADMIN` | Path: `worker_id` | `WorkerStatusResponse` | Deactivate worker account. |
| `/api/v1/workers/{worker_id}/block` | `PATCH` | `DEPARTMENT_ADMIN` | Path: `worker_id`, Body: `BlockWorkerRequest` | `WorkerStatusResponse` | Block worker (`RETIRED`, `SUSPENDED`, `TERMINATED`, etc.). |
| `/api/v1/workers/{worker_id}/unblock` | `PATCH` | `DEPARTMENT_ADMIN` | Path: `worker_id` | `WorkerStatusResponse` | Unblock field worker account. |

---

## 7. Reports & Issue Filings (`/api/v1/report` & `/api/v1/reports`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Rate Limit / Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/report` | `POST` | `CITIZEN` | Multipart Form: `file` (UploadFile), `description` (str) | `ReportResponse` or `DuplicateResponse` | **60/hr**. Upload photo, verify EXIF/GPS, run YOLOv8, check duplicates (8m / OpenCLIP), auto-route & assign worker. |
| `/api/v1/reports/my` | `GET` | `CITIZEN` | None | `list[CitizenReportListItem]` | List all reports submitted by current citizen. |
| `/api/v1/reports` | `GET` | `CITY_ADMIN` | Query: `page`, `page_size`, `department_id`, `status`, `priority`, `issue_type` | `PaginatedCityReports` | Paginated listing of all citywide reports with filters. |
| `/api/v1/reports/department` | `GET` | `DEPARTMENT_ADMIN` | Query: `status`, `priority`, `issue_type` | `list[DepartmentReportListItem]` | List reports belonging to admin's department. |
| `/api/v1/reports/my/search` | `GET` | `CITIZEN` | Query: `query` | `list[CitizenReportListItem]` | Search citizen's reported issues. |
| `/api/v1/reports/search` | `GET` | `CITY_ADMIN` | Query: `query` | `list[CityReportListItem]` | Search citywide reports by number, category, or address. |
| `/api/v1/reports/department/search` | `GET` | `DEPARTMENT_ADMIN` | Query: `query` | `list[DepartmentReportListItem]` | Search department-scoped reports. |
| `/api/v1/reports/{report_number}` | `GET` | `CITIZEN` | Path: `report_number` | `ReportResponse` | Get report detail by report number string. |
| `/api/v1/reports/{report_id}/cancel` | `POST` | `DEPARTMENT_ADMIN` | Path: `report_id`, Body: `ReportCancellationRequest` | `ReportResponse` | Cancel report with cancellation reason code. |
| `/api/v1/reports/{report_id}/reopen` | `POST` | `DEPARTMENT_ADMIN` | Path: `report_id`, Body: `ReportReopenRequest` | `ReportResponse` | Reopen cancelled/resolved report. |
| `/api/v1/reports/{report_id}/admin` | `GET` | `CITY_ADMIN`, `DEPARTMENT_ADMIN` | Path: `report_id` | `AdminReportDetailsResponse` | Secure admin report details including full audit trail. |
| `/api/v1/reports/{report_id}/admin/image` | `GET` | `CITY_ADMIN`, `DEPARTMENT_ADMIN` | Path: `report_id`, Query: `type` (`original`, `annotated`, `resolution`) | FileResponse | Authenticated secure image serving for admin dashboards. |
| `/api/v1/reports/{report_id}/timeline` | `GET` | `CITIZEN` | Path: `report_id` | `list[TimelineEventResponse]` | Fetch citizen timeline events for report lifecycle tracking. |

---

## 8. Worker Assignments (`/api/v1/assignments`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/assignments` | `POST` | `DEPARTMENT_ADMIN` | JSON `AssignmentCreate` (`report_id`, `worker_id`, `remarks`) | `AssignmentResponse` | Manually dispatch/assign report to a field worker. |
| `/api/v1/assignments/my` | `GET` | `WORKER` | None | `list[WorkerAssignmentResponse]` | Fetch active assignments assigned to logged-in worker. |
| `/api/v1/assignments/{assignment_id}/start` | `POST` | `WORKER` | Path: `assignment_id`, Body: `StartWorkRequest` (`latitude`, `longitude`) | `StartWorkResponse` | Verify worker location within **30 meters** of site and set status to `IN_PROGRESS`. |

---

## 9. Resolutions & Verification Pipeline (`/api/v1/resolutions`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Rate Limit / Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/resolutions` | `POST` | `WORKER` | Multipart Form: `assignment_id`, `remarks`, `image` (UploadFile) | `ResolutionResponse` | **20/hr**. Submit site repair photo. Runs OpenCLIP similarity & YOLO re-inference. Automatically marks `RESOLVED` or routes to `REVIEW`. |

---

## 10. Manual Verification & Review Queue (`/api/v1/resolutions/manual-review`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/resolutions/manual-review` | `GET` | `DEPARTMENT_ADMIN` | None | `list[ManualReviewItem]` | List pending manual resolution reviews for admin's department. |
| `/api/v1/resolutions/manual-review/{report_id}` | `GET` | `DEPARTMENT_ADMIN` | Path: `report_id` | `ManualReviewDetail` | Side-by-side original vs resolution image comparison, AI confidence scores, and remarks. |
| `/api/v1/resolutions/manual-review/{report_id}/approve` | `POST` | `DEPARTMENT_ADMIN` | Path: `report_id` | `ResolutionResponse` | Approve resolution, marking report `VERIFIED` / `RESOLVED`. |
| `/api/v1/resolutions/manual-review/{report_id}/reject` | `POST` | `DEPARTMENT_ADMIN` | Path: `report_id`, Body: `ManualReviewRejectRequest` (`reason`) | `ResolutionResponse` | Reject resolution; marks rework required and returns to worker. |

---

## 11. Department Forward / Transfer Requests (`/api/v1/forward-requests`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/forward-requests/{report_id}` | `POST` | `WORKER` | Path: `report_id`, Body: `ForwardRequestCreate` (`target_department_id`, `reason_type`, `remarks`) | `ForwardRequestResponse` | Flag report for inter-department transfer. |
| `/api/v1/forward-requests/pending` | `GET` | `DEPARTMENT_ADMIN` | Query: `include_history` (bool) | `list[ForwardRequestResponse]` | Pending transfer requests submitted by source department workers. |
| `/api/v1/forward-requests/incoming` | `GET` | `DEPARTMENT_ADMIN` | Query: `include_history` (bool) | `list[IncomingForwardRequestResponse]` | Incoming transfer requests awaiting destination department acceptance. |
| `/api/v1/forward-requests/rejected` | `GET` | `DEPARTMENT_ADMIN` | None | `list[ForwardRequestResponse]` | Historical list of rejected forward transfer requests. |
| `/api/v1/forward-requests/{request_id}` | `GET` | `DEPARTMENT_ADMIN` | Path: `request_id` | `ForwardRequestDetailResponse` | Detailed view of forward transfer request and history. |
| `/api/v1/forward-requests/{request_id}/approve` | `POST` | `DEPARTMENT_ADMIN` | Path: `request_id`, Body: `ForwardRequestApprove` | `ForwardRequestResponse` | Source Admin approves request and routes to destination. |
| `/api/v1/forward-requests/{request_id}/accept` | `POST` | `DEPARTMENT_ADMIN` | Path: `request_id` | `ForwardRequestResponse` | Destination Admin accepts report into department. |
| `/api/v1/forward-requests/{request_id}/decline` | `POST` | `DEPARTMENT_ADMIN` | Path: `request_id`, Body: `ForwardRequestReject` (`reason`) | `ForwardRequestResponse` | Destination Admin declines transfer; returns to source. |
| `/api/v1/forward-requests/{request_id}/reject` | `POST` | `DEPARTMENT_ADMIN` | Path: `request_id`, Body: `ForwardRequestReject` (`reason`) | `ForwardRequestResponse` | Source Admin rejects worker's transfer request. |

---

## 12. In-App Notifications (`/api/v1/notifications`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/notifications` | `GET` | Authenticated | None | `list[InAppNotificationResponse]` | Fetch personalized in-app notifications for logged-in user. |
| `/api/v1/notifications/unread-count` | `GET` | Authenticated | None | JSON (`unread_count`) | Unread notification count badge helper. |
| `/api/v1/notifications/{notification_id}/read` | `PATCH` | Authenticated | Path: `notification_id` | `InAppNotificationResponse` | Mark specific notification as read. |
| `/api/v1/notifications/read-all` | `PATCH` | Authenticated | None | `MessageResponse` | Mark all user notifications as read. |

---

## 13. Citizen Feedback (`/api/v1/feedback`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/feedback` | `POST` | `CITIZEN` | JSON `FeedbackCreate` (`report_id`, `rating`, `comments`) | `FeedbackResponse` | Submit rating (1-5 stars) and comments on resolved issue. |
| `/api/v1/feedback/export` | `GET` | `CITY_ADMIN`, `SUPER_ADMIN` | Query: `format` (`csv`, `excel`) | Streaming FileResponse | Export citizen feedback dataset. |

---

## 14. System Issue & Bug Reporting (`/api/v1/issues`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Rate Limit / Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/issues` | `POST` | Authenticated | Form Multipart: `title`, `description`, `category`, `related_report_number`, `attachments` | `SystemIssueResponse` | **20/hr**. Report technical application issue or bug with photo attachment. |
| `/api/v1/issues` | `GET` | `SUPER_ADMIN`, `CITY_ADMIN` | Query: `status`, `category`, `reporter`, `search` | `list[SystemIssueListItem]` | Query system issues reported across the platform. |
| `/api/v1/issues/my` | `GET` | Authenticated | Query: `status`, `category`, `search` | `list[MySystemIssueItem]` | Retrieve list of issues reported by current user. |
| `/api/v1/issues/export` | `GET` | `SUPER_ADMIN` | Query: `format` (`csv`, `excel`) | Streaming FileResponse | Export system issue dataset. |
| `/api/v1/issues/{issue_number}` | `GET` | Authenticated | Path: `issue_number` | `SystemIssueDetailResponse` | View detailed system issue status and attachments. |
| `/api/v1/issues/{issue_number}/status` | `PATCH` | `SUPER_ADMIN` | Path: `issue_number`, Body: `SystemIssueStatusUpdate` (`status`, `admin_notes`) | `MessageResponse` | Update system issue resolution status (`OPEN`, `IN_REVIEW`, `RESOLVED`, `REJECTED`). |

---

## 15. Dashboard Analytics (`/api/v1/dashboard`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/dashboard/summary` | `GET` | `SUPER_ADMIN`, `CITY_ADMIN`, `DEPARTMENT_ADMIN` | None | `CityDashboardSummaryResponse` | High-level metrics, resolution rates, and automated routing percentages. |
| `/api/v1/dashboard/feedback` | `GET` | `CITY_ADMIN`, `SUPER_ADMIN` | None | `FeedbackDashboardResponse` | Overview of citizen feedback scores and breakdown. |
| `/api/v1/dashboard/departments` | `GET` | `CITY_ADMIN`, `SUPER_ADMIN` | None | `list[DepartmentStatisticsItem]` | Performance statistics grouped by department. |
| `/api/v1/dashboard/issues` | `GET` | `CITY_ADMIN`, `SUPER_ADMIN` | None | `list[IssueStatisticsItem]` | Report statistics grouped by issue category. |
| `/api/v1/dashboard/status` | `GET` | `CITY_ADMIN`, `SUPER_ADMIN` | None | `list[StatusStatisticsItem]` | Distribution of reports across statuses. |
| `/api/v1/dashboard/priorities` | `GET` | `CITY_ADMIN`, `SUPER_ADMIN` | None | `list[PriorityStatisticsItem]` | Distribution of reports across priority levels. |
| `/api/v1/dashboard/monthly-trends` | `GET` | `CITY_ADMIN`, `SUPER_ADMIN` | Query: `year` (int) | `list[MonthlyTrendItem]` | Monthly report submission vs resolution trends. |
| `/api/v1/dashboard/recent-reports` | `GET` | `CITY_ADMIN`, `SUPER_ADMIN` | Query: `limit` (int) | `list[RecentReportItem]` | Stream of recently filed civic reports. |
| `/api/v1/dashboard/high-priority` | `GET` | `CITY_ADMIN`, `SUPER_ADMIN` | Query: `limit` (int) | `list[HighPriorityReportItem]` | List of unresolved high/critical priority reports. |
| `/api/v1/dashboard/insights` | `GET` | `CITY_ADMIN`, `SUPER_ADMIN` | None | `list[DashboardInsightItem]` | Automated anomaly and workload bottleneck alerts. |
| `/api/v1/dashboard/department/dashboard` | `GET` | `DEPARTMENT_ADMIN` | None | `DepartmentDashboardResponse` | Department-specific performance summary. |
| `/api/v1/dashboard/top-workers` | `GET` | `CITY_ADMIN`, `SUPER_ADMIN` | Query: `department_id`, `limit` | `list[TopWorkerItem]` | Leaderboard of top-performing workers by resolution volume. |
| `/api/v1/dashboard/worker/dashboard` | `GET` | `WORKER` | None | `WorkerDashboardResponse` | Worker's individual job metrics. |
| `/api/v1/dashboard/citizen/dashboard` | `GET` | `CITIZEN` | None | `CitizenDashboardResponse` | Citizen's reported and supported issue summary. |

---

## 16. AI Dataset Export (`/api/v1/ai-dataset`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/ai-dataset/export` | `GET` | `SUPER_ADMIN` | Query: `format` (`json`, `csv`) | Streaming FileResponse | Export verified detection dataset for YOLO model fine-tuning. |

---

## 17. Super Admin Governance & Telemetry (`/api/v1/super-admin`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/super-admin/audit-logs` | `GET` | `SUPER_ADMIN` | Query: `page`, `page_size`, `action`, `user_id` | `PaginatedAuditLogResponse` | Paginated query of immutable system audit logs. |
| `/api/v1/super-admin/audit-logs/export` | `GET` | `SUPER_ADMIN` | Query: `format` (`csv`, `xlsx`) | Streaming FileResponse | Export audit log history. |
| `/api/v1/super-admin/login-audits` | `GET` | `SUPER_ADMIN` | Query: `page`, `page_size`, `login_success`, `user_id` | `PaginatedLoginAuditResponse` | User login attempts and IP tracking audit logs. |
| `/api/v1/super-admin/health` | `GET` | `SUPER_ADMIN` | None | `SystemHealthResponse` | Platform-wide service status, memory, DB connections, and worker pools. |
| `/api/v1/super-admin/ai-telemetry` | `GET` | `SUPER_ADMIN` | None | `AITelemetryResponse` | AI prediction telemetry, average inference times, confidence scores, and OpenCLIP thresholds. |

---

## 18. Broadcast Announcement Management (`/api/v1/super-admin/announcements` & `/api/v1/announcements`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/super-admin/announcements` | `POST` | `SUPER_ADMIN` | JSON `AnnouncementRequest` (`title`, `message`, `target_role`, `announcement_type`, `starts_at`, `ends_at`) | `AnnouncementResponse` | Create & broadcast system announcement across user roles. |
| `/api/v1/super-admin/announcements` | `GET` | `SUPER_ADMIN` | Query: `lifecycle_state`, `status`, `announcement_type` | `list[AnnouncementItemResponse]` | Management lifecycle list (`SCHEDULED`, `ACTIVE`, `EXPIRED`, `CANCELLED`). |
| `/api/v1/super-admin/announcements/{broadcast_id}/end` | `PATCH` | `SUPER_ADMIN` | Path: `broadcast_id` | `AnnouncementItemResponse` | Terminate an active broadcast prematurely. |
| `/api/v1/super-admin/announcements/{broadcast_id}` | `DELETE` | `SUPER_ADMIN` | Path: `broadcast_id` | JSON status | Delete a scheduled broadcast announcement. |
| `/api/v1/announcements/active` | `GET` | Authenticated | None | `list[AnnouncementItemResponse]` | Fetch active system broadcasts relevant to current user's role. |

---

## 19. Public Overview (`/api/v1/public/overview`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/public/overview` | `GET` | Public | None | `PublicOverviewResponse` | High-level aggregated statistics (total reports, resolution rate, active cities) for unauthenticated public landing page. |

---

## 20. Public Uttar Pradesh State Dashboard (`/api/v1/public/state-dashboard`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/public/state-dashboard` | `GET` | Public | Query: `state` (default "Uttar Pradesh") | `StateDashboardResponse` | Real-time district-by-district breakdown across all **75 Uttar Pradesh districts** with resolution scores and GeoJSON mappings. |

---

## 21. Public News & Press Updates (`/api/v1/public/updates` & `/api/v1/super-admin/updates`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/public/updates` | `GET` | Public | Query: `page`, `page_size`, `category` | `PaginatedPublicUpdatesResponse` | Paginated listing of published municipal press updates. |
| `/api/v1/public/updates/{slug}` | `GET` | Public | Path: `slug` | `PublicUpdateResponse` | Fetch published news article detail by URL slug. |
| `/api/v1/public/updates/images/{filename}` | `GET` | Public | Path: `filename` | FileResponse | Serve thumbnail image for public updates. |
| `/api/v1/super-admin/updates` | `GET` | `SUPER_ADMIN` | Query: `page`, `page_size` | `PaginatedPublicUpdatesResponse` | List all drafts and published updates for governance. |
| `/api/v1/super-admin/updates` | `POST` | `SUPER_ADMIN` | JSON `PublicUpdateCreateRequest` (`title`, `content`, `category`, `thumbnail_url`, `is_published`) | `PublicUpdateResponse` | Create new news & press update article. |
| `/api/v1/super-admin/updates/{update_id}` | `PUT` | `SUPER_ADMIN` | Path: `update_id`, Body: `PublicUpdateUpdateRequest` | `PublicUpdateResponse` | Update existing news article content. |
| `/api/v1/super-admin/updates/{update_id}/publish` | `POST` | `SUPER_ADMIN` | Path: `update_id`, Query: `is_published` (bool) | `PublicUpdateResponse` | Toggle publish state of news article. |
| `/api/v1/super-admin/updates/{update_id}` | `DELETE` | `SUPER_ADMIN` | Path: `update_id` | JSON status | Delete news article. |
| `/api/v1/super-admin/updates/upload-thumbnail` | `POST` | `SUPER_ADMIN` | Multipart Form: `file` (UploadFile) | JSON (`filename`, `thumbnail_url`) | Upload news article thumbnail image. |

---

## 22. Platform Diagnostics & Health (`/health`, `/liveness`, `/readiness`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/health` | `GET` | Public | None | JSON (`status`, `service`, `version`, `timestamp`) | Container health check used by Nginx & Docker. |
| `/liveness` | `GET` | Public | None | JSON (`status`: "alive") | Kubernetes / Docker liveness probe. |
| `/readiness` | `GET` | Public | None | JSON (`status`: "ready", `database`: "connected") | Readiness probe; checks DB `SELECT 1`. Returns `503` if DB fails. |

---

## 23. PDF Performance Report Generation (`/api/v1/reports/department/download` & `/api/v1/reports/city/download`)

| Endpoint | Method | Allowed Roles | Request Body / Parameters | Response Summary | Rate Limit / Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/reports/department/download` | `GET` | `DEPARTMENT_ADMIN` | None | Streaming PDF (`department_report.pdf`) | **20/hr**. Dynamic PDF export of department performance and worker resolution metrics. |
| `/api/v1/reports/city/download` | `GET` | `CITY_ADMIN` | None | Streaming PDF (`city_report.pdf`) | **20/hr**. Dynamic PDF export of citywide performance, department rankings, and SLA adherence. |
