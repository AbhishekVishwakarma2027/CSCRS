from sqlalchemy.orm import Session

from database.models.resolution_ai_result import ResolutionAIResult


class ResolutionAIResultCRUD:

    @staticmethod
    def create(
        db: Session,
        ai_result: ResolutionAIResult,
    ) -> ResolutionAIResult:

        db.add(ai_result)

        db.flush()

        return ai_result


    @staticmethod
    def get_by_report(
        db: Session,
        report_id: int,
    ):

        return (
            db.query(ResolutionAIResult)
            .filter(
                ResolutionAIResult.report_id == report_id,
            )
            .order_by(
                ResolutionAIResult.id.desc(),
            )
            .all()
        )


    @staticmethod
    def get_latest_by_report(
        db: Session,
        report_id: int,
    ):

        return (
            db.query(ResolutionAIResult)
            .filter(
                ResolutionAIResult.report_id == report_id,
            )
            .order_by(
                ResolutionAIResult.id.desc(),
            )
            .first()
        )