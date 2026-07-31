from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.base import Base
from database.enums import (
    Priority,
    ReportStatus,
    VerificationDecision,
)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    report_number = Column(
        String(30),
        unique=True,
        nullable=False,
        index=True,
    )

    citizen_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=False,
        index=True,
    )

    issue_type = Column(
        String(100),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    latitude = Column(
        Float,
        nullable=False,
    )

    longitude = Column(
        Float,
        nullable=False,
    )

    address = Column(
        String(255),
        nullable=True,
    )

    risk_score = Column(
        Float,
        nullable=False,
    )

    forward_count = Column(
        Integer,
        nullable=False,
        default=0,
    )

    ai_confidence = Column(
        Float,
        nullable=False,
    )

    verification_decision = Column(
        Enum(VerificationDecision),
        nullable=False,
    )

    verification_passed = Column(
        Boolean,
        nullable=False,
    )

    priority = Column(
        Enum(Priority),
        nullable=False,
        default=Priority.MEDIUM,
        index=True,
    )

    status = Column(
        Enum(ReportStatus),
        nullable=False,
        default=ReportStatus.PENDING,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    support_count = Column(
        Integer,
        nullable=False,
        default=0,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # ==========================
    # Relationships
    # ==========================

    citizen = relationship(
        "User",
        back_populates="reports",
    )

    department = relationship(
        "Department",
        back_populates="reports",
    )

    images = relationship(
        "ReportImage",
        back_populates="report",
        cascade="all, delete-orphan",
    )

    assignments = relationship(
        "Assignment",
        back_populates="report",
        cascade="all, delete-orphan",
    )

    resolution = relationship(
        "Resolution",
        back_populates="report",
        uselist=False,
        cascade="all, delete-orphan",
    )

    audit_logs = relationship(
        "AuditLog",
        back_populates="report",
        cascade="all, delete-orphan",
    )
    detections = relationship(
        "ReportDetection",
        back_populates="report",
        cascade="all, delete-orphan",
    )
    resolution_ai = relationship(
        "ResolutionAIResult",
        back_populates="report",
        uselist=False,
        cascade="all, delete-orphan",
    )
    supports = relationship(
        "ReportSupport",
        back_populates="report",
        cascade="all, delete-orphan",
    )
    system_issues = relationship(
        "SystemIssue",
        back_populates="related_report",
    )
    forward_histories = relationship(
        "ReportForwardHistory",
        back_populates="report",
        cascade="all, delete-orphan",
    )