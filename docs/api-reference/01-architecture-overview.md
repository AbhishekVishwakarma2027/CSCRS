# 01 - Architecture Overview

The CSCRS backend utilizes a modular, layered architecture built on FastAPI. Understanding these layers helps API consumers anticipate performance, security gates, data validation behaviors, and side-effects.

## Architectural Layers

```mermaid
graph TD
    Client[API Client]
    
    subgraph FastAPI API Layer
        Router[Router Registration / Routing]
        AuthGate[Auth Dependencies / RBAC]
        Validator[Pydantic Validation Layer]
    end
    
    subgraph Service Layer
        Business[Service Classes / Business Logic]
        AIPipeline[AI Inference / Scene Similarity Engine]
        NotifService[In-App & Email Notifications]
    end
    
    subgraph Data Access Layer
        CRUD[CRUD Helper Modules]
        ORM[SQLAlchemy ORM Models]
    end
    
    Database[(SQL Database)]
    Filesystem[(Storage / Uploads File System)]
    
    Client --> Router
    Router --> AuthGate
    AuthGate --> Validator
    Validator --> Business
    Business --> AIPipeline
    Business --> NotifService
    Business --> CRUD
    CRUD --> ORM
    ORM --> Database
    Business --> Filesystem
```

### 1. FastAPI API Layer (`api/`)
* **Routing & Controllers:** Acts as the entry gate. Routes are declared in modular files (e.g. `api/report.py`, `api/assignment.py`) and aggregated in `api/routes.py`.
* **Authentication & RBAC:** Enforced via dependency injection (`Depends(require_roles(...))`). Invalid tokens or insufficient roles trigger immediate early returns (`401` or `403` HTTP status codes) before executing any service logic.
* **Pydantic Validation:** Request payloads are checked against Pydantic models. Any structural or type mismatch raises a `422 Unprocessable Entity` error.

### 2. Service Layer (`services/`)
* **Business Logic:** Implements application rules (e.g., verifying a worker is within 30 meters of coordinates to start an assignment).
* **AI Computer Vision Pipeline:** Integrates custom computer vision components:
  * **YOLO Engine:** Runs inference on submitted reports to verify objects (e.g., street lights, potholes, trash).
  * **OpenCLIP Scene Similarity:** Computes cosine similarity scores (threshold of 0.82) to detect duplicate reports in the same location and evaluate post-repair resolution validity.
* **Notification Dispatchers:** Manages transactional operations, sending email notifications and writing in-app alert events to the database.

### 3. Data Access Layer (`database/`)
* **CRUD Helper Modules:** Functions that execute database commands via SQLAlchemy sessions.
* **SQLAlchemy ORM Models:** Defines the database tables, relations, and enums (e.g. User, Report, Assignment, AuditLog).
* **SQL Database:** Persistence layer configured via connection pools, utilizing transaction rollbacks on failure.

### 4. File / Media Handling (`uploads/` & `utils/file_utils.py`)
* File uploads are received via multipart forms and passed to a centralized validator checking file size, extension, MIME type, and binary header magic-bytes.
* Validated files are assigned a unique, random UUID filename to prevent collision and saved to disk under designated folders (e.g. `uploads/`, `uploads/resolution/`, `uploads/profile/`).

---

## Lifecycle of a Typical Request
To demonstrate the coordination of these layers, the diagram below outlines the flow of a worker attempting to start an assignment via `POST /api/v1/assignments/{assignment_id}/start`:

```mermaid
sequenceDiagram
    autonumber
    actor Worker as API Client (Worker)
    participant API as FastAPI Router
    participant Dependency as Auth Dependency
    participant Service as Assignment Service
    participant Database as SQL Database
    participant Notifications as Notification Service

    Worker->>API: POST /api/v1/assignments/{assignment_id}/start {lat, lon}
    
    Note over API, Dependency: Step 1: Authentication & Authorization
    API->>Dependency: check jwt and require_worker() roles
    alt Token Invalid or Role Mismatch
        Dependency-->>Worker: 401 Unauthorized / 403 Forbidden
    end
    
    Note over API, Service: Step 2: Request Validation & Back-End Dispatch
    API->>API: Validate Pydantic coordinates schema
    alt Invalid coordinates type
        API-->>Worker: 422 Unprocessable Entity
    end
    API->>Service: start_work(assignment_id, worker_id, lat, lon)
    
    Note over Service, Database: Step 3: Business Logic & Data Scoping
    Service->>Database: Fetch assignment & report details
    Service->>Service: Verify assignment ownership & calculate Haversine distance
    alt Distance > 30 meters or not owner
        Service-->>Worker: 403 Forbidden (Too far from location)
    end
    
    Note over Service, Database: Step 4: State Transition & Logging
    Service->>Database: Update Assignment -> IN_PROGRESS & Report -> IN_PROGRESS
    Service->>Database: Write AuditLog entry (WORK_STARTED)
    
    Note over Service, Notifications: Step 5: Side Effects & Response
    Service->>Notifications: Create InAppNotification for Citizen
    Service-->>Worker: 200 OK (Work Started Confirmed)
```
