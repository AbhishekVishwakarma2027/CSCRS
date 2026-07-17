from sqlalchemy.orm import Session
from sqlalchemy import func
from database.models.department import Department
from database.models.report import Report
from sqlalchemy import extract
from sqlalchemy.orm import Query
from schemas.analytics import DashboardFilter
from database.enums import (
    Priority,
    ReportStatus,
)
from database.models.worker_profile import WorkerProfile
from database.models.resolution_ai_result import ResolutionAIResult
from database.enums import ResolutionDecision
from database.models.assignment import Assignment
from database.models.user import User
from database.enums import UserRole
from database.enums import AssignmentStatus
from datetime import date
from configs.config import (
    DASHBOARD_RECENT_REPORT_LIMIT,
)
from database.models.resolution import Resolution
from database.models.department_forward_request import DepartmentForwardRequest
from database.enums import ForwardRequestStatus
from datetime import datetime, timezone




def _calculate_automation_rate(
    db: Session,
    department_id: int | None = None,
):

    query = db.query(
        ResolutionAIResult,
    )

    if department_id is not None:

        query = (
            query.join(
                Report,
                Report.id == ResolutionAIResult.report_id,
            )
            .filter(
                Report.department_id == department_id,
            )
        )

    total_ai_results = query.count()

    if total_ai_results == 0:
        return 0.0

    auto_verified = (
        query.filter(
            ResolutionAIResult.ai_decision == ResolutionDecision.PASS,
        )
        .count()
    )

    return round(
        (auto_verified / total_ai_results) * 100,
        2,
    )


def get_dashboard_summary(
    db: Session,
):
    

    status_counts = dict(
        db.query(
            Report.status,
            func.count(Report.id),
        )
        .group_by(
            Report.status,
        )
        .all()
    )

    pending_reports = status_counts.get(
        ReportStatus.PENDING,
        0,
    )

    assigned_reports = status_counts.get(
        ReportStatus.ASSIGNED,
        0,
    )

    in_progress_reports = status_counts.get(
        ReportStatus.IN_PROGRESS,
        0,
    )

    resolved_reports = status_counts.get(
        ReportStatus.RESOLVED,
        0,
    )

    closed_reports = status_counts.get(
        ReportStatus.CLOSED,
        0,
    )

    rejected_reports = status_counts.get(
        ReportStatus.REJECTED,
        0,
    )

    cancelled_reports = status_counts.get(
        ReportStatus.CANCELLED,
        0,
    )
    total_departments = (
        db.query(Department)
        .count()
    )

    total_workers = (
        db.query(User)
        .filter(
            User.role == UserRole.WORKER,
        )
        .count()
    )

    total_citizens = (
        db.query(User)
        .filter(
            User.role == UserRole.CITIZEN,
        )
        .count()
    )
    resolution_rate = (
        round(
            (
                (resolved_reports + closed_reports)
                / db.query(Report).count()
            ) * 100,
            2,
        )
        if db.query(Report).count()
        else 0.0
    )

    automation_rate = _calculate_automation_rate(
        db,
    )
    return {

    "total_reports": db.query(Report).count(),

    "pending_reports": pending_reports,

    "assigned_reports": assigned_reports,

    "in_progress_reports": in_progress_reports,

    "resolved_reports": resolved_reports,

    "closed_reports": closed_reports,

    "rejected_reports": rejected_reports,

    "cancelled_reports": cancelled_reports,

    "total_departments": total_departments,

    "total_workers": total_workers,

    "total_citizens": total_citizens,

    "resolution_rate": resolution_rate,

    "automation_rate": automation_rate,
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
            Assignment.worker_id.label("assigned_worker_id"),
            User.name.label("assigned_worker"),
        )
        .join(
            Department,
            Department.id == Report.department_id,
        )
        .outerjoin(
            Assignment,
            Assignment.report_id == Report.id,
        )
        .outerjoin(
            User,
            User.id == Assignment.worker_id,
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
        "highest_cancelled_department": (
            db.query(
                Department.name,
                func.count(Report.id).label("count"),
            )
            .join(
                Report,
                Report.department_id == Department.id,
            )
            .filter(
                Report.status == ReportStatus.CANCELLED,
            )
            .group_by(
                Department.name,
            )
            .order_by(
                func.count(Report.id).desc(),
            )
            .first()
        ),

        "top_worker": (
            db.query(
                User.name,
                func.count(Assignment.id).label("completed"),
            )
            .join(
                Assignment,
                Assignment.worker_id == User.id,
            )
            .filter(
                Assignment.status == AssignmentStatus.COMPLETED,
            )
            .group_by(
                User.name,
            )
            .order_by(
                func.count(Assignment.id).desc(),
            )
            .first()
        ),

        "most_delayed_report": (
            db.query(
                Report.report_number,
                Report.created_at,
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
                Report.created_at.asc(),
            )
            .first()
        ),

        "most_delayed_department": (
            db.query(
                Department.name,
                func.min(Report.created_at).label("oldest"),
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
                func.min(Report.created_at).asc(),
            )
            .first()
        ),

        "high_priority_waiting": (
            db.query(Report)
            .filter(
                Report.priority.in_(
                    [
                        Priority.HIGH,
                        Priority.CRITICAL,
                    ]
                ),
                Report.status.in_(
                    [
                        ReportStatus.PENDING,
                        ReportStatus.ASSIGNED,
                        ReportStatus.IN_PROGRESS,
                    ]
                ),
            )
            .count()
        ),

        "available_workers": (
            db.query(WorkerProfile)
            .filter(
                WorkerProfile.is_available.is_(True),
            )
            .count()
        ),

        "busy_workers": (
            db.query(WorkerProfile)
            .filter(
                WorkerProfile.is_available.is_(False),
            )
            .count()
        ),

        "pending_forward_requests": (
            db.query(DepartmentForwardRequest)
            .filter(
                DepartmentForwardRequest.status == ForwardRequestStatus.PENDING,
            )
            .count()
        ),
    }
def get_department_dashboard_summary(
    db: Session,
    department_id: int,
):

    total_reports = (
        db.query(Report)
        .filter(
            Report.department_id == department_id,
        )
        .count()
    )
    status_counts = dict(
        db.query(
            Report.status,
            func.count(Report.id),
        )
        .filter(
            Report.department_id == department_id,
        )
        .group_by(
            Report.status,
        )
        .all()
    )

    pending_reports = status_counts.get(
        ReportStatus.PENDING,
        0,
    )

    assigned_reports = status_counts.get(
        ReportStatus.ASSIGNED,
        0,
    )

    in_progress_reports = status_counts.get(
        ReportStatus.IN_PROGRESS,
        0,
    )

    resolved_reports = status_counts.get(
        ReportStatus.RESOLVED,
        0,
    )

    cancelled_reports = status_counts.get(
        ReportStatus.CANCELLED,
        0,
    )
    
    available_workers = (
        db.query(WorkerProfile)
        .filter(
            WorkerProfile.department_id == department_id,
            WorkerProfile.is_available.is_(True),
        )
        .count()
    )

    busy_workers = (
        db.query(WorkerProfile)
        .filter(
            WorkerProfile.department_id == department_id,
            WorkerProfile.is_available.is_(False),
        )
        .count()
    )
    forward_status_counts = dict(
        db.query(
            DepartmentForwardRequest.status,
            func.count(DepartmentForwardRequest.id),
        )
        .filter(
            DepartmentForwardRequest.current_department_id == department_id,
        )
        .group_by(
            DepartmentForwardRequest.status,
        )
        .all()
    )

    forward_requests_pending = forward_status_counts.get(
        ForwardRequestStatus.PENDING,
        0,
    )

    forward_requests_accepted = forward_status_counts.get(
        ForwardRequestStatus.ACCEPTED,
        0,
    )

    forward_requests_rejected = forward_status_counts.get(
        ForwardRequestStatus.REJECTED,
        0,
    )

    return {
        "total_reports": total_reports,
        "pending_reports": pending_reports,
        "assigned_reports": assigned_reports,
        "in_progress_reports": in_progress_reports,
        "resolved_reports": resolved_reports,
        "cancelled_reports": cancelled_reports,
        "available_workers": available_workers,
        "busy_workers": busy_workers,
        "forward_requests_pending": forward_requests_pending,
        "forward_requests_accepted": forward_requests_accepted,
        "forward_requests_rejected": forward_requests_rejected,
        "average_resolution_time_hours": 0.0,
        "automation_rate": _calculate_automation_rate(
            db,
            department_id,
        ),
    }
def get_top_workers(
    db: Session,
    department_id: int,
    limit: int = 5,
):

    workers = (
        db.query(
            WorkerProfile.user_id,
            User.name,
        )
        .join(
            User,
            User.id == WorkerProfile.user_id,
        )
        .filter(
            WorkerProfile.department_id == department_id,
        )
        .all()
    )

    response = []

    for worker in workers:

        completed = (
            db.query(Assignment)
            .filter(
                Assignment.worker_id == worker.user_id,
                Assignment.status == AssignmentStatus.COMPLETED,
            )
            .count()
        )

        in_progress = (
            db.query(Assignment)
            .filter(
                Assignment.worker_id == worker.user_id,
                Assignment.status == AssignmentStatus.IN_PROGRESS,
            )
            .count()
        )

        total = completed + in_progress

        completion_rate = (
            round(
                (completed / total) * 100,
                2,
            )
            if total
            else 0.0
        )

        response.append(
            {
                "worker_id": worker.user_id,
                "worker_name": worker.name,
                "completed_reports": completed,
                "in_progress_reports": in_progress,
                "completion_rate": completion_rate,
            }
        )

    response.sort(
        key=lambda x: (
            x["completed_reports"],
            x["completion_rate"],
        ),
        reverse=True,
    )

    return response[:limit]
def get_worker_dashboard_summary(
    db: Session,
    worker_id: int,
):

    assigned_reports = (
        db.query(Assignment)
        .filter(
            Assignment.worker_id == worker_id,
            Assignment.status == AssignmentStatus.ASSIGNED,
        )
        .count()
    )

    in_progress_reports = (
        db.query(Assignment)
        .filter(
            Assignment.worker_id == worker_id,
            Assignment.status == AssignmentStatus.IN_PROGRESS,
        )
        .count()
    )

    completed_reports = (
        db.query(Assignment)
        .filter(
            Assignment.worker_id == worker_id,
            Assignment.status == AssignmentStatus.COMPLETED,
        )
        .count()
    )

    pending_review_reports = (
        db.query(Resolution)
        .filter(
            Resolution.worker_id == worker_id,
            Resolution.manual_review.is_(True),
        )
        .count()
    )

    today_completed_reports = (
        db.query(Resolution)
        .filter(
            Resolution.worker_id == worker_id,
            func.date(Resolution.resolved_at)
            == date.today(),
        )
        .count()
    )

    return {
        "assigned_reports": assigned_reports,
        "in_progress_reports": in_progress_reports,
        "pending_review_reports": pending_review_reports,
        "completed_reports": completed_reports,
        "today_completed_reports": today_completed_reports,
        "average_resolution_time_hours": 0.0,
    }
def get_citizen_dashboard_summary(
    db: Session,
    citizen_id: int,
):

    total_reports = (
        db.query(Report)
        .filter(
            Report.citizen_id == citizen_id,
        )
        .count()
    )

    active_reports = (
        db.query(Report)
        .filter(
            Report.citizen_id == citizen_id,
            Report.status.in_(
                [
                    ReportStatus.PENDING,
                    ReportStatus.ASSIGNED,
                    ReportStatus.IN_PROGRESS,
                ]
            ),
        )
        .count()
    )

    resolved_reports = (
        db.query(Report)
        .filter(
            Report.citizen_id == citizen_id,
            Report.status.in_(
                [
                    ReportStatus.RESOLVED,
                    ReportStatus.CLOSED,
                ]
            ),
        )
        .count()
    )

    cancelled_reports = (
        db.query(Report)
        .filter(
            Report.citizen_id == citizen_id,
            Report.status == ReportStatus.CANCELLED,
        )
        .count()
    )

    reopened_reports = (
        db.query(Report)
        .filter(
            Report.citizen_id == citizen_id,
            Report.status.in_(
                [
                    ReportStatus.PENDING,
                    ReportStatus.ASSIGNED,
                    ReportStatus.IN_PROGRESS,
                ]
            ),
            Report.audit_logs.any(
                action="REPORT_REOPENED",
            ),
        )
        .count()
    )

    pending_reports = (
        db.query(Report)
        .filter(
            Report.citizen_id == citizen_id,
            Report.status == ReportStatus.PENDING,
        )
        .count()
    )

    assigned_reports = (
        db.query(Report)
        .filter(
            Report.citizen_id == citizen_id,
            Report.status == ReportStatus.ASSIGNED,
        )
        .count()
    )

    in_progress_reports = (
        db.query(Report)
        .filter(
            Report.citizen_id == citizen_id,
            Report.status == ReportStatus.IN_PROGRESS,
        )
        .count()
    )

    recent_reports = (
        db.query(
            Report.id.label(
                "report_id",
            ),
            Report.report_number,
            Report.issue_type,
            Report.priority,
            Report.status,
            Department.name.label(
                "department_name",
            ),
            Report.created_at,
        )
        .outerjoin(
            Department,
            Department.id == Report.department_id,
        )
        .filter(
            Report.citizen_id == citizen_id,
        )
        .order_by(
            Report.created_at.desc(),
        )
        .limit(
            DASHBOARD_RECENT_REPORT_LIMIT,
        )
        .all()
    )
    return {
    "summary": {
        "total_reports": total_reports,
        "active_reports": active_reports,
        "resolved_reports": resolved_reports,
        "cancelled_reports": cancelled_reports,
        "reopened_reports": reopened_reports,
    },
    "status_distribution": {
    "pending": pending_reports,
    "assigned": assigned_reports,
    "in_progress": in_progress_reports,
    "resolved": resolved_reports,
    "cancelled": cancelled_reports,
    },
    "recent_reports": recent_reports,
}