from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from authentication.dependencies import get_current_user
from database.dependencies import get_db
from database.models.user import User
from schemas.super_admin import AnnouncementItemResponse
import database.crud.broadcast as broadcast_crud

router = APIRouter(
    tags=["Announcements"],
)


@router.get(
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
