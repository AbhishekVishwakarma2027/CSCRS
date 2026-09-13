from sqlalchemy.orm import Session

from database.crud.admin import AdminCRUD
from database.crud.user import UserCRUD

from database.enums import UserRole

from database.models.user import User

from services.worker_invitation import WorkerInvitationService
from services.notification_service import NotificationService

from configs.config import FRONTEND_BASE_URL
from authentication.security import hash_password


class AdminService:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

    def create_department_admin(
        self,
        data,
    ):

        department = AdminCRUD.get_department_by_id(
            self.db,
            data.department_id,
        )

        if department is None:

            raise ValueError(
                "Department not found."
            )

        existing_user = AdminCRUD.get_user_by_email(
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
            role=UserRole.DEPARTMENT_ADMIN,
        )
        user.department_id=data.department_id

        AdminCRUD.create_department_admin(
            self.db,
            user,
        )

        token, invitation = WorkerInvitationService.create_invitation(
            self.db,
            user.id,
        )

        activation_link = (
            f"{FRONTEND_BASE_URL}/admins/activate?token={token}"
        )

        try:

            NotificationService().send_department_admin_invitation(
                admin_name=user.name,
                admin_email=user.email,
                department_name=department.name,
                activation_link=activation_link,
            )

            # EmailService().send_email(
            #     to_email=user.email,
            #     subject="Activate your CSCRS Department Admin Account",
            #     body=(
            #         f"Hello {user.name},\n\n"
            #         "You have been invited as a Department Admin in the "
            #         "Crowdsourced Civic Issue Reporting & Resolution System.\n\n"
            #         "Please activate your account using the link below:\n\n"
            #         f"{activation_link}\n\n"
            #         "This link is valid for 24 hours."
            #     ),
            # )

        except Exception as e:

            self.db.rollback()

            raise ValueError(
                f"Invitation email failed: {e}"
            )

        self.db.commit()

        self.db.refresh(user)

        return user
    def activate_department_admin(
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
                "Department Admin not found."
            )

        user.password_hash = hash_password(password)

        user.is_active = True

        user.is_email_verified = True

        invitation.used = True

        self.db.commit()

        NotificationService().send_account_activation_success(
            user_name=user.name,
            user_email=user.email,
            role_name="Department Administrator",
        )

        return {
            "message": "Department Admin account activated successfully."
        }
    def get_workers(
        self,
        *,
        current_user: User,
    ):

        if current_user.department_id is None:

            raise ValueError(
                "Department Admin is not assigned to a department."
            )

        return AdminCRUD.get_workers_by_department(
            self.db,
            current_user.department_id,
        )