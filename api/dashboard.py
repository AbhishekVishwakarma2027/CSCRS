from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from authentication.dependencies import (
    require_city_admin,
    require_department_admin,
)
from database.models.user import User
from database.dependencies import get_db
from schemas.analytics import CityDashboardSummaryResponse
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
from schemas.analytics import DepartmentDashboardResponse
from schemas.analytics import TopWorkerItem
from schemas.analytics import WorkerDashboardResponse
from authentication.dependencies import require_worker
from schemas.analytics import CitizenDashboardResponse
from authentication.dependencies import require_citizen

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard Analytics"],
)

@router.get(
    "/summary",
    response_model=CityDashboardSummaryResponse,
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
@router.get(
    "/department/dashboard",
    response_model=DepartmentDashboardResponse,
)
def department_dashboard_summary(
    current_user: User = Depends(
        # require_city_admin(),
        require_department_admin(),
    ),
    db: Session = Depends(
        get_db,
    ),
):

    return AnalyticsService(
        db,
    ).get_department_dashboard_summary(
        current_user.department_id,
    )
@router.get(
    "/top-workers",
    response_model=list[TopWorkerItem],
)
def top_workers(
    department_id: int,
    limit: int = 5,
    current_user: User = Depends(
        require_city_admin(),
    ),
    db: Session = Depends(get_db),
):

    return AnalyticsService(
        db,
    ).get_top_workers(
        department_id,
        limit,
    )
@router.get(
    "/worker/dashboard",
    response_model=WorkerDashboardResponse,
)
def worker_dashboard_summary(
  
    current_user: User = Depends(
        require_worker(),
    ),
    db: Session = Depends(get_db),
):

    return AnalyticsService(
        db,
    ).get_worker_dashboard_summary(
        current_user.id,
    )
@router.get(
    "/citizen/dashboard",
    response_model=CitizenDashboardResponse,
)
def citizen_dashboard_summary(

    current_user: User = Depends(
        require_citizen(),
    ),
    db: Session = Depends(get_db),
):

    return AnalyticsService(
        db,
    ).get_citizen_dashboard_summary(
        current_user.id,
    )