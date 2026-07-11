from sqlalchemy.orm import Session

from database.models.user import User


class CityAdminCRUD:

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
    def create_city_admin(
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
    def get_city_admin_by_id(
        db: Session,
        user_id: int,
    ) -> User | None:

        return (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )