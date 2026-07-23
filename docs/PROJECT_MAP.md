# CSCRS Project Map & Module Inventory

## 1. Repository Directory Structure Overview

```
CSCRS/
├── .env                              # Local environment variables
├── .env.example                      # Environment variables template
├── .gitignore                        # Git ignore rules
├── LICENSE                           # License file
├── README.MD                         # Root readme
├── alembic.ini                       # Alembic database migration configuration
├── cscrs.db                          # SQLite database instance
├── requirements.txt                  # Python dependencies declaration
├── alembic/                          # Alembic database migration files
│   ├── env.py                        # Migration environment script
│   ├── script.py.mako                # Migration script template
│   └── versions/                     # 25 Database schema migration scripts
├── api/                              # FastAPI REST API Controllers / Routes
│   ├── __init__.py
│   ├── admin.py                      # Department Admin routes
│   ├── ai_dataset.py                 # AI dataset export routes
│   ├── app.py                        # FastAPI application entry point
│   ├── assignment.py                 # Worker assignment routes
│   ├── auth.py                       # User authentication & OTP routes
│   ├── city_admin.py                 # City Admin management routes
│   ├── dashboard.py                  # Analytics & dashboard summary routes
│   ├── department.py                 # Department CRUD routes
│   ├── feedback.py                   # Citizen feedback routes
│   ├── forward_request.py            # Department-to-department forward routes
│   ├── generate_report.py            # Report document generation routes
│   ├── in_app_notification.py        # In-app user notification routes
│   ├── profile.py                    # User profile management routes
│   ├── report.py                     # Citizen report creation & query routes
│   ├── resolution.py                 # Resolution submission & review routes
│   ├── routes.py                     # Aggregated API router declaration
│   ├── system_issue.py               # System issue reporting & tracking routes
│   ├── timeline.py                   # Citizen audit timeline routes
│   └── worker.py                     # Field worker management routes
├── authentication/                   # Auth logic & Security dependencies
│   ├── __init__.py
│   ├── dependencies.py               # FastAPI role-based access control dependencies
│   └── security.py                   # JWT creation/decoding and bcrypt password hashing
├── configs/                          # System Configuration & Mapping
│   ├── __init__.py
│   ├── config.py                     # Central configuration loader
│   ├── department_mapping.py         # AI class to department resolution map
│   ├── production_config.py          # Production overrides configuration
│   └── production_data.yaml          # Static production reference data
├── database/                         # Database connection, Models, & CRUD operations
│   ├── __init__.py
│   ├── base.py                       # SQLAlchemy DeclarativeBase instantiation
│   ├── connection.py                 # Engine & SessionLocal session maker
│   ├── dependencies.py               # Database session dependency generator
│   ├── enums.py                      # Core system Enums (Roles, Statuses, Priorities)
│   ├── test_create_tables.py         # Table creation test helper
│   ├── crud/                         # Data Access Object (DAO) / CRUD layer
│   │   ├── __init__.py
│   │   ├── admin.py                  # Department Admin CRUD
│   │   ├── ai_dataset.py             # AI Dataset export CRUD
│   │   ├── analytics.py              # Dashboard analytics aggregation queries
│   │   ├── assignment.py             # Report assignment CRUD
│   │   ├── audit_log.py              # Audit logging CRUD
│   │   ├── city_admin.py             # City Admin CRUD
│   │   ├── department.py             # Department CRUD
│   │   ├── department_forward_request.py # Department forward request CRUD
│   │   ├── email_verification.py     # Email verification OTP CRUD
│   │   ├── feedback.py               # Citizen feedback CRUD
│   │   ├── in_app_notification.py    # Notification CRUD
│   │   ├── login_audit.py            # Login audit trail CRUD
│   │   ├── password_reset.py         # Password reset token CRUD
│   │   ├── report.py                 # Civic issue report CRUD
│   │   ├── report_detection.py       # AI bounding box detection CRUD
│   │   ├── report_forward_history.py # Forward history log CRUD
│   │   ├── report_image.py           # Report image asset CRUD
│   │   ├── report_support.py         # Duplicate report support count CRUD
│   │   ├── resolution.py             # Resolution CRUD
│   │   ├── resolution_ai.py          # Resolution AI result CRUD
│   │   ├── resolution_attempt.py     # Resolution attempt history CRUD
│   │   ├── system_issue.py           # System issue CRUD
│   │   ├── system_issue_attachment.py# System issue attachment CRUD
│   │   ├── user.py                   # User account CRUD
│   │   └── worker.py                 # Worker profile CRUD
│   └── models/                       # SQLAlchemy ORM Data Models
│       ├── __init__.py
│       ├── assignment.py             # Assignment model
│       ├── audit_log.py              # AuditLog model
│       ├── department.py             # Department model
│       ├── department_forward_request.py # DepartmentForwardRequest model
│       ├── email_verification.py     # EmailVerification model
│       ├── feedback.py               # Feedback model
│       ├── in_app_notification.py    # InAppNotification model
│       ├── login_audit.py            # LoginAudit model
│       ├── password_reset.py         # PasswordReset model
│       ├── report.py                 # Report model
│       ├── report_detection.py       # ReportDetection model
│       ├── report_forward_history.py # ReportForwardHistory model
│       ├── report_image.py           # ReportImage model
│       ├── report_support.py         # ReportSupport model
│       ├── resolution.py             # Resolution model
│       ├── resolution_ai_result.py   # ResolutionAIResult model
│       ├── resolution_attempt.py     # ResolutionAttempt model
│       ├── system_issue.py           # SystemIssue model
│       ├── system_issue_attachment.py# SystemIssueAttachment model
│       ├── user.py                   # User model
│       ├── worker_invitation.py      # WorkerInvitation model
│       └── worker_profile.py         # WorkerProfile model
├── docs/                             # Technical Documentation Suite
│   ├── API.md                        # API Endpoints Specification
│   ├── ARCHITECTURE.md               # Architecture & Workflows Document
│   ├── DATABASE.md                   # Database ERD & Schema Spec
│   ├── DEPLOYMENT.md                 # Deployment & Environment Spec
│   └── PROJECT_MAP.md                # Project Inventory & Module Responsibilities
├── evaluation/                       # Evaluation subpackage root
│   └── __init__.py
├── evaluation_lab/                   # Interactive Gradio Model Evaluation UI
│   ├── app.py                        # Gradio app launcher
│   ├── config.py                     # Evaluation Lab configuration
│   ├── predictor.py                  # Evaluation Lab predictor wrapper
│   ├── test_predictor.py             # Predictor test script
│   └── ui.py                         # Gradio UI components layout
├── inference/                        # YOLO Detection & OpenCLIP AI Pipeline
│   ├── __init__.py
│   ├── classes.py                    # Class name definitions
│   ├── config.py                     # Inference hyperparameter configuration
│   ├── engine.py                     # Object detection & verification pipeline engine
│   ├── geometry.py                   # Mask polygon & box geometry utilities
│   ├── parser.py                     # YOLO output parser
│   ├── predictor.py                  # Ultralytics YOLO loader & predictor
│   ├── visualizer.py                 # Detection overlay annotation renderer
│   └── resolution_ai/                # Post-repair resolution verification engine
│       ├── __init__.py
│       ├── engine.py                 # Resolution AI verification engine
│       ├── gps.py                    # GPS comparative stub
│       ├── history.py                # History comparative stub
│       ├── rules.py                  # Resolution decision rule engine
│       ├── similarity.py             # OpenCLIP scene similarity calculation engine
│       ├── tempCodeRunnerFile.py     # Temporary runner artifact
│       └── verifier.py               # Verifier wrapper
├── models/                           # Machine Learning Weights Storage
│   └── best_cscrs_seg_v1.pt          # Fine-tuned YOLOv8 segmentation model weights
├── schemas/                          # Pydantic Request/Response Schemas
│   ├── __init__.py
│   ├── admin.py                      # Department Admin schemas
│   ├── ai_dataset.py                 # AI Dataset schemas
│   ├── analytics.py                  # Dashboard analytics response schemas
│   ├── assignment.py                 # Assignment request/response schemas
│   ├── audit_service.py              # Audit log schemas
│   ├── city_admin.py                 # City Admin request schemas
│   ├── common.py                     # Common response wrapper schemas
│   ├── department.py                 # Department schemas
│   ├── feedback.py                   # Feedback request/response schemas
│   ├── forward_request.py            # Forwarding request schemas
│   ├── generate_report.py            # PDF report export schemas
│   ├── in_app_notification.py        # Notification schemas
│   ├── inference.py                  # Inference response schemas
│   ├── profile.py                    # User profile schemas
│   ├── report.py                     # Report creation & list schemas
│   ├── resolution.py                 # Resolution request & manual review schemas
│   ├── response.py                   # Generic message schemas
│   ├── system_issue.py               # System issue reporting schemas
│   ├── timeline.py                   # Timeline item schemas
│   ├── user.py                       # User auth & account schemas
│   └── worker.py                     # Field worker profile schemas
├── scripts/                          # Administrative and Maintenance CLI Scripts
│   ├── benchmark_ai_detector.py      # Benchmark AI detector performance
│   ├── bootstrap_super_admin.py      # Seed initial Super Admin account
│   ├── seed_departments.py           # Seed initial municipal departments
│   ├── sk.py                         # Secret key generator script
│   ├── test_ai_detector.py           # Test AI detector module
│   ├── test_db.py                    # DB connection verification
│   ├── test_email.py                 # SMTP email service test
│   ├── test_engine.py                # Inference Engine execution test
│   ├── test_exif.py                  # EXIF parser test script
│   ├── test_model_loader.py          # Model loader test script
│   ├── test_quality.py               # Image quality detector test
│   ├── test_similarity.py           # Scene similarity engine test
│   ├── test_verification.py          # Verification pipeline test
│   ├── test_verifier.py              # Verifier engine test
│   └── test_yolo_prediction.py       # YOLO prediction test
├── services/                         # Core Domain Business Logic Layer
│   ├── __init__.py
│   ├── admin_service.py              # Department Admin account management service
│   ├── ai_dataset_service.py         # Dataset export service for AI retrain
│   ├── analytics_service.py          # City/Department/Worker/Citizen dashboard analytics
│   ├── assignment.py                 # Worker assignment & workload balancing service
│   ├── audit_log_service.py          # Action audit log recorder service
│   ├── auth_service.py               # Authentication, registration, & password management
│   ├── city_admin_service.py         # City Admin management service
│   ├── department_service.py         # Department resolution & management service
│   ├── duplicate_detection_service.py# Distance & scene similarity duplicate detection
│   ├── email_service.py              # SMTP email transmission service
│   ├── feedback_service.py           # Citizen feedback collection service
│   ├── forward_request_service.py    # Inter-department forward request state machine
│   ├── generate_report_service.py    # PDF report document generator
│   ├── in_app_notification_service.py# In-app notification creation & query service
│   ├── notification_service.py       # Email notification dispatcher service
│   ├── otp_service.py                # One-Time Password generation & validation service
│   ├── priority_engine.py            # Issue severity priority decision engine
│   ├── profile_service.py            # User profile image & attribute service
│   ├── report_builder.py             # Inference result to Report object converter
│   ├── report_service.py             # Main Report creation & lifecycle management service
│   ├── report_support_service.py     # Duplicate report citizen support tracker service
│   ├── resolution.py                 # Resolution verification & approval service
│   ├── security_service.py           # User security & account blocking service
│   ├── system_issue_service.py       # Platform bug reporting & resolution service
│   ├── timeline_service.py           # Citizen timeline formatting service
│   ├── worker_invitation.py          # Worker invite token generator service
│   └── worker_service.py             # Field worker onboarding & lifecycle service
├── templates/                        # Email Templates
│   ├── __init__.py
│   └── email_templates.py            # HTML/Text email template renderer
├── train/                            # YOLO Fine-Tuning & Training Scripts
│   ├── __init__.py
│   ├── resume_training.py            # Resume YOLO training script
│   └── train.py                      # Train YOLO segmentation model script
├── uploads/                          # Static Uploaded File Storage
│   └── resolution/                   # Worker uploaded resolution proof photos
├── utils/                            # Helper Utilities
│   ├── __init__.py
│   ├── feedback_export.py            # Feedback CSV/Excel export helper
│   ├── file_utils.py                 # File deletion & filename generator helpers
│   ├── gps.py                        # Haversine distance & EXIF GPS coordinate converter
│   └── report_number.py              # Unique report number string generator
└── verification/                     # Image Integrity & Quality Verification Pipeline
    ├── __init__.py
    ├── base_detector.py              # Base interface for verification detectors
    ├── risk_engine.py                # Weighted risk score & decision engine
    ├── verifier.py                   # Aggregated VerificationEngine orchestrator
    ├── ai_generated/                 # Synthetic image detection module (Requires third_party)
    │   ├── __init__.py
    │   ├── config.py                 # AI detector configuration & weights path
    │   ├── detector.py               # AIGeneratedDetector model runner
    │   ├── infer.py                  # Standalone inference helper
    │   └── model_loader.py           # Weights loader (Imports from third_party)
    ├── duplicate/                    # Duplicate verification subpackage placeholder
    │   └── __init__.py
    ├── exif/                         # EXIF metadata verification module
    │   ├── __init__.py
    │   ├── detector.py               # EXIFDetector risk evaluation
    │   ├── parser.py                 # PIL ExifTags parser
    │   ├── rules.py                  # EXIF risk weights & rules
    │   └── utils.py                  # Tag extraction helper
    ├── gps/                          # GPS verification subpackage placeholder
    │   └── __init__.py
    ├── quality/                      # OpenCV image quality verification module
    │   ├── __init__.py
    │   ├── detector.py               # QualityDetector risk evaluation
    │   ├── metrics.py                # Blur, brightness, contrast & resolution calculators
    │   └── rules.py                  # Quality metric threshold rules
    └── timestamp/                    # Timestamp verification subpackage placeholder
        └── __init__.py
```

---

## 2. Complete Inventory of Python Files

Total Python Files in Repository: **125 Files** (including 25 Alembic migration scripts).

### API Layer (`api/`) - 20 Files
1. `api/__init__.py`
2. `api/admin.py`
3. `api/ai_dataset.py`
4. `api/app.py`
5. `api/assignment.py`
6. `api/auth.py`
7. `api/city_admin.py`
8. `api/dashboard.py`
9. `api/department.py`
10. `api/feedback.py`
11. `api/forward_request.py`
12. `api/generate_report.py`
13. `api/in_app_notification.py`
14. `api/profile.py`
15. `api/report.py`
16. `api/resolution.py`
17. `api/routes.py`
18. `api/system_issue.py`
19. `api/timeline.py`
20. `api/worker.py`

### Authentication (`authentication/`) - 3 Files
21. `authentication/__init__.py`
22. `authentication/dependencies.py`
23. `authentication/security.py`

### Configuration (`configs/`) - 4 Files
24. `configs/__init__.py`
25. `configs/config.py`
26. `configs/department_mapping.py`
27. `configs/production_config.py`

### Database Core (`database/`) - 6 Files
28. `database/__init__.py`
29. `database/base.py`
30. `database/connection.py`
31. `database/dependencies.py`
32. `database/enums.py`
33. `database/test_create_tables.py`

### Database Models (`database/models/`) - 24 Files
34. `database/models/__init__.py`
35. `database/models/assignment.py`
36. `database/models/audit_log.py`
37. `database/models/department.py`
38. `database/models/department_forward_request.py`
39. `database/models/email_verification.py`
40. `database/models/feedback.py`
41. `database/models/in_app_notification.py`
42. `database/models/login_audit.py`
43. `database/models/password_reset.py`
44. `database/models/report.py`
45. `database/models/report_detection.py`
46. `database/models/report_forward_history.py`
47. `database/models/report_image.py`
48. `database/models/report_support.py`
49. `database/models/resolution.py`
50. `database/models/resolution_ai_result.py`
51. `database/models/resolution_attempt.py`
52. `database/models/system_issue.py`
53. `database/models/system_issue_attachment.py`
54. `database/models/user.py`
55. `database/models/worker_invitation.py`
56. `database/models/worker_profile.py`

### Database CRUD Layer (`database/crud/`) - 27 Files
57. `database/crud/__init__.py`
58. `database/crud/admin.py`
59. `database/crud/ai_dataset.py`
60. `database/crud/analytics.py`
61. `database/crud/assignment.py`
62. `database/crud/audit_log.py`
63. `database/crud/city_admin.py`
64. `database/crud/department.py`
65. `database/crud/department_forward_request.py`
66. `database/crud/email_verification.py`
67. `database/crud/feedback.py`
68. `database/crud/in_app_notification.py`
69. `database/crud/login_audit.py`
70. `database/crud/password_reset.py`
71. `database/crud/report.py`
72. `database/crud/report_detection.py`
73. `database/crud/report_forward_history.py`
74. `database/crud/report_image.py`
75. `database/crud/report_support.py`
76. `database/crud/resolution.py`
77. `database/crud/resolution_ai.py`
78. `database/crud/resolution_attempt.py`
79. `database/crud/system_issue.py`
80. `database/crud/system_issue_attachment.py`
81. `database/crud/user.py`
82. `database/crud/worker.py`

### Evaluation Lab (`evaluation/` & `evaluation_lab/`) - 6 Files
83. `evaluation/__init__.py`
84. `evaluation_lab/app.py`
85. `evaluation_lab/config.py`
86. `evaluation_lab/predictor.py`
87. `evaluation_lab/test_predictor.py`
88. `evaluation_lab/ui.py`

### Inference Pipeline (`inference/`) - 15 Files
89. `inference/__init__.py`
90. `inference/classes.py`
91. `inference/config.py`
92. `inference/engine.py`
93. `inference/geometry.py`
94. `inference/parser.py`
95. `inference/predictor.py`
96. `inference/visualizer.py`
97. `inference/resolution_ai/__init__.py`
98. `inference/resolution_ai/engine.py`
99. `inference/resolution_ai/gps.py`
100. `inference/resolution_ai/history.py`
101. `inference/resolution_ai/rules.py`
102. `inference/resolution_ai/similarity.py`
103. `inference/resolution_ai/verifier.py`

### Schemas (`schemas/`) - 23 Files
104. `schemas/__init__.py`
105. `schemas/admin.py`
106. `schemas/ai_dataset.py`
107. `schemas/analytics.py`
108. `schemas/assignment.py`
109. `schemas/audit_service.py`
110. `schemas/city_admin.py`
111. `schemas/common.py`
112. `schemas/department.py`
113. `schemas/feedback.py`
114. `schemas/forward_request.py`
115. `schemas/generate_report.py`
116. `schemas/in_app_notification.py`
117. `schemas/inference.py`
118. `schemas/profile.py`
119. `schemas/report.py`
120. `schemas/resolution.py`
121. `schemas/response.py`
122. `schemas/system_issue.py`
123. `schemas/timeline.py`
124. `schemas/user.py`
125. `schemas/worker.py`

### Core Domain Services (`services/`) - 28 Files
126. `services/__init__.py`
127. `services/admin_service.py`
128. `services/ai_dataset_service.py`
129. `services/analytics_service.py`
130. `services/assignment.py`
131. `services/audit_log_service.py`
132. `services/auth_service.py`
133. `services/city_admin_service.py`
134. `services/department_service.py`
135. `services/duplicate_detection_service.py`
136. `services/email_service.py`
137. `services/feedback_service.py`
138. `services/forward_request_service.py`
139. `services/generate_report_service.py`
140. `services/in_app_notification_service.py`
141. `services/notification_service.py`
142. `services/otp_service.py`
143. `services/priority_engine.py`
144. `services/profile_service.py`
145. `services/report_builder.py`
146. `services/report_service.py`
147. `services/report_support_service.py`
148. `services/resolution.py`
149. `services/security_service.py`
150. `services/system_issue_service.py`
151. `services/timeline_service.py`
152. `services/worker_invitation.py`
153. `services/worker_service.py`

### Templates & Training (`templates/` & `train/`) - 4 Files
154. `templates/email_templates.py`
155. `train/__init__.py`
156. `train/resume_training.py`
157. `train/train.py`

### Utilities (`utils/`) - 5 Files
158. `utils/__init__.py`
159. `utils/feedback_export.py`
160. `utils/file_utils.py`
161. `utils/gps.py`
162. `utils/report_number.py`

### Verification Pipeline (`verification/`) - 18 Files
163. `verification/__init__.py`
164. `verification/base_detector.py`
165. `verification/risk_engine.py`
166. `verification/verifier.py`
167. `verification/ai_generated/__init__.py`
168. `verification/ai_generated/config.py`
169. `verification/ai_generated/detector.py`
170. `verification/ai_generated/infer.py`
171. `verification/ai_generated/model_loader.py`
172. `verification/duplicate/__init__.py`
173. `verification/exif/__init__.py`
174. `verification/exif/detector.py`
175. `verification/exif/parser.py`
176. `verification/exif/rules.py`
177. `verification/exif/utils.py`
178. `verification/gps/__init__.py`
179. `verification/quality/__init__.py`
180. `verification/quality/detector.py`
181. `verification/quality/metrics.py`
182. `verification/quality/rules.py`
183. `verification/timestamp/__init__.py`

### Scripts & Alembic (`scripts/` & `alembic/`) - 41 Files
184. `scripts/benchmark_ai_detector.py`
185. `scripts/bootstrap_super_admin.py`
186. `scripts/seed_departments.py`
187. `scripts/sk.py`
188. `scripts/test_ai_detector.py`
189. `scripts/test_db.py`
190. `scripts/test_email.py`
191. `scripts/test_engine.py`
192. `scripts/test_exif.py`
193. `scripts/test_model_loader.py`
194. `scripts/test_quality.py`
195. `scripts/test_similarity.py`
196. `scripts/test_verification.py`
197. `scripts/test_verifier.py`
198. `scripts/test_yolo_prediction.py`
199. `alembic/env.py`
200-225. `alembic/versions/*.py` (26 database migration scripts)

---

## 3. Module Responsibilities Summary

### API Controllers (`api/`)
- `api/app.py`: Creates FastAPI app, mounts `/uploads` static server, registers root router.
- `api/routes.py`: Aggregates all 17 sub-routers into a master router.
- `api/auth.py`: Registration, login token issuance, email OTP verification, password reset, and profile inspection endpoints.
- `api/report.py`: Issue report submission, duplicate handling, citizen/department report listing, pagination, and cancellation/reopening.
- `api/assignment.py`: Worker assignment queries and work initiation (`/start-work`) endpoint.
- `api/resolution.py`: Worker resolution proof upload, manual review approval, and rejection.
- `api/forward_request.py`: Inter-department report forwarding creation, approval, acceptance, and declination.
- `api/admin.py`: Department Admin invitation and account activation.
- `api/city_admin.py`: City Admin creation, activation, and user account blocking/unblocking.
- `api/worker.py`: Field worker creation, invitation activation, deactivation, and blocking.
- `api/department.py`: Municipal department creation, listing, activation, and deactivation.
- `api/dashboard.py`: Analytics summaries for City Admin, Department Admin, Worker, and Citizen dashboards.
- `api/system_issue.py`: In-app system issue reporting, status updates, and attachment uploads.
- `api/timeline.py`: Audit log timeline extraction for citizen status tracking.
- `api/in_app_notification.py`: In-app notification retrieval and read status marking.
- `api/feedback.py`: Citizen feedback submission and summary export.
- `api/generate_report.py`: Detailed PDF report document generator.
- `api/profile.py`: User profile updates and avatar upload.
- `api/ai_dataset.py`: Exporting verified report detections for model retraining datasets.

### Core Domain Services (`services/`)
- `services/auth_service.py`: User registration, authentication, JWT creation, OTP dispatching, and password reset flows.
- `services/report_service.py`: Report instantiation, image persistence, detection association, and report queries.
- `services/report_builder.py`: Maps AI inference bounding box detections and metadata into a valid `Report` model.
- `services/assignment.py`: Least-workload worker selection algorithm and proximity-verified work start logic (`START_WORK_RADIUS_METERS`).
- `services/resolution.py`: Orchestrates resolution image verification, OpenCLIP similarity comparison, decision rules, and manual review workflows.
- `services/forward_request_service.py`: State machine managing source department approval and destination department acceptance of misassigned issues.
- `services/duplicate_detection_service.py`: Spatial (Haversine formula) and visual (OpenCLIP embeddings) duplicate issue identifier.
- `services/analytics_service.py`: Aggregates real-time municipal statistics, resolution metrics, and workload insights.
- `services/notification_service.py`: High-level email notification dispatcher.
- `services/in_app_notification_service.py`: Persistent database in-app notification generator.
- `services/audit_log_service.py`: Records immutable system events into `audit_logs`.
- `services/email_service.py`: SMTP connection manager for email delivery.
- `services/priority_engine.py`: Maps detected civic issue types to default priority ratings (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

### Verification & AI Inference (`verification/` & `inference/`)
- `verification/verifier.py`: Aggregates EXIF metadata analysis and OpenCV quality metrics.
- `verification/risk_engine.py`: Evaluates weighted risk scores (EXIF + Quality) to issue `PASS`, `REVIEW`, or `REJECT` verification decisions.
- `verification/exif/detector.py`: Evaluates EXIF tags for missing camera data, date/time, GPS coordinates, or software editing flags.
- `verification/quality/detector.py`: Calculates OpenCV Laplacian blur score, brightness, contrast, and resolution compliance.
- `inference/engine.py`: Runs verification checks followed by YOLO segmentation inference (`YOLOPredictor`), generating annotated bounding box renders.
- `inference/predictor.py`: Loads and runs the PyTorch YOLO model weights (`best_cscrs_seg_v1.pt`).
- `inference/resolution_ai/similarity.py`: Uses OpenCLIP `ViT-B-32` feature embeddings to compute cosine scene similarity between original and resolution photos.
- `inference/resolution_ai/rules.py`: Determines resolution outcome (`FULLY_RESOLVED`, `REVIEW`, `NOT_RESOLVED`) based on scene similarity and YOLO class presence.

---

## 4. Missing Documentation & Codebase Gaps Identified

1. **Unimplemented `third_party` AI Generator Detection Dependency**:
   - `verification/ai_generated/detector.py` and `model_loader.py` reference `from third_party.UniversalFakeDetect.models import get_model` and `fc_weights.pth`. The `third_party` directory is missing from the workspace. This component is isolated from main API runs but present in benchmark scripts.
2. **Empty Verification Packages**:
   - `verification/gps/` and `verification/timestamp/` directories contain no functional modules.
3. **Empty Documentation Base**:
   - Root `README.MD` and previous `docs/` files were completely empty prior to generating this suite.
