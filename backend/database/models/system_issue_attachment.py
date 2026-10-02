from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.base import Base


class SystemIssueAttachment(Base):
    __tablename__ = "system_issue_attachments"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    issue_id = Column(
        Integer,
        ForeignKey(
            "system_issues.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    issue = relationship(
        "SystemIssue",
        back_populates="attachments",
    )

    original_filename = Column(
        String(255),
        nullable=False,
    )

    stored_filename = Column(
        String(255),
        nullable=False,
    )

    file_path = Column(
        String(500),
        nullable=False,
    )

    object_key = Column(
        String(500),
        nullable=True,
        index=True,
    )

    storage_provider = Column(
        String(50),
        nullable=False,
        default="local",
    )

    sha256 = Column(
        String(64),
        nullable=True,
    )

    mime_type = Column(
        String(100),
        nullable=False,
    )

    file_size = Column(
        Integer,
        nullable=False,
    )