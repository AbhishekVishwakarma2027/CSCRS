from sqlalchemy.orm import Session

from database.models.report_image import ReportImage


def create_report_image(
    db: Session,
    report_id: int,
    original_filename: str,
    stored_filename: str,
    image_path: str,
    mime_type: str,
    file_size: int,
):
    image = ReportImage(
        report_id=report_id,
        original_filename=original_filename,
        stored_filename=stored_filename,
        image_path=image_path,
        mime_type=mime_type,
        file_size=file_size,
    )

    db.add(image)
    db.commit()
    db.refresh(image)

    return image