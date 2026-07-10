from sqlalchemy.orm import Session

from database.models.resolution_attempt import ResolutionAttempt

class ResolutionAttemptCRUD:

    @staticmethod
    def get_last_attempt(
        db: Session,
        resolution_id: int,
    ):
        return (
            db.query(ResolutionAttempt)
            .filter(
                ResolutionAttempt.resolution_id == resolution_id
            )
            .order_by(
                ResolutionAttempt.attempt_number.desc()
            )
            .first()
        )

    @staticmethod
    def create(
        db: Session,
        *,
        resolution_id: int,
        image_path: str,
    ):

        last_attempt = ResolutionAttemptCRUD.get_last_attempt(
            db,
            resolution_id,
        )

        attempt_number = (
            last_attempt.attempt_number + 1
            if last_attempt
            else 1
        )

        attempt = ResolutionAttempt(
            resolution_id=resolution_id,
            attempt_number=attempt_number,
            image_path=image_path,
            verification_passed=False,
        )

        db.add(attempt)
        db.commit()
        db.refresh(attempt)

        return attempt
    @staticmethod
    def update_attempt(
        db: Session,
        *,
        attempt: ResolutionAttempt,
        annotated_image_path: str | None,
        verification_passed: bool,
        verification_score: float | None,
        verification_decision: str | None,
        ai_decision: str | None,
        failure_reason: str | None,
        model_version: str | None,
        scene_similarity: float | None,
        same_scene: bool | None,
        yolo_issue_found: bool,
    ):

        attempt.annotated_image_path = annotated_image_path
        attempt.verification_passed = verification_passed
        attempt.verification_score = verification_score
        attempt.verification_decision = verification_decision
        attempt.ai_decision = ai_decision
        attempt.failure_reason = failure_reason
        attempt.model_version = model_version
        attempt.scene_similarity = scene_similarity
        attempt.same_scene = same_scene
        attempt.yolo_issue_found = yolo_issue_found

        db.commit()
        db.refresh(attempt)

        return attempt