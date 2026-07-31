from sqlalchemy.orm import Session

from database.crud.audit_log import AuditLogCRUD
import database.crud.report as report_crud
from configs.config import (
    DASHBOARD_RECENT_TIMELINE_LIMIT,
)
from fastapi import HTTPException

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
        "FORWARD_SENT_TO_DESTINATION": (
            "Report Forwarded",
            "Your report has been forwarded to another department for review.",
        ),

        "REPORT_ACCEPTED_BY_DESTINATION": (
            "Forward Request Accepted",
            "The destination department accepted your report.",
        ),

        "REPORT_RETURNED_TO_SOURCE": (
            "Returned to Source Department",
            "The destination department declined the request. The report has been returned to the source department.",
        ),
        "FORWARDED_WORKER_ASSIGNED": (
            "New Worker Assigned",
            "A new worker from the destination department has been assigned.",
        ),
        "REPORT_CANCELLED_BY_DEPARTMENT": (
            "Report Cancelled",
            "Department cancelled this report after review.",
        ),
        "REPORT_REOPENED": (
            "Report Reopened",
            "Department reopened this report.",
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
            raise HTTPException(
                status_code=404,
                detail="Report not found."
            )
        
        if report.citizen_id != citizen_id:
            raise HTTPException(
                status_code=403,
                detail="Access denied."
            )

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
    def get_recent_citizen_timeline(
        self,
        *,
        citizen_id: int,
        limit: int = DASHBOARD_RECENT_TIMELINE_LIMIT,
    ):

        reports = report_crud.get_reports_by_citizen(
            self.db,
            citizen_id,
        )

        if not reports:
            return []

        report_ids = [
            report.id
            for report in reports
        ]

        logs = AuditLogCRUD.get_logs_for_reports(
            self.db,
            report_ids,
            limit,
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
                    "report_id": log.report_id,
                    "title": title,
                    "description": description,
                    "created_at": log.created_at,
                }
            )

        return timeline