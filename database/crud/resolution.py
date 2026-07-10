from sqlalchemy.orm import Session

from database.models.assignment import Assignment
from database.models.report import Report
from database.models.resolution import Resolution


class ResolutionCRUD:

    @staticmethod
    def get_assignment(
        db: Session,
        assignment_id: int,
    ) -> Assignment | None:

        return (
            db.query(Assignment)
            .filter(
                Assignment.id == assignment_id,
            )
            .first()
        )

    @staticmethod
    def get_report(
        db: Session,
        report_id: int,
    ) -> Report | None:

        return (
            db.query(Report)
            .filter(
                Report.id == report_id,
            )
            .first()
        )

    @staticmethod
    def get_resolution(
        db: Session,
        report_id: int,
    ) -> Resolution | None:

        return (
            db.query(Resolution)
            .filter(
                Resolution.report_id == report_id,
            )
            .first()
        )

    @staticmethod
    def create(
        db: Session,
        resolution: Resolution,
    ) -> Resolution:

        db.add(resolution)

        db.flush()

        return resolution