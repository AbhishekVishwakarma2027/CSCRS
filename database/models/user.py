from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.sql import func

from database.enums import UserRole
from database.base import Base
from sqlalchemy.orm import relationship
from database.enums import (
    UserRole,
    BlockType,
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False)

    email = Column(String(255), unique=True, nullable=False, index=True)

    phone = Column(String(20), unique=True, nullable=True)

    profile_image = Column(String(500),nullable=True,)

    password_hash = Column(String(255), nullable=False)

    is_active = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    is_email_verified = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    is_blocked = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    blocked_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    blocked_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    block_reason = Column(
        String(500),
        nullable=True,
    )

    block_type = Column(
        String(20),
        nullable=True,
    )

    role = Column(
        Enum(UserRole),
        nullable=False,
        default=UserRole.CITIZEN,
    )
    
    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    reports = relationship("Report", back_populates="citizen")

    department = relationship(
        "Department",
        foreign_keys=[department_id],
    )

    worker_profile = relationship(
        "WorkerProfile",
        back_populates="user",
        uselist=False,
    )

    worker_assignments = relationship(
    "Assignment",
    foreign_keys="Assignment.worker_id",
    )

    admin_assignments = relationship(
        "Assignment",
        foreign_keys="Assignment.assigned_by",
    )

    resolutions = relationship(
        "Resolution",
    )
    email_verifications = relationship(
    "EmailVerification",
    cascade="all, delete-orphan",
    )
    supported_reports = relationship(
        "ReportSupport",
        back_populates="citizen",
        cascade="all, delete-orphan",
    )