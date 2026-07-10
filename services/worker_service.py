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


class WorkerService:

    def __init__(self, db: Session):
        self.db = db

    def create_worker(
        self,
        *,
        name: str,
        email: str,
        phone: str | None,
        department_id: int,
        employee_code: str,
        designation: str,
        phone_extension: str | None,
    ) -> WorkerProfile:

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

            self.db.commit()

            self.db.refresh(worker_profile)

            EmailService().send_email(
                to_email=user.email,
                subject="Activate your CSCRS Worker Account",
                body=(
                    f"Hello {user.name},\n\n"
                    "You have been invited to join the "
                    "Crowdsourced Civic Issue Reporting & Resolution System "
                    "as a Worker.\n\n"
                    "Please activate your account using the link below:\n\n"
                    f"{activation_link}\n\n"
                    "This activation link is valid for 24 hours.\n\n"
                    "If you were not expecting this invitation, "
                    "please ignore this email."
                ),
            )

        except Exception as e:

            # TODO:
            # Replace with proper logging in Phase 15.
            print(f"Invitation email failed: {e}")

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

        invitation.used = True

        self.db.commit()

        return {
            "message": "Worker account activated successfully."
        }
    def get_profile(
        self,
        *,
        user_id: int,
    ):

        profile = WorkerCRUD.get_worker_profile(
            self.db,
            user_id,
        )

        if profile is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Worker profile not found.",
            )

        user = UserCRUD.get_by_id(
            self.db,
            user_id,
        )

        if user is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        return {
            "id": profile.id,
            "user_id": profile.user_id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "department_id": profile.department_id,
            "employee_code": profile.employee_code,
            "designation": profile.designation,
            "phone_extension": profile.phone_extension,
            "is_available": profile.is_available,
            "joined_at": profile.joined_at,
        }
    
    def update_profile(
        self,
        *,
        user_id: int,
        phone: str | None,
        phone_extension: str | None,
    ):

        profile = WorkerCRUD.get_worker_profile(
            self.db,
            user_id,
        )

        if profile is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Worker profile not found.",
            )

        user = UserCRUD.get_by_id(
            self.db,
            user_id,
        )

        if user is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        if phone and phone != user.phone:

            existing = UserCRUD.get_by_phone(
                self.db,
                phone,
            )

            if existing:

                raise HTTPException(
                    status_code=400,
                    detail="Phone number already registered.",
                )

            user.phone = phone

        profile.phone_extension = phone_extension

        self.db.commit()

        self.db.refresh(profile)

        return self.get_profile(
            user_id=user_id,
        )
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

        self.db.commit()

        return {
            "message": "Worker activated successfully."
        }