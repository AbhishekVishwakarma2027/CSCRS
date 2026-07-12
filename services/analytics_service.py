from sqlalchemy.orm import Session
import calendar
from database.crud import analytics as analytics_crud


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

        return analytics_crud.get_high_priority_reports(
            self.db,
            limit,
        )
    def get_dashboard_insights(
        self,
    ):
        data = analytics_crud.get_dashboard_insight_data(
            self.db,
        )

        insights = []
        if data["pending_by_department"]:
            insights.append(
                {
                    "type": "warning",
                    "title": "High Pending Workload",
                    "message": (
                        f"{data['pending_by_department'].name} Department "
                        "currently has the highest pending workload."
                    ),
                }
            )
        if data["most_common_issue"]:
            insights.append(
                {
                    "type": "info",
                    "title": "Most Common Issue",
                    "message": (
                        f"{data['most_common_issue'].issue_type} "
                        "is currently the most frequently reported issue."
                    ),
                }
            )
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
                        f"{resolution_rate}% of reports "
                        "have been resolved."
                    ),
                }
            )
        return insights