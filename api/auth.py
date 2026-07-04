from fastapi import (
    APIRouter,
    Depends,
)

from sqlalchemy.orm import Session

from database.dependencies import get_db

from schemas.user import (
    Token,
    UserCreate,
    UserResponse,
    UserLogin,
)

from services.auth_service import AuthService
from authentication.dependencies import get_current_user
from database.models.user import User


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
)
def register(

    user: UserCreate,

    db: Session = Depends(get_db),

):

    service = AuthService(db)

    return service.register(user)


@router.post(
    "/login",
    response_model=Token,
)
def login(

    credentials: UserLogin,

    db: Session = Depends(get_db),

):

    service = AuthService(db)

    return service.login(
        credentials.email,
        credentials.password,
    )

@router.get("/me")
def me(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
    }