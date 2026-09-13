from sqlalchemy.orm import Session

from database.enums import UserRole
from database.models.department import Department
from database.models.user import User
from database.models.worker_profile import WorkerProfile

class AdminCRUD:

    @staticmethod
    def get_department_by_id(
        db: Session,
        department_id: int,
    ) -> Department | None:

        return (
            db.query(Department)
            .filter(
                Department.id == department_id
            )
            .first()
        )
    @staticmethod
    def get_workers_by_department(
        db: Session,
        department_id: int,
    ) -> list[tuple[WorkerProfile, User]]:

        return (
            db.query(WorkerProfile, User)
            .join(
                User,
                User.id == WorkerProfile.user_id,
            )
            .filter(
                WorkerProfile.department_id == department_id,
                User.role == UserRole.WORKER,
            )
            .order_by(
                WorkerProfile.id.asc()
            )
            .all()
        )
    @staticmethod
    def get_user_by_email(
        db: Session,
        email: str,
    ) -> User | None:

        return (
            db.query(User)
            .filter(
                User.email == email
            )
            .first()
        )

    @staticmethod
    def create_department_admin(
        db: Session,
        user: User,
    ) -> User:

        db.add(user)

        db.flush()

        return user

    @staticmethod
    def save_user(
        db: Session,
        user: User,
    ) -> User:

        db.flush()

        return user

    @staticmethod
    def get_department_admin_by_id(
        db: Session,
        user_id: int,
    ) -> User | None:

        return (
            db.query(User)
            .filter(
                User.id == user_id
            )
            .first()
        )