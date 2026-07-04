from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.base import Base


class Resolution(Base):
    __tablename__ = "resolutions"

    id = Column(Integer, primary_key=True, index=True)

    report_id = Column(
        Integer,
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    worker_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    remarks = Column(
        Text,
        nullable=True,
    )

    verification_passed = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    resolved_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    report = relationship(
        "Report",
        back_populates="resolution",
    )

    worker = relationship(
        "User",
        foreign_keys=[worker_id],
    )