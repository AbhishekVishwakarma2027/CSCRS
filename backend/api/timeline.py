from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from authentication.dependencies import require_citizen
from database.dependencies import get_db
from database.models.user import User

from schemas.timeline import TimelineResponse
from services.timeline_service import TimelineService

router = APIRouter(
    prefix="/reports",
    tags=["Citizen Timeline"],
)


@router.get(
    "/{report_id}/timeline",
    response_model=TimelineResponse,
)
def get_timeline(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_citizen()),
):

    service = TimelineService(db)

    timeline = service.get_citizen_timeline(
        report_id=report_id,
        citizen_id=current_user.id,
    )

    if timeline is None:

        raise HTTPException(
            status_code=404,
            detail="Report not found.",
        )

    if timeline["report_id"] != report_id:

        raise HTTPException(
            status_code=404,
            detail="Report not found.",
        )

    return timeline