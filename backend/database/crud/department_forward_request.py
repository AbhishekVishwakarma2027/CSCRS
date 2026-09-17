from sqlalchemy.orm import Session
from database.models.department_forward_request import (
    DepartmentForwardRequest,
    Department,
)
from database.models.report import Report
from database.models.user import User

from database.enums import (
    ForwardRequestStatus,
)
from sqlalchemy.orm import aliased

class DepartmentForwardRequestCRUD:

    @staticmethod
    def create(
        db: Session,
        **kwargs,
    ):

        request = DepartmentForwardRequest(
            **kwargs,
        )

        db.add(request)

        return request


    @staticmethod
    def get_by_id(
        db: Session,
        request_id: int,
    ):

        return (
            db.query(
                DepartmentForwardRequest,
            )
            .filter(
                DepartmentForwardRequest.id == request_id,
            )
            .first()
        )


    @staticmethod
    def get_pending_request_for_report(
        db: Session,
        report_id: int,
    ):

        return (
            db.query(
                DepartmentForwardRequest,
            )
            .filter(
                DepartmentForwardRequest.report_id == report_id,
                DepartmentForwardRequest.status
                == ForwardRequestStatus.PENDING,
            )
            .first()
        )


    @staticmethod
    def get_worker_requests(
        db: Session,
        worker_id: int,
    ):

        return (
            db.query(
                DepartmentForwardRequest,
            )
            .filter(
                DepartmentForwardRequest.worker_id
                == worker_id,
            )
            .order_by(
                DepartmentForwardRequest.created_at.desc(),
            )
            .all()
        )


    @staticmethod
    def get_department_pending_requests(
        db: Session,
        department_id: int,
        include_history: bool = False,
    ):
        query = db.query(DepartmentForwardRequest).filter(
            DepartmentForwardRequest.current_department_id == department_id
        )
        if not include_history:
            query = query.filter(
                DepartmentForwardRequest.status == ForwardRequestStatus.PENDING
            )
        return query.order_by(
            DepartmentForwardRequest.created_at.desc()
        ).all()

    @staticmethod
    def save(
        db: Session,
        request,
    ):

        db.add(request)

        return request

    @staticmethod
    def update_status(
        db: Session,
        request,
    ):

        db.add(
            request,
        )

        return request

    @staticmethod
    def get_request_details(
        db: Session,
        request_id: int,
    ):
        SourceDepartment = aliased(Department)
        DestinationDepartment = aliased(Department)
        ReviewerUser = aliased(User)
        return (
            db.query(
                DepartmentForwardRequest,
                Report,
                User,
                SourceDepartment,
                DestinationDepartment,
                ReviewerUser,
            )
            .join(
                Report,
                DepartmentForwardRequest.report_id == Report.id,
            )
            .join(
                User,
                DepartmentForwardRequest.worker_id == User.id,
            )
            .join(
                Department,
                DepartmentForwardRequest.current_department_id
                == Department.id,
            )
            .filter(
                DepartmentForwardRequest.id == request_id,
            )
            .outerjoin(
                SourceDepartment,
                SourceDepartment.id
                == DepartmentForwardRequest.current_department_id,
            )
            .outerjoin(
                DestinationDepartment,
                DestinationDepartment.id
                == DepartmentForwardRequest.destination_department_id,
            )
            .outerjoin(
                ReviewerUser,
                ReviewerUser.id
                == DepartmentForwardRequest.reviewed_by,
            )
            .first()
        )

    @staticmethod
    def get_destination_pending_requests(
        db: Session,
        department_id: int,
        include_history: bool = False,
    ):
        query = db.query(DepartmentForwardRequest).filter(
            DepartmentForwardRequest.destination_department_id == department_id
        )
        if not include_history:
            query = query.filter(
                DepartmentForwardRequest.status == ForwardRequestStatus.WAITING_DESTINATION
            )
        return query.order_by(
            DepartmentForwardRequest.created_at.desc()
        ).all()

    @staticmethod
    def get_department_rejected_requests(
        db: Session,
        department_id: int,
    ):
        from sqlalchemy import or_
        return (
            db.query(DepartmentForwardRequest)
            .filter(
                or_(
                    DepartmentForwardRequest.current_department_id == department_id,
                    DepartmentForwardRequest.destination_department_id == department_id,
                ),
                DepartmentForwardRequest.status == ForwardRequestStatus.REJECTED,
            )
            .order_by(
                DepartmentForwardRequest.reviewed_at.desc(),
                DepartmentForwardRequest.created_at.desc(),
            )
            .all()
        )