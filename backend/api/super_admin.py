from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from authentication.dependencies import require_super_admin
from database.dependencies import get_db
from database.models.user import User
from schemas.super_admin import (
    PaginatedAuditLogResponse,
    PaginatedLoginAuditResponse,
    SystemHealthResponse,
    AITelemetryResponse,
    AnnouncementRequest,
    AnnouncementResponse,
    AnnouncementItemResponse,
)
from services.super_admin_service import SuperAdminService

router = APIRouter(
    prefix="/super-admin",
    tags=["Super Admin"],
)


@router.get(
    "/audit-logs",
    response_model=PaginatedAuditLogResponse,
    summary="Get System Audit Logs",
)
def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    action: str | None = Query(None),
    user_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin()),
):
    service = SuperAdminService(db)
    return service.get_audit_logs(
        page=page,
        page_size=page_size,
        action=action,
        user_id=user_id,
    )


@router.get(
    "/audit-logs/export",
    summary="Export System Audit Logs",
)
def export_audit_logs(
    format: str = Query("csv", pattern="^(csv|xlsx)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin()),
):
    service = SuperAdminService(db)
    return service.export_audit_logs(export_format=format)


@router.get(
    "/login-audits",
    response_model=PaginatedLoginAuditResponse,
    summary="Get User Login Audits",
)
def get_login_audits(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    login_success: bool | None = Query(None),
    user_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin()),
):
    service = SuperAdminService(db)
    return service.get_login_audits(
        page=page,
        page_size=page_size,
        login_success=login_success,
        user_id=user_id,
    )


@router.get(
    "/health",
    response_model=SystemHealthResponse,
    summary="Get Platform Overview & System Health",
)
def get_system_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin()),
):
    service = SuperAdminService(db)
    return service.get_system_health()


@router.get(
    "/ai-telemetry",
    response_model=AITelemetryResponse,
    summary="Get AI Model & Verification Telemetry",
)
def get_ai_telemetry(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin()),
):
    service = SuperAdminService(db)
    return service.get_ai_telemetry()


@router.post(
    "/announcements",
    response_model=AnnouncementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Broadcast System Announcement",
)
def broadcast_announcement(
    request: AnnouncementRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin()),
):
    service = SuperAdminService(db)
    try:
        return service.broadcast_announcement(
            title=request.title,
            message=request.message,
            target_role=request.target_role,
            announcement_type=request.announcement_type,
            starts_at=request.starts_at,
            ends_at=request.ends_at,
        )
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.get(
    "/announcements",
    response_model=list[AnnouncementItemResponse],
    summary="Get System Announcements Lifecycle Summary",
)
def get_announcements(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin()),
):
    service = SuperAdminService(db)
    return service.get_announcements()


@router.patch(
    "/announcements/{broadcast_id}/end",
    summary="End Active System Announcement",
)
def end_announcement(
    broadcast_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin()),
):
    service = SuperAdminService(db)
    try:
        return service.end_announcement(broadcast_id)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
