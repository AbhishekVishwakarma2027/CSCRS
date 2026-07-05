
from fastapi import (
    Depends,
    HTTPException,
    status,
)

from fastapi.security import OAuth2PasswordBearer

from sqlalchemy.orm import Session

from authentication.security import decode_access_token

from database.crud.user import UserCRUD
from database.dependencies import get_db

from database.enums import UserRole


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
)


def get_current_user(

    token: str = Depends(oauth2_scheme),

    db: Session = Depends(get_db),

):

    payload = decode_access_token(token)

    if not payload:

        raise HTTPException(

            status_code=status.HTTP_401_UNAUTHORIZED,

            detail="Invalid or expired token.",
        )

    user_id = payload.get("sub")

    if user_id is None:

        raise HTTPException(

            status_code=status.HTTP_401_UNAUTHORIZED,

            detail="Invalid token.",
        )

    user = UserCRUD.get_by_id(
        db,
        int(user_id),
    )

    if user is None:

        raise HTTPException(

            status_code=status.HTTP_401_UNAUTHORIZED,

            detail="User not found.",
        )

    return user
def require_roles(
    *allowed_roles: UserRole,
):

    def dependency(

        current_user=Depends(get_current_user),

    ):

        if current_user.role not in allowed_roles:

            raise HTTPException(

                status_code=status.HTTP_403_FORBIDDEN,

                detail="Permission denied.",
            )

        return current_user

    return dependency
def require_citizen():
    return require_roles(
        UserRole.CITIZEN,
    )


def require_worker():
    return require_roles(
        UserRole.WORKER,
    )


def require_admin():
    return require_roles(
        UserRole.ADMIN,
        UserRole.SUPERVISOR,
        UserRole.SUPER_ADMIN,
    )


def require_super_admin():
    return require_roles(
        UserRole.SUPER_ADMIN,
    )