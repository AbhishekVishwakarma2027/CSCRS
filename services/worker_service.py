from sqlalchemy.orm import Session


from database.crud.worker import WorkerCRUD
from database.enums import UserRole
from database.models.worker_profile import WorkerProfile
from database.crud.user import UserCRUD
from services.worker_invitation import WorkerInvitationService
from services.email_service import EmailService
from authentication.security import hash_password
from fastapi import HTTPException, status
from configs.config import (
    APP_BASE_URL,
    FRONTEND_BASE_URL,
)
from database.models.user import User
from database.models.worker_profile import WorkerProfile
from services.notification_service import NotificationService
from services.in_app_notification_service import InAppNotificationService
from database.models.report import Report
from schemas.worker import BlockWorkerRequest

class WorkerService:

    def __init__(self, db: Session):
        self.db = db

    def create_worker(
        self,
        *,
        current_user: User,
        name: str,
        email: str,
        phone: str | None,
        department_id: int,
        employee_code: str,
        designation: str,
        phone_extension: str | None,
    ) -> WorkerProfile:
        
        if current_user.role == UserRole.DEPARTMENT_ADMIN:

            department_id = current_user.department_id

        department = WorkerCRUD.get_department_by_id(
            self.db,
            department_id,
        )

        if department is None:
            raise ValueError("Department not found.")

        existing_user = WorkerCRUD.get_user_by_email(
            self.db,
            email,
        )

        if existing_user is not None:
            raise ValueError(
                "Email is already registered."
            )
        if phone:

            existing_phone = UserCRUD.get_by_phone(
                self.db,
                phone,
            )

            if existing_phone is not None:

                raise ValueError(
                    "Phone number is already registered."
                )
            
        user = UserCRUD.build(
            name=name,
            email=email,
            phone=phone,
            password="CHANGE_ME",
            role=UserRole.WORKER,
        )

        user.is_active = False
        user.is_email_verified = False

        worker_profile = WorkerProfile(
            department_id=department_id,
            employee_code=employee_code,
            designation=designation,
            phone_extension=phone_extension,
        )

        worker = WorkerCRUD.create_worker(
            self.db,
            user=user,
            worker_profile=worker_profile,
        )

        token, invitation = WorkerInvitationService.create_invitation(
            self.db,
            user.id,
        )

        activation_link = (
            f"{FRONTEND_BASE_URL}/workers/activate?token={token}"
        )

        try:

            NotificationService().send_worker_invitation(
                worker_name=user.name,
                worker_email=user.email,
                activation_link=activation_link,
            )

            # EmailService().send_email(
            #     to_email=user.email,
            #     subject="Activate your CSCRS Worker Account",
            #     body=(
            #         f"Hello {user.name},\n\n"
            #         "You have been invited to join the "
            #         "Crowdsourced Civic Issue Reporting & Resolution System "
            #         "as a Worker.\n\n"
            #         "Please activate your account using the link below:\n\n"
            #         f"{activation_link}\n\n"
            #         "This activation link is valid for 24 hours.\n\n"
            #         "If you were not expecting this invitation, "
            #         "please ignore this email."
            #     ),
            # )

        except Exception as e:
            
            self.db.rollback()
            # TODO:
            # Replace with proper logging in Phase 15.
            raise HTTPException(
                status_code=500,
                detail=f"Invitation email failed: {e}",
            )
        self.db.commit()
        self.db.refresh(worker_profile)

        return worker
    
    def activate_worker(
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

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired activation link.",
            )

        user = UserCRUD.get_by_id(
            self.db,
            invitation.user_id,
        )

        if user is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Worker not found.",
            )

        user.password_hash = hash_password(password)

        user.is_active = True

        user.is_email_verified = True

        profile = WorkerCRUD.get_worker_profile(
            self.db,
            user.id,
        )

        if profile is None:

            raise HTTPException(
                status_code=404,
                detail="Worker profile not found.",
            )

        profile.is_available = True

        invitation.used = True

        self.db.commit()

        NotificationService().send_account_activation_success(
            user_name=user.name,
            user_email=user.email,
            role_name="Worker",
        )

        return {
            "message": "Worker account activated successfully."
        }
    
    def deactivate_worker(
        self,
        *,
        worker_id: int,
    ):

        profile = WorkerCRUD.get_worker_by_id(
            self.db,
            worker_id,
        )

        if profile is None:

            raise HTTPException(
                status_code=404,
                detail="Worker not found.",
            )

        user = UserCRUD.get_by_id(
            self.db,
            profile.user_id,
        )

        if user is None:

            raise HTTPException(
                status_code=404,
                detail="User not found.",
            )

        if not user.is_active:

            return {
                "message": "Worker already inactive."
            }

        user.is_active = False

        profile.is_available = False

        self.db.commit()

        return {
            "message": "Worker deactivated successfully."
        }
    def activate_worker_account(
        self,
        *,
        worker_id: int,
    ):

        profile = WorkerCRUD.get_worker_by_id(
            self.db,
            worker_id,
        )

        if profile is None:

            raise HTTPException(
                status_code=404,
                detail="Worker not found.",
            )

        user = UserCRUD.get_by_id(
            self.db,
            profile.user_id,
        )

        if user is None:

            raise HTTPException(
                status_code=404,
                detail="User not found.",
            )

        if user.is_active:

            return {
                "message": "Worker already active."
            }

        user.is_active = True
        
        profile.is_available = True

        self.db.commit()

        return {
            "message": "Worker activated successfully."
        }
    def block_worker(
        self,
        *,
        worker_id: int,
        current_user: User,
        block_type,
        reason: str,
    ):

        profile = WorkerCRUD.get_worker_by_id(
            self.db,
            worker_id,
        )

        if profile is None:

            raise HTTPException(
                status_code=404,
                detail="Worker not found.",
            )

        if (
            current_user.role == UserRole.DEPARTMENT_ADMIN
            and current_user.department_id
            != profile.department_id
        ):

            raise HTTPException(
                status_code=403,
                detail=(
                    "You can only block workers "
                    "from your own department."
                ),
            )

        user = UserCRUD.get_by_id(
            self.db,
            profile.user_id,
        )

        if user is None:

            raise HTTPException(
                status_code=404,
                detail="User not found.",
            )

        if user.is_blocked:

            raise HTTPException(
                status_code=409,
                detail="Worker account is already blocked.",
            )

        WorkerCRUD.block_worker(
            self.db,
            user=user,
            blocked_by=current_user.id,
            block_type=block_type,
            reason=reason,
        )

        self.db.commit()

        try:

            NotificationService().send_account_blocked(
                user_name=user.name,
                user_email=user.email,
                block_type=block_type.value,
                reason=reason,
            )

        except Exception as e:

            print(
                f"Failed to send worker blocked email: {e}"
            )

        return {
            "message": "Worker blocked successfully."
        }


    def unblock_worker(
        self,
        *,
        worker_id: int,
        current_user: User,
    ):

        profile = WorkerCRUD.get_worker_by_id(
            self.db,
            worker_id,
        )

        if profile is None:

            raise HTTPException(
                status_code=404,
                detail="Worker not found.",
            )

        if (
            current_user.role == UserRole.DEPARTMENT_ADMIN
            and current_user.department_id
            != profile.department_id
        ):

            raise HTTPException(
                status_code=403,
                detail=(
                    "You can only unblock workers "
                    "from your own department."
                ),
            )

        user = UserCRUD.get_by_id(
            self.db,
            profile.user_id,
        )

        if user is None:

            raise HTTPException(
                status_code=404,
                detail="User not found.",
            )

        if not user.is_blocked:

            raise HTTPException(
                status_code=409,
                detail="Worker account is already active.",
            )

        WorkerCRUD.unblock_worker(
            self.db,
            user=user,
        )

        self.db.commit()

        try:

            NotificationService().send_account_unblocked(
                user_name=user.name,
                user_email=user.email,
            )

        except Exception as e:

            print(
                f"Failed to send worker unblocked email: {e}"
            )

        return {
            "message": "Worker unblocked successfully."
        }