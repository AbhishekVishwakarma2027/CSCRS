from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from authentication.dependencies import get_current_user, require_super_admin
from database.dependencies import get_db
from database.models.user import User
from schemas.super_admin import (
    AnnouncementRequest,
    AnnouncementResponse,
    AnnouncementItemResponse,
)
from services.super_admin_service import SuperAdminService
import database.crud.broadcast as broadcast_crud

super_admin_router = APIRouter(
    prefix="/super-admin/announcements",
    tags=["Super Admin Announcements"],
)

user_router = APIRouter(
    prefix="/announcements",
    tags=["Announcements"],
)

router = user_router


@super_admin_router.post(
    "",
    response_model=AnnouncementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Broadcast System Announcement",
)
def broadcast_announcement(
    request: AnnouncementRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin()),
):
    service = SuperAdminService(db)
    try:
        return service.broadcast_announcement(
            title=request.title,
            message=request.message,
            target_role=request.target_role,
            announcement_type=request.announcement_type,
            starts_at=request.starts_at,
            ends_at=request.ends_at,
            created_by=current_user.id,
        )
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@super_admin_router.get(
    "",
    response_model=list[AnnouncementItemResponse],
    summary="Get System Announcements Lifecycle Summary",
)
def get_announcements(
    lifecycle_state: str = Query("ALL", alias="lifecycle_state"),
    status: str | None = Query(None, alias="status"),
    announcement_type: str = Query("ALL", alias="announcement_type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin()),
):
    service = SuperAdminService(db)
    filter_state = status if status is not None else lifecycle_state
    return service.get_announcements(
        lifecycle_state=filter_state,
        announcement_type=announcement_type,
    )


@super_admin_router.patch(
    "/{broadcast_id}/end",
    summary="End Active System Announcement",
)
def end_announcement(
    broadcast_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin()),
):
    service = SuperAdminService(db)
    try:
        return service.end_announcement(broadcast_id)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))


@super_admin_router.delete(
    "/{broadcast_id}",
    summary="Delete Scheduled System Announcement",
)
def delete_announcement(
    broadcast_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_admin()),
):
    service = SuperAdminService(db)
    try:
        return service.delete_announcement(broadcast_id)
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))


@user_router.get(
    "/active",
    response_model=list[AnnouncementItemResponse],
    summary="Get Active System Announcements For Current User",
)
def get_active_announcements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_role_str = (
        current_user.role.name
        if hasattr(current_user.role, "name")
        else str(current_user.role)
    )
    active_broadcasts = broadcast_crud.get_active_broadcasts(
        db, user_role=user_role_str
    )

    results = []
    for b in active_broadcasts:
        lifecycle_state = broadcast_crud.compute_derived_lifecycle_state(b)
        results.append(
            AnnouncementItemResponse(
                broadcast_id=b.broadcast_id,
                title=b.title,
                message=b.message,
                target_role=b.target_role,
                announcement_type=b.announcement_type,
                starts_at=b.starts_at,
                ends_at=b.ends_at,
                created_at=b.created_at,
                recipient_count=b.recipient_count,
                lifecycle_state=lifecycle_state,
                created_by=b.created_by,
            )
        )

    return results
