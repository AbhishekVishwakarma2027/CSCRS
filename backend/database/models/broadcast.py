from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from database.base import Base


class Broadcast(Base):

    __tablename__ = "broadcasts"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    broadcast_id = Column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    title = Column(
        String(150),
        nullable=False,
    )

    message = Column(
        Text,
        nullable=False,
    )

    target_role = Column(
        String(30),
        nullable=False,
        default="ALL",
    )

    announcement_type = Column(
        String(30),
        nullable=False,
        default="INFORMATIONAL",
    )

    starts_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    ends_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    recipient_count = Column(
        Integer,
        nullable=False,
        default=0,
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    creator = relationship(
        "User",
        foreign_keys=[created_by],
        lazy="joined",
    )
