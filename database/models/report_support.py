from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.base import Base


class ReportSupport(Base):
    __tablename__ = "report_supports"

    __table_args__ = (
        UniqueConstraint(
            "report_id",
            "citizen_id",
            name="uq_report_support",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    report_id = Column(
        Integer,
        ForeignKey("reports.id",
                   ondelete="CASCADE"), #THIS IS NOT IMPLEMENTED BECAUSE MIGRATION IS NOT DONE YET IN V1 CORRECTION
        nullable=False,
    )

    citizen_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    report = relationship(
        "Report",
        back_populates="supports",
    )

    citizen = relationship(
        "User",
        back_populates="supported_reports",
    )