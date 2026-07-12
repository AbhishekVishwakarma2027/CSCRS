from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

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