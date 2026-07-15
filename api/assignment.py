from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from authentication.dependencies import require_admin
from database.dependencies import get_db
from database.models.user import User

from schemas.assignment import (
    AssignmentCreate,
    AssignmentResponse,
    StartWorkRequest,
)

from services.assignment import AssignmentService
from authentication.dependencies import require_worker
from schemas.assignment import WorkerAssignmentResponse
from schemas.assignment import StartWorkResponse
router = APIRouter(
    prefix="/assignments",
    tags=["Assignments"],
)


@router.post(
    "",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_report(

    request: AssignmentCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(require_admin()),

):

    service = AssignmentService(db)

    return service.assign_worker(
        report_id=request.report_id,
        assigned_by=current_user.id,
        remarks=request.remarks,
    )
@router.get(
    "/my",
    response_model=list[WorkerAssignmentResponse],
)
def my_assignments(

    db: Session = Depends(get_db),

    current_user: User = Depends(require_worker()),

):

    service = AssignmentService(db)

    return service.get_my_assignments(
        worker_id=current_user.id,
    )
@router.post(
    "/{assignment_id}/start",
    response_model=StartWorkResponse,
)
def start_work(
    assignment_id: int,
    request: StartWorkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_worker()),
):

    service = AssignmentService(db)

    return service.start_work(
        assignment_id=assignment_id,
        worker_id=current_user.id,
        latitude=request.latitude,
        longitude=request.longitude,
    )