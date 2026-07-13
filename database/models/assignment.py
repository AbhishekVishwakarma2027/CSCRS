from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Text,
    Float,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.base import Base
from database.enums import AssignmentStatus


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)

    report_id = Column(
        Integer,
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
    )

    worker_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    assigned_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    assigned_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    accepted_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    completed_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    work_started_at = Column(
    DateTime(timezone=True),
    nullable=True,
    )

    work_started_latitude = Column(
        Float,
        nullable=True,
    )

    work_started_longitude = Column(
        Float,
        nullable=True,
    )

    status = Column(
        Enum(AssignmentStatus),
        nullable=False,
        default=AssignmentStatus.ASSIGNED,
    )

    remarks = Column(
        Text,
        nullable=True,
    )

    report = relationship(
        "Report",
        back_populates="assignments",
    )

    worker = relationship(
        "User",
        foreign_keys=[worker_id],
    )

    admin = relationship(
        "User",
        foreign_keys=[assigned_by],
    )