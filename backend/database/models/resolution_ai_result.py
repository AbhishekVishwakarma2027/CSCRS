from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    ForeignKey,
    DateTime,
    Enum,
    Boolean,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.base import Base
from database.enums import ResolutionDecision




class ResolutionAIResult(Base):
    __tablename__ = "resolution_ai_results"

    id = Column(Integer, primary_key=True, index=True)

    report_id = Column(
        Integer,
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )


    attempt_number = Column(
    Integer,
    nullable=False,
    default=1,
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

    ai_decision = Column(
        Enum(ResolutionDecision),
        nullable=False,
    )

    model_version = Column(
        String(100),
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    report = relationship(
        "Report",
        back_populates="resolution_ai",
    )