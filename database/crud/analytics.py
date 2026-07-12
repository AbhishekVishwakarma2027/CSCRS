from sqlalchemy.orm import Session
from sqlalchemy import func

from database.models.department import Department
from database.models.report import Report
from database.enums import ReportStatus
from sqlalchemy import extract
from sqlalchemy.orm import Query
from schemas.analytics import DashboardFilter
from database.models.department import Department
from database.enums import (
    Priority,
    ReportStatus,
)


def get_dashboard_summary(
    db: Session,
):
    return {
    "total_reports": db.query(Report).count(),

    "pending_reports": db.query(Report).filter(
        Report.status == ReportStatus.PENDING
    ).count(),

    "assigned_reports": db.query(Report).filter(
        Report.status == ReportStatus.ASSIGNED
    ).count(),

    "in_progress_reports": db.query(Report).filter(
        Report.status == ReportStatus.IN_PROGRESS
    ).count(),

    "resolved_reports": db.query(Report).filter(
        Report.status == ReportStatus.RESOLVED
    ).count(),

    "closed_reports": db.query(Report).filter(
        Report.status == ReportStatus.CLOSED
    ).count(),

    "rejected_reports": db.query(Report).filter(
        Report.status == ReportStatus.REJECTED
    ).count(),
}
def get_department_statistics(
    db: Session,
):

    return (
        db.query(
            Department.id.label("department_id"),
            Department.name.label("department_name"),
            func.count(Report.id).label("total_reports"),
        )
        .outerjoin(
            Report,
            Report.department_id == Department.id,
        )
        .group_by(
            Department.id,
            Department.name,
        )
        .order_by(
            func.count(Report.id).desc(),
            Department.name.asc(),
        )
        .all()
    )
def get_issue_statistics(
    db: Session,
):

    return (
        db.query(
            Report.issue_type.label("issue_type"),
            func.count(Report.id).label("total_reports"),
        )
        .group_by(
            Report.issue_type,
        )
        .order_by(
            func.count(Report.id).desc(),
            Report.issue_type.asc(),
        )
        .all()
    )
def get_status_statistics(
    db: Session,
):

    return (
        db.query(
            Report.status.label("status"),
            func.count(Report.id).label("total_reports"),
        )
        .group_by(
            Report.status,
        )
        .order_by(
            func.count(Report.id).desc(),
        )
        .all()
    )
def get_priority_statistics(
    db: Session,
):

    return (
        db.query(
            Report.priority.label("priority"),
            func.count(Report.id).label("total_reports"),
        )
        .group_by(
            Report.priority,
        )
        .order_by(
            func.count(Report.id).desc(),
        )
        .all()
    )
def get_monthly_trend(
    db: Session,
    year: int,
):

    return (
        db.query(
            extract(
                "month",
                Report.created_at,
            ).label("month"),
            func.count(
                Report.id,
            ).label(
                "total_reports",
            ),
        )
        .filter(
            extract(
                "year",
                Report.created_at,
            )
            == year
        )
        .group_by(
            extract(
                "month",
                Report.created_at,
            )
        )
        .order_by(
            extract(
                "month",
                Report.created_at,
            )
        )
        .all()
    )
def apply_dashboard_filters(
    query: Query,
    filters: DashboardFilter,
):

    if filters.department_id is not None:

        query = query.filter(
            Report.department_id == filters.department_id
        )

    if filters.issue_type is not None:

        query = query.filter(
            Report.issue_type == filters.issue_type
        )

    if filters.status is not None:

        query = query.filter(
            Report.status == filters.status
        )

    if filters.priority is not None:

        query = query.filter(
            Report.priority == filters.priority
        )

    if filters.from_date is not None:

        query = query.filter(
            Report.created_at >= filters.from_date
        )

    if filters.to_date is not None:

        query = query.filter(
            Report.created_at <= filters.to_date
        )

    return query
def get_recent_reports(
    db: Session,
    limit: int = 10,
):

    return (
        db.query(
            Report.report_number,
            Report.issue_type,
            Report.priority,
            Report.status,
            Department.name.label("department_name"),
            Report.created_at,
        )
        .join(
            Department,
            Department.id == Report.department_id,
        )
        .order_by(
            Report.created_at.desc(),
        )
        .limit(limit)
        .all()
    )
def get_high_priority_reports(
    db: Session,
    limit: int = 10,
):

    return (
        db.query(
            Report.report_number,
            Report.issue_type,
            Report.priority,
            Report.status,
            Department.name.label(
                "department_name"
            ),
            Report.risk_score,
            Report.created_at,
        )
        .join(
            Department,
            Department.id == Report.department_id,
        )
        .filter(
            Report.priority.in_(
                [
                    Priority.CRITICAL,
                    Priority.HIGH,
                ]
            )
        )
        .filter(
            Report.status.in_(
                [
                    ReportStatus.PENDING,
                    ReportStatus.ASSIGNED,
                    ReportStatus.IN_PROGRESS,
                ]
            )
        )
        .order_by(
            Report.risk_score.desc(),
            Report.created_at.asc(),
        )
        .limit(limit)
        .all()
    )
def get_dashboard_insight_data(
    db: Session,
):
    return {
        "total_reports": db.query(Report).count(),

        "resolved_reports": db.query(Report).filter(
            Report.status == ReportStatus.RESOLVED
        ).count(),

        "pending_by_department": (
            db.query(
                Department.name,
                func.count(Report.id).label("count"),
            )
            .join(
                Report,
                Report.department_id == Department.id,
            )
            .filter(
                Report.status.in_(
                    [
                        ReportStatus.PENDING,
                        ReportStatus.ASSIGNED,
                        ReportStatus.IN_PROGRESS,
                    ]
                )
            )
            .group_by(
                Department.name,
            )
            .order_by(
                func.count(Report.id).desc(),
            )
            .first()
        ),

        "most_common_issue": (
            db.query(
                Report.issue_type,
                func.count(Report.id).label("count"),
            )
            .group_by(
                Report.issue_type,
            )
            .order_by(
                func.count(Report.id).desc(),
            )
            .first()
        ),
    }