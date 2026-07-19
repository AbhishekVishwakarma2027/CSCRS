from authentication.security import (
    create_access_token,
    verify_password,
    hash_password,
)

from database.crud.user import UserCRUD
from database.enums import UserRole
from schemas.user import (
    Token,
    UserCreate,
)

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from services.otp_service import OTPService
from services.notification_service import NotificationService

from database.crud.email_verification import (
    EmailVerificationCRUD,
)

from database.crud.password_reset import (
    PasswordResetCRUD,
)


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

        otp = OTPService.generate_otp()

        otp_hash = OTPService.hash_otp(
            otp,
        )

        expires_at = OTPService.expiry_time()

        EmailVerificationCRUD.create(
            self.db,
            user_id=user.id,
            otp_hash=otp_hash,
            expires_at=expires_at,
        )

        try:
            NotificationService().send_email_verification_otp(
                user_name=user.name,
                user_email=user.email,
                otp=otp,
                expiry_minutes=5,
            )

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to send verification email: {str(e)}",
            ) 

        return {
            "message": "Registration successful. Please check your email for the verification OTP."
        }

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

        if not user.is_email_verified:

            raise HTTPException(
                status_code=403,
                detail="Please verify your email before logging in.",
            )
        if not user.is_active:

            raise HTTPException(
                status_code=403,
                detail="Account is inactive. Please contact the administrator.",
            )
        if user.is_blocked:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been blocked. Please contact the city administration.",
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
    
    def verify_email(
        self,
        email: str,
        otp: str,
    ):

        user = UserCRUD.get_by_email(
            self.db,
            email,
        )

        if user is None:

            raise HTTPException(
                status_code=404,
                detail="User not found.",
            )

        verification = EmailVerificationCRUD.get_latest(
            self.db,
            user.id,
        )

        if verification is None:

            raise HTTPException(
                status_code=404,
                detail="OTP not found.",
            )

        if verification.verified:
            if verification.attempts >= 5:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Maximum OTP attempts exceeded. "
                        "Please request a new OTP."
                    ),
                )
            raise HTTPException(
                status_code=400,
                detail="Email already verified.",
            )

        if OTPService.is_expired(
            verification.expires_at,
        ):

            raise HTTPException(
                status_code=400,
                detail="OTP expired.",
            )

        if not OTPService.verify_otp(
            otp,
            verification.otp_hash,
        ):

            verification.attempts += 1

            EmailVerificationCRUD.save(
                self.db,
                verification,
            )

            raise HTTPException(
                status_code=400,
                detail="Invalid OTP.",
            )

        verification.verified = True

        user.is_active = True

        user.is_email_verified = True

        EmailVerificationCRUD.save(
            self.db,
            verification,
        )

        NotificationService().send_account_activation_success(
            user_name=user.name,
            user_email=user.email,
            role_name="Citizen",
        )

        return {
            "message": "Email verified successfully."
        }
    
    def resend_otp(
    self,
    email: str,
    ):

        user = UserCRUD.get_by_email(
            self.db,
            email,
        )

        if user is None:

            raise HTTPException(
                status_code=404,
                detail="User not found.",
            )

        if user.is_email_verified:

            raise HTTPException(
                status_code=400,
                detail="Email already verified.",
            )

        EmailVerificationCRUD.delete_unverified(
            self.db,
            user.id,
        )

        otp = OTPService.generate_otp()

        otp_hash = OTPService.hash_otp(
            otp,
        )

        expires_at = OTPService.expiry_time()

        EmailVerificationCRUD.create(
            self.db,
            user_id=user.id,
            otp_hash=otp_hash,
            expires_at=expires_at,
        )

        NotificationService().send_email_verification_otp(
            user_name=user.name,
            user_email=user.email,
            otp=otp,
            expiry_minutes=5,
        )

        return {
            
            "message": "A new verification OTP has been sent to your email."
        }
    def forgot_password(
        self,
        email: str,
    ):

        user = UserCRUD.get_by_email(
            self.db,
            email,
        )

        # Security:
        # Don't reveal whether the email exists.

        if user is None:

            return {
                "message": (
                    "If the email is registered, "
                    "a password reset OTP has been sent."
                )
            }

        PasswordResetCRUD.delete_unverified(
            self.db,
            user.id,
        )

        otp = OTPService.generate_otp()

        otp_hash = OTPService.hash_otp(
            otp,
        )

        expires_at = OTPService.expiry_time()

        PasswordResetCRUD.create(
            self.db,
            user_id=user.id,
            otp_hash=otp_hash,
            expires_at=expires_at,
        )

        NotificationService().send_password_reset_otp(
            user_name=user.name,
            user_email=user.email,
            otp=otp,
            expiry_minutes=5,
        )

        return {
            "message": (
                "If the email is registered, "
                "a password reset OTP has been sent."
            )
        }


    def verify_reset_otp(
        self,
        email: str,
        otp: str,
    ):

        user = UserCRUD.get_by_email(
            self.db,
            email,
        )

        if user is None:

            raise HTTPException(
                status_code=404,
                detail="User not found.",
            )

        reset = PasswordResetCRUD.get_latest(
            self.db,
            user.id,
        )

        if reset is None:

            raise HTTPException(
                status_code=404,
                detail="Password reset request not found.",
            )

        if reset.verified:

            raise HTTPException(
                status_code=400,
                detail="OTP already verified.",
            )

        if reset.attempts >= 5:

            raise HTTPException(
                status_code=400,
                detail="Maximum OTP attempts exceeded. Please request a new OTP.",
            )

        if OTPService.is_expired(
            reset.expires_at,
        ):

            raise HTTPException(
                status_code=400,
                detail="OTP expired.",
            )

        if not OTPService.verify_otp(
            otp,
            reset.otp_hash,
        ):

            reset.attempts += 1

            PasswordResetCRUD.save(
                self.db,
                reset,
            )

            raise HTTPException(
                status_code=400,
                detail="Invalid OTP.",
            )

        reset.verified = True

        PasswordResetCRUD.save(
            self.db,
            reset,
        )

        return {
            "message": "OTP verified successfully."
        }


    def reset_password(
        self,
        email: str,
        otp: str,
        new_password: str,
    ):

        user = UserCRUD.get_by_email(
            self.db,
            email,
        )

        if user is None:

            raise HTTPException(
                status_code=404,
                detail="User not found.",
            )

        reset = PasswordResetCRUD.get_latest(
            self.db,
            user.id,
        )

        if reset is None:

            raise HTTPException(
                status_code=404,
                detail="Password reset request not found.",
            )

        if not reset.verified:

            raise HTTPException(
                status_code=400,
                detail="Please verify the OTP first.",
            )

        if OTPService.is_expired(
            reset.expires_at,
        ):

            raise HTTPException(
                status_code=400,
                detail="OTP expired.",
            )

        UserCRUD.update_password(
            self.db,
            user,
            hash_password(
                new_password,
            ),
        )

        reset.verified = False

        PasswordResetCRUD.save(
            self.db,
            reset,
        )

        return {
            "message": "Password reset successfully."
        }
    def change_password(
        self,
        current_user,
        old_password: str,
        new_password: str,
        confirm_password: str,
    ):

        if not verify_password(
            old_password,
            current_user.password_hash,
        ):

            raise HTTPException(
                status_code=400,
                detail="Current password is incorrect.",
            )

        if new_password != confirm_password:

            raise HTTPException(
                status_code=400,
                detail="New password and confirm password do not match.",
            )

        if verify_password(
            new_password,
            current_user.password_hash,
        ):

            raise HTTPException(
                status_code=400,
                detail="New password must be different from the current password.",
            )

        UserCRUD.update_password(
            self.db,
            current_user,
            hash_password(
                new_password,
            ),
        )

        return {
            "message": "Password changed successfully.",
        }