from utils.gps import calculate_distance
from sqlalchemy.orm import Session
from database.enums import ReportStatus
from database.models.report import Report
from configs.config import (
    DUPLICATE_REPORT_RADIUS_METERS,
    DUPLICATE_ENABLE_SCENE_CHECK,
    DUPLICATE_SCENE_THRESHOLD,
)

from inference.resolution_ai.similarity import SceneSimilarityEngine
from database.crud import report_image as report_image_crud
from database.enums import ReportStatus
from pathlib import Path

class DuplicateDetectionService:

    def __init__(
        self,
        db: Session,
    ):

        self.db = db
        self.scene_similarity = (
            SceneSimilarityEngine()
            if DUPLICATE_ENABLE_SCENE_CHECK
            else None
        )

    def find_duplicate(
        self,
        issue_type: str,
        latitude: float,
        longitude: float,
        uploaded_image: str,
    ) -> dict | None:
        
        if latitude is None or longitude is None:
            return None
        
        reports = (
            self.db.query(Report)
            .filter(
                Report.issue_type == issue_type,
            )
            .filter(
                Report.status.in_(
                    [
                        ReportStatus.PENDING,
                        ReportStatus.ASSIGNED,
                        ReportStatus.IN_PROGRESS,
                    ]
                )
            )
            .all()
        )

        for report in reports:

            distance = calculate_distance(
                latitude,
                longitude,
                report.latitude,
                report.longitude,
            )

            if distance > DUPLICATE_REPORT_RADIUS_METERS:
                continue

            original_image = report_image_crud.get_original_image(
                self.db,
                report.id,
            )

            if original_image is None:
                continue

            from storage import get_media_service
            media_service = get_media_service()
            try:
                ref = original_image.object_key or original_image.image_path
                orig_img = media_service.get_image_for_embedding(
                    ref,
                    getattr(original_image, "storage_provider", None),
                )
            except Exception:
                continue

            same_scene, score = self.is_same_scene(
                orig_img,
                uploaded_image,
            )


            if same_scene:
                return {
                    "report": report,
                    "distance": round(distance, 2),
                    "scene_similarity": score,
                }

        return None
    
    def is_same_scene(
        self,
        original_image: str,
        uploaded_image: str,
    ):
        try:

            score = self.scene_similarity.compare(
                original_image,
                uploaded_image,
            )

        except Exception:
            return False, 0.0

        return (
            score >= DUPLICATE_SCENE_THRESHOLD,
            score,
        )