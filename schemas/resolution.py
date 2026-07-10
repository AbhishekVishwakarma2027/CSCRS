from datetime import datetime

from pydantic import BaseModel, ConfigDict

from database.enums import VerificationDecision


class ResolutionCreate(BaseModel):

    assignment_id: int

    remarks: str | None = None


class ResolutionResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int

    report_id: int

    worker_id: int

    remarks: str | None

    verification_passed: bool

    verification_score: float | None

    verification_decision: VerificationDecision | None

    manual_review: bool

    verified_at: datetime | None

    resolved_at: datetime


class ResolutionVerificationResponse(BaseModel):

    verification_passed: bool

    verification_score: float

    verification_decision: VerificationDecision

    manual_review: bool