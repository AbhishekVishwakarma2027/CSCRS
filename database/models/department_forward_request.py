from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    Text,
    DateTime,
    Enum,
)

from sqlalchemy.sql import func

from database.base import Base

from database.enums import (
    ForwardRequestStatus,
)
from database.models.department import Department

class DepartmentForwardRequest(Base):

    __tablename__ = "department_forward_requests"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    report_id = Column(
        Integer,
        ForeignKey("reports.id"),
        nullable=False,
        index=True,
    )

    worker_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    current_department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=False,
    )

    destination_department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=True,
    )

    reason = Column(
        Text,
        nullable=False,
    )

    status = Column(
        Enum(ForwardRequestStatus),
        nullable=False,
        default=ForwardRequestStatus.PENDING,
    )

    decision_reason = Column(
        Text,
        nullable=True,
    )

    reviewed_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    reviewed_at = Column(
        DateTime,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )