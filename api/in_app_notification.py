from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from authentication.dependencies import get_current_user
from database.dependencies import get_db
from database.models.user import User

from schemas.in_app_notification import (
    NotificationResponse,
    UnreadNotificationResponse,
)

from services.in_app_notification_service import (
    InAppNotificationService,
)

router = APIRouter(
    prefix="/notifications",
    tags=["In-App Notifications"],
)


@router.get(
    "",
    response_model=list[NotificationResponse],
)
def get_notifications(
    current_user: User = Depends(
        get_current_user,
    ),
    db: Session = Depends(
        get_db,
    ),
):

    return InAppNotificationService(
        db,
    ).get_notifications(
        user_id=current_user.id,
    )


@router.get(
    "/unread-count",
    response_model=UnreadNotificationResponse,
)
def unread_count(
    current_user: User = Depends(
        get_current_user,
    ),
    db: Session = Depends(
        get_db,
    ),
):

    return {
        "unread_count":
        InAppNotificationService(
            db,
        ).get_unread_count(
            user_id=current_user.id,
        )
    }


@router.patch(
    "/{notification_id}/read",
)
def mark_as_read(
    notification_id: int,
    current_user: User = Depends(
        get_current_user,
    ),
    db: Session = Depends(
        get_db,
    ),
):

    notification = (
        InAppNotificationService(
            db,
        ).mark_as_read(
            notification_id=notification_id,
            user_id=current_user.id,
        )
    )

    if notification is None:

        raise HTTPException(
            status_code=404,
            detail="Notification not found.",
        )

    return {
        "success": True,
        "message": "Notification marked as read.",
    }


@router.patch(
    "/read-all",
)
def mark_all_read(
    current_user: User = Depends(
        get_current_user,
    ),
    db: Session = Depends(
        get_db,
    ),
):

    count = (
        InAppNotificationService(
            db,
        ).mark_all_as_read(
            user_id=current_user.id,
        )
    )

    return {
        "success": True,
        "updated": count,
    }