from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AuditLogItem(BaseModel):
    id: int
    report_id: int | None = None
    user_id: int | None = None
    action: str
    details: str | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedAuditLogResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[AuditLogItem]


class LoginAuditItem(BaseModel):
    id: int
    user_id: int | None = None
    email: str | None = None
    role: str | None = None
    login_success: bool
    failure_reason: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    browser: str | None = None
    browser_version: str | None = None
    operating_system: str | None = None
    os_version: str | None = None
    device_type: str | None = None
    platform: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    request_path: str | None = None
    http_method: str | None = None
    login_source: str | None = None
    login_at: datetime | None = None
    logout_at: datetime | None = None
    session_id: str | None = None
    jwt_id: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedLoginAuditResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[LoginAuditItem]


class SystemHealthResponse(BaseModel):
    status: str
    database: str
    redis: str
    app_name: str
    version: str
    timestamp: str
    system_summary: dict


class AITelemetryResponse(BaseModel):
    total_ai_verifications: int
    distinct_model_versions: list[str]
    average_confidence: float
    average_inference_time_ms: float
    resolution_ai_total: int
    resolution_ai_approved: int
    resolution_ai_manual_review: int


class AnnouncementRequest(BaseModel):
    title: str
    message: str
    target_role: str | None = "ALL"
    announcement_type: str | None = "INFORMATIONAL"
    starts_at: datetime | None = None
    ends_at: datetime | None = None


class AnnouncementResponse(BaseModel):
    success: bool
    recipient_count: int
    message: str
    broadcast_id: str | None = None


class AnnouncementItemResponse(BaseModel):
    broadcast_id: str
    title: str
    message: str
    target_role: str = "ALL"
    announcement_type: str
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    created_at: datetime
    recipient_count: int
    lifecycle_state: str  # SCHEDULED, ACTIVE, EXPIRED
    created_by: int | None = None

    model_config = ConfigDict(from_attributes=True)

