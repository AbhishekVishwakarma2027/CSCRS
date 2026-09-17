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

