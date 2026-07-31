from fastapi import (
    APIRouter,
    Depends,
)

from sqlalchemy.orm import Session

from database.dependencies import get_db

from database.models.user import User

from authentication.dependencies import (
    require_worker,
    require_department_admin
)

from schemas.forward_request import (
    ForwardRequestCreate,
    ForwardRequestResponse,
    ForwardRequestApprove,
    ForwardRequestReject,
    IncomingForwardRequestResponse,
    ForwardRequestDetailResponse,
)

from services.forward_request_service import (
    ForwardRequestService,
)




router = APIRouter(
    prefix="/forward-requests",
    tags=["Forward Requests"],
)


@router.post(
    "/{report_id}",
    response_model=ForwardRequestResponse,
)
def create_forward_request(
    report_id: int,
    request: ForwardRequestCreate,
    current_user: User = Depends(
        require_worker(),
    ),
    db: Session = Depends(
        get_db,
    ),
):

    return ForwardRequestService(
        db,
    ).create_request(
        report_id,
        current_user,
        request,
    )
@router.get(
    "/pending",
    response_model=list[ForwardRequestResponse],
)
def get_pending_requests(
    current_user: User = Depends(
        require_department_admin(),
    ),
    db: Session = Depends(
        get_db,
    ),
):

    return (
        ForwardRequestService(
            db,
        ).get_pending_requests(
            current_user,
        )
    )
@router.get(
    "/incoming",
    response_model=list[IncomingForwardRequestResponse],
)
def get_incoming_requests(
    current_user: User = Depends(
        require_department_admin(),
    ),
    db: Session = Depends(
        get_db,
    ),
):

    return (
        ForwardRequestService(
            db,
        ).get_destination_requests(
            current_user,
        )
    )
@router.get(
    "/{request_id}",
    response_model=ForwardRequestDetailResponse,
)
def get_request_details(
    request_id: int,
    current_user: User = Depends(
        require_department_admin(),
    ),
    db: Session = Depends(
        get_db,
    ),
):

    return (
        ForwardRequestService(
            db,
        ).get_request_details(
            request_id,
            current_user,
        )
    )

@router.post(
    "/{request_id}/approve",
    response_model=ForwardRequestResponse,
)
def approve_forward_request(
    request_id: int,
    request: ForwardRequestApprove,
    current_user: User = Depends(
        require_department_admin(),
    ),
    db: Session = Depends(
        get_db,
    ),
):

    return (
        ForwardRequestService(
            db,
        ).approve_request(
            request_id,
            current_user,
            request,
        )
    )
@router.post(
    "/{request_id}/accept",
    response_model=ForwardRequestResponse,
)
def accept_forward_request(
    request_id: int,
    current_user: User = Depends(
        require_department_admin(),
    ),
    db: Session = Depends(
        get_db,
    ),
):

    return (
        ForwardRequestService(
            db,
        ).accept_request(
            request_id,
            current_user,
        )
    )
@router.post(
    "/{request_id}/decline",
    response_model=ForwardRequestResponse,
)
def decline_forward_request(
    request_id: int,
    request: ForwardRequestReject,
    current_user: User = Depends(
        require_department_admin(),
    ),
    db: Session = Depends(
        get_db,
    ),
):

    return (
        ForwardRequestService(
            db,
        ).decline_request(
            request_id,
            current_user,
            request.reason,
        )
    )
@router.post(
    "/{request_id}/reject",
    response_model=ForwardRequestResponse,
)
def reject_forward_request(
    request_id: int,
    request: ForwardRequestReject,
    current_user: User = Depends(
        require_department_admin(),
    ),
    db: Session = Depends(
        get_db,
    ),
):

    return (
        ForwardRequestService(
            db,
        ).reject_request(
            request_id,
            current_user,
            request.reason,
        )
    )