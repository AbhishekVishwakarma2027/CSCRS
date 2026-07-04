from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database.base import Base
from database.enums import ImageType


class ReportImage(Base):
    __tablename__ = "report_images"

    id = Column(Integer, primary_key=True, index=True)

    report_id = Column(
        Integer,
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
    )

    image_path = Column(
        String(500),
        nullable=False,
    )

    image_type = Column(
        Enum(ImageType),
        nullable=False,
        default=ImageType.ORIGINAL,
    )

    uploaded_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    report = relationship(
        "Report",
        back_populates="images",
    )