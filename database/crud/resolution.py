from sqlalchemy.orm import Session

from database.models.assignment import Assignment
from database.models.report import Report
from database.models.resolution import Resolution
from database.models.user import User
from database.models.resolution_ai_result import ResolutionAIResult
from database.models.resolution_attempt import ResolutionAttempt
from database.models.worker_profile import WorkerProfile
from database.models.department import Department
from database.models.report_image import ReportImage
from database.enums import ImageType

class ResolutionCRUD:

    @staticmethod
    def get_assignment(
        db: Session,
        assignment_id: int,
    ) -> Assignment | None:

        return (
            db.query(Assignment)
            .filter(
                Assignment.id == assignment_id,
            )
            .first()
        )

    @staticmethod
    def get_report(
        db: Session,
        report_id: int,
    ) -> Report | None:

        return (
            db.query(Report)
            .filter(
                Report.id == report_id,
            )
            .first()
        )

    @staticmethod
    def get_resolution(
        db: Session,
        report_id: int,
    ) -> Resolution | None:

        return (
            db.query(Resolution)
            .filter(
                Resolution.report_id == report_id,
            )
            .first()
        )

    @staticmethod
    def create(
        db: Session,
        resolution: Resolution,
    ) -> Resolution:

        db.add(resolution)

        db.flush()

        return resolution
    
    @staticmethod
    def get_pending_manual_reviews(
        db: Session,
        department_id: int,
    ):

        rows = (
            db.query(
                Resolution,
                Report,
                User,
                ResolutionAIResult,
                ResolutionAttempt,
            )
            .join(
                Report,
                Resolution.report_id == Report.id,
            )
            .join(
                User,
                Resolution.worker_id == User.id,
            )

            .outerjoin(
                ResolutionAIResult,
                ResolutionAIResult.report_id == Report.id,
            )
            .outerjoin(
                ResolutionAttempt,
                ResolutionAttempt.resolution_id == Resolution.id,
            )
            .filter(
                Resolution.manual_review.is_(True),
                Report.department_id == department_id,
            )
            .order_by(
                Resolution.resolved_at.desc(),
            )
            .all()
        )

        result = []

        for resolution, report, worker, ai, attempt  in rows:

            result.append(
                {
                    "report_id": report.id,
                    "report_number": report.report_number,
                    "issue_type": report.issue_type,
                    "priority": report.priority.value,
                    "worker_name": worker.name,
                    "verification_score": resolution.verification_score,
                    "verification_decision": resolution.verification_decision,

                    "scene_similarity": (
                        ai.scene_similarity
                        if ai
                        else None
                    ),

                    "failure_reason": (
                        attempt.failure_reason
                        if attempt
                        else None
                    ),

                    "attempt_number": (
                        attempt.attempt_number
                        if attempt
                        else None
                    ),

                    "resolved_at": resolution.resolved_at,
                }
            )

        return result
    @staticmethod
    def get_manual_review_details(
        db: Session,
        report_id: int,
        department_id:int,
    ):

        row = (
            db.query(
                Resolution,
                Report,
                User,
                WorkerProfile,
                Department,
                ResolutionAttempt,
                ResolutionAIResult,
            )
            .join(
                Report,
                Resolution.report_id == Report.id,
            )
            .join(
                User,
                Resolution.worker_id == User.id,
            )
            .join(
                WorkerProfile,
                WorkerProfile.user_id == User.id,
            ) 
            .join(
                Department,
                Department.id == WorkerProfile.department_id,
            )
            .outerjoin(
                ResolutionAttempt,
                ResolutionAttempt.resolution_id == Resolution.id,
            )
            .outerjoin(
                ResolutionAIResult,
                ResolutionAIResult.report_id == Report.id,
            )
            .filter(
                Resolution.report_id == report_id,
                Report.department_id == department_id,
            )
            .first()
        )

        if row is None:
            return None

        resolution, report, worker, worker_profile ,department, attempt, ai = row

        original_image = (
                db.query(ReportImage)
                .filter(
                    ReportImage.report_id == report.id,
                    ReportImage.image_type == ImageType.ORIGINAL,
                )
                .first()
            )

        annotated_image = (
                db.query(ReportImage)
                .filter(
                    ReportImage.report_id == report.id,
                    ReportImage.image_type == ImageType.ANNOTATED,
                )
                .first()
            )

        resolution_image = (
                db.query(ReportImage)
                .filter(
                    ReportImage.report_id == report.id,
                    ReportImage.image_type == ImageType.RESOLUTION,
                )
                .order_by(ReportImage.id.desc())
                .first()
            )

        return {
            "report_id": report.id,
            "report_number": report.report_number,
            "issue_type": report.issue_type,
            "priority": report.priority.value,
            "worker_name": worker.name,
            "worker_id": worker.id,
            "worker_email": worker.email,
            "worker_phone": worker.phone,
            "department_name": department.name,
            "remarks": resolution.remarks,
            "address": report.address,

            "latitude": report.latitude,

            "longitude": report.longitude,

            "original_image_path": (
                original_image.image_path
                if original_image
                else None
            ),

            "annotated_image_path": (
                annotated_image.image_path
                if annotated_image
                else None
            ),

            "resolution_image_path": (
                resolution_image.image_path
                if resolution_image
                else None
            ),
            "verification_score": resolution.verification_score,
            "verification_decision": resolution.verification_decision,

            "failure_reason": (
                attempt.failure_reason
                if attempt
                else None
            ),

            "attempt_number": (
                attempt.attempt_number
                if attempt
                else None
            ),

            "ai_decision": (
                attempt.ai_decision
                if attempt
                else None
            ),

            "model_version": (
                attempt.model_version
                if attempt
                else None
            ),

            "scene_similarity": (
                attempt.scene_similarity
                if attempt
                else None
            ),

            "same_scene": (
                attempt.same_scene
                if attempt
                else None
            ),

            "yolo_issue_found": (
                attempt.yolo_issue_found
                if attempt
                else None
            ),

            "manual_review": resolution.manual_review,

            "resolved_at": resolution.resolved_at,
        }
    @staticmethod
    def get_resolution_by_report(
        db: Session,
        report_id: int,
    ):

        return (
            db.query(Resolution)
            .filter(
                Resolution.report_id == report_id,
            )
            .first()
        )