from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.base import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    token_hash = Column(
        String(64),
        nullable=False,
        unique=True,
        index=True,
    )

    jwt_id = Column(
        String(36),
        nullable=False,
        unique=True,
        index=True,
    )

    session_id = Column(
        String(36),
        nullable=False,
        index=True,
    )

    ip_address = Column(
        String(64),
        nullable=True,
    )

    device_type = Column(
        String(50),
        nullable=True,
    )

    browser = Column(
        String(100),
        nullable=True,
    )

    operating_system = Column(
        String(100),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    last_used_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    revoked_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    revoked_reason = Column(
        String(255),
        nullable=True,
    )

    user = relationship(
        "User",
        back_populates="refresh_tokens",
    )