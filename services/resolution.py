from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from database.crud.resolution import ResolutionCRUD
from database.models.resolution import Resolution
from pathlib import Path
import shutil
import logging

from utils.file_utils import generate_filename,validate_uploaded_file
from utils.file_utils import safe_delete_file

from database.enums import ImageType

from services.report_service import ReportService
from inference.engine import InferenceEngine
from database.crud.resolution_attempt import ResolutionAttemptCRUD

from inference.resolution_ai.engine import ResolutionAIEngine
from inference.resolution_ai.rules import ResolutionRuleEngine
from database.crud.resolution_ai import ResolutionAIResultCRUD
from database.models.resolution_ai_result import ResolutionAIResult
from database.enums import ResolutionDecision
from database.enums import VerificationDecision
from datetime import datetime,timezone

from database.enums import (
    ReportStatus,
    AssignmentStatus,
)

from database.crud.assignment import AssignmentCRUD
from database.crud.worker import WorkerCRUD
import database.crud.report as report_crud
from services.notification_service import NotificationService
from services.audit_log_service import AuditLogService
from services.in_app_notification_service import (
    InAppNotificationService,
)



logger = logging.getLogger(__name__)
class ResolutionService:

    def __init__(
        self,
        db: Session,
    ):
        self.db = db
        self.report_service = ReportService(db)
        self.inference_engine = InferenceEngine()

        self.resolution_ai = ResolutionAIEngine()
        self.rule_engine = ResolutionRuleEngine()
        self.notification_service = NotificationService()

    def normalize_issue_name(self, issue: str) -> str:
        return (
            issue.strip()
            .lower()
            .replace("_", " ")
            .replace("-", " ")
        )
    
    image_path = None
    annotated_path = None
    report_image = None

    # TODO:
    # Split create_resolution() into smaller private methods
    # after backend freeze.
    try:
        def create_resolution(
            self,
            *,
            assignment_id: int,
            worker_id: int,
            image,
            remarks: str | None = None,
        ):

            assignment = self._validate_assignment(
                assignment_id,
                worker_id,
            )
            image_path = self._save_resolution_image(
                assignment=assignment,
                image=image,
            )

            report_image = self.report_service.get_latest_resolution_image(
                assignment.report_id,
            )

            ai_result = self.inference_engine.predict(
                str(image_path),
            )

            if not ai_result["success"]:

                from utils.file_utils import safe_delete_file

                safe_delete_file(image_path)

                if report_image is not None:
                    self.report_service.delete_image(report_image)

                raise HTTPException(
                    status_code=400,
                    detail=ai_result["message"],
                )
            
            annotated_path = Path(
                ai_result["ai"]["annotated_image"].lstrip("/")
            )

            original_image = self.report_service.get_original_image(
                assignment.report_id,
            )

            if original_image is None:

                raise HTTPException(
                    status_code=500,
                    detail="Original report image not found.",
                )

            resolution_ai = self.resolution_ai.predict(
                original_image=original_image.image_path,
                resolution_image=str(image_path),
            )

            verification = ai_result["verification"]

            detections = ai_result["ai"]["detections"]

            report = ResolutionCRUD.get_report(
                self.db,
                assignment.report_id,
            )

            if report.status == ReportStatus.RESOLVED:
                raise HTTPException(
                    status_code=409,
                    detail="This report has already been resolved.",
                )

            same_issue_detected = False

            if report is not None:

                original_issue = self.normalize_issue_name(report.issue_type)

                for detection in detections:

                    detected_issue = self.normalize_issue_name(detection["class_name"])

                    if detected_issue == original_issue:

                        same_issue_detected = True
                        break

            rule_decision = self.rule_engine.evaluate(

                verification_passed=verification["verification_passed"],

                scene_similarity=resolution_ai["scene_similarity"],

                yolo_issue_found=same_issue_detected,

            )

            logger.info(
                "Resolution evaluated. report_id=%s decision=%s similarity=%.2f same_scene=%s same_issue=%s",
                assignment.report_id,
                rule_decision,
                resolution_ai["scene_similarity"],
                resolution_ai["same_scene"],
                same_issue_detected,
            )

            resolution = ResolutionCRUD.get_resolution(
                self.db,
                assignment.report_id,
            )

            if resolution is None:

                resolution = self._store_resolution(
                    assignment,
                    remarks,
                )

            attempt = ResolutionAttemptCRUD.create(
                self.db,
                resolution_id=resolution.id,
                image_path=str(image_path),
            )

            logger.info(
                "Resolution attempt created. attempt_id=%s report_id=%s",
                attempt.id,
                assignment.report_id,
            )

            AuditLogService(self.db).log(
                report_id=assignment.report_id,
                user_id=worker_id,
                action="RESOLUTION_SUBMITTED",
                details="Worker uploaded resolution image.",
            )

            ResolutionAttemptCRUD.update_attempt(
                self.db,
                attempt=attempt,
                annotated_image_path=str(annotated_path),
                verification_passed=verification["verification_passed"],
                verification_score=verification.get("risk_score"),
                verification_decision=verification.get("decision"),
                ai_decision=rule_decision,
                failure_reason=(";".join(
                    verification.get("flags", []))
                    if rule_decision != "PASS"
                    else None
                ),
                model_version=ai_result["ai"].get("model_version"),
                scene_similarity=resolution_ai["scene_similarity"],
                same_scene=resolution_ai["same_scene"],
                yolo_issue_found=same_issue_detected,
            )

            if rule_decision == "PASS":
                ai_decision = ResolutionDecision.FULLY_RESOLVED

            elif rule_decision == "REVIEW":
                ai_decision = ResolutionDecision.REVIEW

            else:
                ai_decision = ResolutionDecision.NOT_RESOLVED

            resolution_ai_result = ResolutionAIResult(
                report_id=assignment.report_id,
                attempt_number=attempt.id,
                scene_similarity=resolution_ai["scene_similarity"],
                same_scene=resolution_ai["same_scene"],
                yolo_issue_found=same_issue_detected,
                ai_decision=ai_decision,
                model_version=ai_result["ai"].get("model_version"),
            )

            ResolutionAIResultCRUD.create(
                self.db,
                resolution_ai_result,
            )

            if rule_decision == "FAIL":

                resolution.verification_passed = False
                resolution.verification_score = verification["risk_score"]
                resolution.verification_decision = VerificationDecision.REJECT
                resolution.manual_review = False

            elif rule_decision == "REVIEW":

                resolution.verification_passed = False
                resolution.verification_score = verification["risk_score"]
                resolution.verification_decision = VerificationDecision.REVIEW
                resolution.manual_review = True

            else:

                resolution.verification_passed = True
                resolution.verification_score = verification["risk_score"]
                resolution.verification_decision = VerificationDecision.PASS
                resolution.manual_review = False
                resolution.verified_at = datetime.now(timezone.utc)

                report = report_crud.get_report_by_id(
                    self.db,
                    assignment.report_id,
                )

                if report is not None:
                    report.status = ReportStatus.RESOLVED

                assignment.status = AssignmentStatus.COMPLETED
                assignment.completed_at = datetime.now(timezone.utc)

                AssignmentCRUD.save_assignment(
                    self.db,
                    assignment,
                )

                worker_profile = WorkerCRUD.get_worker_profile(
                    self.db,
                    assignment.worker_id,
                )

                if worker_profile is not None:
                    worker_profile.is_available = True
                    WorkerCRUD.save_worker_profile(
                        self.db,
                        worker_profile,
                    )
                    AuditLogService(self.db).log(
                        report_id=assignment.report_id,
                        user_id=worker_id,
                        action="RESOLUTION_VERIFIED",
                        details=(
                            f"AI verification result: "
                            f"{resolution.verification_decision.value}"
                        ),
                    )
                AuditLogService(self.db).log(
                    report_id=assignment.report_id,
                    user_id=worker_id,
                    action="REPORT_COMPLETED",
                    details="Report marked as resolved.",
                )

            self.db.commit()
            self.db.refresh(resolution)

            if resolution.verification_passed:

                InAppNotificationService(
                    self.db,
                ).create_notification(
                    user_id=assignment.worker_id,
                    report_id=assignment.report_id,
                    title="Resolution Approved",
                    message="Your submitted resolution has been approved.",
                    notification_type="RESOLUTION_APPROVED",
                )
                InAppNotificationService(
                    self.db,
                ).create_notification(
                    user_id=report.citizen_id,
                    report_id=report.id,
                    title="Issue Resolved",
                    message="Your reported civic issue has been successfully resolved.",
                    notification_type="REPORT_RESOLVED",
                )

            elif resolution.manual_review:

                InAppNotificationService(
                    self.db,
                ).create_notification(
                    user_id=assignment.worker_id,
                    report_id=assignment.report_id,
                    title="Manual Review Required",
                    message="Your submitted resolution requires manual review.",
                    notification_type="MANUAL_REVIEW",
                )
            if resolution.verification_passed:

                try:

                    report = ResolutionCRUD.get_report(
                        self.db,
                        assignment.report_id,
                    )

                    self.notification_service.send_resolution_completed_email(
                        citizen_name=report.citizen.name,
                        citizen_email=report.citizen.email,
                        report_number=report.report_number,
                        issue_type=report.issue_type,
                        department_name=report.department.name,
                        resolved_at=str(resolution.resolved_at),
                    )

                except Exception as e:

                    logger.exception("Failed to send citizen resolution email.")

            return resolution
    except Exception:
        if image_path:
            safe_delete_file(image_path)
        if annotated_path:
            safe_delete_file(annotated_path)
        raise

    def _validate_assignment(
        self,
        assignment_id: int,
        worker_id: int,
    ):

        assignment = ResolutionCRUD.get_assignment(
            self.db,
            assignment_id,
        )

        if assignment is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found.",
            )

        if assignment.worker_id != worker_id:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this report.",
            )
        
        if assignment.status == AssignmentStatus.COMPLETED:
            raise HTTPException(
                status_code=409,
                detail="This assignment has already been completed.",
            )
        
        if assignment.status != AssignmentStatus.IN_PROGRESS:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Please start work before uploading the resolution.",
            )

        return assignment

    def _store_resolution(
        self,
        assignment,
        remarks,
    ):

        resolution = Resolution(
            report_id=assignment.report_id,
            worker_id=assignment.worker_id,
            remarks=remarks,
        )

        resolution = ResolutionCRUD.create(
            self.db,
            resolution,
        )
        self.db.flush()

        return resolution
    def _save_resolution_image(
        self,
        assignment,
        image,
    ):
        validate_uploaded_file(
            file=image,
            allowed_extensions={
                ".jpg",
                ".jpeg",
                ".png",
                ".webp",
            },
            allowed_content_types={
                "image/jpeg",
                "image/png",
                "image/webp",
            },
            max_size=10 * 1024 * 1024,
        )
        upload_dir = Path("uploads/resolution")

        upload_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        stored_filename = generate_filename(
            image.filename,
        )

        image_path = upload_dir / stored_filename

        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(
                image.file,
                buffer,
            )

        self.report_service.save_image(
            report_id=assignment.report_id,

            original_filename=image.filename,

            stored_filename=stored_filename,

            image_path=str(image_path),

            mime_type=image.content_type
            or "application/octet-stream",

            file_size=image_path.stat().st_size,

            image_type=ImageType.RESOLUTION,
        )

        return image_path
    
    def get_pending_manual_reviews(
        self,
        *,
        department_id: int,
    ):

        return ResolutionCRUD.get_pending_manual_reviews(
            self.db,
            department_id,
        )
    
    def get_manual_review_details(
        self,
        *,
        report_id: int,
        department_admin,
    ):
        details = ResolutionCRUD.get_manual_review_details(
            self.db,
            report_id,
            department_admin.department_id,
        )

        if details is None:
            raise HTTPException(
                status_code=404,
                detail="Manual review not found.",
            )

        if details.report.department_id != department_admin.department_id:
            raise HTTPException(
                status_code=403,
                detail="You can view only your department reports.",
            )

        return details
    
    def approve_manual_review(
        self,
        *,
        report_id: int,
        department_admin,
    ):

        resolution = ResolutionCRUD.get_resolution_by_report(
            self.db,
            report_id,
        )

        if resolution is None:
            raise HTTPException(
                status_code=404,
                detail="Resolution not found.",
            )

        if not resolution.manual_review:
            raise HTTPException(
                status_code=400,
                detail="Resolution is not pending manual review.",
            )

        report = report_crud.get_report_by_id(
            self.db,
            report_id,
        )


        if report is None:
            raise HTTPException(
                status_code=404,
                detail="Report not found.",
            )
        
        if report.department_id != department_admin.department_id:

            raise HTTPException(
                status_code=403,
                detail="You can review only your department reports.",
            )

        assignment = AssignmentCRUD.get_assignment_by_report(
            self.db,
            report_id,
        )

        if assignment is None:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found.",
            )
        resolution.manual_review = False
        resolution.verification_passed = True
        resolution.verification_decision = VerificationDecision.PASS
        resolution.verified_at = datetime.now(timezone.utc)

        report.status = ReportStatus.RESOLVED

        assignment.status = AssignmentStatus.COMPLETED
        assignment.completed_at = datetime.now(timezone.utc)

        worker_profile = WorkerCRUD.get_worker_profile(
            self.db,
            assignment.worker_id,
        )

        if worker_profile is not None:
            worker_profile.is_available = True
            WorkerCRUD.save_worker_profile(
                self.db,
                worker_profile,
            )

        AssignmentCRUD.save_assignment(
            self.db,
            assignment,
        )

        self.db.commit()

        self.db.refresh(resolution)
        AuditLogService(self.db).log(
            report_id=report.id,
            user_id=assignment.worker_id,
            action="MANUAL_REVIEW_APPROVED",
            details="Department Admin approved the manually reviewed resolution.",
        )

        
        AuditLogService(self.db).log(
            report_id=report.id,
            user_id=assignment.worker_id,
            action="REPORT_COMPLETED",
            details="Report marked as resolved after manual approval.",
        )

        notification_service = InAppNotificationService(self.db)

        notification_service.create_notification(
            user_id=assignment.worker_id,
            report_id=report.id,
            title="Resolution Approved",
            message="Your submitted resolution has been approved by the Department Admin.",
            notification_type="RESOLUTION_APPROVED",
        )

        notification_service.create_notification(
            user_id=report.citizen_id,
            report_id=report.id,
            title="Issue Resolved",
            message="Your reported civic issue has been successfully resolved.",
            notification_type="REPORT_RESOLVED",
        )

        try:

            self.notification_service.send_resolution_completed_email(
                citizen_name=report.citizen.name,
                citizen_email=report.citizen.email,
                report_number=report.report_number,
                issue_type=report.issue_type,
                department_name=report.department.name,
                resolved_at=str(resolution.resolved_at),
            )

        except Exception:
            logger.exception(
                "Failed to send citizen resolution email after manual approval."
            )
        return resolution
    
    def reject_manual_review(
        self,
        *,
        report_id: int,
        reason: str,
        department_admin,
    ):

        resolution = ResolutionCRUD.get_resolution_by_report(
            self.db,
            report_id,
        )

        if resolution is None:
            raise HTTPException(
                status_code=404,
                detail="Resolution not found.",
            )

        if not resolution.manual_review:
            raise HTTPException(
                status_code=400,
                detail="Resolution is not pending manual review.",
            )

        report = report_crud.get_report_by_id(
            self.db,
            report_id,
        )
        
        if report is None:
            raise HTTPException(
                status_code=404,
                detail="Report not found.",
            )
        if report.department_id != department_admin.department_id:

            raise HTTPException(
                status_code=403,
                detail="You can review only your department reports.",
            )

        assignment = AssignmentCRUD.get_assignment_by_report(
            self.db,
            report_id,
        )

        if assignment is None:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found.",
            )

        resolution.manual_review = False
        resolution.verification_passed = False
        resolution.verification_decision = VerificationDecision.REJECT

        report.status = ReportStatus.IN_PROGRESS

        assignment.status = AssignmentStatus.IN_PROGRESS
        assignment.completed_at = None

        worker_profile = WorkerCRUD.get_worker_profile(
            self.db,
            assignment.worker_id,
        )

        if worker_profile is not None:
            worker_profile.is_available = False

            WorkerCRUD.save_worker_profile(
                self.db,
                worker_profile,
            )

        AssignmentCRUD.save_assignment(
            self.db,
            assignment,
        )

        self.db.commit()

        self.db.refresh(resolution)

        AuditLogService(self.db).log(
            report_id=report.id,
            user_id=assignment.worker_id,
            action="MANUAL_REVIEW_REJECTED",
            details=reason,
        )

        InAppNotificationService(
            self.db,
        ).create_notification(
            user_id=assignment.worker_id,
            report_id=report.id,
            title="Resolution Rejected",
            message=(
                f"Your submitted resolution was rejected.\n"
                f"Reason: {reason}"
            ),
            notification_type="RESOLUTION_REJECTED",
        )

        return resolution