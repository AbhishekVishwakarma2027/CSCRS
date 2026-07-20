from fastapi import (
    APIRouter,
    Depends,
    Request,
)
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database.dependencies import get_db
from schemas.user import (
    VerifyEmailRequest,
)
from schemas.user import (
    Token,
    UserCreate,
)
from schemas.user import (
    ResendOTPRequest,
)
from services.auth_service import AuthService
from authentication.dependencies import get_current_user
from database.models.user import User
from schemas.user import MessageResponse

from schemas.user import (
    ForgotPasswordRequest,
    VerifyResetOTPRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
)

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=MessageResponse,
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
    request: Request,

    form_data: OAuth2PasswordRequestForm = Depends(),

    db: Session = Depends(get_db),

):

    service = AuthService(db)

    return service.login(
        request,
        form_data.username,
        form_data.password,
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

@router.post(
    "/verify-email",
    response_model=MessageResponse,
)
def verify_email(
    request: VerifyEmailRequest,
    db: Session = Depends(get_db),
):

    service = AuthService(db)

    return service.verify_email(
        request.email,
        request.otp,
    )
@router.post(
    "/resend-otp",
    response_model=MessageResponse,
)
def resend_otp(
    request: ResendOTPRequest,
    db: Session = Depends(get_db),
):

    service = AuthService(db)

    return service.resend_otp(
        request.email,
    )
@router.post(
    "/forgot-password",
    response_model=MessageResponse,
)
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):

    service = AuthService(db)

    return service.forgot_password(
        request.email,
    )
@router.post(
    "/verify-reset-otp",
    response_model=MessageResponse,
)
def verify_reset_otp(
    request: VerifyResetOTPRequest,
    db: Session = Depends(get_db),
):

    service = AuthService(db)

    return service.verify_reset_otp(
        request.email,
        request.otp,
    )
@router.post(
    "/reset-password",
    response_model=MessageResponse,
)
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):

    service = AuthService(db)

    return service.reset_password(
        request.email,
        request.otp,
        request.new_password,
    )
@router.post(
    "/change-password",
    response_model=MessageResponse,
)
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(
        get_current_user,
    ),
    db: Session = Depends(
        get_db,
    ),
):

    service = AuthService(db)

    return service.change_password(
        current_user=current_user,
        old_password=request.old_password,
        new_password=request.new_password,
        confirm_password=request.confirm_password,
    )