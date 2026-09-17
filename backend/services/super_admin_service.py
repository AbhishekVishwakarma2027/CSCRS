from datetime import datetime, timezone
from io import BytesIO
import pandas as pd
from fastapi import HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from database.models.audit_log import AuditLog
from database.models.login_audit import LoginAudit
from database.models.report import Report
from database.models.report_detection import ReportDetection
from database.models.resolution_ai_result import ResolutionAIResult
from database.models.user import User, UserRole
from database.models.department import Department
from services.in_app_notification_service import InAppNotificationService
from schemas.super_admin import (
    AuditLogItem,
    PaginatedAuditLogResponse,
    LoginAuditItem,
    PaginatedLoginAuditResponse,
    SystemHealthResponse,
    AITelemetryResponse,
    AnnouncementResponse,
)


from database.enums import ResolutionDecision


class SuperAdminService:

    def __init__(self, db: Session):
        self.db = db

    def get_audit_logs(
        self,
        page: int = 1,
        page_size: int = 20,
        action: str | None = None,
        user_id: int | None = None,
    ) -> PaginatedAuditLogResponse:
        query = self.db.query(AuditLog)

        if action:
            query = query.filter(AuditLog.action.ilike(f"%{action}%"))
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)

        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(page_size).all()

        return PaginatedAuditLogResponse(
            total=total,
            page=page,
            page_size=page_size,
            items=[AuditLogItem.model_validate(item) for item in items],
        )

    def export_audit_logs(self, export_format: str = "csv"):
        logs = self.db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(5000).all()
        data = [
            {
                "id": log.id,
                "report_id": log.report_id,
                "user_id": log.user_id,
                "action": log.action,
                "details": log.details,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ]
        df = pd.DataFrame(data)

        if export_format == "csv":
            stream = BytesIO()
            df.to_csv(stream, index=False)
            stream.seek(0)
            return StreamingResponse(
                stream,
                media_type="text/csv",
                headers={"Content-Disposition": 'attachment; filename="audit_logs.csv"'},
            )

        stream = BytesIO()
        with pd.ExcelWriter(stream, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Audit Logs")
        stream.seek(0)
        return StreamingResponse(
            stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": 'attachment; filename="audit_logs.xlsx"'},
        )

    def get_login_audits(
        self,
        page: int = 1,
        page_size: int = 20,
        login_success: bool | None = None,
        user_id: int | None = None,
    ) -> PaginatedLoginAuditResponse:
        query = self.db.query(LoginAudit)

        if login_success is not None:
            query = query.filter(LoginAudit.login_success == login_success)
        if user_id:
            query = query.filter(LoginAudit.user_id == user_id)

        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(LoginAudit.login_at.desc()).offset(offset).limit(page_size).all()

        return PaginatedLoginAuditResponse(
            total=total,
            page=page,
            page_size=page_size,
            items=[LoginAuditItem.model_validate(item) for item in items],
        )

    def get_system_health(self) -> SystemHealthResponse:
        db_status = "connected"
        try:
            self.db.execute(text("SELECT 1"))
        except Exception:
            db_status = "error"

        user_count = self.db.query(User).count()
        department_count = self.db.query(Department).count()
        active_worker_count = self.db.query(User).filter(
            User.role == UserRole.WORKER,
            User.is_active == True,
            User.is_blocked == False,
        ).count()
        report_count = self.db.query(Report).count()

        return SystemHealthResponse(
            status="healthy" if db_status == "connected" else "degraded",
            database=db_status,
            redis="connected",
            app_name="CSCRS Municipal Infrastructure Platform",
            version="1.0.0",
            timestamp=datetime.now(timezone.utc).isoformat(),
            system_summary={
                "total_users": user_count,
                "total_departments": department_count,
                "active_workers": active_worker_count,
                "total_reports": report_count,
            },
        )

    def get_ai_telemetry(self) -> AITelemetryResponse:
        total_verifications = self.db.query(ReportDetection).count()
        
        models_query = self.db.query(ReportDetection.model_version).distinct().all()
        models = [m[0] for m in models_query if m[0]] or ["best_cscrs_seg_v1.pt"]

        avg_conf = self.db.query(func.avg(ReportDetection.confidence)).scalar() or 0.0
        avg_time = self.db.query(func.avg(ReportDetection.inference_time_ms)).scalar() or 0.0

        ai_res_total = self.db.query(ResolutionAIResult).count()
        ai_res_approved = self.db.query(ResolutionAIResult).filter(ResolutionAIResult.ai_decision == ResolutionDecision.FULLY_RESOLVED).count()
        ai_res_manual = self.db.query(ResolutionAIResult).filter(ResolutionAIResult.ai_decision == ResolutionDecision.REVIEW).count()

        return AITelemetryResponse(
            total_ai_verifications=total_verifications,
            distinct_model_versions=models,
            average_confidence=round(float(avg_conf), 4),
            average_inference_time_ms=round(float(avg_time), 2),
            resolution_ai_total=ai_res_total,
            resolution_ai_approved=ai_res_approved,
            resolution_ai_manual_review=ai_res_manual,
        )

    def broadcast_announcement(
        self,
        title: str,
        message: str,
        target_role: str | None = "ALL",
        announcement_type: str | None = "INFORMATIONAL",
        starts_at: datetime | None = None,
        ends_at: datetime | None = None,
        created_by: int | None = None,
    ) -> AnnouncementResponse:
        now = datetime.now(timezone.utc)

        # Validate timestamps if provided
        if starts_at and ends_at and starts_at >= ends_at:
            raise ValueError("Start time must be strictly before end time.")

        if ends_at and ends_at <= now:
            raise ValueError("End time must be in the future.")

        query = self.db.query(User).filter(User.is_active == True, User.is_blocked == False)

        if target_role and target_role.upper() != "ALL":
            try:
                role_enum = UserRole[target_role.upper()]
                query = query.filter(User.role == role_enum)
            except KeyError:
                pass

        recipient_count = query.count()

        import database.crud.broadcast as broadcast_crud
        broadcast = broadcast_crud.create_broadcast(
            self.db,
            title=title,
            message=message,
            target_role=target_role or "ALL",
            announcement_type=announcement_type or "INFORMATIONAL",
            starts_at=starts_at,
            ends_at=ends_at,
            recipient_count=recipient_count,
            created_by=created_by,
        )

        return AnnouncementResponse(
            success=True,
            recipient_count=recipient_count,
            message=f"Broadcast announcement created for {recipient_count} users.",
            broadcast_id=broadcast.broadcast_id,
        )

    def get_announcements(
        self,
        lifecycle_state: str = "ALL",
        announcement_type: str = "ALL",
    ) -> list[dict]:
        import database.crud.broadcast as broadcast_crud
        broadcasts = broadcast_crud.get_all_broadcasts(
            self.db,
            lifecycle_state=lifecycle_state,
            announcement_type=announcement_type,
        )
        results = []
        for b in broadcasts:
            lifecycle_state_val = broadcast_crud.compute_derived_lifecycle_state(b)
            results.append({
                "broadcast_id": b.broadcast_id,
                "title": b.title,
                "message": b.message,
                "target_role": b.target_role,
                "announcement_type": b.announcement_type,
                "starts_at": b.starts_at,
                "ends_at": b.ends_at,
                "created_at": b.created_at,
                "recipient_count": b.recipient_count,
                "lifecycle_state": lifecycle_state_val,
                "created_by": b.created_by,
            })
        return results

    def end_announcement(self, broadcast_id: str) -> dict:
        import database.crud.broadcast as broadcast_crud
        broadcast = broadcast_crud.end_broadcast(self.db, broadcast_id)
        if not broadcast:
            raise ValueError(f"No active announcement found with broadcast ID '{broadcast_id}'.")
        return {
            "success": True,
            "message": f"Announcement ended successfully.",
            "broadcast_id": broadcast_id,
            "updated_count": 1,
        }

    def delete_announcement(self, broadcast_id: str) -> dict:
        import database.crud.broadcast as broadcast_crud
        broadcast = broadcast_crud.get_broadcast_by_broadcast_id(self.db, broadcast_id)
        if not broadcast:
            raise ValueError(f"No announcement found with broadcast ID '{broadcast_id}'.")

        state = broadcast_crud.compute_derived_lifecycle_state(broadcast)
        if state != "SCHEDULED":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot delete an announcement in '{state}' state. Only SCHEDULED announcements can be deleted.",
            )

        broadcast_crud.delete_broadcast(self.db, broadcast_id)
        return {
            "success": True,
            "message": f"Scheduled announcement deleted successfully.",
            "broadcast_id": broadcast_id,
            "deleted_count": 1,
        }
