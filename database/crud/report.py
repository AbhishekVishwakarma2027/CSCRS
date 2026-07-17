from sqlalchemy.orm import Session

from database.models.report import Report
from schemas.report import ReportCreateInternal
from sqlalchemy import and_
from sqlalchemy import or_
from math import ceil

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
def get_department_reports_filtered(
    db: Session,
    department_id: int,
    status=None,
    priority=None,
    issue_type=None,
):

    query = db.query(Report).filter(
        Report.department_id == department_id
    )

    if status is not None:

        query = query.filter(
            Report.status == status
        )

    if priority is not None:

        query = query.filter(
            Report.priority == priority
        )

    if issue_type is not None:

        query = query.filter(
            Report.issue_type == issue_type
        )

    return (
        query.order_by(
            Report.created_at.desc()
        )
        .all()
    )
def get_all_reports_filtered(
    db: Session,
    department_id=None,
    status=None,
    priority=None,
    issue_type=None,
):

    query = db.query(Report)

    if department_id is not None:

        query = query.filter(
            Report.department_id == department_id
        )

    if status is not None:

        query = query.filter(
            Report.status == status
        )

    if priority is not None:

        query = query.filter(
            Report.priority == priority
        )

    if issue_type is not None:

        query = query.filter(
            Report.issue_type == issue_type
        )

    return (
        query.order_by(
            Report.created_at.desc()
        )
        .all()
    )
def search_reports(
    db: Session,
    query: str,
):

    return (
        db.query(Report)
        .filter(
            or_(
                Report.report_number.ilike(f"%{query}%"),
                Report.issue_type.ilike(f"%{query}%"),
            )
        )
        .order_by(
            Report.created_at.desc()
        )
        .all()
    )
def search_department_reports(
    db: Session,
    department_id: int,
    query: str,
):

    return (
        db.query(Report)
        .filter(
            Report.department_id == department_id
        )
        .filter(
            or_(
                Report.report_number.ilike(f"%{query}%"),
                Report.issue_type.ilike(f"%{query}%"),
            )
        )
        .order_by(
            Report.created_at.desc()
        )
        .all()
    )
def search_citizen_reports(
    db: Session,
    citizen_id: int,
    query: str,
):

    return (
        db.query(Report)
        .filter(
            Report.citizen_id == citizen_id
        )
        .filter(
            or_(
                Report.report_number.ilike(f"%{query}%"),
                Report.issue_type.ilike(f"%{query}%"),
            )
        )
        .order_by(
            Report.created_at.desc()
        )
        .all()
    )

def get_all_reports_paginated(
    db: Session,
    page: int,
    page_size: int,
    department_id=None,
    status=None,
    priority=None,
    issue_type=None,
):
    query = db.query(Report)

    if department_id is not None:
        query = query.filter(
            Report.department_id == department_id
        )

    if status is not None:
        query = query.filter(
            Report.status == status
        )

    if priority is not None:
        query = query.filter(
            Report.priority == priority
        )

    if issue_type is not None:
        query = query.filter(
            Report.issue_type == issue_type
        )

    total_items = query.count()

    items = (
        query.order_by(
            Report.created_at.desc()
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    total_pages = ceil(total_items / page_size) if total_items else 1

    return items, total_items, total_pages

def update_report_department(
    db: Session,
    report: Report,
    department_id: int,
):

    report.department_id = department_id

    db.add(report)

    return report

def increment_forward_count(
    db: Session,
    report: Report,
):

    report.forward_count += 1

    db.add(report)

    return report

def get_forward_count(
    report: Report,
) -> int:

    return report.forward_count
def get_next_forward_number(
    db: Session,
    report_id: int,
) -> int:

    return (
        get_last_forward_number(
            db,
            report_id,
        )
        + 1
    )