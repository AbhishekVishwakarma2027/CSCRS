from sqlalchemy.orm import Session

from database.models.report import Report
from database.models.report_support import ReportSupport


def get_support(
    db: Session,
    report_id: int,
    citizen_id: int,
) -> ReportSupport | None:

    return (
        db.query(ReportSupport)
        .filter(
            ReportSupport.report_id == report_id,
            ReportSupport.citizen_id == citizen_id,
        )
        .first()
    )


def create_support(
    db: Session,
    report_id: int,
    citizen_id: int,
) -> ReportSupport:

    support = ReportSupport(
        report_id=report_id,
        citizen_id=citizen_id,
    )

    db.add(support)

    report = (
        db.query(Report)
        .filter(
            Report.id == report_id,
        )
        .first()
    )

    if report:

        report.support_count += 1

    db.commit()

    db.refresh(support)

    return support


def get_support_count(
    db: Session,
    report_id: int,
) -> int:

    report = (
        db.query(Report)
        .filter(
            Report.id == report_id,
        )
        .first()
    )

    if report is None:

        return 0

    return report.support_count