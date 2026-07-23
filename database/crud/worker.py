from sqlalchemy.orm import Session

from database.models.department import Department
from database.models.user import User
from database.models.worker_profile import WorkerProfile
from database.models.worker_invitation import WorkerInvitation
from datetime import datetime, timezone

class WorkerCRUD:

    @staticmethod
    def get_department_by_id(
        db: Session,
        department_id: int,
    ) -> Department | None:
        return (
            db.query(Department)
            .filter(Department.id == department_id)
            .first()
        )

    @staticmethod
    def get_user_by_email(
        db: Session,
        email: str,
    ) -> User | None:
        return (
            db.query(User)
            .filter(User.email == email)
            .first()
        )
    @staticmethod
    def get_by_employee_code(
        db: Session,
        employee_code: str,
    ) -> WorkerProfile | None:

        return (
            db.query(WorkerProfile)
            .filter(
                WorkerProfile.employee_code == employee_code
            )
            .first()
        )
    
    @staticmethod
    def create_worker(
        db: Session,
        user: User,
        worker_profile: WorkerProfile,
    ) -> WorkerProfile:

        db.add(user)
        db.flush()

        worker_profile.user_id = user.id

        db.add(worker_profile)
        db.flush()

        return worker_profile

    @staticmethod
    def get_worker_by_user_id(
        db: Session,
        user_id: int,
    ) -> WorkerProfile | None:

        return (
            db.query(WorkerProfile)
            .filter(
                WorkerProfile.user_id == user_id
            )
            .first()
        )
    @staticmethod
    def create_invitation(
        db: Session,
        invitation: WorkerInvitation,
    ) -> WorkerInvitation:

        db.add(invitation)

        db.flush()

        return invitation
    
    @staticmethod
    def get_latest_invitation(
        db: Session,
        user_id: int,
    ) -> WorkerInvitation | None:

        return (
            db.query(WorkerInvitation)
            .filter(
                WorkerInvitation.user_id == user_id
            )
            .order_by(
                WorkerInvitation.created_at.desc()
            )
            .first()
        )
    @staticmethod
    def save_invitation(
        db: Session,
        invitation: WorkerInvitation,
    ):

        db.flush()

        return invitation
    
    @staticmethod
    def get_invitation_by_token_hash(
        db: Session,
        token_hash: str,
    ) -> WorkerInvitation | None:

        return (
            db.query(WorkerInvitation)
            .filter(
                WorkerInvitation.token_hash == token_hash
            )
            .first()
        )


    @staticmethod
    def save_user(
        db: Session,
        user,
    ):

        db.flush()

        return user
    @staticmethod
    def get_worker_profile(
        db: Session,
        user_id: int,
    ) -> WorkerProfile | None:

        return (
            db.query(WorkerProfile)
            .filter(
                WorkerProfile.user_id == user_id
            )
            .first()
        )
    @staticmethod
    def get_worker_by_id(
        db: Session,
        worker_id: int,
    ) -> WorkerProfile | None:

        return (
            db.query(WorkerProfile)
            .filter(
                WorkerProfile.id == worker_id
            )
            .first()
        )
    @staticmethod
    def save_worker_profile(
        db: Session,
        worker_profile: WorkerProfile,
    ) -> WorkerProfile:

        db.flush()

        return worker_profile
    @staticmethod
    def block_worker(
        db: Session,
        *,
        user: User,
        blocked_by: int,
        reason: str,
    ):

        user.is_blocked = True
        user.blocked_at = datetime.now(timezone.utc)
        user.blocked_by = blocked_by
        user.block_reason = reason

        db.flush()

        return user


    @staticmethod
    def unblock_worker(
        db: Session,
        *,
        user: User,
    ):

        user.is_blocked = False
        user.blocked_at = None
        user.blocked_by = None
        user.block_reason = None

        db.flush()

        return user