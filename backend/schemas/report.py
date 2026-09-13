from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from schemas.common import PaginationMetadata
from database.enums import ForwardReasonType

from database.enums import (
    Priority,
    ReportStatus,
    VerificationDecision,
    ReportCancellationReason,
    AssignmentStatus,
    ResolutionDecision,
)
from pydantic import Field, computed_field

# =====================================================
# Client Request
# =====================================================

class ReportCreateRequest(BaseModel):
    description: Optional[str] = None


# =====================================================
# Internal Schema (Backend Only)
# =====================================================

class ReportCreateInternal(BaseModel):
    citizen_id: int

    department_id: int

    issue_type: str

    description: Optional[str] = None

    latitude: float
    longitude: float

    address: Optional[str] = None

    risk_score: float

    ai_confidence: float

    verification_decision: VerificationDecision

    verification_passed: bool


# =====================================================
# API Response
# =====================================================

class ReportResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: int

    report_number: str

    issue_type: str

    status: ReportStatus

    priority: Priority

    latitude: float

    longitude: float

    address: Optional[str]

    risk_score: float

    ai_confidence: float

    verification_decision: VerificationDecision

    verification_passed: bool
class CitizenReportListItem(BaseModel):

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int

    report_number: str

    issue_type: str

    status: ReportStatus

    priority: Priority

    created_at: datetime

class DepartmentReportListItem(BaseModel):

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int

    report_number: str

    issue_type: str

    status: ReportStatus

    priority: Priority

    citizen_id: int

    created_at: datetime

class CityReportListItem(BaseModel):

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int

    report_number: str

    issue_type: str

    status: ReportStatus

    priority: Priority

    department_id: int

    citizen_id: int

    created_at: datetime

class PaginatedCitizenReports(BaseModel):

    items: list[CitizenReportListItem]

    pagination: PaginationMetadata

class PaginatedDepartmentReports(BaseModel):

    items: list[DepartmentReportListItem]

    pagination: PaginationMetadata

class PaginatedCityReports(BaseModel):

    items: list[CityReportListItem]

    pagination: PaginationMetadata

class ReportForwardRequest(BaseModel):

    department_id: int

    reason_type: ForwardReasonType

    remarks: Optional[str] = None
class ReportCancellationRequest(BaseModel):

    reason_type: ReportCancellationReason

    remarks: Optional[str] = None
class ReportReopenRequest(BaseModel):

    reason: Optional[str] = Field(
        default=None,
        max_length=500,
    )

# =====================================================
# Admin Schema 
# =====================================================

class AdminCitizenInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    profile_image: Optional[str] = None

class AdminDepartmentInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str

class AdminWorkerInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str

class AdminAssignmentInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    worker: AdminWorkerInfo
    assigned_by: int
    assigned_at: datetime
    accepted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: AssignmentStatus
    remarks: Optional[str] = None

class AdminResolutionAttemptInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    attempt_number: int
    verification_passed: bool
    verification_score: Optional[float] = None
    verification_decision: Optional[str] = None
    ai_decision: Optional[str] = None
    failure_reason: Optional[str] = None
    model_version: Optional[str] = None
    created_at: datetime
    
    annotated_image_path: Optional[str] = Field(default=None, exclude=True)

    @computed_field
    @property
    def has_annotated_image(self) -> bool:
        return bool(self.annotated_image_path)

class AdminResolutionInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    worker_id: int
    remarks: Optional[str] = None
    verification_passed: bool
    resolved_at: datetime
    verification_score: Optional[float] = None
    verification_decision: Optional[VerificationDecision] = None
    manual_review: bool
    verified_at: Optional[datetime] = None
    attempts: list[AdminResolutionAttemptInfo] = Field(default_factory=list)

class AdminResolutionAIInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    attempt_number: int
    scene_similarity: Optional[float] = None
    same_scene: Optional[bool] = None
    yolo_issue_found: Optional[bool] = None
    original_area: Optional[float] = None
    remaining_area: Optional[float] = None
    cleaned_percentage: Optional[float] = None
    decision_confidence: Optional[float] = None
    ai_decision: ResolutionDecision
    model_version: str
    created_at: datetime

class AdminImageInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    image_type: str
    uploaded_at: datetime

class AdminDetectionInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    class_name: str
    confidence: float
    model_version: str
    created_at: datetime

class AdminReportDetailsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    report_number: str
    issue_type: str
    description: Optional[str] = None
    status: ReportStatus
    priority: Priority
    latitude: float
    longitude: float
    address: Optional[str] = None
    risk_score: float
    ai_confidence: float
    verification_decision: VerificationDecision
    verification_passed: bool
    created_at: datetime
    updated_at: datetime
    citizen: Optional[AdminCitizenInfo] = None
    department: Optional[AdminDepartmentInfo] = None
    images: list[AdminImageInfo] = Field(default_factory=list)
    assignments: list[AdminAssignmentInfo] = Field(default_factory=list)
    resolution: Optional[AdminResolutionInfo] = None
    resolution_ai: Optional[AdminResolutionAIInfo] = None
    detections: list[AdminDetectionInfo] = Field(default_factory=list)