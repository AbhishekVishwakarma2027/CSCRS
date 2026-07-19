from io import BytesIO


from sqlalchemy.orm import Session

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)
from reportlab.lib.pagesizes import A4
from database.crud import analytics as analytics_crud
from services.analytics_service import AnalyticsService
from datetime import datetime, timezone
from reportlab.pdfgen import canvas

class ReportGenerationService:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

        self.styles = getSampleStyleSheet()

        self.title_style = self.styles["Heading1"]
        self.title_style.alignment = TA_CENTER

        self.heading_style = self.styles["Heading2"]

        self.normal_style = self.styles["BodyText"]

    def generate_department_report(
        self,
        department_id: int,
    ):
        """
        Generates a Department Performance Report.
        """

        summary = analytics_crud.get_department_dashboard_summary(
            db=self.db,
            department_id=department_id,
        )

        recent_reports = analytics_crud.get_recent_reports(
            db=self.db,
            department_id=department_id,
            limit=10,
        )

        high_priority_reports = analytics_crud.get_high_priority_reports(
            db=self.db,
            department_id=department_id,
            limit=10,
        )

        top_workers = analytics_crud.get_top_workers(
            db=self.db,
            department_id=department_id,
            limit=5,
        )

        insights = analytics_crud.get_dashboard_insight_data(
            db=self.db,
            department_id=department_id,
        )

        document, buffer, story = self._create_document()

        self._add_cover_page(
            story=story,
            report_title="Department Performance Report",
            generated_by=summary.get(
                "generated_by",
                "Department Admin",
            ),
            city_name=summary.get(
                "city_name",
                "Lucknow",
            ),
            department_name=summary.get(
                "department_name",
                f"Department #{department_id}",
            ),
        )

        self._add_heading(
            story,
            "Executive Summary",
        )

        self._add_paragraph(
            story,
            (
                "This report provides an overview of department performance, "
                "worker productivity, civic issue trends, pending workload and "
                "overall operational statistics generated automatically by CSCRS."
            ),
        )

        self._add_table(
            story=story,
            title="Department Summary",
            headers=[
                "Metric",
                "Value",
            ],
            rows=[
                [
                    "Total Reports",
                    summary["total_reports"],
                ],
                [
                    "Pending Reports",
                    summary["pending_reports"],
                ],
                [
                    "Assigned Reports",
                    summary["assigned_reports"],
                ],
                [
                    "In Progress",
                    summary["in_progress_reports"],
                ],
                [
                    "Resolved Reports",
                    summary["resolved_reports"],
                ],
                [
                    "Cancelled Reports",
                    summary["cancelled_reports"],
                ],
                [
                    "Reopened Reports",
                    summary["reopened_reports"],
                ],
                [
                    "Available Workers",
                    summary["available_workers"],
                ],
                [
                    "Busy Workers",
                    summary["busy_workers"],
                ],
                [
                    "Pending Forward Requests",
                    summary["forward_requests_pending"],
                ],
                [
                    "Accepted Forward Requests",
                    summary["forward_requests_accepted"],
                ],
                [
                    "Rejected Forward Requests",
                    summary["forward_requests_rejected"],
                ],
                [
                    "Automation Rate",
                    f'{summary["automation_rate"]}%',
                ],
            ],
        )

        self._add_recent_reports_section(
            story,
            recent_reports,
        )

        self._add_high_priority_reports_section(
            story,
            high_priority_reports,
        )

        self._add_top_workers_section(
            story,
            top_workers,
        )

        self._add_dashboard_insights_section(
            story,
            insights,
        )
        story.append(
            PageBreak(),
        )
        self._add_recommendations_section(
            story,
            summary,
            insights,
        )

        return self._build_document(
            document=document,
            story=story,
            buffer=buffer,
        )


    def generate_city_report(
        self,
        city_admin_id: int,
    ):
        """
        Generates the City Performance Report.
        """

        summary = analytics_crud.get_dashboard_summary(
            db=self.db,
        )

        department_statistics = analytics_crud.get_department_statistics(
            db=self.db,
        )
        reopened_statistics = (
            analytics_crud.get_reopened_report_statistics(
                db=self.db,
            )
        )
        issue_statistics = analytics_crud.get_issue_statistics(
            db=self.db,
        )

        status_statistics = analytics_crud.get_status_statistics(
            db=self.db,
        )

        priority_statistics = analytics_crud.get_priority_statistics(
            db=self.db,
        )

        monthly_trend = analytics_crud.get_monthly_trend(
            db=self.db,
            year=datetime.now().year,
        )

        recent_reports = analytics_crud.get_recent_reports(
            db=self.db,
            limit=10,
        )

        high_priority_reports = analytics_crud.get_high_priority_reports(
            db=self.db,
            limit=10,
        )

        insights = analytics_crud.get_dashboard_insight_data(
            db=self.db,
        )

        document, buffer, story = self._create_document()

        self._add_cover_page(
            story=story,
            report_title="City Performance Report",
            generated_by=summary.get(
                "generated_by",
                "City Administrator",
            ),
            city_name=summary.get(
                "city_name",
                "Lucknow",
            ),
            department_name=None,
        )

        self._add_heading(
            story,
            "Executive Summary",
        )

        self._add_paragraph(
            story,
            (
                "This report provides an overall view of city-wide civic "
                "issue reporting, department performance, worker "
                "productivity and AI-assisted operational statistics."
            ),
        )

        self._add_table(
            story=story,
            title="City Summary",
            headers=[
                "Metric",
                "Value",
            ],
            rows=[
                [
                    "Total Reports",
                    summary["total_reports"],
                ],
                [
                    "Pending Reports",
                    summary["pending_reports"],
                ],
                [
                    "Assigned Reports",
                    summary["assigned_reports"],
                ],
                [
                    "In Progress",
                    summary["in_progress_reports"],
                ],
                [
                    "Resolved Reports",
                    summary["resolved_reports"],
                ],
                [
                    "Closed Reports",
                    summary["closed_reports"],
                ],
                [
                    "Rejected Reports",
                    summary["rejected_reports"],
                ],
                [
                    "Cancelled Reports",
                    summary["cancelled_reports"],
                ],
                [
                    "Reopened Reports",
                    summary["reopened_reports"],
                ],
                [
                    "Departments",
                    summary["total_departments"],
                ],
                [
                    "Workers",
                    summary["total_workers"],
                ],
                [
                    "Citizens",
                    summary["total_citizens"],
                ],
                [
                    "Resolution Rate",
                    f'{summary["resolution_rate"]}%',
                ],
                [
                    "Automation Rate",
                    f'{summary["automation_rate"]}%',
                ],
            ],
        )

        self._add_department_statistics_section(
            story,
            department_statistics,
        )
        self._add_reopened_report_statistics_section(
            story,
            reopened_statistics,
        )
        self._add_issue_statistics_section(
            story,
            issue_statistics,
        )

        self._add_status_statistics_section(
            story,
            status_statistics,
        )

        self._add_priority_statistics_section(
            story,
            priority_statistics,
        )

        self._add_monthly_trend_section(
            story,
            monthly_trend,
        )

        self._add_recent_reports_section(
            story,
            recent_reports,
        )

        self._add_high_priority_reports_section(
            story,
            high_priority_reports,
        )

        self._add_dashboard_insights_section(
            story,
            insights,
        )

        story.append(
            PageBreak(),
        )
        
        self._add_city_recommendations_section(
            story,
            summary,
            insights,
        )

        return self._build_document(
            document=document,
            story=story,
            buffer=buffer,
        )


    def _create_document(
        self,
    ):
        buffer = BytesIO()

        document = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=0.5 * inch,
            rightMargin=0.5 * inch,
            topMargin=0.6 * inch,
            bottomMargin=0.6 * inch,
        )

        story = []

        return document, buffer, story
    def _add_title(
        self,
        story,
        title: str,
    ):
        story.append(
            Paragraph(
                title,
                self.title_style,
            )
        )

        story.append(
            Spacer(
                1,
                0.3 * inch,
            )
        )
    def _add_heading(
        self,
        story,
        heading: str,
    ):
        story.append(
            Paragraph(
                heading,
                self.heading_style,
            )
        )

        story.append(
            Spacer(
                1,
                0.15 * inch,
            )
        )
    def _add_paragraph(
        self,
        story,
        text: str,
    ):
        story.append(
            Paragraph(
                text,
                self.normal_style,
            )
        )

        story.append(
            Spacer(
                1,
                0.1 * inch,
            )
        )
    def _build_document(
        self,
        document,
        story,
        buffer,
    ):
        document.build(
            story,
            onFirstPage=self._add_page_header_footer,
            onLaterPages=self._add_page_header_footer,
        )

        buffer.seek(0)

        return buffer
    def _add_cover_page(
        self,
        story,
        report_title: str,
        generated_by: str,
        city_name: str,
        department_name: str | None = None,
    ):
        """
        Adds the cover page to the report.
        """

        self._add_title(
            story,
            "Crowdsourced Civic Issue Reporting and Resolution System",
        )

        story.append(
            Paragraph(
                "<b>CSCRS</b>",
                self.heading_style,
            )
        )

        story.append(
            Spacer(
                1,
                0.30 * inch,
            )
        )

        story.append(
            Paragraph(
                f"<b>{report_title}</b>",
                self.heading_style,
            )
        )

        story.append(
            Spacer(
                1,
                0.30 * inch,
            )
        )

        self._add_paragraph(
            story,
            f"<b>City :</b> {city_name}",
        )

        if department_name:

            self._add_paragraph(
                story,
                f"<b>Department :</b> {department_name}",
            )

        self._add_paragraph(
            story,
            f"<b>Generated By :</b> {generated_by}",
        )

        self._add_paragraph(
            story,
            f"<b>Generated On :</b> "
            f"{datetime.now().strftime('%d %B %Y %I:%M %p')}",
        )
        report_id = (
            f"RPT-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        )

        self._add_paragraph(
            story,
            f"<b>Report ID :</b> {report_id}",
        )
        self._add_paragraph(
            story,
            "<b>Version :</b> 1.0",
        )

        self._add_paragraph(
            story,
            "This report has been generated automatically by CSCRS.",
        )

        story.append(
            PageBreak(),
        )

        story.append(
            Spacer(
                1,
                0.60 * inch,
            )
        )
    def _add_table(
        self,
        story,
        title: str,
        headers: list[str],
        rows: list[list],
    ):
        """
        Adds a formatted table to the report.
        """

        self._add_heading(
            story,
            title,
        )

        table_data = [headers]

        for row in rows:
            table_data.append(
                [
                    str(value)
                    if value is not None
                    else "-"
                    for value in row
                ]
            )

        table = Table(
            table_data,
            repeatRows=1,
            splitByRow=True,
            # colWidths=[
            #     (
            #         document.width / len(headers)
            #     )
            #     for _ in headers
            # ],
        )

        table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.HexColor("#1F4E78"),
                    ),
                    (
                        "TEXTCOLOR",
                        (0, 0),
                        (-1, 0),
                        colors.white,
                    ),
                    (
                        "FONTNAME",
                        (0, 0),
                        (-1, 0),
                        "Helvetica-Bold",
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, 0),
                        8,
                    ),
                    (
                        "BACKGROUND",
                        (0, 1),
                        (-1, -1),
                        colors.whitesmoke,
                    ),
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey,
                    ),
                    (
                        "ALIGN",
                        (0, 0),
                        (-1, -1),
                        "CENTER",
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "MIDDLE",
                    ),
                    (
                        "FONTNAME",
                        (0, 1),
                        (-1, -1),
                        "Helvetica",
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 1),
                        (-1, -1),
                        6,
                    ),
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -1),
                        [
                            colors.white,
                            colors.HexColor("#F5F5F5"),
                        ],
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                ]
            )
        )

        story.append(
            table,
        )

        story.append(
            Spacer(
                1,
                0.25 * inch,
            )
        )
    def _get_department_report_data(
        self,
        department_admin_id: int,
    ):
        """
        Collects all data required for Department Report.
        """

        data = {}

        data["summary"] = analytics_crud.get_department_dashboard_summary(
            db=self.db,
            department_admin_id=department_admin_id,
        )

        data["recent_reports"] = analytics_crud.get_recent_reports(
            db=self.db,
            limit=10,
        )

        data["high_priority_reports"] = analytics_crud.get_high_priority_reports(
            db=self.db,
            limit=10,
        )

        data["dashboard_insights"] = (
            AnalyticsService(
                self.db,
            ).get_dashboard_insights()
        )

        return data
    def _add_recent_reports_section(
        self,
        story,
        recent_reports,
    ):
        """
        Adds the Recent Reports section.
        """

        rows = []

        for report in recent_reports:

            created_at = "-"

            if report.created_at:

                created_at = report.created_at.strftime(
                    "%d-%m-%Y %H:%M"
                )

            rows.append(
                [
                    report.report_number,
                    report.issue_type,
                    report.priority.value
                    if hasattr(report.priority, "value")
                    else str(report.priority),
                    report.status.value
                    if hasattr(report.status, "value")
                    else str(report.status),
                    report.department_name,
                    created_at,
                ]
            )

        if not rows:

            rows.append(
                [
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                ]
            )

        self._add_table(
            story=story,
            title="Recent Reports",
            headers=[
                "Report No.",
                "Issue Type",
                "Priority",
                "Status",
                "Department",
                "Reported On",
            ],
            rows=rows,
        )
    def _add_high_priority_reports_section(
        self,
        story,
        high_priority_reports,
    ):
        """
        Adds the High Priority Reports section.
        """

        rows = []

        for report in high_priority_reports:

            if report.created_at:

                age_hours = round(
                    (
                        datetime.now(timezone.utc)
                        - report.created_at
                    ).total_seconds()
                    / 3600,
                    1,
                )

            else:

                age_hours = "-"

            assigned_worker = (
                report.assigned_worker
                if report.assigned_worker
                else "Unassigned"
            )

            rows.append(
                [
                    report.report_number,
                    report.issue_type,
                    report.priority.value
                    if hasattr(
                        report.priority,
                        "value",
                    )
                    else str(
                        report.priority,
                    ),
                    report.status.value
                    if hasattr(
                        report.status,
                        "value",
                    )
                    else str(
                        report.status,
                    ),
                    report.department_name,
                    report.risk_score,
                    assigned_worker,
                    age_hours,
                ]
            )

        if not rows:

            rows.append(
                [
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                    "-",
                ]
            )

        self._add_table(
            story=story,
            title="High Priority Reports",
            headers=[
                "Report No.",
                "Issue Type",
                "Priority",
                "Status",
                "Department",
                "Risk Score",
                "Assigned Worker",
                "Age (Hours)",
            ],
            rows=rows,
        )
    def _add_top_workers_section(
        self,
        story,
        top_workers,
    ):
        """
        Adds the Top Workers section.
        """

        rows = []

        for worker in top_workers:

            rows.append(
                [
                    worker["worker_name"],
                    worker["completed_reports"],
                    worker["in_progress_reports"],
                    f'{worker["completion_rate"]}%',
                ]
            )

        if not rows:

            rows.append(
                [
                    "-",
                    "-",
                    "-",
                    "-",
                ]
            )

        self._add_table(
            story=story,
            title="Top Performing Workers",
            headers=[
                "Worker",
                "Completed",
                "In Progress",
                "Completion Rate",
            ],
            rows=rows,
        )

        if rows[0][0] != "-":

            self._add_paragraph(
                story,
                (
                    "The above table lists the highest performing workers "
                    "based on completed assignments and completion rate."
                ),
            )
        else:

            self._add_paragraph(
                story,
                (
                    "No worker performance data is available for the "
                    "selected department."
                ),
            )
    def _add_dashboard_insights_section(
        self,
        story,
        insights,
    ):
        """
        Adds dashboard insights to the report.
        """

        self._add_heading(
            story,
            "Dashboard Insights",
        )

        pending_department = insights.get(
            "pending_by_department",
        )

        if pending_department:

            self._add_paragraph(
                story,
                (
                    f"• Highest pending workload is currently in "
                    f"{pending_department.name} Department "
                    f"with {pending_department.count} active reports."
                ),
            )

        common_issue = insights.get(
            "most_common_issue",
        )

        if common_issue:

            self._add_paragraph(
                story,
                (
                    f"• Most frequently reported issue is "
                    f"{common_issue.issue_type} "
                    f"({common_issue.count} reports)."
                ),
            )

        cancelled_department = insights.get(
            "highest_cancelled_department",
        )

        if cancelled_department:

            self._add_paragraph(
                story,
                (
                    f"• {cancelled_department.name} Department "
                    f"has the highest number of cancelled reports "
                    f"({cancelled_department.count})."
                ),
            )

        top_worker = insights.get(
            "top_worker",
        )

        if top_worker:

            self._add_paragraph(
                story,
                (
                    f"• Top performing worker is "
                    f"{top_worker.name} with "
                    f"{top_worker.completed} completed assignments."
                ),
            )
        delayed_report = insights.get(
            "most_delayed_report",
        )

        if delayed_report:

            if delayed_report.created_at.tzinfo is None:

                report_time = delayed_report.created_at.replace(
                    tzinfo=timezone.utc,
                )

            else:

                report_time = delayed_report.created_at

            age_days = round(
                (
                    datetime.now(
                        timezone.utc,
                    )
                    - report_time
                ).total_seconds()
                / 86400,
                1,
            )

            self._add_paragraph(
                story,
                (
                    f"• Report {delayed_report.report_number} "
                    f"has been pending for approximately "
                    f"{age_days} day(s)."
                ),
            )

        delayed_department = insights.get(
            "most_delayed_department",
        )

        if delayed_department:

            self._add_paragraph(
                story,
                (
                    f"• Oldest pending workload belongs to "
                    f"{delayed_department.name} Department."
                ),
            )

        self._add_paragraph(
            story,
            (
                f"• High priority reports awaiting action : "
                f"{insights['high_priority_waiting']}"
            ),
        )

        self._add_paragraph(
            story,
            (
                f"• Available workers : "
                f"{insights['available_workers']}"
            ),
        )

        self._add_paragraph(
            story,
            (
                f"• Busy workers : "
                f"{insights['busy_workers']}"
            ),
        )

        self._add_paragraph(
            story,
            (
                f"• Pending department forward requests : "
                f"{insights['pending_forward_requests']}"
            ),
        )
    def _add_recommendations_section(
        self,
        story,
        summary,
        insights,
    ):
        """
        Adds recommendations based on dashboard statistics.
        """

        self._add_heading(
            story,
            "Recommendations",
        )

        recommendations = []

        if summary["pending_reports"] > summary["resolved_reports"]:

            recommendations.append(
                (
                    "Increase workforce allocation to reduce the "
                    "current pending workload."
                )
            )

        if summary["busy_workers"] > summary["available_workers"]:

            recommendations.append(
                (
                    "Most workers are currently occupied. Consider "
                    "assigning additional workers or redistributing "
                    "the workload."
                )
            )

        if summary["forward_requests_pending"] > 0:

            recommendations.append(
                (
                    "Review pending department forward requests to "
                    "avoid unnecessary delays."
                )
            )

        if summary["automation_rate"] < 70:

            recommendations.append(
                (
                    "Automation rate is below the desired level. "
                    "Review AI verification workflow and model "
                    "performance."
                )
            )

        if insights["high_priority_waiting"] > 0:

            recommendations.append(
                (
                    f"{insights['high_priority_waiting']} high priority "
                    "report(s) require immediate attention."
                )
            )

        if (
            summary["available_workers"] == 0
            and summary["busy_workers"] > 0
        ):

            recommendations.append(
                (
                    "No workers are currently available. Consider "
                    "temporary workload redistribution."
                )
            )

        if not recommendations:

            recommendations.append(
                (
                    "Current department performance is satisfactory. "
                    "Continue monitoring report trends and maintain "
                    "existing operational efficiency."
                )
            )

        for index, recommendation in enumerate(
            recommendations,
            start=1,
        ):

            self._add_paragraph(
                story,
                f"{index}. {recommendation}",
            )
    def _add_department_statistics_section(
        self,
        story,
        department_statistics,
    ):
        """
        Adds department statistics section.
        """

        rows = []

        for department in department_statistics:

            rows.append(
                [
                    department.department_id,
                    department.department_name,
                    department.total_reports,
                ]
            )

        if not rows:

            rows.append(
                [
                    "-",
                    "-",
                    "-",
                ]
            )

        self._add_table(
            story=story,
            title="Department Statistics",
            headers=[
                "Department ID",
                "Department",
                "Total Reports",
            ],
            rows=rows,
        )

        self._add_paragraph(
            story,
            (
                "This table shows the number of civic issues handled by "
                "each department. Departments with higher report counts "
                "may require additional workforce or operational planning."
            ),
        )
    def _add_reopened_report_statistics_section(
        self,
        story,
        statistics,
    ):

        rows = []

        for row in statistics:

            rows.append(
                [
                    row.department_name,
                    row.reopened_reports,
                ]
            )

        if not rows:

            rows.append(
                [
                    "-",
                    "-",
                ]
            )

        self._add_table(
            story=story,
            title="Department-wise Reopened Reports",
            headers=[
                "Department",
                "Reopened Reports",
            ],
            rows=rows,
        )
    def _add_issue_statistics_section(
        self,
        story,
        issue_statistics,
    ):
        """
        Adds issue statistics section.
        """

        rows = []

        for issue in issue_statistics:

            issue_type = (
                issue.issue_type.value
                if hasattr(issue.issue_type, "value")
                else str(issue.issue_type)
            )

            rows.append(
                [
                    issue_type,
                    issue.total_reports,
                ]
            )

        if not rows:

            rows.append(
                [
                    "-",
                    "-",
                ]
            )

        self._add_table(
            story=story,
            title="Issue Type Statistics",
            headers=[
                "Issue Type",
                "Total Reports",
            ],
            rows=rows,
        )

        self._add_paragraph(
            story,
            (
                "This section summarizes the distribution of reported "
                "civic issues across all supported issue categories. "
                "It helps identify the most frequently occurring civic "
                "problems within the city."
            ),
        )
    def _add_status_statistics_section(
        self,
        story,
        status_statistics,
    ):
        """
        Adds report status statistics section.
        """

        rows = []

        for status in status_statistics:

            status_name = (
                status.status.value
                if hasattr(status.status, "value")
                else str(status.status)
            )

            rows.append(
                [
                    status_name,
                    status.total_reports,
                ]
            )

        if not rows:

            rows.append(
                [
                    "-",
                    "-",
                ]
            )

        self._add_table(
            story=story,
            title="Report Status Statistics",
            headers=[
                "Status",
                "Total Reports",
            ],
            rows=rows,
        )

        self._add_paragraph(
            story,
            (
                "This section shows the current distribution of reports "
                "based on their lifecycle status. It provides an overview "
                "of the operational workload and report processing progress "
                "across the city."
            ),
        )
    def _add_priority_statistics_section(
        self,
        story,
        priority_statistics,
    ):
        """
        Adds priority statistics section.
        """

        rows = []

        for priority in priority_statistics:

            priority_name = (
                priority.priority.value
                if hasattr(priority.priority, "value")
                else str(priority.priority)
            )

            rows.append(
                [
                    priority_name,
                    priority.total_reports,
                ]
            )

        if not rows:

            rows.append(
                [
                    "-",
                    "-",
                ]
            )

        self._add_table(
            story=story,
            title="Priority Statistics",
            headers=[
                "Priority",
                "Total Reports",
            ],
            rows=rows,
        )

        self._add_paragraph(
            story,
            (
                "This section presents the distribution of reports "
                "based on their assigned priority level. It helps "
                "identify the proportion of high-risk reports requiring "
                "immediate attention compared to routine civic issues."
            ),
        )
    def _add_monthly_trend_section(
        self,
        story,
        monthly_trend,
    ):
        """
        Adds monthly report trend section.
        """

        month_names = {
            1: "January",
            2: "February",
            3: "March",
            4: "April",
            5: "May",
            6: "June",
            7: "July",
            8: "August",
            9: "September",
            10: "October",
            11: "November",
            12: "December",
        }

        rows = []

        for record in monthly_trend:

            rows.append(
                [
                    month_names.get(
                        record.month,
                        f"Month {record.month}",
                    ),
                    record.total_reports,
                ]
            )

        if not rows:

            rows.append(
                [
                    "-",
                    "-",
                ]
            )

        self._add_table(
            story=story,
            title="Monthly Report Trend",
            headers=[
                "Month",
                "Total Reports",
            ],
            rows=rows,
        )

        self._add_paragraph(
            story,
            (
                "The monthly trend highlights how civic issue reports "
                "have varied throughout the year. This information can "
                "be used to identify seasonal patterns, forecast future "
                "workload, and support resource planning."
            ),
        )
    def _add_city_recommendations_section(
        self,
        story,
        summary,
        insights,
    ):
        """
        Adds recommendations for City Administration.
        """

        self._add_heading(
            story,
            "Recommendations",
        )

        recommendations = []

        if (
            summary["pending_reports"]
            > summary["resolved_reports"]
        ):

            recommendations.append(
                (
                    "Increase operational capacity to reduce the number "
                    "of pending reports across departments."
                )
            )

        if summary["automation_rate"] < 70:

            recommendations.append(
                (
                    "Improve AI verification performance to increase "
                    "overall automation rate."
                )
            )

        if summary["resolution_rate"] < 80:

            recommendations.append(
                (
                    "Review departmental workflows to improve the overall "
                    "city resolution rate."
                )
            )

        if insights["high_priority_waiting"] > 0:

            recommendations.append(
                (
                    f"There are {insights['high_priority_waiting']} "
                    "high priority reports awaiting action. Immediate "
                    "attention is recommended."
                )
            )

        if insights["pending_forward_requests"] > 0:

            recommendations.append(
                (
                    f"There are {insights['pending_forward_requests']} "
                    "pending department forward requests requiring review."
                )
            )

        if (
            insights["busy_workers"]
            > insights["available_workers"]
        ):

            recommendations.append(
                (
                    "Most workers are currently occupied. Consider "
                    "rebalancing workload between departments."
                )
            )

        if (
            summary["cancelled_reports"]
            > summary["resolved_reports"] * 0.20
        ):

            recommendations.append(
                (
                    "Cancelled report volume is comparatively high. "
                    "Investigate the root causes and improve report "
                    "validation or assignment procedures."
                )
            )

        if not recommendations:

            recommendations.append(
                (
                    "Current city-wide operational performance is stable. "
                    "Continue monitoring dashboards and maintain existing "
                    "resource allocation strategies."
                )
            )

        for index, recommendation in enumerate(
            recommendations,
            start=1,
        ):

            self._add_paragraph(
                story,
                f"{index}. {recommendation}",
            )
    def _add_page_header_footer(
        self,
        canvas: canvas.Canvas,
        document,
    ):
        """
        Draws page header, footer and page number.
        """

        canvas.saveState()

        canvas.setFont(
            "Helvetica-Bold",
            10,
        )

        canvas.drawString(
            40,
            820,
            "Crowdsourced Civic Issue Reporting and Resolution System (CSCRS)",
        )

        canvas.line(
            40,
            815,
            555,
            815,
        )

        canvas.setFont(
            "Helvetica",
            9,
        )

        canvas.line(
            40,
            30,
            555,
            30,
        )

        canvas.drawString(
            40,
            15,
            f"Generated: {datetime.now().strftime('%d-%m-%Y %H:%M')}",
        )

        canvas.drawRightString(
            555,
            15,
            f"Page {canvas.getPageNumber()}",
        )

        canvas.restoreState()