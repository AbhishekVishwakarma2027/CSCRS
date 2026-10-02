from pathlib import Path
import shutil
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from authentication.dependencies import require_super_admin
from database.dependencies import get_db
from database.models.user import User
from schemas.public_update import (
    PublicUpdateCreateRequest,
    PublicUpdateUpdateRequest,
    PublicUpdateResponse,
    PaginatedPublicUpdatesResponse,
)
from services.public_update_service import PublicUpdateService
from utils.file_utils import generate_filename, validate_uploaded_file
from configs.config import MAX_FILE_SIZE

router = APIRouter(
    prefix="/super-admin/updates",
    tags=["Super Admin Public Updates Management"],
)

THUMBNAIL_DIR = Path("uploads/public_updates")
THUMBNAIL_DIR.mkdir(parents=True, exist_ok=True)


@router.get("", response_model=PaginatedPublicUpdatesResponse)
def get_all_updates_admin(
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    service = PublicUpdateService(db)
    return service.get_all_updates_admin(page=page, page_size=page_size)


@router.post("", response_model=PublicUpdateResponse)
def create_update(
    req: PublicUpdateCreateRequest,
    current_user: User = Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    service = PublicUpdateService(db)
    return service.create_update(created_by_id=current_user.id, req=req)


@router.put("/{update_id}", response_model=PublicUpdateResponse)
def update_update(
    update_id: int,
    req: PublicUpdateUpdateRequest,
    current_user: User = Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    service = PublicUpdateService(db)
    res = service.update_update(update_id=update_id, req=req)
    if not res:
        raise HTTPException(status_code=404, detail="Public update not found.")
    return res


@router.post("/{update_id}/publish", response_model=PublicUpdateResponse)
def toggle_publish_update(
    update_id: int,
    is_published: bool,
    current_user: User = Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    service = PublicUpdateService(db)
    res = service.toggle_publish(update_id=update_id, is_published=is_published)
    if not res:
        raise HTTPException(status_code=404, detail="Public update not found.")
    return res


@router.delete("/{update_id}")
def delete_update(
    update_id: int,
    current_user: User = Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    service = PublicUpdateService(db)
    success = service.delete_update(update_id=update_id)
    if not success:
        raise HTTPException(status_code=404, detail="Public update not found.")
    return {"success": True, "message": "Public update deleted successfully."}


@router.post("/upload-thumbnail")
def upload_thumbnail(
    file: UploadFile = File(...),
    current_user: User = Depends(require_super_admin()),
):
    import uuid
    import tempfile
    from storage.media_service import get_media_service

    file_size = validate_uploaded_file(
        file=file,
        allowed_extensions={".jpg", ".jpeg", ".png", ".webp"},
        allowed_content_types={"image/jpeg", "image/png", "image/webp"},
        max_size=MAX_FILE_SIZE,
    )

    media_service = get_media_service()
    temp_files_to_clean = []
    try:
        ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as raw_temp:
            raw_temp_path = Path(raw_temp.name)
            temp_files_to_clean.append(raw_temp_path)
            shutil.copyfileobj(file.file, raw_temp)
        file.file.seek(0)

        # Canonicalize to WebP (handles orientation, max dimension, and quality)
        canonical_path, _, _ = media_service.process_canonical_image(
            raw_temp_path,
            output_ext="webp",
        )
        temp_files_to_clean.append(canonical_path)

        random_id = uuid.uuid4().hex
        stored_filename = f"{random_id}.webp"
        object_key = f"{media_service.prefix}/public-updates/thumbnails/{stored_filename}"

        media_service.upload_file(
            local_path=canonical_path,
            object_key=object_key,
            content_type="image/webp",
        )

        return {
            "success": True,
            "filename": stored_filename,
            "thumbnail_url": f"/api/v1/public/updates/images/{stored_filename}",
            "object_key": object_key,
        }
    finally:
        for p in temp_files_to_clean:
            try:
                if p.exists():
                    p.unlink()
            except Exception:
                pass

