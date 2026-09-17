from pydantic import BaseModel
from typing import Optional


class PublicOverviewResponse(BaseModel):
    reports_resolved: int
    departments: int
    active_workers: int
    covered_cities: int


class DistrictSummaryItem(BaseModel):
    district: str
    total_reports: int
    resolved_reports: int
    active_departments: int
    active_workers: int
    average_resolution_hours: float
    coordinates_available: bool = True


class StateDashboardResponse(BaseModel):
    state: str
    total_reports: int
    resolved_reports: int
    active_departments: int
    active_workers: int
    average_resolution_hours: float
    resolution_rate: float
    districts: list[DistrictSummaryItem]
