from datetime import datetime
from typing import List, Dict, Any

from sqlalchemy.orm import Session
from database.models.resolution_ai_result import ResolutionAIResult
from database.crud.ai_dataset import AIDatasetCRUD



def excel_datetime(value):
    if isinstance(value, datetime) and value.tzinfo is not None:
        return value.replace(tzinfo=None)
    return value

class AIDatasetService:

    @staticmethod
    def get_dataset(
        db: Session,
    ) -> List[Dict[str, Any]]:

        reports = AIDatasetCRUD.get_dataset(db)

        dataset = []

        for report in reports:

            row = {}

            # --------------------------------------------------
            # REPORT
            # --------------------------------------------------

            row["Issue Type"] = report.issue_type
            row["Department"] = (
                report.department.name
                if report.department
                else None
            )
            row["Priority"] = (
                report.priority.name
                if report.priority
                else None
            )
            row["Status"] = (
                report.status.name
                if report.status
                else None
            )

            row["Verification Decision"] = (
                report.verification_decision.name
                if report.verification_decision
                else None
            )

            row["Verification Passed"] = (
                report.verification_passed
            )

            row["Risk Score"] = report.risk_score
            row["AI Confidence"] = report.ai_confidence
            row["Confidence Gap"] = (
                round(
                    100 - report.ai_confidence,
                    2,
                )
                if report.ai_confidence is not None
                else None
            )

            row["Support Count"] = report.support_count
            row["Forward Count"] = report.forward_count

            row["Description"] = report.description

            row["Created At"] = excel_datetime(report.created_at)
            row["Updated At"] = excel_datetime(report.updated_at)

            # --------------------------------------------------
            # TIME FEATURES
            # --------------------------------------------------

            if report.created_at:

                row["Report Hour"] = (
                    report.created_at.hour
                )

                row["Report Weekday"] = (
                    report.created_at.strftime("%A")
                )

                row["Report Month"] = (
                    report.created_at.strftime("%B")
                )

                row["Is Weekend"] = (
                    report.created_at.weekday() >= 5
                )

            else:

                row["Report Hour"] = None
                row["Report Weekday"] = None
                row["Report Month"] = None
                row["Is Weekend"] = None

            # --------------------------------------------------
            # LOCATION
            # --------------------------------------------------

            row["Latitude"] = report.latitude
            row["Longitude"] = report.longitude
            row["Address"] = report.address

            # --------------------------------------------------
            # DETECTION
            # --------------------------------------------------

            detection = (
                report.detections[0]
                if report.detections
                else None
            )

            if detection:

                row["Detected Class"] = detection.class_name
                row["Detection Confidence"] = detection.confidence
                row["Mask Area"] = detection.mask_area
                bbox = detection.bbox

                row["Bounding Box"] = bbox

                row["BBox X1"] = None
                row["BBox Y1"] = None
                row["BBox X2"] = None
                row["BBox Y2"] = None

                if (
                    isinstance(bbox, (list, tuple))
                    and len(bbox) == 4
                ):

                    row["BBox X1"] = bbox[0]
                    row["BBox Y1"] = bbox[1]
                    row["BBox X2"] = bbox[2]
                    row["BBox Y2"] = bbox[3]

                row["Detection Correct"] = (
                    detection.class_name.lower()
                    == report.issue_type.lower()
                    if detection.class_name
                    and report.issue_type
                    else None
                )

                row["Model Version"] = detection.model_version
                row["Inference Time (ms)"] = (
                    detection.inference_time_ms
                )

            else:

                row["Detected Class"] = None
                row["Detection Confidence"] = None
                row["Mask Area"] = None
                row["Bounding Box"] = None
                row["Model Version"] = None
                row["Inference Time (ms)"] = None
            # --------------------------------------------------
            # IMAGES
            # --------------------------------------------------

            original_image = None
            annotated_image = None

            for image in report.images:

                if image.image_type.lower() == "original":
                    original_image = image.image_path

                elif image.image_type.lower() == "annotated":
                    annotated_image = image.image_path

            row["Original Image"] = original_image
            row["Annotated Image"] = annotated_image

            row["Has Original Image"] = bool(
                original_image
            )

            row["Has Annotated Image"] = bool(
                annotated_image
            )

            # --------------------------------------------------
            # RESOLUTION
            # --------------------------------------------------

            resolution = report.resolution

            if resolution:

                row["Resolution Passed"] = (
                    resolution.verification_passed
                )

                row["Verification Score"] = (
                    resolution.verification_score
                )

                row["Resolution Decision"] = (
                    resolution.verification_decision.name
                    if resolution.verification_decision
                    else None
                )

                row["Manual Review"] = (
                    resolution.manual_review
                )

                row["Resolved At"] = excel_datetime(resolution.resolved_at)

                row["Verified At"] = excel_datetime(resolution.verified_at)

            else:

                row["Resolution Passed"] = None
                row["Verification Score"] = None
                row["Resolution Decision"] = None
                row["Manual Review"] = None
                row["Resolved At"] = None
                row["Verified At"] = None

            # --------------------------------------------------
            # RESOLUTION ATTEMPT
            # --------------------------------------------------

            if (
                resolution
                and resolution.attempts
            ):

                latest_attempt = max(
                    resolution.attempts,
                    key=lambda x: x.attempt_number,
                )

                row["Attempt Number"] = (
                    latest_attempt.attempt_number
                )

                row["Attempt Passed"] = (
                    latest_attempt.verification_passed
                )

                row["Attempt Score"] = (
                    latest_attempt.verification_score
                )

                row["Attempt Decision"] = (
                    latest_attempt.verification_decision
                )

                row["AI Decision"] = latest_attempt.ai_decision
                

                row["Failure Reason"] = (
                    latest_attempt.failure_reason
                )

                row["Processing Time (ms)"] = None

                row["Scene Similarity"] = (
                    latest_attempt.scene_similarity
                )

                row["Same Scene"] = (
                    latest_attempt.same_scene
                )

                row["YOLO Issue Found"] = (
                    latest_attempt.yolo_issue_found
                )

            else:

                row["Attempt Number"] = None
                row["Attempt Passed"] = None
                row["Attempt Score"] = None
                row["Attempt Decision"] = None
                row["AI Decision"] = None
                row["Failure Reason"] = None
                row["Processing Time (ms)"] = None
                row["Scene Similarity"] = None
                row["Same Scene"] = None
                row["YOLO Issue Found"] = None

            # --------------------------------------------------
            # ASSIGNMENT
            # --------------------------------------------------

            assignment = (
                report.assignments[0]
                if report.assignments
                else None
            )

            if assignment:

                row["Assignment Status"] = (
                    assignment.status.name
                    if assignment and assignment.status
                    else None
                )

                row["Assigned At"] = excel_datetime(assignment.assigned_at)

                row["Accepted At"] = excel_datetime(assignment.accepted_at)

                row["Work Started At"] = excel_datetime(assignment.work_started_at)

                row["Completed At"] = excel_datetime(assignment.completed_at)

            else:

                row["Assignment Status"] = None
                row["Assigned At"] = None
                row["Accepted At"] = None
                row["Work Started At"] = None
                row["Completed At"] = None

            # --------------------------------------------------
            # FORWARD HISTORY
            # --------------------------------------------------

            if report.forward_histories:

                latest_forward = max(
                    report.forward_histories,
                    key=lambda x: x.forward_number,
                )

                row["Forward Number"] = (
                    latest_forward.forward_number
                )

                row["Forward Reason"] = (
                    latest_forward.reason_type.name
                    if latest_forward.reason_type
                    else None
                )

                row["From Department"] = (
                    latest_forward.from_department.name
                    if latest_forward.from_department
                    else None
                )

                row["Destination Department"] = (
                    latest_forward.to_department.name
                    if latest_forward.to_department
                    else None
                )

                row["Forwarded At"] = excel_datetime(latest_forward.created_at)

            else:

                row["Forward Number"] = None
                row["Forward Reason"] = None
                row["From Department"] = None
                row["Destination Department"] = None
                row["Forwarded At"] = None

            ai_result = report.resolution_ai

            if ai_result:

                row["Final AI Decision"] = (
                    ai_result.ai_decision.name
                    if ai_result.ai_decision
                    else None
                )
                row["AI Scene Similarity"] = ai_result.scene_similarity
                row["AI Same Scene"] = ai_result.same_scene
                row["AI YOLO Issue Found"] = ai_result.yolo_issue_found
                row["AI Model Version"] = ai_result.model_version

            else:

                row["Final AI Decision"] = None
                row["AI Scene Similarity"] = None
                row["AI Same Scene"] = None
                row["AI YOLO Issue Found"] = None
                row["AI Model Version"] = None
            # --------------------------------------------------
            # CALCULATED FIELDS
            # --------------------------------------------------

            row["Duplicate Supported"] = (
                report.support_count > 0
            )

            row["Forwarded"] = bool(report.forward_histories)

            row["Total Forward Count"] = len(
                report.forward_histories
            )

            row["Total Attempts"] = (
                len(resolution.attempts)
                if (
                    resolution
                    and resolution.attempts
                )
                else 0
            )

            row["Successfully Resolved"] = (
                bool(
                    resolution
                    and resolution.verification_passed
                )
            )          

            row["Gold Sample"] = (
                bool(
                    resolution
                    and resolution.verification_passed
                    and not resolution.manual_review
                )
            )

            row["Training Eligible"] = (
                bool(
                    resolution
                    and resolution.verification_passed
                )
            )

            if (
                assignment
                and assignment.assigned_at
                and assignment.completed_at
            ):

                row["Resolution Time (Hours)"] = round(
                    (
                        assignment.completed_at
                        - assignment.assigned_at
                    ).total_seconds()
                    / 3600,
                    2,
                )

            else:

                row["Resolution Time (Hours)"] = None

            if (
                assignment
                and assignment.assigned_at
                and assignment.work_started_at
            ):

                row["Assignment Delay (Minutes)"] = round(
                    (
                        assignment.work_started_at
                        - assignment.assigned_at
                    ).total_seconds()
                    / 60,
                    2,
                )

            else:

                row["Assignment Delay (Minutes)"] = None

            if (
                resolution
                and resolution.resolved_at
                and resolution.verified_at
            ):

                row["Verification Delay (Minutes)"] = round(
                    (
                        resolution.verified_at
                        - resolution.resolved_at
                    ).total_seconds()
                    / 60,
                    2,
                )

            else:

                row["Verification Delay (Minutes)"] = None
            dataset.append(row)

        return dataset