from sqlalchemy.orm import Session

from database.crud import report as report_crud
from database.crud import report_image as report_image_crud

from schemas.report import ReportCreateInternal

from utils.report_number import generate_report_number
from database.crud import report_detection as report_detection_crud
from database.enums import ImageType

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
        image_type=ImageType.ORIGINAL,
    ):
        return report_image_crud.create_report_image(
            self.db,
            report_id,
            original_filename,
            stored_filename,
            image_path,
            mime_type,
            file_size,
            image_type,
        )
    def save_detections(
        self,
        report_id: int,
        detections: list,
        model_version: str,
        inference_time_ms: int,
    ):
        return report_detection_crud.create_many_detections(
            db=self.db,
            report_id=report_id,
            detections=detections,
            model_version=model_version,
            inference_time_ms=inference_time_ms,
        )
    def get_original_image(
        self,
        report_id: int,
    ):

        return report_image_crud.get_original_image(
            self.db,
            report_id,
        )
    
    def get_latest_resolution_image(
        self,
        report_id: int,
    ):
        return report_image_crud.get_latest_resolution_image(
            self.db,
            report_id,
        )


    def delete_image(
        self,
        image,
    ):
        report_image_crud.delete_image(
            self.db,
            image,
        )