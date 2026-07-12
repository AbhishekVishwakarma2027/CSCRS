from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from authentication.dependencies import (
    require_city_admin,
)
from database.models.user import User
from database.dependencies import get_db
from schemas.analytics import DashboardSummaryResponse
from services.analytics_service import AnalyticsService
from schemas.analytics import DepartmentStatisticsItem
from schemas.analytics import IssueStatisticsItem
from schemas.analytics import StatusStatisticsItem
from schemas.analytics import PriorityStatisticsItem
from schemas.analytics import MonthlyTrendItem
from schemas.analytics import RecentReportItem
from schemas.analytics import (
    HighPriorityReportItem,
)
from schemas.analytics import DashboardInsightItem




router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard Analytics"],
)

@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
)
def dashboard_summary(
    current_user: User = Depends(
        require_city_admin(),
    ),
    db: Session = Depends(get_db),
):

    return AnalyticsService(
        db,
    ).get_dashboard_summary()
@router.get(
    "/departments",
    response_model=list[DepartmentStatisticsItem],
)
def department_statistics(
    current_user: User = Depends(
        require_city_admin(),
    ),
    db: Session = Depends(get_db),
):

    return AnalyticsService(
        db,
    ).get_department_statistics()
@router.get(
    "/issues",
    response_model=list[IssueStatisticsItem],
)
def issue_statistics(
    current_user: User = Depends(
        require_city_admin(),
    ),
    db: Session = Depends(get_db),
):

    return AnalyticsService(
        db,
    ).get_issue_statistics()
@router.get(
    "/status",
    response_model=list[StatusStatisticsItem],
)
def status_statistics(
    current_user: User = Depends(
        require_city_admin(),
    ),
    db: Session = Depends(get_db),
):

    return AnalyticsService(
        db,
    ).get_status_statistics()
@router.get(
    "/priorities",
    response_model=list[PriorityStatisticsItem],
)
def priority_statistics(
    current_user: User = Depends(
        require_city_admin(),
    ),
    db: Session = Depends(get_db),
):

    return AnalyticsService(
        db,
    ).get_priority_statistics()
@router.get(
    "/monthly-trends",
    response_model=list[MonthlyTrendItem],
)
def monthly_trend(
    year: int,
    current_user: User = Depends(
        require_city_admin(),
    ),
    db: Session = Depends(
        get_db,
    ),
):

    return AnalyticsService(
        db,
    ).get_monthly_trend(
        year,
    )
@router.get(
    "/recent-reports",
    response_model=list[RecentReportItem],
)
def recent_reports(
    limit: int = 10,
    current_user: User = Depends(
        require_city_admin(),
    ),
    db: Session = Depends(
        get_db,
    ),
):

    return AnalyticsService(
        db,
    ).get_recent_reports(
        limit,
    )
@router.get(
    "/high-priority",
    response_model=list[HighPriorityReportItem],
)
def high_priority_reports(
    limit: int = 10,
    current_user: User = Depends(
        require_city_admin(),
    ),
    db: Session = Depends(
        get_db,
    ),
):

    return AnalyticsService(
        db,
    ).get_high_priority_reports(
        limit,
    )
@router.get(
    "/insights",
    response_model=list[DashboardInsightItem],
)
def dashboard_insights(
    current_user: User = Depends(
        require_city_admin(),
    ),
    db: Session = Depends(
        get_db,
    ),
):

    return AnalyticsService(
        db,
    ).get_dashboard_insights()