from sqlalchemy.orm import Session
import calendar
from database.crud import analytics as analytics_crud
from datetime import datetime, timezone

class AnalyticsService:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

    def get_dashboard_summary(
        self,
    ):

        return analytics_crud.get_dashboard_summary(
            self.db,
        )
    def get_department_dashboard_summary(
        self,
        department_id: int,
    ):

        return analytics_crud.get_department_dashboard_summary(
            self.db,
            department_id,
        )
    def get_department_statistics(
        self,
    ):

        return analytics_crud.get_department_statistics(
            self.db,
        )
    def get_issue_statistics(
        self,
    ):

        return analytics_crud.get_issue_statistics(
            self.db,
        )
    def get_status_statistics(
        self,
    ):

        return analytics_crud.get_status_statistics(
            self.db,
        )
    def get_priority_statistics(
        self,
    ):

        return analytics_crud.get_priority_statistics(
            self.db,
        )
    def get_monthly_trend(
        self,
        year: int,
    ):

        result = analytics_crud.get_monthly_trend(
            self.db,
            year,
        )

        response = []

        for row in result:

            response.append(
                {
                    "month": int(row.month),
                    "month_name": calendar.month_name[
                        int(row.month)
                    ],
                    "total_reports": row.total_reports,
                }
            )

        return response
    def get_recent_reports(
        self,
        limit: int = 10,
    ):

        return analytics_crud.get_recent_reports(
            self.db,
            limit,
        )
    def get_high_priority_reports(
        self,
        limit: int = 10,
    ):
        rows = analytics_crud.get_high_priority_reports(
            self.db,
        )
        response = []
        for row in rows:
            age_hours = round(
            (
                datetime.now(timezone.utc)
                - row.created_at
            ).total_seconds()
            / 3600,
            1,
            )
            response.append(
                {
                    "report_number": row.report_number,
                    "issue_type": row.issue_type,
                    "priority": row.priority,
                    "status": row.status,
                    "department_name": row.department_name,
                    "risk_score": row.risk_score,
                    "age_hours": age_hours,
                    "assigned_worker": (
                        row.assigned_worker
                        if row.assigned_worker
                        else "Unassigned"
                    ),
                }
            )
        return response
    
    def get_dashboard_insights(
        self,
        
    ):
        
        data = analytics_crud.get_dashboard_insight_data(
            self.db,
        )

        insights = []

        # High Pending Workload
        if data["pending_by_department"]:
            insights.append(
                {
                    "type": "warning",
                    "title": "High Pending Workload",
                    "message": (
                        f"{data['pending_by_department'][0]} Department "
                        "currently has the highest pending workload."
                    ),
                }
            )
        else:
            insights.append(
                {
                    "type": "success",
                    "title": "Pending Workload",
                    "message": "No department has pending workload.",
                }
            )

        # Most Common Issue
        if data["most_common_issue"]:
            insights.append(
                {
                    "type": "info",
                    "title": "Most Common Issue",
                    "message": (
                        f"{data['most_common_issue'][0]} "
                        "is currently the most frequently reported issue."
                    ),
                }
            )
        else:
            insights.append(
                {
                    "type": "info",
                    "title": "Most Common Issue",
                    "message": "No issues have been reported yet.",
                }
            )

        # Resolution Performance
        if data["total_reports"] > 0:

            resolution_rate = round(
                (
                    data["resolved_reports"]
                    / data["total_reports"]
                )
                * 100,
                1,
            )

            insights.append(
                {
                    "type": "success",
                    "title": "Resolution Performance",
                    "message": (
                        f"{resolution_rate}% of reports have been resolved."
                    ),
                }
            )
        else:
            insights.append(
                {
                    "type": "info",
                    "title": "Resolution Performance",
                    "message": "No reports available yet.",
                }
            )

        # Highest Cancellation
        if data["highest_cancelled_department"]:
            insights.append(
                {
                    "type": "warning",
                    "title": "Highest Cancellation",
                    "message": (
                        f"{data['highest_cancelled_department'][0]} Department "
                        "has the highest number of cancelled reports."
                    ),
                }
            )
        else:
            insights.append(
                {
                    "type": "success",
                    "title": "Highest Cancellation",
                    "message": "No cancelled reports found.",
                }
            )

        # Top Worker
        if data["top_worker"]:
            insights.append(
                {
                    "type": "success",
                    "title": "Top Performing Worker",
                    "message": (
                        f"{data['top_worker'][0]} has completed the "
                        "highest number of assignments."
                    ),
                }
            )
        else:
            insights.append(
                {
                    "type": "info",
                    "title": "Top Performing Worker",
                    "message": "No completed assignments yet.",
                }
            )

        # Most Delayed Report
        if data["most_delayed_report"]:
            insights.append(
                {
                    "type": "warning",
                    "title": "Most Delayed Report",
                    "message": (
                        f"Report {data['most_delayed_report'][0]} "
                        "has been pending the longest."
                    ),
                }
            )
        else:
            insights.append(
                {
                    "type": "success",
                    "title": "Most Delayed Report",
                    "message": "No delayed reports.",
                }
            )

        # Most Delayed Department
        if data["most_delayed_department"]:
            insights.append(
                {
                    "type": "warning",
                    "title": "Most Delayed Department",
                    "message": (
                        f"{data['most_delayed_department'][0]} Department "
                        "currently has the oldest unresolved report."
                    ),
                }
            )
        else:
            insights.append(
                {
                    "type": "success",
                    "title": "Most Delayed Department",
                    "message": "No delayed departments.",
                }
            )

        # High Priority Reports
        if data["high_priority_waiting"] > 0:
            insights.append(
                {
                    "type": "warning",
                    "title": "High Priority Reports",
                    "message": (
                        f"{data['high_priority_waiting']} high priority reports "
                        "are awaiting action."
                    ),
                }
            )
        else:
            insights.append(
                {
                    "type": "success",
                    "title": "High Priority Reports",
                    "message": "No high priority backlog.",
                }
            )

        # Worker Availability
        if data["busy_workers"] > data["available_workers"]:
            insights.append(
                {
                    "type": "warning",
                    "title": "Worker Availability",
                    "message": "Most workers are currently occupied.",
                }
            )
        else:
            insights.append(
                {
                    "type": "success",
                    "title": "Worker Availability",
                    "message": "Workers are currently available.",
                }
            )

        # Pending Forward Requests
        if data["pending_forward_requests"] > 0:
            insights.append(
                {
                    "type": "warning",
                    "title": "Pending Forward Requests",
                    "message": (
                        f"{data['pending_forward_requests']} department "
                        "forward requests are awaiting action."
                    ),
                }
            )
        else:
            insights.append(
                {
                    "type": "success",
                    "title": "Pending Forward Requests",
                    "message": "No pending forward requests.",
                }
            )

        return insights
        
    def get_top_workers(
        self,
        department_id: int,
        limit: int = 5,
    ):

        return analytics_crud.get_top_workers(
            self.db,
            department_id,
            limit,
        )
    def get_worker_dashboard_summary(
        self,
        worker_id: int,
    ):

        return analytics_crud.get_worker_dashboard_summary(
            self.db,
            worker_id,
        )
    def get_citizen_dashboard_summary(
        self,
        citizen_id: int,
    ):

        return analytics_crud.get_citizen_dashboard_summary(
            self.db,
            citizen_id,
        )