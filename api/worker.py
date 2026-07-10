from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from authentication.dependencies import require_admin
from database.dependencies import get_db
from database.models.user import User
from schemas.worker import WorkerCreate, WorkerResponse
from services.worker_service import WorkerService
from schemas.worker import (
    WorkerActivationRequest,
    WorkerActivationResponse,
)

from authentication.dependencies import require_worker
from schemas.worker import WorkerProfileUpdate
from schemas.worker import WorkerProfileResponse
from schemas.worker import WorkerStatusResponse

router = APIRouter(
    prefix="/workers",
    tags=["Workers"],
)


@router.post(
    "",
    response_model=WorkerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_worker(
    worker: WorkerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin()),
):

    service = WorkerService(db)

    try:

        return service.create_worker(
            name=worker.name,
            email=worker.email,
            phone=worker.phone,
            department_id=worker.department_id,
            employee_code=worker.employee_code,
            designation=worker.designation,
            phone_extension=worker.phone_extension,
        )

    except ValueError as e:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    
@router.post(
    "/activate",
    response_model=WorkerActivationResponse,
)
def activate_worker(
    request: WorkerActivationRequest,
    db: Session = Depends(get_db),
):

    service = WorkerService(db)

    return service.activate_worker(
        token=request.token,
        password=request.password,
    )

@router.get(
    "/profile",
    response_model=WorkerProfileResponse,
)
def worker_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_worker()),
):

    service = WorkerService(db)

    return service.get_profile(
        user_id=current_user.id,
    )

@router.patch(
    "/profile",
    response_model=WorkerProfileResponse,
)
def update_worker_profile(
    request: WorkerProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_worker()),
):

    service = WorkerService(db)

    return service.update_profile(
        user_id=current_user.id,
        phone=request.phone,
        phone_extension=request.phone_extension,
    )
@router.patch(
    "/{worker_id}/deactivate",
    response_model=WorkerStatusResponse,
)
def deactivate_worker(
    worker_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin()),
):

    service = WorkerService(db)

    return service.deactivate_worker(
        worker_id=worker_id,
    )


@router.patch(
    "/{worker_id}/activate",
    response_model=WorkerStatusResponse,
)
def activate_worker_account(
    worker_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin()),
):

    service = WorkerService(db)

    return service.activate_worker_account(
        worker_id=worker_id,
    )