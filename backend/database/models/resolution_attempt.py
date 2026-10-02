from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Boolean,
    ForeignKey,
    DateTime,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.base import Base


class ResolutionAttempt(Base):

    __tablename__ = "resolution_attempts"

    id = Column(Integer, primary_key=True)

    resolution_id = Column(
        Integer,
        ForeignKey(
            "resolutions.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    attempt_number = Column(
        Integer,
        nullable=False,
    )

    image_path = Column(
        String,
        nullable=False,
    )

    annotated_image_path = Column(
        String,
        nullable=True,
    )

    object_key = Column(
        String(500),
        nullable=True,
        index=True,
    )

    annotated_object_key = Column(
        String(500),
        nullable=True,
    )

    storage_provider = Column(
        String(50),
        nullable=False,
        default="local",
    )

    verification_passed = Column(
        Boolean,
        nullable=False,
    )

    verification_score = Column(
        Float,
        nullable=True,
    )

    verification_decision = Column(
        String(30),
        nullable=True,
    )

    ai_decision = Column(
        String(30),
        nullable=True,
    )

    failure_reason = Column(
        String(100),
        nullable=True,
    )

    model_version = Column(
        String(100),
        nullable=True,
    )

    scene_similarity = Column(
    Float,
    nullable=True,
    )

    same_scene = Column(
        Boolean,
        nullable=True,
    )

    yolo_issue_found = Column(
        Boolean,
        nullable=True,
    )


    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    resolution = relationship(
        "Resolution",
        back_populates="attempts",
    )