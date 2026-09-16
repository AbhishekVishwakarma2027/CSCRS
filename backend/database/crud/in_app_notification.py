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
    starts_at: datetime | None = None,
    ends_at: datetime | None = None,
    announcement_type: str | None = None,
    broadcast_id: str | None = None,
):

    notification = InAppNotification(
        user_id=user_id,
        report_id=report_id,
        title=title,
        message=message,
        type=notification_type,
        starts_at=starts_at,
        ends_at=ends_at,
        announcement_type=announcement_type,
        broadcast_id=broadcast_id,
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


def get_announcements_summary(db: Session):
    """
    Groups system announcements by broadcast_id (or title/created_at if legacy)
    and computes recipient count, timestamps, and derived lifecycle state.
    """
    rows = (
        db.query(
            InAppNotification.broadcast_id,
            InAppNotification.title,
            InAppNotification.message,
            InAppNotification.announcement_type,
            InAppNotification.starts_at,
            InAppNotification.ends_at,
            func.min(InAppNotification.created_at).label('created_at'),
            func.count(InAppNotification.id).label('recipient_count'),
        )
        .filter(InAppNotification.type == 'SYSTEM_ANNOUNCEMENT')
        .group_by(
            InAppNotification.broadcast_id,
            InAppNotification.title,
            InAppNotification.message,
            InAppNotification.announcement_type,
            InAppNotification.starts_at,
            InAppNotification.ends_at,
        )
        .order_by(func.min(InAppNotification.created_at).desc())
        .all()
    )

    now = datetime.now(timezone.utc)
    results = []

    for r in rows:
        # Determine derived lifecycle state
        starts_at = r.starts_at
        ends_at = r.ends_at

        if starts_at and now < starts_at:
            lifecycle_state = 'SCHEDULED'
        elif ends_at and now >= ends_at:
            lifecycle_state = 'EXPIRED'
        else:
            lifecycle_state = 'ACTIVE'

        b_id = r.broadcast_id or f"legacy_{hash(r.title + str(r.created_at))}"

        results.append(
            {
                'broadcast_id': b_id,
                'title': r.title,
                'message': r.message,
                'announcement_type': r.announcement_type or 'INFORMATIONAL',
                'starts_at': starts_at,
                'ends_at': ends_at,
                'created_at': r.created_at,
                'recipient_count': r.recipient_count,
                'lifecycle_state': lifecycle_state,
            }
        )

    return results


def end_announcement(db: Session, broadcast_id: str) -> int:
    """
    Sets ends_at = now() for all notification rows matching the given broadcast_id.
    Effectively transitions the announcement to EXPIRED immediately for all recipients.
    """
    now = datetime.now(timezone.utc)
    count = (
        db.query(InAppNotification)
        .filter(
            InAppNotification.type == 'SYSTEM_ANNOUNCEMENT',
            InAppNotification.broadcast_id == broadcast_id,
        )
        .update({InAppNotification.ends_at: now}, synchronize_session=False)
    )
    db.commit()
    return count