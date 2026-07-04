from sqlalchemy.orm import Session

from database.crud import report as report_crud
from database.crud import report_image as report_image_crud

from schemas.report import ReportCreateInternal

from utils.report_number import generate_report_number


class ReportService:

    def __init__(self, db: Session):
        self.db = db

    def create_report(
        self,
        report_data: ReportCreateInternal,
    ):
        report_number = generate_report_number()

        return report_crud.create_report(
            self.db,
            report_data,
            report_number,
        )

    def save_image(
        self,
        report_id: int,
        original_filename: str,
        stored_filename: str,
        image_path: str,
        mime_type: str,
        file_size: int,
    ):
        return report_image_crud.create_report_image(
            self.db,
            report_id,
            original_filename,
            stored_filename,
            image_path,
            mime_type,
            file_size,
        )