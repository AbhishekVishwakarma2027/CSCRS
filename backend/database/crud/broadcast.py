from datetime import datetime, timezone
import uuid
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from database.models.broadcast import Broadcast


def create_broadcast(
    db: Session,
    *,
    title: str,
    message: str,
    target_role: str = "ALL",
    announcement_type: str = "INFORMATIONAL",
    starts_at: datetime | None = None,
    ends_at: datetime | None = None,
    recipient_count: int = 0,
    created_by: int | None = None,
) -> Broadcast:
    broadcast_id = f"bcast_{uuid.uuid4().hex[:12]}"

    broadcast = Broadcast(
        broadcast_id=broadcast_id,
        title=title,
        message=message,
        target_role=target_role,
        announcement_type=announcement_type,
        starts_at=starts_at,
        ends_at=ends_at,
        recipient_count=recipient_count,
        created_by=created_by,
    )

    db.add(broadcast)
    db.commit()
    db.refresh(broadcast)

    return broadcast


def get_all_broadcasts(
    db: Session,
    lifecycle_state: str = "ALL",
    announcement_type: str = "ALL",
) -> list[Broadcast]:
    now = datetime.now(timezone.utc)
    query = db.query(Broadcast)

    state_upper = (lifecycle_state or "ALL").upper()
    if state_upper == "SCHEDULED":
        query = query.filter(
            Broadcast.starts_at.isnot(None),
            Broadcast.starts_at > now,
        )
    elif state_upper == "EXPIRED":
        query = query.filter(
            or_(Broadcast.starts_at.is_(None), Broadcast.starts_at <= now),
            Broadcast.ends_at.isnot(None),
            Broadcast.ends_at <= now,
        )
    elif state_upper == "ACTIVE":
        query = query.filter(
            or_(Broadcast.starts_at.is_(None), Broadcast.starts_at <= now),
            or_(Broadcast.ends_at.is_(None), Broadcast.ends_at > now),
        )

    type_upper = (announcement_type or "ALL").upper()
    if type_upper != "ALL":
        query = query.filter(
            func.upper(Broadcast.announcement_type) == type_upper
        )

    return query.order_by(Broadcast.created_at.desc()).all()


def get_broadcast_by_broadcast_id(db: Session, broadcast_id: str) -> Broadcast | None:
    return (
        db.query(Broadcast)
        .filter(Broadcast.broadcast_id == broadcast_id)
        .first()
    )


def end_broadcast(db: Session, broadcast_id: str) -> Broadcast | None:
    broadcast = get_broadcast_by_broadcast_id(db, broadcast_id)
    if not broadcast:
        return None

    now = datetime.now(timezone.utc)
    broadcast.ends_at = now
    db.commit()
    db.refresh(broadcast)

    return broadcast


def delete_broadcast(db: Session, broadcast_id: str) -> Broadcast | None:
    broadcast = get_broadcast_by_broadcast_id(db, broadcast_id)
    if not broadcast:
        return None

    db.delete(broadcast)
    db.commit()

    return broadcast


def get_active_broadcasts(db: Session, user_role: str | None = None) -> list[Broadcast]:
    now = datetime.now(timezone.utc)

    query = db.query(Broadcast).filter(
        or_(Broadcast.starts_at.is_(None), Broadcast.starts_at <= now),
        or_(Broadcast.ends_at.is_(None), Broadcast.ends_at > now),
    )

    if user_role:
        query = query.filter(
            or_(
                Broadcast.target_role == "ALL",
                Broadcast.target_role == user_role,
                func.upper(Broadcast.target_role) == user_role.upper(),
            )
        )

    return query.order_by(Broadcast.created_at.desc()).all()


def compute_derived_lifecycle_state(broadcast: Broadcast) -> str:
    now = datetime.now(timezone.utc)

    starts_at = broadcast.starts_at
    if starts_at and starts_at.tzinfo is None:
        starts_at = starts_at.replace(tzinfo=timezone.utc)

    ends_at = broadcast.ends_at
    if ends_at and ends_at.tzinfo is None:
        ends_at = ends_at.replace(tzinfo=timezone.utc)

    if starts_at and now < starts_at:
        return "SCHEDULED"
    elif ends_at and now >= ends_at:
        return "EXPIRED"
    else:
        return "ACTIVE"
