from fastapi import (
    APIRouter,
    Depends,
    Form,
    UploadFile,
    File,
    status,
)

from sqlalchemy.orm import Session

from authentication.dependencies import require_worker

from database.dependencies import get_db
from database.models.user import User

from services.resolution import ResolutionService
from authentication.dependencies import require_department_admin

from schemas.resolution import (
    ResolutionCreate,
    ResolutionResponse,
    ManualReviewItem,
    ManualReviewDetail,
    ManualReviewRejectRequest,
)


router = APIRouter(
    prefix="/resolutions",
    tags=["Resolution"],
)


@router.post(
    "",
    response_model=ResolutionResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_resolution(

    assignment_id: int = Form(...),

    remarks: str | None = Form(None),

    image: UploadFile = File(...),

    db: Session = Depends(get_db),

    current_user: User = Depends(require_worker()),

):

    service = ResolutionService(db)

    return service.create_resolution(
        assignment_id=assignment_id,
        worker_id=current_user.id,
        remarks=remarks,
        image=image,
    )
@router.get(
    "/manual-review",
    response_model=list[ManualReviewItem],
)
def get_pending_manual_reviews(

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_department_admin(),
    ),
):

    service = ResolutionService(db)

    return service.get_pending_manual_reviews(
        department_id=current_user.department_id,
    )
@router.get(
    "/manual-review/{report_id}",
    response_model=ManualReviewDetail,
)
def manual_review_details(

    report_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_department_admin(),
    ),

):

    service = ResolutionService(db)

    return service.get_manual_review_details(
        report_id=report_id,
    )
@router.post(
    "/manual-review/{report_id}/approve",
    response_model=ResolutionResponse,
)
def approve_manual_review(

    report_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_department_admin(),
    ),

):

    service = ResolutionService(db)

    return service.approve_manual_review(
        report_id=report_id,
    )
@router.post(
    "/manual-review/{report_id}/reject",
    response_model=ResolutionResponse,
)
def reject_manual_review(

    report_id: int,

    request: ManualReviewRejectRequest,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_department_admin(),
    ),

):

    service = ResolutionService(db)

    return service.reject_manual_review(
        report_id=report_id,
        reason=request.reason,
    )