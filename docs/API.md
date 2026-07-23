# CSCRS REST API Specification Map

## 1. Authentication & Security Endpoints (`/api/v1/auth`)

| Endpoint | Method | Source File | Allowed Roles | Service Invoked | Request Body / Params | Response Schema | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/auth/register` | POST | `api/auth.py` | Public | `AuthService.register` | `UserCreate` | `MessageResponse` | Register a new Citizen account and dispatch an email OTP code. |
| `/api/v1/auth/login` | POST | `api/auth.py` | Public | `AuthService.login` | `OAuth2PasswordRequestForm` | `Token` | Authenticate user credentials and issue a JWT bearer token. |
| `/api/v1/auth/me` | GET | `api/auth.py` | Authenticated | Direct ORM | Header: Bearer Token | `UserResponse` | Fetch authenticated user profile details. |
| `/api/v1/auth/verify-email` | POST | `api/auth.py` | Public | `AuthService.verify_email` | `VerifyEmailRequest` | `MessageResponse` | Validate 6-digit OTP to activate citizen account. |
| `/api/v1/auth/resend-otp` | POST | `api/auth.py` | Public | `AuthService.resend_otp` | `ResendOTPRequest` | `MessageResponse` | Resend email verification OTP code. |
| `/api/v1/auth/forgot-password` | POST | `api/auth.py` | Public | `AuthService.forgot_password` | `ForgotPasswordRequest` | `MessageResponse` | Initiate password recovery and dispatch reset OTP. |
| `/api/v1/auth/verify-reset-otp` | POST | `api/auth.py` | Public | `AuthService.verify_reset_otp` | `VerifyResetOTPRequest` | `MessageResponse` | Verify password reset OTP code. |
| `/api/v1/auth/reset-password` | POST | `api/auth.py` | Public | `AuthService.reset_password` | `ResetPasswordRequest` | `MessageResponse` | Reset account password using verified OTP token. |
| `/api/v1/auth/change-password` | POST | `api/auth.py` | Authenticated | `AuthService.change_password` | `ChangePasswordRequest` | `MessageResponse` | Update existing user password. |

---

## 2. Issue Reporting Endpoints (`/api/v1/report` & `/api/v1/reports`)

| Endpoint | Method | Source File | Allowed Roles | Service Invoked | Request Body / Params | Response Schema | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/report` | POST | `api/report.py` | `CITIZEN` | `ReportService` / `InferenceEngine` | Form Multipart: `file`, `description` | `ReportResponse` / `DuplicateResponse` | Upload civic issue photo, run verification & YOLO, detect duplicates, and create report. |
| `/api/v1/reports/my` | GET | `api/report.py` | `CITIZEN` | `ReportService.get_my_reports` | None | `list[CitizenReportListItem]` | List all civic reports submitted by the active citizen. |
| `/api/v1/reports` | GET | `api/report.py` | `CITY_ADMIN` | `ReportService.get_all_reports_paginated` | Query: `page`, `page_size`, `department_id`, `status`, `priority`, `issue_type` | `PaginatedCityReports` | Paginated listing of all citywide reports with filters. |
| `/api/v1/reports/department` | GET | `api/report.py` | `DEPARTMENT_ADMIN` | `ReportService.get_department_reports` | Query: `status`, `priority`, `issue_type` | `list[DepartmentReportListItem]` | List reports belonging to the admin's department. |
| `/api/v1/reports/my/search` | GET | `api/report.py` | `CITIZEN` | `ReportService.search_my_reports` | Query: `query` | `list[CitizenReportListItem]` | Search active citizen's reports by query string. |
| `/api/v1/reports/search` | GET | `api/report.py` | `CITY_ADMIN` | `ReportService.search_reports` | Query: `query` | `list[CityReportListItem]` | Search citywide reports by report number, issue type, or address. |
| `/api/v1/reports/department/search` | GET | `api/report.py` | `DEPARTMENT_ADMIN` | `ReportService.search_department_reports` | Query: `query` | `list[DepartmentReportListItem]` | Search department reports. |
| `/api/v1/reports/{report_number}` | GET | `api/report.py` | `CITIZEN` | `ReportService.get_my_report` | Path: `report_number` | `ReportResponse` | Get detailed report data by report number. |
| `/api/v1/reports/{report_id}/cancel` | POST | `api/report.py` | `DEPARTMENT_ADMIN` | `ReportService.cancel_report` | Path: `report_id`, Body: `ReportCancellationRequest` | `ReportResponse` | Cancel a civic report with reason. |
| `/api/v1/reports/{report_id}/reopen` | POST | `api/report.py` | `DEPARTMENT_ADMIN` | `ReportService.reopen_report` | Path: `report_id`, Body: `ReportReopenRequest` | `ReportResponse` | Reopen a cancelled or resolved report. |

---

## 3. Worker Assignment Endpoints (`/api/v1/assignments`)

| Endpoint | Method | Source File | Allowed Roles | Service Invoked | Request Body / Params | Response Schema | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/assignments/my` | GET | `api/assignment.py` | `WORKER` | `AssignmentService.get_my_assignments` | None | `list[WorkerAssignmentResponse]` | List active assignments assigned to the logged-in field worker. |
| `/api/v1/assignments/{assignment_id}/start-work` | POST | `api/assignment.py` | `WORKER` | `AssignmentService.start_work` | Path: `assignment_id`, Body: `latitude`, `longitude` | `AssignmentResponse` | Verify worker's location within 30 meters and mark work as `IN_PROGRESS`. |

---

## 4. Resolution Verification Endpoints (`/api/v1/resolutions`)

| Endpoint | Method | Source File | Allowed Roles | Service Invoked | Request Body / Params | Response Schema | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/resolutions` | POST | `api/resolution.py` | `WORKER` | `ResolutionService.create_resolution` | Form Multipart: `assignment_id`, `file`, `remarks` | `ResolutionResponse` | Submit post-repair proof photo, run OpenCLIP scene similarity & YOLO re-inference. |
| `/api/v1/resolutions/manual-reviews` | GET | `api/resolution.py` | `DEPARTMENT_ADMIN` | `ResolutionService.get_pending_manual_reviews` | None | `list[ManualReviewListItem]` | List resolutions flagged for manual review in admin's department. |
| `/api/v1/resolutions/manual-reviews/{report_id}` | GET | `api/resolution.py` | `DEPARTMENT_ADMIN` | `ResolutionService.get_manual_review_details` | Path: `report_id` | `ManualReviewDetailResponse` | Get side-by-side original vs resolution image comparison and AI metrics. |
| `/api/v1/resolutions/manual-reviews/{report_id}/approve` | POST | `api/resolution.py` | `DEPARTMENT_ADMIN` | `ResolutionService.approve_manual_review` | Path: `report_id` | `MessageResponse` | Approve resolution manually, marking report `RESOLVED`. |
| `/api/v1/resolutions/manual-reviews/{report_id}/reject` | POST | `api/resolution.py` | `DEPARTMENT_ADMIN` | `ResolutionService.reject_manual_review` | Path: `report_id`, Body: `reason` | `MessageResponse` | Reject resolution manually, reverting assignment to `IN_PROGRESS`. |

---

## 5. Department Forward Request Endpoints (`/api/v1/forward-requests`)

| Endpoint | Method | Source File | Allowed Roles | Service Invoked | Request Body / Params | Response Schema | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/forward-requests` | POST | `api/forward_request.py` | `WORKER` | `ForwardRequestService.create_request` | Body: `report_id`, `reason` | `ForwardRequestResponse` | Flag a report for department transfer review. |
| `/api/v1/forward-requests/pending` | GET | `api/forward_request.py` | `DEPARTMENT_ADMIN` | `ForwardRequestService.get_pending_requests` | None | `list[PendingForwardRequestItem]` | List pending forward requests submitted by source department workers. |
| `/api/v1/forward-requests/destination-pending` | GET | `api/forward_request.py` | `DEPARTMENT_ADMIN` | `ForwardRequestService.get_destination_requests` | None | `list[PendingForwardRequestItem]` | List incoming forward requests waiting for destination department decision. |
| `/api/v1/forward-requests/{request_id}` | GET | `api/forward_request.py` | `DEPARTMENT_ADMIN` | `ForwardRequestService.get_request_details` | Path: `request_id` | `ForwardRequestDetailResponse` | Get detailed forward request information and audit timeline. |
| `/api/v1/forward-requests/{request_id}/approve` | POST | `api/forward_request.py` | `DEPARTMENT_ADMIN` | `ForwardRequestService.approve_request` | Path: `request_id`, Body: `department_id`, `reason_type`, `remarks` | `ForwardRequestResponse` | Source Admin approves forwarding and assigns destination department. |
| `/api/v1/forward-requests/{request_id}/accept` | POST | `api/forward_request.py` | `DEPARTMENT_ADMIN` | `ForwardRequestService.accept_request` | Path: `request_id` | `ForwardRequestResponse` | Destination Admin accepts report; updates department and auto-assigns worker. |
| `/api/v1/forward-requests/{request_id}/decline` | POST | `api/forward_request.py` | `DEPARTMENT_ADMIN` | `ForwardRequestService.decline_request` | Path: `request_id`, Body: `reason` | `ForwardRequestResponse` | Destination Admin declines report; reverts report back to source worker. |
| `/api/v1/forward-requests/{request_id}/reject` | POST | `api/forward_request.py` | `DEPARTMENT_ADMIN` | `ForwardRequestService.reject_request` | Path: `request_id`, Body: `reason` | `ForwardRequestResponse` | Source Admin rejects worker's forward flag. |

---

## 6. Dashboard Analytics Endpoints (`/dashboard`)

| Endpoint | Method | Source File | Allowed Roles | Service Invoked | Request Body / Params | Response Schema | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/dashboard/summary` | GET | `api/dashboard.py` | `SUPER_ADMIN`, `CITY_ADMIN`, `DEPARTMENT_ADMIN` | `AnalyticsService.get_dashboard_summary` | None | `CityDashboardSummaryResponse` | High-level citywide metrics, resolution times, and automation rates. |
| `/dashboard/feedback` | GET | `api/dashboard.py` | `CITY_ADMIN` | `FeedbackService.get_dashboard` | None | `FeedbackDashboardResponse` | Summary metrics for citizen feedback ratings and comments. |
| `/dashboard/departments` | GET | `api/dashboard.py` | `CITY_ADMIN` | `AnalyticsService.get_department_statistics` | None | `list[DepartmentStatisticsItem]` | Report resolution metrics broken down by municipal department. |
| `/dashboard/issues` | GET | `api/dashboard.py` | `CITY_ADMIN` | `AnalyticsService.get_issue_statistics` | None | `list[IssueStatisticsItem]` | Report statistics broken down by civic issue category. |
| `/dashboard/status` | GET | `api/dashboard.py` | `CITY_ADMIN` | `AnalyticsService.get_status_statistics` | None | `list[StatusStatisticsItem]` | Distribution of reports across statuses. |
| `/dashboard/priorities` | GET | `api/dashboard.py` | `CITY_ADMIN` | `AnalyticsService.get_priority_statistics` | None | `list[PriorityStatisticsItem]` | Distribution of reports across priority levels. |
| `/dashboard/monthly-trends` | GET | `api/dashboard.py` | `CITY_ADMIN` | `AnalyticsService.get_monthly_trend` | Query: `year` | `list[MonthlyTrendItem]` | Monthly report creation vs resolution volume trend data. |
| `/dashboard/recent-reports` | GET | `api/dashboard.py` | `CITY_ADMIN` | `AnalyticsService.get_recent_reports` | Query: `limit` | `list[RecentReportItem]` | Stream of recently created civic reports. |
| `/dashboard/high-priority` | GET | `api/dashboard.py` | `CITY_ADMIN` | `AnalyticsService.get_high_priority_reports` | Query: `limit` | `list[HighPriorityReportItem]` | Listing of unresolved critical/high-priority reports. |
| `/dashboard/insights` | GET | `api/dashboard.py` | `CITY_ADMIN` | `AnalyticsService.get_dashboard_insights` | None | `list[DashboardInsightItem]` | Automated anomaly and workload bottleneck alerts. |
| `/dashboard/department/dashboard` | GET | `api/dashboard.py` | `DEPARTMENT_ADMIN` | `AnalyticsService.get_department_dashboard_summary` | None | `DepartmentDashboardResponse` | Department-specific performance dashboard summary. |
| `/dashboard/top-workers` | GET | `api/dashboard.py` | `CITY_ADMIN` | `AnalyticsService.get_top_workers` | Query: `department_id`, `limit` | `list[TopWorkerItem]` | Leaderboard of top-performing workers by resolution volume. |
| `/dashboard/worker/dashboard` | GET | `api/dashboard.py` | `WORKER` | `AnalyticsService.get_worker_dashboard_summary` | None | `WorkerDashboardResponse` | Personal performance metrics for field worker. |
| `/dashboard/citizen/dashboard` | GET | `api/dashboard.py` | `CITIZEN` | `AnalyticsService.get_citizen_dashboard_summary` | None | `CitizenDashboardResponse` | Overview summary of citizen's reported and supported issues. |

---

## 7. Administrative & Management Endpoints

### Administrative Management (`/admins` & `/city-admins`)
- `POST /admins`: Invite Department Admin account (`SUPER_ADMIN`, `CITY_ADMIN`).
- `POST /admins/activate`: Complete Department Admin account setup with password token.
- `POST /city-admins`: Create City Admin account (`SUPER_ADMIN`).
- `POST /city-admins/activate`: Activate City Admin account token.
- `PATCH /city-admins/citizens/{id}/block`: Block Citizen account with reason (`CITY_ADMIN`).
- `PATCH /city-admins/citizens/{id}/unblock`: Unblock Citizen account (`CITY_ADMIN`).
- `PATCH /city-admins/department-admins/{id}/block`: Block Department Admin (`CITY_ADMIN`).
- `PATCH /city-admins/department-admins/{id}/unblock`: Unblock Department Admin (`CITY_ADMIN`).

### Worker Management (`/workers`)
- `POST /workers`: Onboard new field worker (`DEPARTMENT_ADMIN`, `SUPER_ADMIN`).
- `POST /workers/activate`: Complete worker invitation activation.
- `PATCH /workers/{id}/activate`: Re-activate worker profile (`DEPARTMENT_ADMIN`).
- `PATCH /workers/{id}/deactivate`: Deactivate worker profile (`DEPARTMENT_ADMIN`).
- `PATCH /workers/{id}/block`: Block worker account (`DEPARTMENT_ADMIN`).
- `PATCH /workers/{id}/unblock`: Unblock worker account (`DEPARTMENT_ADMIN`).

### Department Management (`/departments`)
- `POST /departments`: Create municipal department (`SUPER_ADMIN`).
- `GET /departments`: List all departments (`SUPER_ADMIN`, `CITY_ADMIN`).
- `GET /departments/{id}`: Fetch department details by ID.
- `PATCH /departments/{id}/activate`: Activate department (`SUPER_ADMIN`, `CITY_ADMIN`).
- `PATCH /departments/{id}/deactivate`: Deactivate department (`SUPER_ADMIN`, `CITY_ADMIN`).

---

## 8. System Issues, Timeline, & Notifications

- `GET /api/v1/timeline/{report_id}`: Retrieve citizen-facing chronological timeline (`CITIZEN`).
- `GET /api/v1/timeline/recent`: Fetch recent timeline activities across citizen reports.
- `GET /api/v1/in-app-notifications`: Fetch user notifications (`Authenticated`).
- `PATCH /api/v1/in-app-notifications/{id}/read`: Mark notification as read.
- `POST /api/v1/system-issues`: Report system bug/issue with attachments (`Authenticated`).
- `GET /api/v1/system-issues`: Query system issues (`Authenticated`).
- `PATCH /api/v1/system-issues/{id}/status`: Update system issue status (`SUPER_ADMIN`, `CITY_ADMIN`).
- `POST /api/v1/feedback`: Submit application feedback (`CITIZEN`).
- `GET /api/v1/feedback/export`: Export feedback data (`CITY_ADMIN`).
- `GET /api/v1/ai-dataset/export`: Export verified detections dataset (`SUPER_ADMIN`).
