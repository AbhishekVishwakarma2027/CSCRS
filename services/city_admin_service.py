from sqlalchemy.orm import Session

from database.crud.city_admin import CityAdminCRUD
from database.crud.user import UserCRUD

from database.enums import UserRole
from database.models.user import User

from services.worker_invitation import WorkerInvitationService
from services.notification_service import NotificationService

from configs.config import FRONTEND_BASE_URL
from authentication.security import hash_password
from fastapi import HTTPException, status

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
    def block_citizen(
        self,
        citizen_id: int,
        current_user,
        block_type,
        reason: str,
    ):
        citizen = UserCRUD.get_by_id(
            self.db,
            citizen_id,
        )

        if citizen is None:
            raise HTTPException(
                status_code=404,
                detail="Citizen not found.",
            )

        if citizen.role != UserRole.CITIZEN:
            raise HTTPException(
                status_code=400,
                detail="Only citizen accounts can be blocked.",
            )

        if citizen.is_blocked:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Citizen account is already blocked.",
            )

        UserCRUD.block_user(
            self.db,
            citizen,
            current_user.id,
            block_type,
            reason,
        )
        try:

            NotificationService().send_account_blocked(
                user_name=citizen.name,
                user_email=citizen.email,
                block_type=block_type.value,
                reason=reason,
            )

        except Exception as e:

            print(
                f"Failed to send account blocked email: {e}"
            )
        return {
            "message": "Citizen blocked successfully."
        }
    def unblock_citizen(
        self,
        citizen_id: int,
    ):
        citizen = UserCRUD.get_by_id(
            self.db,
            citizen_id,
        )

        if citizen is None:
            raise HTTPException(
                status_code=404,
                detail="Citizen not found.",
            )

        if citizen.role != UserRole.CITIZEN:
            raise HTTPException(
                status_code=404,
                detail="Only citizen accounts can be unblocked.",
            )

        if not citizen.is_blocked:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Citizen account is already active.",
            )

        UserCRUD.unblock_user(
            self.db,
            citizen,
        )
        try:

            NotificationService().send_account_unblocked(
                user_name=citizen.name,
                user_email=citizen.email,
            )

        except Exception as e:

            print(
                f"Failed to send account unblocked email: {e}"
            )
        return {
            "message": "Citizen unblocked successfully."
        }
    def block_department_admin(
        self,
        admin_id: int,
        current_user,
        block_type,
        reason: str,
    ):

        admin = UserCRUD.get_by_id(
            self.db,
            admin_id,
        )

        if admin is None:

            raise HTTPException(
                status_code=404,
                detail="Department Admin not found.",
            )

        if admin.role != UserRole.DEPARTMENT_ADMIN:

            raise HTTPException(
                status_code=400,
                detail="Selected user is not a Department Admin.",
            )

        if admin.is_blocked:

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Department Admin account is already blocked.",
            )

        UserCRUD.block_user(
            self.db,
            admin,
            current_user.id,
            block_type,
            reason,
        )

        try:

            NotificationService().send_account_blocked(
                user_name=admin.name,
                user_email=admin.email,
                block_type=block_type.value,
                reason=reason,
            )

        except Exception as e:

            print(
                f"Failed to send department admin blocked email: {e}"
            )

        return {
            "message": "Department Admin blocked successfully."
        }


    def unblock_department_admin(
        self,
        admin_id: int,
        current_user,
    ):

        admin = UserCRUD.get_by_id(
            self.db,
            admin_id,
        )

        if admin is None:

            raise HTTPException(
                status_code=404,
                detail="Department Admin not found.",
            )

        if admin.role != UserRole.DEPARTMENT_ADMIN:

            raise HTTPException(
                status_code=400,
                detail="Selected user is not a Department Admin.",
            )

        if not admin.is_blocked:

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Department Admin account is already active.",
            )

        UserCRUD.unblock_user(
            self.db,
            admin,
        )

        try:

            NotificationService().send_account_unblocked(
                user_name=admin.name,
                user_email=admin.email,
            )

        except Exception as e:

            print(
                f"Failed to send department admin unblocked email: {e}"
            )

        return {
            "message": "Department Admin unblocked successfully."
        }
    
    def block_city_admin(
        self,
        admin_id: int,
        current_user,
        block_type,
        reason: str,
    ):

        admin = UserCRUD.get_by_id(
            self.db,
            admin_id,
        )

        if admin is None:

            raise HTTPException(
                status_code=404,
                detail="City Admin not found.",
            )

        if admin.role != UserRole.CITY_ADMIN:

            raise HTTPException(
                status_code=400,
                detail="Selected user is not a City Admin.",
            )

        if admin.is_blocked:

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="City Admin account is already blocked.",
            )

        UserCRUD.block_user(
            self.db,
            admin,
            current_user.id,
            block_type,
            reason,
        )

        try:

            NotificationService().send_account_blocked(
                user_name=admin.name,
                user_email=admin.email,
                block_type=block_type.value,
                reason=reason,
            )

        except Exception as e:

            print(
                f"Failed to send city admin blocked email: {e}"
            )

        return {
            "message": "City Admin blocked successfully."
        }


    def unblock_city_admin(
        self,
        admin_id: int,
        current_user,
    ):

        admin = UserCRUD.get_by_id(
            self.db,
            admin_id,
        )

        if admin is None:

            raise HTTPException(
                status_code=404,
                detail="City Admin not found.",
            )

        if admin.role != UserRole.CITY_ADMIN:

            raise HTTPException(
                status_code=400,
                detail="Selected user is not a City Admin.",
            )

        if not admin.is_blocked:

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="City Admin account is already active.",
            )

        UserCRUD.unblock_user(
            self.db,
            admin,
        )

        try:

            NotificationService().send_account_unblocked(
                user_name=admin.name,
                user_email=admin.email,
            )

        except Exception as e:

            print(
                f"Failed to send city admin unblocked email: {e}"
            )

        return {
            "message": "City Admin unblocked successfully."
        }