from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

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

class ManualReviewItem(BaseModel):

    model_config = ConfigDict(
        from_attributes=True,
    )

    report_id: int

    report_number: str

    issue_type: str

    priority: str

    worker_name: str

    verification_score: float | None

    resolved_at: datetime

    scene_similarity: float | None

    verification_decision: VerificationDecision | None

    failure_reason: str | None

    attempt_number: int | None

class ManualReviewDetail(BaseModel):

    model_config = ConfigDict(
        from_attributes=True,
    )

    report_id: int

    report_number: str

    issue_type: str

    priority: str

    remarks: str | None

    verification_score: float | None

    verification_decision: VerificationDecision | None

    manual_review: bool

    resolved_at: datetime

    worker_name: str

    failure_reason: str | None

    attempt_number: int | None

    ai_decision: str | None

    model_version: str | None

    scene_similarity: float | None

    same_scene: bool | None

    yolo_issue_found: bool | None

    worker_id: int

    worker_email: str

    worker_phone: str | None

    department_name: str

    address: str | None

    latitude: float | None

    longitude: float | None

    original_image_path: str | None

    annotated_image_path: str | None

    resolution_image_path: str | None

class ManualReviewRejectRequest(BaseModel):
    reason: str = Field(
        ...,
        min_length=5,
        max_length=500,
    )