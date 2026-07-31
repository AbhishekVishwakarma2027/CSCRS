from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ReportGenerationResponse(BaseModel):
    """
    Response returned after a PDF report is generated.
    """

    report_name: str
    generated_at: datetime
    file_name: str
    download_url: str


class ReportMetadata(BaseModel):
    """
    Common metadata shown on generated reports.
    """

    title: str
    generated_by: str
    generated_at: datetime
    city_name: str
    department_name: Optional[str] = None


class SummaryMetric(BaseModel):
    """
    Generic metric/value pair used in report summaries.
    """

    label: str
    value: str


class RecommendationItem(BaseModel):
    """
    Recommendation displayed at the end of the report.
    """

    title: str
    description: str


class ReportTableRow(BaseModel):
    """
    Generic table row for report sections.
    """

    values: list[str]