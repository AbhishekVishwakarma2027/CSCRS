from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.base import Base


class ReportDetection(Base):
    __tablename__ = "report_detections"

    id = Column(Integer, primary_key=True, index=True)

    report_id = Column(
        Integer,
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    class_name = Column(
        String(100),
        nullable=False,
    )

    confidence = Column(
        Float,
        nullable=False,
    )

    bbox = Column(
        JSON,
        nullable=False,
    )

    mask_area = Column(
        Float,
        nullable=False,
    )

    model_version = Column(
        String(100),
        nullable=False,
    )

    inference_time_ms = Column(
        Integer,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    report = relationship(
        "Report",
        back_populates="detections",
    )