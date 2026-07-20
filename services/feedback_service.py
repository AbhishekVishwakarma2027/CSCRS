from sqlalchemy.orm import Session

from database.crud.feedback import FeedbackCRUD
from database.enums import UserRole
from database.models.user import User
from schemas.feedback import (
    FeedbackCreate,
    FeedbackResponse,
    FeedbackDashboardResponse,
    RatingDistribution,
)
from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from utils.feedback_export import FeedbackExportUtil

class FeedbackService:

    @staticmethod
    def submit_feedback(
        db: Session,
        current_user: User,
        request: FeedbackCreate,
    ) -> FeedbackResponse:

        liked_text = (
            request.liked_text.strip()
            if request.liked_text
            else None
        )

        if liked_text == "":
            liked_text = None

        suggestion_text = (
            request.suggestion_text.strip()
            if request.suggestion_text
            else None
        )

        if suggestion_text == "":
            suggestion_text = None

        feedback = FeedbackCRUD.create(
            db=db,
            user_id=current_user.id,
            rating=request.rating,
            liked_text=liked_text,
            suggestion_text=suggestion_text,
        )

        return FeedbackResponse(
            message="Thank you for your feedback.",
            feedback_id=feedback.id,
        )
    @staticmethod
    def get_dashboard(
        db: Session,
    ) -> FeedbackDashboardResponse:

        statistics = (
            FeedbackCRUD.get_dashboard_statistics(
                db=db,
            )
        )

        distribution = statistics["distribution"]

        return FeedbackDashboardResponse(

            total_feedback=statistics["total_feedback"],

            average_rating=statistics["average_rating"],

            rating_distribution=RatingDistribution(

                one_star=distribution[1],

                two_star=distribution[2],

                three_star=distribution[3],

                four_star=distribution[4],

                five_star=distribution[5],
            ),
        )
    @staticmethod
    def export_feedback(
        db: Session,
        export_format: str,
    ) -> StreamingResponse:

        rows = FeedbackCRUD.get_export_data(
            db=db,
        )

        export_format = export_format.lower()

        if export_format == "xlsx":

            stream = FeedbackExportUtil.generate_excel(
                rows,
            )

            return StreamingResponse(
                stream,
                media_type=(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                ),
                headers={
                    "Content-Disposition":
                        "attachment; filename=feedback.xlsx"
                },
            )

        if export_format == "csv":

            stream = FeedbackExportUtil.generate_csv(
                rows,
            )

            return StreamingResponse(
                iter([stream.getvalue()]),
                media_type="text/csv",
                headers={
                    "Content-Disposition":
                        "attachment; filename=feedback.csv"
                },
            )

        raise HTTPException(
            status_code=400,
            detail="Supported formats are csv and xlsx.",
        )