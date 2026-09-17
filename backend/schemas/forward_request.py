from pydantic import BaseModel
from typing import Optional
from pydantic import Field
from database.enums import (
    ForwardRequestStatus,
    ForwardReasonType
)
from datetime import datetime


class ForwardRequestCreate(BaseModel):

    reason: str

class ForwardRequestResponse(BaseModel):

    id: int

    report_id: int

    worker_id: int

    current_department_id: int

    destination_department_id: Optional[int] = None

    source_department_name: Optional[str] = None

    destination_department_name: Optional[str] = None

    worker_name: Optional[str] = None

    reviewer_name: Optional[str] = None

    reason: str

    status: ForwardRequestStatus

    decision_reason: Optional[str] = None

    reviewed_at: Optional[datetime] = None

    reviewed_by: Optional[int] = None

    created_at: Optional[datetime] = None


    class Config:

        from_attributes = True

class IncomingForwardRequestResponse(BaseModel):

    id: int

    report_id: int

    worker_id: Optional[int] = None

    current_department_id: int

    destination_department_id: Optional[int] = None

    source_department_name: Optional[str] = None

    destination_department_name: Optional[str] = None

    worker_name: Optional[str] = None

    reviewer_name: Optional[str] = None

    reason: str

    status: ForwardRequestStatus

    decision_reason: Optional[str] = None

    reviewed_at: Optional[datetime] = None

    reviewed_by: Optional[int] = None

    created_at: Optional[datetime] = None

    class Config:

        from_attributes = True

class ForwardRequestWorkerInfo(BaseModel):

    id: int

    name: str

    email: Optional[str] = None

    phone: Optional[str] = None


class ForwardRequestReportInfo(BaseModel):

    id: int

    report_number: str

    issue_type: str

    priority: str

    status: str

    latitude: float

    longitude: float

    address: Optional[str]

    support_count: int

    risk_score: float

    ai_confidence: float

    verification_decision: str

    verification_passed: bool


class ForwardRequestDepartmentInfo(BaseModel):

    id: int

    name: str

class ForwardRequestDepartments(BaseModel):

    source_department: ForwardRequestDepartmentInfo

    destination_department: ForwardRequestDepartmentInfo | None = None

class ForwardRequestImageInfo(BaseModel):

    original_image: Optional[str]

    annotated_image: Optional[str]

    resolution_image: Optional[str]


class ForwardRequestTimelineInfo(BaseModel):

    title: str

    description: str

    created_at: datetime


class ForwardRequestDetailResponse(BaseModel):

    request_id: int

    status: ForwardRequestStatus

    reason: str

    decision_reason: Optional[str] = None

    reviewed_at: Optional[datetime] = None

    reviewed_by: Optional[int] = None

    reviewer_name: Optional[str] = None

    created_at: datetime

    worker: ForwardRequestWorkerInfo

    report: ForwardRequestReportInfo

    departments: ForwardRequestDepartments

    images: ForwardRequestImageInfo

    timeline: list[ForwardRequestTimelineInfo]

    class Config:

        from_attributes = True

class ForwardRequestApprove(BaseModel):

    department_id: int

    reason_type: ForwardReasonType

    remarks: str = Field(
        ...,
        min_length=5,
        max_length=500,
    )
class ForwardRequestReject(BaseModel):

    reason: str = Field(
        min_length=5,
        max_length=500,
    )
