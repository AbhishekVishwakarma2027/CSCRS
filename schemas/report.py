from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from schemas.common import PaginationMetadata

from database.enums import (
    Priority,
    ReportStatus,
    VerificationDecision,
)


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