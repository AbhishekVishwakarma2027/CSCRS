from sqlalchemy.orm import Session
from sqlalchemy import func
from database.models.user import User
from database.models.feedback import Feedback


class FeedbackCRUD:

    @staticmethod
    def create(
        db: Session,
        user_id: int,
        rating: int,
        liked_text: str | None,
        suggestion_text: str | None,
    ) -> Feedback:

        feedback = Feedback(
            user_id=user_id,
            rating=rating,
            liked_text=liked_text,
            suggestion_text=suggestion_text,
        )

        db.add(feedback)
        db.commit()
        db.refresh(feedback)

        return feedback
    @staticmethod
    def get_dashboard_statistics(
        db: Session,
    ) -> dict:

        total_feedback = (
            db.query(func.count(Feedback.id))
            .scalar()
            or 0
        )

        average_rating = (
            db.query(func.avg(Feedback.rating))
            .scalar()
        )

        if average_rating is None:
            average_rating = 0.0

        rating_counts = (
            db.query(
                Feedback.rating,
                func.count(Feedback.id),
            )
            .group_by(
                Feedback.rating,
            )
            .all()
        )

        distribution = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
        }

        for rating, count in rating_counts:
            distribution[rating] = count

        return {
            "total_feedback": total_feedback,
            "average_rating": round(
                float(average_rating),
                2,
            ),
            "distribution": distribution,
        }
    @staticmethod
    def get_export_data(
        db: Session,
    ) -> list[dict]:

        feedbacks = (
            db.query(Feedback)
            .order_by(
                Feedback.created_at.desc(),
            )
            .all()
        )

        rows = []

        for feedback in feedbacks:

            rows.append(
                {
                    "rating": feedback.rating,
                    "liked_text": feedback.liked_text or "",
                    "suggestion_text": feedback.suggestion_text or "",
                    "created_at": feedback.created_at.strftime(
                        "%Y-%m-%d %H:%M:%S"
                    ),
                }
            )

        return rows