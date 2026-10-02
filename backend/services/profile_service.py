from fastapi import HTTPException, status
import os
from pathlib import Path
from sqlalchemy.orm import Session
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
    validate_uploaded_file,
)
from storage import get_media_service


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
            "profile_image_object_key",
            None,
        ) or getattr(
            current_user,
            "profile_image",
            None,
        )

        profile_image_url = None

        if profile_image:
            from storage import get_media_service
            media_service = get_media_service()
            if media_service.is_cloud_object(profile_image, getattr(current_user, "profile_image_storage_provider", None)):
                profile_image_url = f"{APP_BASE_URL.rstrip('/')}/api/v1/profile/{current_user.id}/photo"
            else:
                normalized_path = profile_image.replace(
                    "\\",
                    "/",
                ).lstrip("/")
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
            "joined_at": current_user.created_at,
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

        validate_uploaded_file(
            file=photo,
            allowed_extensions={
                ".jpg",
                ".jpeg",
                ".png",
                ".webp",
            },
            allowed_content_types={
                "image/jpeg",
                "image/png",
                "image/webp",
            },
            max_size=5 * 1024 * 1024,
        )

        import shutil
        import tempfile
        from fastapi.responses import StreamingResponse

        media_service = get_media_service()

        # Spool uploaded photo to temporary file
        fd, temp_spool_str = tempfile.mkstemp(suffix=Path(photo.filename).suffix, prefix="profile_upload_")
        os.close(fd)
        temp_spool = Path(temp_spool_str)
        canonical_temp = temp_spool.with_suffix(".canonical.webp")
        profile_key = None

        try:
            with open(temp_spool, "wb") as buffer:
                photo.file.seek(0)
                shutil.copyfileobj(photo.file, buffer)

            media_service.process_canonical_image(
                temp_spool, canonical_temp, preserve_transparency=True
            )

            profile_key = media_service.build_profile_image_key(current_user.id, "webp")
            upload_meta = media_service.upload_file(canonical_temp, profile_key, "image/webp")

            old_profile_image = getattr(current_user, "profile_image_object_key", None) or current_user.profile_image
            old_provider = getattr(current_user, "profile_image_storage_provider", None)

            current_user.profile_image = profile_key
            current_user.profile_image_object_key = profile_key
            current_user.profile_image_storage_provider = upload_meta["storage_provider"]

            self.db.add(current_user)
            self.db.commit()
            self.db.refresh(current_user)

            # Safely clean up old profile image after successful commit
            if old_profile_image:
                media_service.safe_delete_media(old_profile_image, old_provider)

            profile_image_url = f"{APP_BASE_URL.rstrip('/')}/api/v1/profile/{current_user.id}/photo"

            return {
                "message": "Profile photo uploaded successfully.",
                "profile_image": profile_image_url,
            }

        except Exception:
            self.db.rollback()
            if profile_key:
                media_service.delete_quietly(profile_key)
            raise
        finally:
            safe_delete_file(temp_spool)
            safe_delete_file(canonical_temp)

    def delete_profile_photo(
        self,
        current_user,
    ):
        old_profile_image = getattr(current_user, "profile_image_object_key", None) or current_user.profile_image
        if not old_profile_image:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile photo not found.",
            )

        old_provider = getattr(current_user, "profile_image_storage_provider", None)
        current_user.profile_image = None
        current_user.profile_image_object_key = None

        self.db.add(current_user)
        self.db.commit()
        self.db.refresh(current_user)

        get_media_service().safe_delete_media(old_profile_image, old_provider)

        return {
            "message": "Profile photo deleted successfully.",
        }

    def get_profile_photo_stream(
        self,
        user_id: int,
    ):
        from database.models.user import User
        from fastapi.responses import StreamingResponse

        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        profile_ref = getattr(user, "profile_image_object_key", None) or user.profile_image
        if not profile_ref:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile photo not found.",
            )

        media_service = get_media_service()
        try:
            stream, mime_type, file_size = media_service.get_stream(
                profile_ref, getattr(user, "profile_image_storage_provider", None)
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile photo file not found in storage.",
            )

        headers = {"Content-Length": str(file_size)} if file_size else {}
        return StreamingResponse(
            stream,
            media_type=mime_type or "image/webp",
            headers=headers,
        )