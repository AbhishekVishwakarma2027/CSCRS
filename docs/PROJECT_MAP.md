# CSCRS Project Map & Module Inventory

## 1. Repository Directory Structure Overview

```
CSCRS/
├── .dockerignore                     # Docker ignore rules
├── .env                              # Local environment variables
├── .env.example                      # Environment variables template
├── .env.production.example           # Production environment template
├── .gitignore                        # Git ignore rules
├── Dockerfile                        # Production Dockerfile
├── LICENSE                           # License file
├── README.MD                         # Root readme
├── alembic.ini                       # Alembic database migration configuration
├── backup.sh                         # Database backup shell script
├── cscrs.db                          # SQLite database instance (development)
├── deploy.sh                         # Production Docker deployment runner
├── docker-compose.yml                # Docker Compose orchestration
├── requirements-dev.txt              # Development & training Python dependencies
├── requirements-prod.txt             # Production Python dependencies
├── update.sh                         # System update shell script
├── alembic/                          # Alembic database migration files
│   ├── env.py                        # Migration environment script
│   ├── script.py.mako                # Migration script template
│   └── versions/                     # 2 Database schema migration scripts
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
│   │   ├── refresh_token.py          # Refresh token CRUD
│   │   ├── report.py                 # Civic issue report CRUD
│   │   ├── report_detection.py       # AI bounding box detection CRUD
│   │   ├── report_forward_history.py # Forward history log CRUD
│   │   ├── report_image.py           # Report image asset CRUD
│   │   ├── report_support.py         # Duplicate report citizen support count CRUD
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
│       ├── refresh_token.py          # RefreshToken model
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
├── deployment/                       # Production deployment configurations
│   ├── oracle_vm_setup.md            # VM setup instructions
│   └── nginx/                        # Nginx reverse proxy configs
│       └── nginx.conf
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
│   ├── bootstrap_super_admin.py      # Seed initial Super Admin account
│   ├── seed_departments.py           # Seed initial municipal departments
│   └── sk.py                         # Secret key generator script
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
│   ├── refresh_token_service.py      # JWT refresh token & multi-device session service
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
├── third_party/                      # Third-party integrated repositories
│   └── UniversalFakeDetect/          # Synthetic image generator detector repository
│       ├── dataset_paths.py
│       ├── train.py
│       ├── validate.py
│       ├── data/
│       ├── models/
│       ├── networks/
│       └── options/
├── train/                            # YOLO Fine-Tuning & Training Scripts
│   ├── __init__.py
│   ├── resume_training.py            # Resume YOLO training script
│   └── train.py                      # Train YOLO segmentation model script
├── uploads/                          # Static Uploaded File Storage
│   └── resolution/                   # Worker uploaded resolution proof photos
├── utils/                            # Helper Utilities
│   ├── __init__.py
│   ├── datetime_utils.py             # Datetime timezone parsing utility
│   ├── feedback_export.py            # Feedback CSV/Excel export helper
│   ├── file_utils.py                 # File deletion & filename generator helpers
│   ├── gps.py                        # Haversine distance & EXIF GPS coordinate converter
│   ├── logger.py                     # Centralized platform logger setup
│   ├── rate_limiter.py               # slowapi Redis smart rate limiter
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
    ├── gps/                          # GPS verification subpackage (empty placeholder)
    ├── quality/                      # OpenCV image quality verification module
    │   ├── __init__.py
    │   ├── detector.py               # QualityDetector risk evaluation
    │   ├── metrics.py                # Blur, brightness, contrast & resolution calculators
    │   └── rules.py                  # Quality metric threshold rules
    └── timestamp/                    # Timestamp verification subpackage (empty placeholder)
```

---

## 2. Complete Inventory of Python Files

Total Python Files in Repository: **220 Files** (including 2 Alembic migration scripts).

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
44. `database/models/refresh_token.py`
45. `database/models/report.py`
46. `database/models/report_detection.py`
47. `database/models/report_forward_history.py`
48. `database/models/report_image.py`
49. `database/models/report_support.py`
50. `database/models/resolution.py`
51. `database/models/resolution_ai_result.py`
52. `database/models/resolution_attempt.py`
53. `database/models/system_issue.py`
54. `database/models/system_issue_attachment.py`
55. `database/models/user.py`
56. `database/models/worker_invitation.py`
57. `database/models/worker_profile.py`

### Database CRUD Layer (`database/crud/`) - 27 Files
58. `database/crud/__init__.py`
59. `database/crud/admin.py`
60. `database/crud/ai_dataset.py`
61. `database/crud/analytics.py`
62. `database/crud/assignment.py`
63. `database/crud/audit_log.py`
64. `database/crud/city_admin.py`
65. `database/crud/department.py`
66. `database/crud/department_forward_request.py`
67. `database/crud/email_verification.py`
68. `database/crud/feedback.py`
69. `database/crud/in_app_notification.py`
70. `database/crud/login_audit.py`
71. `database/crud/password_reset.py`
72. `database/crud/refresh_token.py`
73. `database/crud/report.py`
74. `database/crud/report_detection.py`
75. `database/crud/report_forward_history.py`
76. `database/crud/report_image.py`
77. `database/crud/report_support.py`
78. `database/crud/resolution.py`
79. `database/crud/resolution_ai.py`
80. `database/crud/resolution_attempt.py`
81. `database/crud/system_issue.py`
82. `database/crud/system_issue_attachment.py`
83. `database/crud/user.py`
84. `database/crud/worker.py`

### Evaluation Lab (`evaluation/` & `evaluation_lab/`) - 6 Files
85. `evaluation/__init__.py`
86. `evaluation_lab/app.py`
87. `evaluation_lab/config.py`
88. `evaluation_lab/predictor.py`
89. `evaluation_lab/test_predictor.py`
90. `evaluation_lab/ui.py`

### Inference Pipeline (`inference/`) - 16 Files
91. `inference/__init__.py`
92. `inference/classes.py`
93. `inference/config.py`
94. `inference/engine.py`
95. `inference/geometry.py`
96. `inference/parser.py`
97. `inference/predictor.py`
98. `inference/visualizer.py`
99. `inference/resolution_ai/__init__.py`
100. `inference/resolution_ai/engine.py`
101. `inference/resolution_ai/gps.py`
102. `inference/resolution_ai/history.py`
103. `inference/resolution_ai/rules.py`
104. `inference/resolution_ai/similarity.py`
105. `inference/resolution_ai/tempCodeRunnerFile.py`
106. `inference/resolution_ai/verifier.py`

### Schemas (`schemas/`) - 22 Files
107. `schemas/__init__.py`
108. `schemas/admin.py`
109. `schemas/ai_dataset.py`
110. `schemas/analytics.py`
111. `schemas/assignment.py`
112. `schemas/audit_service.py`
113. `schemas/city_admin.py`
114. `schemas/common.py`
115. `schemas/department.py`
116. `schemas/feedback.py`
117. `schemas/forward_request.py`
118. `schemas/generate_report.py`
119. `schemas/in_app_notification.py`
120. `schemas/inference.py`
121. `schemas/profile.py`
122. `schemas/report.py`
123. `schemas/resolution.py`
124. `schemas/response.py`
125. `schemas/system_issue.py`
126. `schemas/timeline.py`
127. `schemas/user.py`
128. `schemas/worker.py`

### Core Domain Services (`services/`) - 29 Files
129. `services/__init__.py`
130. `services/admin_service.py`
131. `services/ai_dataset_service.py`
132. `services/analytics_service.py`
133. `services/assignment.py`
134. `services/audit_log_service.py`
135. `services/auth_service.py`
136. `services/city_admin_service.py`
137. `services/department_service.py`
138. `services/duplicate_detection_service.py`
139. `services/email_service.py`
140. `services/feedback_service.py`
141. `services/forward_request_service.py`
142. `services/generate_report_service.py`
143. `services/in_app_notification_service.py`
144. `services/notification_service.py`
145. `services/otp_service.py`
146. `services/priority_engine.py`
147. `services/profile_service.py`
148. `services/refresh_token_service.py`
149. `services/report_builder.py`
150. `services/report_service.py`
151. `services/report_support_service.py`
152. `services/resolution.py`
153. `services/security_service.py`
154. `services/system_issue_service.py`
155. `services/timeline_service.py`
156. `services/worker_invitation.py`
157. `services/worker_service.py`

### Templates & Training (`templates/` & `train/`) - 4 Files
158. `templates/email_templates.py`
159. `train/__init__.py`
160. `train/resume_training.py`
161. `train/train.py`

### Utilities (`utils/`) - 8 Files
162. `utils/__init__.py`
163. `utils/datetime_utils.py`
164. `utils/feedback_export.py`
165. `utils/file_utils.py`
166. `utils/gps.py`
167. `utils/logger.py`
168. `utils/rate_limiter.py`
169. `utils/report_number.py`

### Verification Pipeline (`verification/`) - 19 Files
170. `verification/__init__.py`
171. `verification/base_detector.py`
172. `verification/risk_engine.py`
173. `verification/verifier.py`
174. `verification/ai_generated/__init__.py`
175. `verification/ai_generated/config.py`
176. `verification/ai_generated/detector.py`
177. `verification/ai_generated/infer.py`
178. `verification/ai_generated/model_loader.py`
179. `verification/duplicate/__init__.py`
180. `verification/exif/__init__.py`
181. `verification/exif/detector.py`
182. `verification/exif/parser.py`
183. `verification/exif/rules.py`
184. `verification/exif/utils.py`
185. `verification/quality/__init__.py`
186. `verification/quality/detector.py`
187. `verification/quality/metrics.py`
188. `verification/quality/rules.py`

### Scripts & Alembic (`scripts/` & `alembic/`) - 6 Files
189. `alembic/env.py`
190. `alembic/versions/08a946b86902_initial_postgresql_schema.py`
191. `alembic/versions/65d2488006d6_create_refresh_tokens_table.py`
192. `scripts/bootstrap_super_admin.py`
193. `scripts/seed_departments.py`
194. `scripts/sk.py`

### Third-Party Integrated Modules (`third_party/`) - 26 Files
195. `third_party/UniversalFakeDetect/dataset_paths.py`
196. `third_party/UniversalFakeDetect/train.py`
197. `third_party/UniversalFakeDetect/validate.py`
198. `third_party/UniversalFakeDetect/data/__init__.py`
199. `third_party/UniversalFakeDetect/data/datasets.py`
200. `third_party/UniversalFakeDetect/models/__init__.py`
201. `third_party/UniversalFakeDetect/models/clip/__init__.py`
202. `third_party/UniversalFakeDetect/models/clip/clip.py`
203. `third_party/UniversalFakeDetect/models/clip/model.py`
204. `third_party/UniversalFakeDetect/models/clip/simple_tokenizer.py`
205. `third_party/UniversalFakeDetect/models/clip_models.py`
206. `third_party/UniversalFakeDetect/models/imagenet_models.py`
207. `third_party/UniversalFakeDetect/models/resnet.py`
208. `third_party/UniversalFakeDetect/models/vgg.py`
209. `third_party/UniversalFakeDetect/models/vision_transformer.py`
210. `third_party/UniversalFakeDetect/models/vision_transformer_misc.py`
211. `third_party/UniversalFakeDetect/models/vision_transformer_utils.py`
212. `third_party/UniversalFakeDetect/networks/__init__.py`
213. `third_party/UniversalFakeDetect/networks/base_model.py`
214. `third_party/UniversalFakeDetect/networks/lpf.py`
215. `third_party/UniversalFakeDetect/networks/resnet_lpf.py`
216. `third_party/UniversalFakeDetect/networks/trainer.py`
217. `third_party/UniversalFakeDetect/options/__init__.py`
218. `third_party/UniversalFakeDetect/options/base_options.py`
219. `third_party/UniversalFakeDetect/options/test_options.py`
220. `third_party/UniversalFakeDetect/options/train_options.py`

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
- `services/admin_service.py`: Onboards municipal department administrator accounts.
- `services/ai_dataset_service.py`: Generates dataset zip exports of verified civic issue detections for model retraining.
- `services/analytics_service.py`: Real-time analytics summaries for City Admin, Department Admin, Citizen, and Worker dashboards.
- `services/assignment.py`: Selects the worker with the lowest active workload and verifies location check proximity.
- `services/audit_log_service.py`: Saves immutable system events and history logs to the audit log table.
- `services/auth_service.py`: User registration, login token generation, password resets, and user verification workflows.
- `services/city_admin_service.py`: Onboards City Admin accounts and manages blocking/unblocking policies for citizens and workers.
- `services/department_service.py`: Manages municipal department creation, details querying, and state activation toggle.
- `services/duplicate_detection_service.py`: Identifies near-duplicate issues using location-bound checks and visual OpenCLIP scene embedding.
- `services/email_service.py`: Formats and sends notifications using templated HTML emails via SMTP.
- `services/feedback_service.py`: Collects user feedback submissions and creates feedback export statistics.
- `services/forward_request_service.py`: Moves wrong-department issues to target departments through cross-approval states.
- `services/generate_report_service.py`: Exposes automated PDF document generator for report analytics.
- `services/in_app_notification_service.py`: Creates user-targeted in-app notification events.
- `services/notification_service.py`: Acts as a high-level notification aggregator dispatcher.
- `services/otp_service.py`: Handles OTP codes generation, resend cooldowns, and max login attempt restrictions.
- `services/priority_engine.py`: Maps class predictions to default priority ratings.
- `services/profile_service.py`: Manages user profile details and profile avatar file uploads.
- `services/refresh_token_service.py`: Handles secure session management, rotation validation, and revocation logs.
- `services/report_builder.py`: Maps YOLO inference boundaries into database-compatible Report items.
- `services/report_service.py`: Main Report CRUD builder and report pagination query loader.
- `services/report_support_service.py`: Handles citizen support endorsement counters.
- `services/resolution.py`: Connects resolution proofs, similarity outputs, and auto-decision rule outputs.
- `services/security_service.py`: Provides blocking policies and failed login attempt lock timers.
- `services/system_issue_service.py`: Manages application system issue bugs lifecycle.
- `services/timeline_service.py`: Translates raw audit actions into user-friendly tracking events.
- `services/worker_invitation.py`: Handles worker invite activation URLs and security tokens.
- `services/worker_service.py`: Onboards and manages field workers.

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

1. **Empty Verification Packages**:
   - `verification/gps/` and `verification/timestamp/` directories contain no functional modules.
