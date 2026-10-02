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

    original_filename = Column(
        String(255),
        nullable=False,
    )

    stored_filename = Column(
        String(255),
        nullable=False,
    )

    image_path = Column(
        String(500),
        nullable=False,
    )

    mime_type = Column(
        String(100),
        nullable=False,
    )

    file_size = Column(
        Integer,
        nullable=False,
    )

    image_type = Column(
        Enum(ImageType),
        nullable=False,
        default=ImageType.ORIGINAL,
    )

    object_key = Column(
        String(500),
        nullable=True,
        index=True,
    )

    storage_provider = Column(
        String(50),
        nullable=False,
        default="local",
    )

    sha256 = Column(
        String(64),
        nullable=True,
        index=True,
    )

    width = Column(
        Integer,
        nullable=True,
    )

    height = Column(
        Integer,
        nullable=True,
    )

    uploaded_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    report = relationship(
        "Report",
        back_populates="images",
    )