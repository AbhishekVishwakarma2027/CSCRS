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
def get_citizen_report_by_number(
    db: Session,
    citizen_id: int,
    report_number: str,
) -> Report | None:

    return (
        db.query(Report)
        .filter(
            Report.citizen_id == citizen_id,
            Report.report_number == report_number,
        )
        .first()
    )

def get_all_reports(
    db: Session,
) -> list[Report]:
    return db.query(Report).all()

def get_reports_by_citizen(
    db: Session,
    citizen_id: int,
):

    return (
        db.query(Report)
        .filter(
            Report.citizen_id == citizen_id
        )
        .order_by(
            Report.created_at.desc()
        )
        .all()
    )

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

def get_reports_by_department(
    db: Session,
    department_id: int,
) -> list[Report]:

    return (
        db.query(Report)
        .filter(
            Report.department_id == department_id
        )
        .order_by(
            Report.created_at.desc()
        )
        .all()
    )