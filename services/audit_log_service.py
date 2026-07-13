from sqlalchemy.orm import Session

from database.crud.audit_log import AuditLogCRUD


class AuditLogService:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

    def log(
        self,
        *,
        report_id: int,
        user_id: int,
        action: str,
        details: str | None = None,
    ):

        return AuditLogCRUD.create(
            db=self.db,
            report_id=report_id,
            user_id=user_id,
            action=action,
            details=details,
        )

    def get_report_logs(
        self,
        report_id: int,
    ):

        return AuditLogCRUD.get_report_logs(
            self.db,
            report_id,
        )