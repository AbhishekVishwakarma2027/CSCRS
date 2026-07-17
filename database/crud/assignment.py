from sqlalchemy.orm import Session

from database.models.assignment import Assignment
from database.models.report import Report
from database.models.user import User
from database.models.worker_profile import WorkerProfile
from database.enums import UserRole
from sqlalchemy import func

from database.enums import AssignmentStatus

class AssignmentCRUD:

    @staticmethod
    def get_report(
        db: Session,
        report_id: int,
    ) -> Report | None:

        return (
            db.query(Report)
            .filter(Report.id == report_id)
            .first()
        )

    @staticmethod
    def get_worker_profile(
        db: Session,
        user_id: int,
    ) -> WorkerProfile | None:

        return (
            db.query(WorkerProfile)
            .filter(WorkerProfile.user_id == user_id)
            .first()
        )

    @staticmethod
    def get_user(
        db: Session,
        user_id: int,
    ) -> User | None:

        return (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )

    @staticmethod
    def create(
        db: Session,
        assignment: Assignment,
    ) -> Assignment:

        db.add(assignment)
        db.flush()
        return assignment
    
    @staticmethod
    def get_available_workers(
        db: Session,
        department_id: int,
    ):

        return (
            db.query(User)
            .join(
                WorkerProfile,
                WorkerProfile.user_id == User.id,
            )
            .filter(
                User.is_active.is_(True),
                WorkerProfile.is_available.is_(True),
                WorkerProfile.department_id == department_id,
                User.role == UserRole.WORKER,
            )
            .all()
        )
    @staticmethod
    def get_active_assignment_count(
        db: Session,
        worker_id: int,
    ) -> int:

        return (
            db.query(func.count(Assignment.id))
            .filter(
                Assignment.worker_id == worker_id,
                Assignment.status.in_(
                    [
                        AssignmentStatus.ASSIGNED,
                        AssignmentStatus.ACCEPTED,
                    ]
                ),
            )
            .scalar()
            or 0
        )
    @staticmethod
    def update_report_status(
        db: Session,
        report: Report,
        status,
    ):

        report.status = status

        db.flush()

        return report
    @staticmethod
    def get_active_assignment_for_report(
        db: Session,
        report_id: int,
    ) -> Assignment | None:

        return (
            
            db.query(Assignment)
            .filter(
                Assignment.report_id == report_id,
                Assignment.status.in_(
                    [
                        AssignmentStatus.ASSIGNED,
                        AssignmentStatus.ACCEPTED,
                        AssignmentStatus.IN_PROGRESS,
                    ]
                ),
            )
            .first()
        )
    @staticmethod
    def get_worker_assignments(
        db: Session,
        worker_id: int,
    ):

        return (
            db.query(Assignment)
            .filter(
                Assignment.worker_id == worker_id,
            )
            .order_by(
                Assignment.assigned_at.desc(),
            )
            .all()
        )
    @staticmethod
    def save_assignment(
        db: Session,
        assignment: Assignment,
    ) -> Assignment:

        db.flush()

        return assignment
    @staticmethod
    def get_assignment_by_id(
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
    def update_assignment(
        db: Session,
        assignment: Assignment,
    ) -> Assignment:

        db.flush()

        return assignment

    @staticmethod
    def update_assignment_status(
        db: Session,
        assignment: Assignment,
        status: AssignmentStatus,
    ) -> Assignment:

        assignment.status = status

        db.flush()

        return assignment
    @staticmethod
    def get_assignment_by_report(
        db: Session,
        report_id: int,
    ):

        return (
            db.query(Assignment)
            .filter(
                Assignment.report_id == report_id,
            )
            .first()
        )