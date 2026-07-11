from sqlalchemy.orm import Session

from database.models.department import Department
from database.models.user import User


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