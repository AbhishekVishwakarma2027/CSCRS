from pydantic import BaseModel
from datetime import date
from pydantic import BaseModel

class DashboardSummaryResponse(BaseModel):

    total_reports: int

    pending_reports: int

    assigned_reports: int

    in_progress_reports: int

    resolved_reports: int

    closed_reports: int

    rejected_reports: int

class DepartmentStatisticsItem(BaseModel):
    department_id: int
    department_name: str
    total_reports: int

class IssueStatisticsItem(BaseModel):

    issue_type: str

    total_reports: int
class StatusStatisticsItem(BaseModel):

    status: str

    total_reports: int

class PriorityStatisticsItem(BaseModel):

    priority: str

    total_reports: int
class MonthlyTrendItem(BaseModel):

    month: int

    month_name: str

    total_reports: int

from datetime import datetime


class RecentReportItem(BaseModel):

    report_number: str

    issue_type: str

    priority: str

    status: str

    department_name: str

    created_at: datetime

class DashboardFilter(BaseModel):

    department_id: int | None = None

    issue_type: str | None = None

    status: str | None = None

    priority: str | None = None

    from_date: date | None = None

    to_date: date | None = None
class HighPriorityReportItem(BaseModel):

    report_number: str

    issue_type: str

    priority: str

    status: str

    department_name: str

    risk_score: float

    created_at: datetime

class DashboardInsightItem(BaseModel):

    type: str

    title: str

    message: str
class DepartmentDashboardResponse(BaseModel):

    total_reports: int

    pending_reports: int

    in_progress_reports: int

    resolved_reports: int

    available_workers: int

    average_resolution_time_hours: float

    ai_accepted: int

    manual_review: int

    automation_rate: float

    busy_workers : int
class TopWorkerItem(BaseModel):

    worker_id: int

    worker_name: str

    completed_reports: int

    in_progress_reports: int
class TopWorkerItem(BaseModel):

    worker_id: int

    worker_name: str

    completed_reports: int

    in_progress_reports: int

    completion_rate: float
class WorkerDashboardResponse(BaseModel):

    assigned_reports: int

    in_progress_reports: int

    pending_review_reports: int

    completed_reports: int

    today_completed_reports: int

    average_resolution_time_hours: float

class CitizenDashboardSummary(BaseModel):

    total_reports: int

    active_reports: int

    resolved_reports: int

    cancelled_reports: int

    reopened_reports: int


class CitizenStatusStatistics(BaseModel):

    pending: int

    assigned: int

    in_progress: int

    resolved: int

    cancelled: int


class CitizenRecentReport(BaseModel):

    report_id: int

    report_number: str

    issue_type: str

    priority: str

    status: str

    department_name: str | None = None

    created_at: datetime


class CitizenDashboardResponse(BaseModel):

    summary: CitizenDashboardSummary

    status_distribution: CitizenStatusStatistics

    recent_reports: list[CitizenRecentReport]

    recent_notifications: list[dict]

    recent_timeline: list[dict]