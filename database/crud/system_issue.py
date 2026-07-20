from sqlalchemy.orm import (
    Session,
    joinedload,
)
from datetime import datetime
from sqlalchemy import or_

from database.models.user import User

from database.models.system_issue import SystemIssue,SystemIssueStatus


class SystemIssueCRUD:

    @staticmethod
    def create(
        db: Session,
        issue_number: str,
        reporter_id: int,
        related_report_id: int | None,
        title: str,
        description: str,
        category,
        status,
    ) -> SystemIssue:

        issue = SystemIssue(
            issue_number=issue_number,
            reporter_id=reporter_id,
            related_report_id=related_report_id,
            title=title,
            description=description,
            category=category,
            status=status,
        )

        db.add(issue)
        db.commit()
        db.refresh(issue)

        return issue

    @staticmethod
    def get_last_issue(
        db: Session,
    ) -> SystemIssue | None:

        return (
            db.query(SystemIssue)
            .order_by(SystemIssue.id.desc())
            .first()
        )
    @staticmethod
    def get_issues(

        db: Session,

        status=None,

        category=None,

        reporter: str | None = None,

        search: str | None = None,

    ):

        query = (
            db.query(SystemIssue)
            .options(
                joinedload(
                    SystemIssue.reporter,
                )
            )
        )

        if status:

            query = query.filter(
                SystemIssue.status == status,
            )

        if category:

            query = query.filter(
                SystemIssue.category == category,
            )

        if reporter:

            query = query.join(User).filter(

                User.name.ilike(
                    f"%{reporter}%"
                )
            )

        if search:

            query = query.filter(

                or_(

                    SystemIssue.issue_number.ilike(
                        f"%{search}%"
                    ),

                    SystemIssue.title.ilike(
                        f"%{search}%"
                    ),
                )
            )

        return (
            query
            .order_by(
                SystemIssue.created_at.desc()
            )
            .all()
        )
    @staticmethod
    def get_issue_by_number(
        db: Session,
        issue_number: str,
    ) -> SystemIssue | None:

        return (
            db.query(SystemIssue)
            .options(
                joinedload(SystemIssue.reporter),
                joinedload(SystemIssue.related_report),
                joinedload(SystemIssue.attachments),
            )
            .filter(
                SystemIssue.issue_number == issue_number,
            )
            .first()
        )
    @staticmethod
    def update_status(
        db: Session,
        issue: SystemIssue,
        status,
        remarks: str | None,
    ):

        issue.status = status

        issue.remarks = remarks

        if status in (
            SystemIssueStatus.RESOLVED,
            SystemIssueStatus.REJECTED,
        ):

            issue.closed_at = datetime.utcnow()

        else:

            issue.closed_at = None

        db.add(issue)

        db.commit()

        db.refresh(issue)

        return issue
    @staticmethod
    def get_all_for_export(
        db: Session,
    ):

        return (
            db.query(SystemIssue)
            .options(
                joinedload(SystemIssue.reporter),
                joinedload(SystemIssue.related_report),
            )
            .order_by(
                SystemIssue.created_at.desc()
            )
            .all()
        )