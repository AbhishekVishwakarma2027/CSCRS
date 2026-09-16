import hashlib
from datetime import datetime, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session

from database.models.in_app_notification import InAppNotification


def create_notification(
    db: Session,
    *,
    user_id: int,
    report_id: int | None,
    title: str,
    message: str,
    notification_type: str,
):

    notification = InAppNotification(
        user_id=user_id,
        report_id=report_id,
        title=title,
        message=message,
        type=notification_type,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


def get_user_notifications(
    db: Session,
    *,
    user_id: int,
):

    return (
        db.query(InAppNotification)
        .filter(
            InAppNotification.user_id == user_id,
        )
        .order_by(
            InAppNotification.created_at.desc(),
        )
        .all()
    )


def get_unread_count(
    db: Session,
    *,
    user_id: int,
):

    return (
        db.query(InAppNotification)
        .filter(
            InAppNotification.user_id == user_id,
            InAppNotification.is_read.is_(False),
        )
        .count()
    )


def mark_as_read(
    db: Session,
    *,
    notification_id: int,
    user_id: int,
):

    notification = (
        db.query(InAppNotification)
        .filter(
            InAppNotification.id == notification_id,
            InAppNotification.user_id == user_id,
        )
        .first()
    )

    if notification is None:
        return None

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification


def mark_all_as_read(
    db: Session,
    *,
    user_id: int,
):

    notifications = (
        db.query(InAppNotification)
        .filter(
            InAppNotification.user_id == user_id,
            InAppNotification.is_read.is_(False),
        )
        .all()
    )

    for notification in notifications:
        notification.is_read = True

    db.commit()

    return len(notifications)

