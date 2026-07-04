from authentication.security import (
    create_access_token,
    verify_password,
)

from database.crud.user import UserCRUD
from database.enums import UserRole
from schemas.user import (
    Token,
    UserCreate,
)

from fastapi import HTTPException, status
from sqlalchemy.orm import Session


class AuthService:

    def __init__(self, db: Session):

        self.db = db

    def register(
        self,
        user_data: UserCreate,
    ):

        existing_user = UserCRUD.get_by_email(
            self.db,
            user_data.email,
        )

        if existing_user:

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered.",
            )

        user = UserCRUD.create(
            db=self.db,

            name=user_data.name,

            email=user_data.email,

            phone=user_data.phone,

            password=user_data.password,

            role=UserRole.CITIZEN,
        )

        return user

    def login(
        self,
        email: str,
        password: str,
    ) -> Token:

        user = UserCRUD.get_by_email(
            self.db,
            email,
        )

        if not user:

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not verify_password(
            password,
            user.password_hash,
        ):

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        token = create_access_token(
            {
                "sub": str(user.id),
                "role": user.role.value,
            }
        )

        return Token(
            access_token=token,
        )