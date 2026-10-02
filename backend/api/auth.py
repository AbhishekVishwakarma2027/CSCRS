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
    TokenResponse,
    UserCreate,
)
from schemas.user import (
    ResendOTPRequest,
)
from services.auth_service import AuthService
from authentication.dependencies import get_current_user
from database.models.user import User
from schemas.user import MessageResponse
from utils.rate_limiter import limiter


from schemas.user import (
    ForgotPasswordRequest,
    VerifyResetOTPRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    SessionResponse,
)
from services.refresh_token_service import RefreshTokenService
from schemas.user import RefreshTokenRequest

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=MessageResponse,
            responses={
        429: {
            "description": "Too many requests. Please try again later."
        }
    },
)
@limiter.limit("3 per minutes")
def register(
    request:Request,

    user: UserCreate,

    db: Session = Depends(get_db),

):

    service = AuthService(db)

    return service.register(user)


@router.post(
    "/login",
    response_model=TokenResponse,
        responses={
        429: {
            "description": "Too many requests. Please try again later."
        }
    },
)

@limiter.limit("5 per minute")
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
    "/refresh",
    response_model=TokenResponse,
)
def refresh_access_token(
    request_data: RefreshTokenRequest,
    db: Session = Depends(get_db),
):

    return RefreshTokenService(
        db,
    ).refresh(
        request_data.refresh_token,
    )
@router.post(
    "/logout",
)
def logout(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db),
):

    return RefreshTokenService(
        db,
    ).logout(
        request.refresh_token,
    )
@router.post(
    "/logout-all",
)
def logout_all(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    return RefreshTokenService(
        db,
    ).logout_all(
        current_user.id,
    )
@router.get(
    "/sessions",
    response_model=list[SessionResponse],
)
def get_sessions(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    return RefreshTokenService(
        db,
    ).get_active_sessions(
        current_user.id,
    )
@router.post(
    "/verify-email",
    response_model=MessageResponse,
            responses={
        429: {
            "description": "Too many requests. Please try again later."
        }
    },
)
@limiter.limit("5 per minutes")
def verify_email(
    request:Request,
    body: VerifyEmailRequest,
    db: Session = Depends(get_db),
):

    service = AuthService(db)

    return service.verify_email(
        body.email,
        body.otp,
    )

@router.post(
    "/resend-otp",
    response_model=MessageResponse,
            responses={
        429: {
            "description": "Too many requests. Please try again later."
        }
    },
)
@limiter.limit("5 per 10 minute")
def resend_otp(
    request:Request,
    body: ResendOTPRequest,
    db: Session = Depends(get_db),
):

    service = AuthService(db)

    return service.resend_otp(
        body.email,
    )
@router.post(
    "/forgot-password",
    response_model=MessageResponse,
            responses={
        429: {
            "description": "Too many requests. Please try again later."
        }
    },
)
@limiter.limit("3 per 15 minutes")
def forgot_password(
    request:Request,
    body: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):

    service = AuthService(db)

    return service.forgot_password(
        body.email,
    )
@router.post(
    "/verify-reset-otp",
    response_model=MessageResponse,
            responses={
        429: {
            "description": "Too many requests. Please try again later."
        }
    },
)
@limiter.limit("5 per 10 minutes")
def verify_reset_otp(
    request:Request,
    body: VerifyResetOTPRequest,
    db: Session = Depends(get_db),
):

    service = AuthService(db)

    return service.verify_reset_otp(
        body.email,
        body.otp,
    )
@router.post(
    "/reset-password",
    response_model=MessageResponse,
            responses={
        429: {
            "description": "Too many requests. Please try again later."
        }
    },
)
@limiter.limit("5 per 15 minutes")
def reset_password(
    request:Request,
    body: ResetPasswordRequest,
    db: Session = Depends(get_db),
):

    service = AuthService(db)

    return service.reset_password(
        body.email,
        body.otp,
        body.new_password,
    )
@router.post(
    "/change-password",
    response_model=MessageResponse,
            responses={
        429: {
            "description": "Too many requests. Please try again later."
        }
    },
)
@limiter.limit("2 per 15 minutes")
def change_password(
    request: Request,
    body: ChangePasswordRequest,
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
        old_password=body.old_password,
        new_password=body.new_password,
        confirm_password=body.confirm_password,
    )