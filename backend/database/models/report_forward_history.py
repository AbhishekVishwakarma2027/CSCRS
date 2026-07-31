from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.base import Base
from database.enums import ForwardReasonType


class ReportForwardHistory(Base):

    __tablename__ = "report_forward_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    report_id = Column(
        Integer,
        ForeignKey(
            "reports.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    forward_number = Column(
        Integer,
        nullable=False,
    )

    from_department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=False,
    )

    to_department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=False,
    )

    forwarded_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    issue_type = Column(
        String(100),
        nullable=False,
    )

    reason_type = Column(
        Enum(ForwardReasonType),
        nullable=False,
    )

    remarks = Column(
        String(500),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    report = relationship(
        "Report",
        back_populates="forward_histories",
    )

    from_department = relationship(
        "Department",
        foreign_keys=[from_department_id],
    )

    to_department = relationship(
        "Department",
        foreign_keys=[to_department_id],
    )

    forwarded_by_user = relationship(
        "User",
        foreign_keys=[forwarded_by],
    )