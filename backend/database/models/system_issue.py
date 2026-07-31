from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Enum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.base import Base
from database.enums import (
    SystemIssueStatus,
    SystemIssueCategory,
)

class SystemIssue(Base):
    __tablename__ = "system_issues"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    issue_number = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    reporter_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    related_report_id = Column(
        Integer,
        ForeignKey(
            "reports.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    title = Column(
        String(200),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=False,
    )
    category = Column(

        Enum(SystemIssueCategory),

        nullable=False,

        default=SystemIssueCategory.OTHER,

        index=True,
    )
    
    status = Column(
        Enum(SystemIssueStatus),
        nullable=False,
        default=SystemIssueStatus.OPEN,
        index=True,
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

    reporter = relationship(
        "User",
        back_populates="system_issues",
    )

    related_report = relationship(
        "Report",
        back_populates="system_issues",
    )

    attachments = relationship(
        "SystemIssueAttachment",
        back_populates="issue",
        cascade="all, delete-orphan",
    )
    closed_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    remarks = Column(
        Text,
        nullable=True,
    )