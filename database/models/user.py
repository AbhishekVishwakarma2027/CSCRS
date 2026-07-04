from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy import Enum
from database.enums import UserRole
from database.base import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False)

    email = Column(String(255), unique=True, nullable=False, index=True)

    phone = Column(String(20), unique=True, nullable=True)

    password_hash = Column(String(255), nullable=False)

    role = Column(
        Enum(UserRole),
        nullable=False,
        default=UserRole.CITIZEN,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    reports = relationship("Report", back_populates="citizen")

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