from sqlalchemy.orm import Session

from database.crud.city_admin import CityAdminCRUD
from database.crud.user import UserCRUD

from database.enums import UserRole
from database.models.user import User

from services.worker_invitation import WorkerInvitationService
from services.notification_service import NotificationService

from configs.config import FRONTEND_BASE_URL
from authentication.security import hash_password


class CityAdminService:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

    def create_city_admin(
        self,
        data,
    ):

        existing_user = CityAdminCRUD.get_user_by_email(
            self.db,
            data.email,
        )

        if existing_user:

            raise ValueError(
                "Email already registered."
            )

        if data.phone:

            existing_phone = UserCRUD.get_by_phone(
                self.db,
                data.phone,
            )

            if existing_phone is not None:

                raise ValueError(
                    "Phone number already registered."
                )

        user = UserCRUD.build(
            name=data.name,
            email=data.email,
            phone=data.phone,
            password="Temp@123456",
            role=UserRole.CITY_ADMIN,
        )

        CityAdminCRUD.create_city_admin(
            self.db,
            user,
        )

        token, invitation = WorkerInvitationService.create_invitation(
            self.db,
            user.id,
        )

        activation_link = (
            f"{FRONTEND_BASE_URL}/city-admins/activate?token={token}"
        )

        try:
            NotificationService().send_city_admin_invitation(
                admin_name=user.name,
                admin_email=user.email,
                activation_link=activation_link,
            )

        except Exception as e:

            self.db.rollback()

            raise ValueError(
                f"Invitation email failed: {e}"
            )

        self.db.commit()

        self.db.refresh(user)

        return user

    def activate_city_admin(
        self,
        *,
        token: str,
        password: str,
    ):

        invitation = WorkerInvitationService.verify_token(
            self.db,
            token,
        )

        if invitation is None:

            raise ValueError(
                "Invalid or expired activation link."
            )

        user = UserCRUD.get_by_id(
            self.db,
            invitation.user_id,
        )

        if user is None:

            raise ValueError(
                "City Admin not found."
            )

        user.password_hash = hash_password(password)

        user.is_active = True

        user.is_email_verified = True

        invitation.used = True

        self.db.commit()

        NotificationService().send_account_activation_success(
            user_name=user.name,
            user_email=user.email,
            role_name="City Administrator",
        )

        return {
            "message": "City Admin account activated successfully."
        }