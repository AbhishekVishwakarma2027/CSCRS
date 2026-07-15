from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.base import Base


class WorkerProfile(Base):
    __tablename__ = "worker_profiles"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=False,
    )

    employee_code = Column(
        String(30),
        unique=True,
        nullable=False,
    )

    designation = Column(
        String(100),
        nullable=False,
    )

    phone_extension = Column(
        String(20),
        nullable=True,
    )

    is_available = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    joined_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    user = relationship(
        "User",
        back_populates="worker_profile",
    )

    department = relationship(
        "Department",
        back_populates="workers",
    )