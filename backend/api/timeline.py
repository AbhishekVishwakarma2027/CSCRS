from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from authentication.dependencies import require_citizen, require_admin_reports
from database.dependencies import get_db
from database.models.user import User

from schemas.timeline import TimelineResponse, AdminTimelineResponse
from services.timeline_service import TimelineService

router = APIRouter(
    prefix="/reports",
)


@router.get(
    "/{report_id}/timeline",
    response_model=TimelineResponse,
    tags=["Citizen Timeline"],
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

@router.get(
    "/{report_id}/admin/timeline",
    response_model=AdminTimelineResponse,
    tags=["Admin Reports"],
)
def get_admin_timeline_api(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_reports()),
):
    service = TimelineService(db)
    timeline = service.get_admin_timeline(
        report_id=report_id,
        admin_user=current_user,
    )
    if timeline is None:
        raise HTTPException(
            status_code=404,
            detail="Report not found.",
        )
    return timeline