from sqlalchemy.orm import Session

from database.models.audit_log import AuditLog


class AuditLogCRUD:

    @staticmethod
    def create(
        db: Session,
        *,
        report_id: int,
        user_id: int,
        action: str,
        details: str | None = None,
    ) -> AuditLog:

        log = AuditLog(
            report_id=report_id,
            user_id=user_id,
            action=action,
            details=details,
        )

        db.add(log)
        db.flush()

        return log

    @staticmethod
    def get_report_logs(
        db: Session,
        report_id: int,
    ):

        return (
            db.query(AuditLog)
            .filter(
                AuditLog.report_id == report_id,
            )
            .order_by(
                AuditLog.created_at.asc(),
            )
            .all()
        )
    def get_logs_for_reports(
        db: Session,
        report_ids: list[int],
        limit: int,
    ):

        return (
            db.query(
                AuditLog,
            )
            .filter(
                AuditLog.report_id.in_(report_ids),
            )
            .order_by(
                AuditLog.created_at.desc(),
            )
            .limit(limit)
            .all()
        )