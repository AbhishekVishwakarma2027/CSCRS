
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

    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token.",
        )

    user = UserCRUD.get_by_id(
        db,
        user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )

    # Account activation check
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive.",
        )

    # Account blocked check
    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been blocked.",
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

def require_department_admin():
    return require_roles(
        UserRole.DEPARTMENT_ADMIN,
    )

def require_city_admin():
    return require_roles(
        UserRole.CITY_ADMIN,
    )

def require_super_admin():
    return require_roles(
        UserRole.SUPER_ADMIN,
    )

def require_admin():
    return require_roles(
        UserRole.DEPARTMENT_ADMIN,
        UserRole.SUPER_ADMIN,
    )

def require_admin_reports():
    return require_roles(
        UserRole.CITY_ADMIN,
        UserRole.DEPARTMENT_ADMIN,
    )