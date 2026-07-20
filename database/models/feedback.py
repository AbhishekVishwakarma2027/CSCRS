from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.base import Base


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    rating = Column(
        Integer,
        nullable=False,
    )

    liked_text = Column(
        Text,
        nullable=True,
    )

    suggestion_text = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="feedbacks",
    )