from sqlalchemy.orm import Session

from database.crud import report_support as report_support_crud
from services.priority_engine import PriorityEngine
from database.crud import report as report_crud


class ReportSupportService:

    def __init__(
        self,
        db: Session,
    ):

        self.db = db

    def already_supported(
        self,
        report_id: int,
        citizen_id: int,
    ):

        return report_support_crud.get_support(
            self.db,
            report_id,
            citizen_id,
        )

    def add_support(
        self,
        report_id: int,
        citizen_id: int,
    ):
        if report is None:
            raise ValueError("Report not found.")
        
        support = report_support_crud.create_support(
            self.db,
            report_id,
            citizen_id,
        )

        report = report_crud.get_report_by_id(
            self.db,
            report_id,
        )

        report.priority = PriorityEngine.calculate(
            risk_score=report.risk_score,
            support_count=report.support_count,
        )

        report_crud.update_report(
            self.db,
            report,
        )

        return support

    def support_count(
        self,
        report_id: int,
    ):

        return report_support_crud.get_support_count(
            self.db,
            report_id,
        )
    def support_existing_report(
        self,
        report_id: int,
        citizen_id: int,
    ):
        """
        Supports an existing report if the citizen
        has not already supported it.
        """

        existing_support = report_support_crud.get_support(
            self.db,
            report_id,
            citizen_id,
        )

        if existing_support:

            return None

        return report_support_crud.create_support(
            self.db,
            report_id,
            citizen_id,
        )