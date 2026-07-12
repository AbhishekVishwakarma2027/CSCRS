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
    def get_my_reports(
        self,
        citizen_id: int,
    ):

        return report_crud.get_reports_by_citizen(
            self.db,
            citizen_id,
        )
    def get_my_report(
        self,
        citizen_id: int,
        report_number: str,
    ):

        report = report_crud.get_citizen_report_by_number(
            self.db,
            citizen_id,
            report_number,
        )

        if report is None:

            raise ValueError(
                "Report not found."
            )

        return report
    def get_department_reports(
        self,
        department_id: int,
        status=None,
        priority=None,
        issue_type=None,
    ):

        return report_crud.get_department_reports_filtered(
            self.db,
            department_id,
            status,
            priority,
            issue_type,
        )
    def get_all_reports(
        self,
        department_id=None,
        status=None,
        priority=None,
        issue_type=None,
    ):

        return report_crud.get_all_reports_filtered(
            self.db,
            department_id,
            status,
            priority,
            issue_type,
        )
    def search_reports(
        self,
        query: str,
    ):

        return report_crud.search_reports(
            self.db,
            query,
        )
    def search_department_reports(
        self,
        department_id: int,
        query: str,
    ):

        return report_crud.search_department_reports(
            self.db,
            department_id,
            query,
        )
    def search_my_reports(
        self,
        citizen_id: int,
        query: str,
    ):

        return report_crud.search_citizen_reports(
            self.db,
            citizen_id,
            query,
        )
    def get_all_reports_paginated(
        self,
        page: int,
        page_size: int,
        department_id=None,
        status=None,
        priority=None,
        issue_type=None,
    ):

        items, total_items, total_pages = (
            report_crud.get_all_reports_paginated(
                self.db,
                page,
                page_size,
                department_id,
                status,
                priority,
                issue_type,
            )
        )

        return {
            "items": items,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_items": total_items,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1,
            },
        }