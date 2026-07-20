from sqlalchemy.orm import (
    Session,
    joinedload,
)

from database.models.report import Report
from database.models.report_detection import ReportDetection
from database.models.report_image import ReportImage
from database.models.resolution import Resolution
from database.models.resolution_attempt import ResolutionAttempt
from database.models.resolution_ai_result import ResolutionAIResult
from database.models.assignment import Assignment
from database.models.report_forward_history import ReportForwardHistory
from database.models.report_support import ReportSupport
from database.models.feedback import Feedback


class AIDatasetCRUD:

    @staticmethod
    def get_dataset(
        db: Session,
    ):

        return (
            db.query(Report)
            .options(
                joinedload(Report.department),
                joinedload(Report.detections),
                joinedload(Report.images),
                joinedload(Report.resolution)
                .joinedload(
                    Resolution.attempts
                ),
                joinedload(
                    Report.assignments
                ),
                joinedload(
                    Report.supports
                ),
                joinedload(
                    Report.forward_histories
                ),
            )
            .order_by(
                Report.created_at.desc()
            )
            .all()
        )