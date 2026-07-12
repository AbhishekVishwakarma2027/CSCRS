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