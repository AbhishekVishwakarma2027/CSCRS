from sqlalchemy.orm import Session

from database.models.report import Report
from schemas.report import ReportCreateInternal


def create_report(
    db: Session,
    report_data: ReportCreateInternal,
    report_number: str,
) -> Report:
    report = Report(
        report_number=report_number,
        **report_data.model_dump(),
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return report


def get_report_by_id(
    db: Session,
    report_id: int,
) -> Report | None:
    return (
        db.query(Report)
        .filter(Report.id == report_id)
        .first()
    )


def get_report_by_number(
    db: Session,
    report_number: str,
) -> Report | None:
    return (
        db.query(Report)
        .filter(Report.report_number == report_number)
        .first()
    )


def get_all_reports(
    db: Session,
) -> list[Report]:
    return db.query(Report).all()


def update_report(
    db: Session,
    report: Report,
):
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def delete_report(
    db: Session,
    report: Report,
):
    db.delete(report)
    db.commit()