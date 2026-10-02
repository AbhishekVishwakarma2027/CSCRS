from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database.dependencies import get_db
from schemas.public_dashboard import (
    PublicOverviewResponse,
    StateDashboardResponse,
)
from schemas.public_update import (
    PublicUpdateResponse,
    PaginatedPublicUpdatesResponse,
)
from services.public_dashboard_service import PublicDashboardService
from services.public_update_service import PublicUpdateService

router = APIRouter(
    prefix="/public",
    tags=["Public"],
)

THUMBNAIL_DIR = Path("uploads/public_updates")


@router.get(
    "/overview",
    response_model=PublicOverviewResponse,
    summary="Get Public Overview Platform Metrics",
)
def get_public_overview(db: Session = Depends(get_db)):
    service = PublicDashboardService(db)
    return service.get_public_overview()


@router.get(
    "/state-dashboard",
    response_model=StateDashboardResponse,
    summary="Get Public State & District Analytics",
)
def get_state_dashboard(
    state: str = Query("Uttar Pradesh", description="State name for geographic resolution"),
    db: Session = Depends(get_db),
):
    service = PublicDashboardService(db)
    return service.get_state_dashboard(state)


@router.get(
    "/updates",
    response_model=PaginatedPublicUpdatesResponse,
    summary="Get Published News & Press Updates",
)
def get_published_updates(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    category: str | None = None,
    db: Session = Depends(get_db),
):
    service = PublicUpdateService(db)
    return service.get_published_updates(page=page, page_size=page_size, category=category)


@router.get(
    "/updates/{slug}",
    response_model=PublicUpdateResponse,
    summary="Get Published News & Press Update Detail by Slug",
)
def get_published_update_by_slug(
    slug: str,
    db: Session = Depends(get_db),
):
    service = PublicUpdateService(db)
    res = service.get_published_update_by_slug(slug)
    if not res:
        raise HTTPException(status_code=404, detail="Public update not found.")
    return res


@router.get(
    "/updates/images/{filename}",
    summary="Serve Public News & Press Thumbnail Image",
)
def get_update_thumbnail(filename: str):
    from fastapi.responses import StreamingResponse
    from storage.media_service import get_media_service

    media_service = get_media_service()

    # 1. Dual-read: Check in active storage provider (OCI or Local)
    candidate_key = f"{media_service.prefix}/public-updates/thumbnails/{filename}"
    if media_service.provider.exists(candidate_key):
        stream_res = media_service.get_stream(candidate_key)
        if stream_res:
            stream, content_type, length = stream_res
            headers = {"Content-Disposition": f'inline; filename="{filename}"'}
            if length:
                headers["Content-Length"] = str(length)
            return StreamingResponse(
                stream,
                media_type=content_type or "image/webp",
                headers=headers,
            )

    # 2. Dual-read fallback: check local filesystem
    file_path = THUMBNAIL_DIR / filename
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)

    raise HTTPException(status_code=404, detail="Thumbnail image not found.")
