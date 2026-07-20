from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from database.crud.user import UserCRUD
from pathlib import Path
from database.enums import UserRole
from database.crud.worker import WorkerCRUD
from database.crud.department import DepartmentCRUD
from fastapi import (
    HTTPException,
    UploadFile,
    status,
)
from configs.config import APP_BASE_URL

from utils.file_utils import (
    save_uploaded_file,
    safe_delete_file,
)


class ProfileService:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db

    def get_my_profile(
        self,
        current_user,
    ):

        profile_image = getattr(
            current_user,
            "profile_image",
            None,
        )

        profile_image_url = None

        if profile_image:

            normalized_path = profile_image.replace(
                "\\",
                "/",
            )

            profile_image_url = (
                f"{APP_BASE_URL.rstrip('/')}/{normalized_path}"
            )

        profile_data = {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "phone": current_user.phone,
            "role": current_user.role,
            "profile_image": profile_image_url,
            "is_email_verified": current_user.is_email_verified,
            "is_active": current_user.is_active,
            "department_id": None,
            "department_name": None,
            "employee_code": None,
            "designation": None,
            "phone_extension": None,
            "joined_at": None,
            "is_available": None,
        }

        # Worker
        if current_user.role == UserRole.WORKER:

            worker = WorkerCRUD.get_worker_profile(
                self.db,
                current_user.id,
            )

            if worker:

                department = DepartmentCRUD.get_by_id(
                    self.db,
                    worker.department_id,
                )

                profile_data.update(
                    {
                        "department_id": worker.department_id,
                        "department_name": (
                            department.name
                            if department
                            else None
                        ),
                        "employee_code": worker.employee_code,
                        "designation": worker.designation,
                        "phone_extension": worker.phone_extension,
                        "joined_at": worker.joined_at,
                        "is_available": worker.is_available,
                    }
                )

        # Department Admin
        elif current_user.role == UserRole.DEPARTMENT_ADMIN:

            if current_user.department_id:

                department = DepartmentCRUD.get_by_id(
                    self.db,
                    current_user.department_id,
                )

                profile_data.update(
                    {
                        "department_id": current_user.department_id,
                        "department_name": (
                            department.name
                            if department
                            else None
                        ),
                        "designation": "Department Administrator",
                    }
                )

        # City Admin
        elif current_user.role == UserRole.CITY_ADMIN:

            profile_data.update(
                {
                    "designation": "City Administrator",
                }
            )

        return profile_data

    def update_profile(
        self,
        current_user,
        name: str | None,
        phone: str | None,
    ):

        if name is not None:
            current_user.name = name

        if phone is not None:

            existing_user = UserCRUD.get_by_phone(
                self.db,
                phone,
            )

            if (
                existing_user
                and existing_user.id != current_user.id
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Phone number already registered.",
                )

            current_user.phone = phone

        self.db.add(current_user)

        self.db.commit()

        self.db.refresh(current_user)

        return {
            "message": "Profile updated successfully."
        }
    def upload_profile_photo(
        self,
        current_user,
        photo: UploadFile,
    ):

        allowed_extensions = {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
        }

        extension = (
            Path(photo.filename)
            .suffix
            .lower()
        )

        if extension not in allowed_extensions:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only JPG, JPEG, PNG and WEBP images are allowed.",
            )

        photo.file.seek(
            0,
            2,
        )

        size = photo.file.tell()

        photo.file.seek(0)

        if size > 5 * 1024 * 1024:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum image size is 5 MB.",
            )

        uploaded = save_uploaded_file(
            photo,
            folder="profile",
        )

        old_profile_image = current_user.profile_image

        current_user.profile_image = uploaded[
            "image_path"
        ]

        self.db.add(
            current_user,
        )

        self.db.commit()

        self.db.refresh(
            current_user,
        )

        if old_profile_image:

            safe_delete_file(
                old_profile_image,
            )

        normalized_path = current_user.profile_image.replace(
            "\\",
            "/",
        )

        profile_image_url = (
            f"{APP_BASE_URL.rstrip('/')}/{normalized_path}"
        )

        profile_image_url = (
            f"{APP_BASE_URL.rstrip('/')}/{normalized_path}"
        )

        return {
            "message": "Profile photo uploaded successfully.",
            "profile_image": profile_image_url,
        }
    
    def delete_profile_photo(
        self,
        current_user,
    ):

        if not current_user.profile_image:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile photo not found.",
            )

        safe_delete_file(
            current_user.profile_image,
        )

        current_user.profile_image = None

        self.db.add(
            current_user,
        )

        self.db.commit()

        self.db.refresh(
            current_user,
        )

        return {
            "message": "Profile photo deleted successfully.",
        }