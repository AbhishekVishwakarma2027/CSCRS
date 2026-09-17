from sqlalchemy.orm import Session
from database.models.report import Report
from database.models.department import Department
from database.models.user import User
from database.models.resolution import Resolution
from database.enums import ReportStatus, UserRole
from schemas.public_dashboard import (
    PublicOverviewResponse,
    StateDashboardResponse,
    DistrictSummaryItem,
)
from utils.geo import DistrictResolver


class PublicDashboardService:

    def __init__(self, db: Session):
        self.db = db
        self.resolver = DistrictResolver.get_instance()

    def get_public_overview(self) -> PublicOverviewResponse:
        reports_resolved = (
            self.db.query(Report)
            .filter(
                Report.status.in_(
                    [
                        ReportStatus.RESOLVED,
                        ReportStatus.CLOSED,
                    ]
                )
            )
            .count()
        )

        departments = (
            self.db.query(Department)
            .filter(Department.is_active.is_(True))
            .count()
        )

        active_workers = (
            self.db.query(User)
            .filter(
                User.role == UserRole.WORKER,
                User.is_active.is_(True),
                User.is_blocked.is_(False),
            )
            .count()
        )

        # Operational jurisdiction count (Lucknow deployment)
        covered_cities = 1

        return PublicOverviewResponse(
            reports_resolved=reports_resolved,
            departments=departments,
            active_workers=active_workers,
            covered_cities=covered_cities,
        )

    def get_state_dashboard(
        self, state_name: str = "Uttar Pradesh"
    ) -> StateDashboardResponse:
        total_depts = (
            self.db.query(Department)
            .filter(Department.is_active.is_(True))
            .count()
        )
        total_workers = (
            self.db.query(User)
            .filter(
                User.role == UserRole.WORKER,
                User.is_active.is_(True),
                User.is_blocked.is_(False),
            )
            .count()
        )

        reports = (
            self.db.query(Report)
            .all()
        )

        # Resolution times map: report_id -> resolution_hours
        resolutions = (
            self.db.query(Report.id, Report.created_at, Resolution.resolved_at)
            .join(Resolution, Resolution.report_id == Report.id)
            .filter(Report.status.in_([ReportStatus.RESOLVED, ReportStatus.CLOSED]))
            .all()
        )
        res_time_map = {}
        for rid, created_at, resolved_at in resolutions:
            if created_at and resolved_at:
                diff_h = (resolved_at - created_at).total_seconds() / 3600.0
                if diff_h >= 0:
                    res_time_map[rid] = diff_h

        # Aggregate state statistics
        total_reports_count = len(reports)
        resolved_reports_count = sum(
            1 for r in reports if r.status in (ReportStatus.RESOLVED, ReportStatus.CLOSED)
        )
        all_resolution_times = list(res_time_map.values())
        avg_res_time_state = (
            round(sum(all_resolution_times) / len(all_resolution_times), 1)
            if all_resolution_times
            else 0.0
        )
        res_rate_state = (
            round((resolved_reports_count / total_reports_count) * 100, 1)
            if total_reports_count > 0
            else 0.0
        )

        # District-level bucket initialization for all 75 UP districts
        district_data: dict[str, dict] = {}
        for d in self.resolver.districts:
            d_name = d["name"]
            district_data[d_name] = {
                "district": d_name,
                "total_reports": 0,
                "resolved_reports": 0,
                "active_departments": total_depts,
                "active_workers": 0,
                "resolution_times": [],
            }

        # Map each report coordinate to its district
        for report in reports:
            d_name = self.resolver.resolve_district(report.latitude, report.longitude)
            if d_name and d_name in district_data:
                d_entry = district_data[d_name]
                d_entry["total_reports"] += 1
                if report.status in (ReportStatus.RESOLVED, ReportStatus.CLOSED):
                    d_entry["resolved_reports"] += 1
                if report.id in res_time_map:
                    d_entry["resolution_times"].append(res_time_map[report.id])

        # Worker distribution per department/district (or fallback to proportional/total)
        district_items: list[DistrictSummaryItem] = []
        for d_name, info in district_data.items():
            r_times = info["resolution_times"]
            avg_hours = round(sum(r_times) / len(r_times), 1) if r_times else 0.0
            district_items.append(
                DistrictSummaryItem(
                    district=d_name,
                    total_reports=info["total_reports"],
                    resolved_reports=info["resolved_reports"],
                    active_departments=total_depts,
                    active_workers=total_workers if info["total_reports"] > 0 else 0,
                    average_resolution_hours=avg_hours,
                    coordinates_available=True,
                )
            )

        return StateDashboardResponse(
            state=state_name,
            total_reports=total_reports_count,
            resolved_reports=resolved_reports_count,
            active_departments=total_depts,
            active_workers=total_workers,
            average_resolution_hours=avg_res_time_state,
            resolution_rate=res_rate_state,
            districts=district_items,
        )
