from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Boolean,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.base import Base


class LoginAudit(Base):
    __tablename__ = "login_audits"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    email = Column(
        String(255),
        nullable=False,
    )
    role = Column(
        String(50),
        nullable=True,
    )
    login_success = Column(
        Boolean,
        nullable=False,
    )

    failure_reason = Column(
        Text,
        nullable=True,
    )

    ip_address = Column(
        String(45),
        nullable=True,
    )

    user_agent = Column(
        Text,
        nullable=True,
    )

    browser = Column(
        String(100),
        nullable=True,
    )

    browser_version = Column(
        String(50),
        nullable=True,
    )

    operating_system = Column(
        String(100),
        nullable=True,
    )

    os_version = Column(
        String(50),
        nullable=True,
    )

    device_type = Column(
        String(50),
        nullable=True,
    )

    platform = Column(
        String(100),
        nullable=True,
    )

    city = Column(
        String(100),
        nullable=True,
    )

    state = Column(
        String(100),
        nullable=True,
    )

    country = Column(
        String(100),
        nullable=True,
    )
    request_path = Column(
        String(255),
        nullable=True,
    )

    http_method = Column(
        String(10),
        nullable=True,
    )

    login_source = Column(
        String(50),
        nullable=True,
    )
    login_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    logout_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    session_id = Column(
        String(255),
        nullable=True,
        index=True,
    )

    jwt_id = Column(
        String(255),
        nullable=True,
        index=True,
    )

    user = relationship(
        "User",
        back_populates="login_audits",
    )