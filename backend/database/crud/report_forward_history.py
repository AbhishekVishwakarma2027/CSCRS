from sqlalchemy.orm import Session

from database.models.report_forward_history import (
    ReportForwardHistory,
)


class ReportForwardHistoryCRUD:

    @staticmethod
    def create(
        db: Session,
        **kwargs,
    ) -> ReportForwardHistory:

        history = ReportForwardHistory(
            **kwargs,
        )

        db.add(history)

        return history


    @staticmethod
    def get_last_forward_number(
        db: Session,
        report_id: int,
    ) -> int:

        last = (
            db.query(
                ReportForwardHistory,
            )
            .filter(
                ReportForwardHistory.report_id == report_id,
            )
            .order_by(
                ReportForwardHistory.forward_number.desc(),
            )
            .first()
        )

        if last is None:

            return 0

        return last.forward_number
    
    @staticmethod
    def get_next_forward_number(
        db: Session,
        report_id: int,
    ) -> int:

        return (
            ReportForwardHistoryCRUD.get_last_forward_number(
                db,
                report_id,
            )
            + 1
        )