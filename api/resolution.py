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

from schemas.resolution import ResolutionResponse

from services.resolution import ResolutionService


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