from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base


class PublicUpdate(Base):
    __tablename__ = "public_updates"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False)

    slug = Column(String(255), unique=True, nullable=False, index=True)

    description = Column(Text, nullable=True)

    content = Column(Text, nullable=False)

    category = Column(String(100), nullable=False, default="Press")

    thumbnail_url = Column(String(500), nullable=True)
    thumbnail_object_key = Column(String(500), nullable=True)
    thumbnail_storage_provider = Column(String(50), nullable=True, default="local")

    published_at = Column(DateTime(timezone=True), nullable=True)

    read_time_minutes = Column(Integer, nullable=False, default=3)

    is_published = Column(Boolean, nullable=False, default=False, index=True)

    created_by_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    creator = relationship("User", foreign_keys=[created_by_id])
