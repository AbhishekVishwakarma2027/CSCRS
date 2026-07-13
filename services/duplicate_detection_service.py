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

    # @staticmethod
    # def calculate_distance(
    #     lat1: float,
    #     lon1: float,
    #     lat2: float,
    #     lon2: float,
    # ) -> float:
    #     """
    #     Returns distance in meters using the Haversine formula.
    #     """

    #     earth_radius = 6371000

    #     d_lat = radians(lat2 - lat1)
    #     d_lon = radians(lon2 - lon1)

    #     a = (
    #         sin(d_lat / 2) ** 2
    #         + cos(radians(lat1))
    #         * cos(radians(lat2))
    #         * sin(d_lon / 2) ** 2
    #     )

    #     c = 2 * atan2(
    #         sqrt(a),
    #         sqrt(1 - a),
    #     )

    #     return earth_radius * c

    def find_duplicate(
        self,
        issue_type: str,
        latitude: float,
        longitude: float,
        uploaded_image: str,
    ) -> Report | None:

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

            if not Path(original_image.image_path).exists():
                continue
            same_scene, score = self.is_same_scene(
                original_image.image_path,
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
        if not DUPLICATE_ENABLE_SCENE_CHECK:
            return True, 1.0

        score = self.scene_similarity.compare(
            original_image,
            uploaded_image,
        )

        return (
            score >= DUPLICATE_SCENE_THRESHOLD,
            score,
        )