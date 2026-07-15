from sqlalchemy.orm import Session

from database.crud.audit_log import AuditLogCRUD
import database.crud.report as report_crud


class TimelineService:

    EVENT_MAPPING = {
        "REPORT_CREATED": (
            "Report Submitted",
            "Your report has been submitted successfully.",
        ),
        "AUTO_ASSIGNED": (
            "Worker Assigned",
            "A field worker has been assigned.",
        ),
        "WORK_STARTED": (
            "Work Started",
            "Repair work has started.",
        ),
        "REPORT_COMPLETED": (
            "Issue Resolved",
            "The civic issue has been resolved.",
        ),
    }

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

    def get_citizen_timeline(
        self,
        *,
        report_id: int,
        citizen_id:int,
    ):

        report = report_crud.get_report_by_id(
            self.db,
            report_id,
        )

        if report is None:
            return None
        
        if report.citizen_id != citizen_id:
            return None

        logs = AuditLogCRUD.get_report_logs(
            self.db,
            report_id,
        )

        timeline = []

        for log in logs:

            if log.action not in self.EVENT_MAPPING:
                continue

            title, description = self.EVENT_MAPPING[
                log.action
            ]

            timeline.append(
                {
                    "title": title,
                    "description": description,
                    "created_at": log.created_at,
                }
            )

        return {
            "report_id": report.id,
            "report_number": report.report_number,
            "status": report.status.value,
            "timeline": timeline,
        }