from sqlalchemy.orm import Session

from authentication.security import hash_password
from datetime import datetime, timezone
from database.enums import UserRole
from database.models.user import User


class UserCRUD:

    @staticmethod
    def get_by_email(
        db: Session,
        email: str,
    ) -> User | None:

        return (
            db.query(User)
            .filter(User.email == email)
            .first()
        )
    @staticmethod
    def get_by_phone(
        db: Session,
        phone: str,
    ) -> User | None:

        return (
            db.query(User)
            .filter(User.phone == phone)
            .first()
        )
    @staticmethod
    def get_by_id(
        db: Session,
        user_id: int,
    ) -> User | None:

        return (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )
    @staticmethod
    def get_department_admins(
        db: Session,
        department_id: int,
    ) -> list[User]:

        return (
            db.query(User)
            .filter(
                User.role == UserRole.DEPARTMENT_ADMIN,
                User.department_id == department_id,
                User.is_active.is_(True),
            )
            .all()
        )

    @staticmethod
    def create(
        db: Session,
        *,
        name: str,
        email: str,
        phone: str | None,
        password: str,
        role: UserRole = UserRole.CITIZEN,
    ) -> User:

        user = User(

            name=name,

            email=email,

            phone=phone,

            password_hash=hash_password(password),

            role=role,
        )

        db.add(user)
        db.flush()

        return user
    
    @staticmethod
    def update_password(
        db: Session,
        user,
        password_hash: str,
    ):

        user.password_hash = password_hash
        db.add(user)

        db.commit()

        db.refresh(user)

        return user
    @staticmethod
    def build(
        *,
        name: str,
        email: str,
        phone: str | None,
        password: str,
        role: UserRole = UserRole.CITIZEN,
    ) -> User:

        return User(
            name=name,
            email=email,
            phone=phone,
            password_hash=hash_password(password),
            role=role,
        )
    @staticmethod
    def block_user(
        db: Session,
        user,
        blocked_by: int,
        block_type,
        reason: str,
    ):

        user.is_blocked = True
        user.block_type = block_type.value
        user.blocked_by = blocked_by
        user.blocked_at = datetime.now(timezone.utc)
        user.block_reason = reason

        db.add(user)
        db.commit()
        db.refresh(user)

        return user
    @staticmethod
    def unblock_user(
        db: Session,
        user,
    ):

        user.is_blocked = False
        user.blocked_by = None
        user.block_type= None
        user.blocked_at = None
        user.block_reason = None

        db.add(user)
        db.commit()
        db.refresh(user)

        return user