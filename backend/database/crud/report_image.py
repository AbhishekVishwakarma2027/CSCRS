from sqlalchemy.orm import Session

from database.models.report_image import ReportImage
from database.enums import ImageType


def create_report_image(
    db,
    report_id,
    original_filename,
    stored_filename,
    image_path,
    mime_type,
    file_size,
    image_type=ImageType.ORIGINAL,
    object_key=None,
    storage_provider="local",
    sha256=None,
    width=None,
    height=None,
):
    image = ReportImage(
        report_id=report_id,
        original_filename=original_filename,
        stored_filename=stored_filename,
        image_path=image_path,
        mime_type=mime_type,
        file_size=file_size,
        image_type=image_type,
        object_key=object_key,
        storage_provider=storage_provider,
        sha256=sha256,
        width=width,
        height=height,
    )

    db.add(image)
    db.flush()

    return image


def get_original_image(
    db,
    report_id: int,
):

    return (
        db.query(ReportImage)
        .filter(
            ReportImage.report_id == report_id,
            ReportImage.image_type == ImageType.ORIGINAL,
        )
        .first()
    )
def get_annotated_image(
    db,
    report_id: int,
):

    return (
        db.query(ReportImage)
        .filter(
            ReportImage.report_id == report_id,
            ReportImage.image_type == ImageType.ANNOTATED,
        )
        .first()
    )
def get_latest_resolution_image(
    db: Session,
    report_id: int,
):
    return (
        db.query(ReportImage)
        .filter(
            ReportImage.report_id == report_id,
            ReportImage.image_type == ImageType.RESOLUTION,
        )
        .order_by(ReportImage.id.desc())
        .first()
    )


def delete_image(
    db: Session,
    image: ReportImage,
):
    db.delete(image)
    db.flush()