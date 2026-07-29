# CSCRS Architecture & Workflows Documentation

## 1. System Architecture Overview

The **Civic Surveillance & Complaint Resolution System (CSCRS)** is engineered as a multi-layered, micro-service-ready web application built around **FastAPI**, **SQLAlchemy ORM**, **SQLite/PostgreSQL**, and specialized **Deep Learning Computer Vision** models.

```mermaid
graph TD
    Client[Web / Mobile Clients] -->|HTTPS / JWT| API[FastAPI API Router Layer]
    API --> Auth[Authentication & Security]
    API --> Services[Domain Services Layer]
    
    subgraph Core Domain Services
        Services --> ReportSvc[Report Service]
        Services --> AssignSvc[Assignment Service]
        Services --> ResSvc[Resolution Service]
        Services --> FwdSvc[Forward Request Service]
        Services --> AnalyticsSvc[Analytics Service]
        Services --> AuditSvc[Audit Log Service]
        Services --> NotifSvc[Notification Service]
    end

    subgraph Verification & AI Inference Pipeline
        ReportSvc --> InferEngine[Inference Engine]
        ResSvc --> ResAI[Resolution AI Engine]
        
        InferEngine --> Verifier[Verification Engine]
        Verifier --> EXIF[EXIF Detector]
        Verifier --> Quality[Quality Detector - OpenCV]
        Verifier --> RiskEng[Risk Engine]
        
        InferEngine --> YOLO[YOLO Predictor - best_cscrs_seg_v1.pt]
        ResAI --> OpenCLIP[Scene Similarity - OpenCLIP ViT-B-32]
        ResAI --> RuleEng[Resolution Rule Engine]
    end

    subgraph Data Access Layer
        Services --> CRUD[SQLAlchemy CRUD Layer]
        CRUD --> Models[SQLAlchemy Models]
        Models --> DB [(PostgreSQL / SQLite)]
    end

    subgraph External System Interfaces
        NotifSvc --> SMTP[SMTP Email Server]
    end
```

---

## 2. Global Dependency Graph

```mermaid
graph LR
    api_routes[api/routes.py] --> api_auth[api/auth.py]
    api_routes --> api_report[api/report.py]
    api_routes --> api_assignment[api/assignment.py]
    api_routes --> api_resolution[api/resolution.py]
    api_routes --> api_forward[api/forward_request.py]
    api_routes --> api_dashboard[api/dashboard.py]

    api_report --> service_report[services/report_service.py]
    api_report --> service_assign[services/assignment.py]
    api_report --> service_duplicate[services/duplicate_detection_service.py]
    api_report --> infer_engine[inference/engine.py]

    infer_engine --> verifier_engine[verification/verifier.py]
    infer_engine --> yolo_predictor[inference/predictor.py]
    verifier_engine --> risk_engine[verification/risk_engine.py]
    verifier_engine --> exif_detector[verification/exif/detector.py]
    verifier_engine --> quality_detector[verification/quality/detector.py]

    service_resolution[services/resolution.py] --> res_ai_engine[inference/resolution_ai/engine.py]
    service_resolution --> res_rule_engine[inference/resolution_ai/rules.py]
    res_ai_engine --> clip_similarity[inference/resolution_ai/similarity.py]

    service_report --> db_crud_report[database/crud/report.py]
    service_assign --> db_crud_assign[database/crud/assignment.py]
    service_resolution --> db_crud_res[database/crud/resolution.py]
```

---

## 3. Service Interaction Map

```mermaid
graph TB
    subgraph API Layer
        AuthAPI[Auth API]
        ReportAPI[Report API]
        AssignAPI[Assignment API]
        ResAPI[Resolution API]
        FwdAPI[Forward Request API]
    end

    subgraph Service Layer
        AuthSvc[Auth Service]
        ReportSvc[Report Service]
        AssignSvc[Assignment Service]
        ResSvc[Resolution Service]
        FwdSvc[Forward Request Service]
        DupSvc[Duplicate Detection Service]
        AuditSvc[Audit Log Service]
        InAppNotifSvc[InApp Notification Service]
        EmailNotifSvc[Notification Service]
    end

    ReportAPI --> ReportSvc
    ReportAPI --> DupSvc
    ReportSvc --> AssignSvc
    AssignAPI --> AssignSvc
    ResAPI --> ResSvc
    FwdAPI --> FwdSvc

    ReportSvc --> AuditSvc
    AssignSvc --> AuditSvc
    AssignSvc --> InAppNotifSvc
    ResSvc --> AuditSvc
    ResSvc --> InAppNotifSvc
    ResSvc --> EmailNotifSvc
    FwdSvc --> AuditSvc
    FwdSvc --> InAppNotifSvc
```

---

## 4. Workflows & Sequence Diagrams

### Workflow 1: Authentication & User Management Flow

```mermaid
flowchart TD
    Start([User Registration Request]) --> CheckExists{Email / Phone Exists?}
    CheckExists -- Yes --> Error[Return 400 Conflict]
    CheckExists -- No --> HashPwd[Hash Password using bcrypt]
    HashPwd --> CreateUser[Create Inactive User Record]
    CreateUser --> GenOTP[Generate 6-Digit OTP]
    GenOTP --> SendEmail[Dispatch Email via SMTP]
    SendEmail --> AwaitOTP([Await User OTP Verification])
    AwaitOTP --> VerifyOTP{OTP Valid & Unexpired?}
    VerifyOTP -- No --> OTPError[Return 400 Invalid OTP]
    VerifyOTP -- Yes --> ActivateUser[Set is_active=True]
    ActivateUser --> Login([User Login Request])
    Login --> VerifyCreds{Password Valid?}
    VerifyCreds -- No --> AuthFail[Return 401 Unauthorized]
    VerifyCreds -- Yes --> GenJWT[Generate JWT Token with jti & sid]
    GenJWT --> ReturnToken[Return Access Token]
```

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    participant AuthAPI as Auth Router
    participant AuthSvc as Auth Service
    participant OTPSvc as OTP Service
    participant DB as Database
    participant Email as Email Service

    Citizen->>AuthAPI: POST /api/v1/auth/register
    AuthAPI->>AuthSvc: register(user_data)
    AuthSvc->>DB: Check existing email/phone
    AuthSvc->>AuthSvc: hash_password(password)
    AuthSvc->>DB: Create User (is_active=False)
    AuthSvc->>OTPSvc: generate_otp(email)
    OTPSvc->>DB: Save EmailVerification OTP
    AuthSvc->>Email: send_email_verification_otp()
    Email-->>Citizen: Email with OTP Code

    Citizen->>AuthAPI: POST /api/v1/auth/verify-email
    AuthAPI->>AuthSvc: verify_email(email, otp)
    AuthSvc->>OTPSvc: validate_otp(email, otp)
    AuthSvc->>DB: Update User (is_active=True)
    AuthAPI-->>Citizen: 200 Email Verified

    Citizen->>AuthAPI: POST /api/v1/auth/login
    AuthAPI->>AuthSvc: login(username, password)
    AuthSvc->>DB: Retrieve User
    AuthSvc->>AuthSvc: verify_password()
    AuthSvc->>AuthSvc: create_access_token()
    AuthSvc->>AuthSvc: create_refresh_token()
    AuthSvc->>DB: Save RefreshToken record
    AuthAPI-->>Citizen: 200 Access & Refresh Tokens (JWT)
```

---

### Workflow 2: AI Report Submission & Verification Flow

```mermaid
flowchart TD
    CitizenUpload([Citizen Uploads Report Image]) --> SaveTemp[Save file to /uploads]
    SaveTemp --> RunVerify[VerificationEngine.verify]
    RunVerify --> EXIFCheck[EXIFDetector: Parse GPS, DateTime, Camera]
    RunVerify --> QualityCheck[QualityDetector: Calculate Blur, Contrast, Brightness]
    EXIFCheck & QualityCheck --> RiskEval[RiskEngine.evaluate: Calculate Weighted Risk]
    RiskEval --> RiskDecision{Risk Decision?}
    RiskDecision -- REJECT --> DeleteTemp[Delete Image & Return 400 Rejected]
    RiskDecision -- PASS / REVIEW --> RunYOLO[YOLOPredictor.predict: YOLOv8 Segmentation]
    RunYOLO --> CheckDetections{Civic Issue Detected?}
    CheckDetections -- No --> Cleanup[Unlink Image & Return 400 No Issue Detected]
    CheckDetections -- Yes --> MapDept[DepartmentService: Map Issue to Department]
    MapDept --> DupCheck[DuplicateDetectionService.find_duplicate]
    DupCheck --> IsDup{Duplicate Found?}
    IsDup -- Yes --> AddSupport[Add Citizen Support & Return Duplicate Response]
    IsDup -- No --> CreateReport[ReportBuilder: Create Report Record]
    CreateReport --> SaveImages[Save Original & Annotated ReportImages]
    SaveImages --> AutoAssign[AssignmentService.assign_worker]
    AutoAssign --> Done([Return Report Confirmation Response])
```

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    participant API as Report API
    participant Infer as Inference Engine
    participant Verifier as Verification Engine
    participant Risk as Risk Engine
    participant YOLO as YOLO Predictor
    participant Dup as Duplicate Service
    participant Assign as Assignment Service
    participant DB as Database

    Citizen->>API: POST /api/v1/report (Image file)
    API->>Infer: predict(image_path)
    Infer->>Verifier: verify(image_path)
    Verifier->>Risk: evaluate(EXIF, Quality)
    Risk-->>Verifier: Decision (PASS/REVIEW)
    Infer->>YOLO: predict(image_path)
    YOLO-->>Infer: Bounding Boxes, Class, Confidence
    Infer-->>API: Detections & Verification Results
    API->>Dup: find_duplicate(issue_type, lat, lon, image)
    alt Is Duplicate
        Dup-->>API: Duplicate Match Found
        API->>DB: Add ReportSupport record
        API-->>Citizen: 200 Supported Existing Report
    else Is New Report
        Dup-->>API: No Duplicate
        API->>DB: Save Report & ReportImage
        API->>Assign: assign_worker(report_id)
        Assign->>DB: Auto-select worker & create Assignment
        API-->>Citizen: 200 Report Created (Report Number)
    end
```

---

### Workflow 3: Worker Assignment & Work Start Flow

```mermaid
flowchart TD
    AssignStart([Report Created / Forward Accepted]) --> GetWorkers[Fetch Available Department Workers]
    GetWorkers --> WorkersExist{Workers Available?}
    WorkersExist -- No --> Throw404[Raise 404 No Available Workers]
    WorkersExist -- Yes --> SelectWorker[Select Worker with Lowest Active Assignments]
    SelectWorker --> CreateAssignment[Create Assignment (Status: ASSIGNED)]
    CreateAssignment --> UpdateReportStatus[Update Report Status to ASSIGNED]
    UpdateReportStatus --> AuditLog[Log Action AUTO_ASSIGNED]
    AuditLog --> NotifyWorker[Create InAppNotification for Worker]
    NotifyWorker --> WorkerArrives([Worker Arrives at Site])
    WorkerArrives --> StartWorkRequest[Worker POST /api/v1/assignments/{assignment_id}/start]
    StartWorkRequest --> CalcDist[Calculate Distance from Report GPS via Haversine]
    CalcDist --> CheckRadius{Distance <= 30m?}
    CheckRadius -- No --> RejectStart[Raise 403 Distance Exceeded]
    CheckRadius -- Yes --> UpdateAssign[Set Assignment Status IN_PROGRESS]
    UpdateAssign --> UpdateReport[Set Report Status IN_PROGRESS]
    UpdateReport --> LogWork[AuditLog: WORK_STARTED]
    LogWork --> NotifyCitizen[InAppNotification to Citizen: Work Started]
```

```mermaid
sequenceDiagram
    autonumber
    actor Worker
    participant AssignAPI as Assignment API
    participant AssignSvc as Assignment Service
    participant DB as Database
    participant Audit as Audit Log Service
    participant Notif as InApp Notification Service

    AssignSvc->>DB: Fetch department workers
    AssignSvc->>AssignSvc: Select worker with min(active_assignments)
    AssignSvc->>DB: Create Assignment (Status: ASSIGNED)
    AssignSvc->>DB: Update Report Status to ASSIGNED
    AssignSvc->>Audit: log("AUTO_ASSIGNED")
    AssignSvc->>Notif: create_notification("New Assignment")

    Worker->>AssignAPI: POST /api/v1/assignments/{assignment_id}/start (lat, lon)
    AssignAPI->>AssignSvc: start_work(assignment_id, worker_id, lat, lon)
    AssignSvc->>AssignSvc: calculate_distance(worker_gps, report_gps)
    alt Distance > 30 meters
        AssignSvc-->>AssignAPI: 403 Forbidden (Too far from location)
    else Distance <= 30 meters
        AssignSvc->>DB: Update Assignment (Status: IN_PROGRESS)
        AssignSvc->>DB: Update Report (Status: IN_PROGRESS)
        AssignSvc->>Audit: log("WORK_STARTED")
        AssignSvc->>Notif: create_notification("Work Started")
        AssignAPI-->>Worker: 200 Work Started Confirmed
    end
```

---

### Workflow 4: Resolution Verification & Approval Flow

```mermaid
flowchart TD
    WorkerUpload([Worker Uploads Resolution Proof Image]) --> SaveResImg[Save image to /uploads/resolution]
    SaveResImg --> RunYOLO[InferenceEngine.predict: YOLO Detection on Resolution Photo]
    RunYOLO --> OpenCLIP[ResolutionAIEngine: OpenCLIP Cosine Scene Similarity]
    OpenCLIP --> MatchIssue{YOLO Detected Same Issue?}
    MatchIssue -- Yes --> SetSameIssue[same_issue_detected = True]
    MatchIssue -- No --> SetNoIssue[same_issue_detected = False]
    SetSameIssue & SetNoIssue --> EvaluateRule[ResolutionRuleEngine.evaluate]
    EvaluateRule --> Decision{Rule Decision?}
    Decision -- PASS --> AutoApprove[Set Report RESOLVED & Assignment COMPLETED]
    Decision -- REVIEW --> ManualReview[Set manual_review = True]
    Decision -- FAIL --> RejectRes[Set verification_decision REJECT]

    AutoApprove --> NotifSuccess[Notify Worker & Citizen & Send Resolution Email]
    ManualReview --> AdminQueue[Add to Department Admin Review Queue]
    AdminQueue --> AdminAction{Department Admin Decision?}
    AdminAction -- Approve --> AutoApprove
    AdminAction -- Reject --> ReopenWork[Revert Report to IN_PROGRESS & Notify Worker]
```

```mermaid
sequenceDiagram
    autonumber
    actor Worker
    actor Admin
    participant ResAPI as Resolution API
    participant ResSvc as Resolution Service
    participant Infer as Inference Engine
    participant CLIP as OpenCLIP Engine
    participant DB as Database
    participant Notif as Notification Service

    Worker->>ResAPI: POST /api/v1/resolutions (Image file)
    ResAPI->>ResSvc: create_resolution(assignment_id, image)
    ResSvc->>Infer: predict(resolution_image)
    ResSvc->>CLIP: compare(original_image, resolution_image)
    CLIP-->>ResSvc: scene_similarity (e.g. 0.85)
    ResSvc->>ResSvc: ResolutionRuleEngine.evaluate()
    
    alt Decision == PASS
        ResSvc->>DB: Update Report Status RESOLVED
        ResSvc->>DB: Update Assignment Status COMPLETED
        ResSvc->>Notif: Send Resolution Email & InApp Notifications
        ResAPI-->>Worker: 200 Resolution Approved
    else Decision == REVIEW
        ResSvc->>DB: Save Resolution (manual_review=True)
        ResAPI-->>Worker: 200 Pending Manual Review
        Admin->>ResAPI: POST /api/v1/resolutions/manual-review/{report_id}/approve
        ResAPI->>ResSvc: approve_manual_review(report_id)
        ResSvc->>DB: Update Report Status RESOLVED
        ResSvc->>Notif: Send Resolution Completed Email
        ResAPI-->>Admin: 200 Manual Review Approved
    end
```

---

### Workflow 5: Inter-Department Forwarding Flow

```mermaid
flowchart TD
    WorkerFlag([Worker Flags Wrong Department Issue]) --> CreateFwd[Create DepartmentForwardRequest (Status: PENDING)]
    CreateFwd --> SourceReview([Source Department Admin Reviews Request])
    SourceReview --> SourceDecision{Source Admin Decision?}
    SourceDecision -- Reject --> RejectFwd[Set Status REJECTED & Keep Report Assigned to Worker]
    SourceDecision -- Approve --> ApproveFwd[Set Status WAITING_DESTINATION & Specify Target Department]
    ApproveFwd --> DestReview([Destination Department Admin Reviews Request])
    DestReview --> DestDecision{Destination Admin Decision?}
    DestDecision -- Decline --> ReturnSource[Set Status REJECTED & Reassign to Source Worker]
    DestDecision -- Accept --> AcceptFwd[Set Status ACCEPTED & Update Report Department]
    AcceptFwd --> NewAssign[AssignmentService: Assign Worker in Destination Department]
```

```mermaid
sequenceDiagram
    autonumber
    actor Worker
    actor SourceAdmin as Source Dept Admin
    actor DestAdmin as Destination Dept Admin
    participant FwdAPI as Forward API
    participant FwdSvc as Forward Request Service
    participant AssignSvc as Assignment Service
    participant DB as Database

    Worker->>FwdAPI: POST /api/v1/forward-requests/{report_id} (reason)
    FwdAPI->>FwdSvc: create_request(report_id, worker, request)
    FwdSvc->>DB: Create DepartmentForwardRequest (Status: PENDING)
    
    SourceAdmin->>FwdAPI: POST /api/v1/forward-requests/{request_id}/approve
    FwdAPI->>FwdSvc: approve_request(request_id, destination_dept_id)
    FwdSvc->>DB: Update Status (WAITING_DESTINATION)

    alt Destination Admin Accepts
        DestAdmin->>FwdAPI: POST /api/v1/forward-requests/{request_id}/accept
        FwdAPI->>FwdSvc: accept_request(request_id)
        FwdSvc->>DB: Update Report Department ID
        FwdSvc->>AssignSvc: assign_worker(new_department_id)
        AssignSvc->>DB: Create New Assignment for Destination Worker
        FwdAPI-->>DestAdmin: 200 Forward Accepted & Reassigned
    else Destination Admin Declines
        DestAdmin->>FwdAPI: POST /api/v1/forward-requests/{request_id}/decline
        FwdAPI->>FwdSvc: decline_request(request_id, reason)
        FwdSvc->>DB: Revert Assignment to Original Source Worker
        FwdAPI-->>DestAdmin: 200 Forward Declined & Returned
    end
```

---

### Workflow 6: Duplicate Detection Flow

```mermaid
flowchart TD
    NewReport([New Report Submission Upload]) --> ExtractGPS[Extract Decimal Latitude & Longitude]
    ExtractGPS --> QueryNearby[Find Active Reports within DUPLICATE_REPORT_RADIUS_METERS (8m)]
    QueryNearby --> NearbyFound{Nearby Active Reports Found?}
    NearbyFound -- No --> ReturnNoDup[Return Duplicate: None]
    NearbyFound -- Yes --> MatchIssueClass{Same Issue Type / Class?}
    MatchIssueClass -- No --> ReturnNoDup
    MatchIssueClass -- Yes --> CheckScene{DUPLICATE_ENABLE_SCENE_CHECK == True?}
    CheckScene -- No --> MarkDuplicate[Mark Duplicate Found]
    CheckScene -- Yes --> RunCLIP[Compare Image Embeddings via OpenCLIP]
    RunCLIP --> SimCheck{Scene Similarity >= 0.82?}
    SimCheck -- No --> ReturnNoDup
    SimCheck -- Yes --> MarkDuplicate
    MarkDuplicate --> AddSupport[Add Citizen Support to Existing Report & Increment Support Count]
```

---

### Workflow 7: AI Inference Pipeline Flow

```mermaid
flowchart TD
    InputImage([Input Image File Path]) --> ReadEXIF[EXIFDetector: Read PIL EXIF Tags]
    ReadEXIF --> ReadQuality[QualityDetector: Calculate OpenCV Metrics]
    ReadQuality --> RiskCalc[RiskEngine: Compute Weighted Risk & Flags]
    RiskCalc --> RiskCheck{Risk Decision == REJECT?}
    RiskCheck -- Yes --> AbortInference[Abort & Return Verification Failure]
    RiskCheck -- No --> LoadYOLO[YOLOPredictor: Run Ultralytics YOLOv8 Segmentation]
    LoadYOLO --> ParseResults[ResultParser: Parse Polygons, BBoxes, Confidences]
    ParseResults --> Visualizer[Visualizer: Render Overlay Bounding Boxes & Save Annotated Image]
    Visualizer --> OutputSummary[Return Detection Summary, Primary Issue, Highest Confidence]
```

---

### Workflow 8: Notification & Email Flow

```mermaid
flowchart TD
    TriggerEvent([System Event Triggered]) --> Dispatch{Event Type?}
    Dispatch -- Account Registration --> SendOTP[NotificationService: Send Email Verification OTP]
    Dispatch -- Worker Invitation --> SendInvite[NotificationService: Send Worker Activation Link]
    Dispatch -- Work Started --> InAppCitizen[InAppNotificationService: Notify Citizen Work Started]
    Dispatch -- Resolution Completed --> EmailCitizen[NotificationService: Send Resolution Completed HTML Email]
    SendOTP & SendInvite & EmailCitizen --> SMTP[EmailService: Render Template & Send via SMTP]
```

---

### Workflow 9: Citizen Timeline Flow

```mermaid
flowchart TD
    TimelineReq([Citizen Requests Timeline GET /api/v1/reports/{id}/timeline]) --> AuthCitizen[Verify Citizen Ownership]
    AuthCitizen --> QueryLogs[AuditLogCRUD: Fetch Audit Logs for Report ID]
    QueryLogs --> MapEvents[Map Internal Actions to Citizen-Facing Titles & Descriptions]
    MapEvents --> FormatTimeline[Format Timestamps & Timeline Items]
    FormatTimeline --> ReturnJson[Return JSON Array of Chronological Events]
```

---

### Workflow 10: Refresh Token Session Management Flow

This workflow handles rotation of refresh tokens to maintain long-lived sessions safely, revoke reused tokens (replay attack prevention), and execute logouts.

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant AuthAPI as Auth Router
    participant RefreshSvc as Refresh Token Service
    participant DB as Database

    Note over Client, DB: Token Refresh Workflow (POST /api/v1/auth/refresh)
    Client->>AuthAPI: Send old refresh token
    AuthAPI->>RefreshSvc: refresh(old_refresh_token)
    RefreshSvc->>DB: Query stored token by token string
    alt Token Reused (revoked_at is not None)
        RefreshSvc->>DB: Revoke entire session (reason: TOKEN_REUSE_DETECTED)
        RefreshSvc-->>AuthAPI: Raise 401 Unauthorized (Session Revoked)
        AuthAPI-->>Client: 401 Unauthorized (Session Expired)
    else Token Active & Valid
        RefreshSvc->>DB: Revoke old token (reason: ROTATED)
        RefreshSvc->>RefreshSvc: Generate new JWT access & refresh tokens
        RefreshSvc->>DB: Create new RefreshToken record
        RefreshSvc-->>AuthAPI: Return new Access & Refresh tokens
        AuthAPI-->>Client: 200 Return tokens & set cookies
    end

    Note over Client, DB: Single Device Logout (POST /api/v1/auth/logout)
    Client->>AuthAPI: Send refresh token
    AuthAPI->>RefreshSvc: logout(refresh_token)
    RefreshSvc->>DB: Revoke token record (reason: LOGOUT)
    RefreshSvc-->>AuthAPI: Logout success
    AuthAPI-->>Client: 200 Logout Confirmed

    Note over Client, DB: Multi-Device Logout (POST /api/v1/auth/logout-all)
    Client->>AuthAPI: Send access token in header
    AuthAPI->>RefreshSvc: logout_all(user_id)
    RefreshSvc->>DB: Revoke all refresh tokens for user (reason: LOGOUT_ALL)
    RefreshSvc-->>AuthAPI: Logout all success
    AuthAPI-->>Client: 200 All Devices Logged Out
```
