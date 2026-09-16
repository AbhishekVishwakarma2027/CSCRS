from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)

from database.base import Base
from sqlalchemy.orm import relationship


class InAppNotification(Base):

    __tablename__ = "in_app_notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    report_id = Column(
        Integer,
        ForeignKey("reports.id"),
        nullable=True,
    )

    title = Column(
        String(150),
        nullable=False,
    )

    message = Column(
        Text,
        nullable=False,
    )

    type = Column(
        String(50),
        nullable=False,
    )

    is_read = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    starts_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )
    ends_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )
    announcement_type = Column(
        String(30),
        nullable=True,
    )
    broadcast_id = Column(
        String(50),
        nullable=True,
        index=True,
    )
    user = relationship(
        "User",
        lazy="joined",
    )

    report = relationship(
        "Report",
        lazy="joined",
    )